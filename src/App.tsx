import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  RepoInfo,
  TocNode,
  HeadingItem,
  UserSettings,
  ReadingState,
  Bookmark,
  UserNote,
  UserProfile,
} from './types';
import {
  loadUserSettings,
  saveUserSettings,
  loadReadingState,
  saveReadingState,
  loadBookmarks,
  saveBookmarks,
  loadUserNotes,
  saveUserNotes,
} from './services/storage';
import { fetchRepoDetails, fetchGitTreeItems, fetchFileContent, resolveMarkdownAssetUrls } from './services/githubApi';
import { buildTocFromGitTree, parseSummaryMd, flattenToc } from './services/tocParser';
import { exportToPdf, exportToHtml } from './services/exportService';
import { logUserActivity } from './services/analyticsService';
import { handleOAuthCodeExchange } from './services/authService';

import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Reader } from './components/Reader';
import { OnPageToc } from './components/OnPageToc';
import { SearchModal } from './components/SearchModal';
import { SettingsModal } from './components/SettingsModal';
import { NotesDrawer } from './components/NotesDrawer';
import { AuthModal } from './components/AuthModal';
import { AdminDashboard } from './components/AdminDashboard';
import { LandingHero } from './components/LandingHero';
import { PRESET_REPOSITORIES } from './data/presets';

const USER_PROFILE_KEY = 'gitbookify_user_profile_v1';

export function App() {
  const [settings, setSettings] = useState<UserSettings>(() => loadUserSettings());
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    try {
      const raw = localStorage.getItem(USER_PROFILE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  });

  const [repoInfo, setRepoInfo] = useState<RepoInfo | null>(null);
  const [toc, setToc] = useState<TocNode[]>([]);
  const [activeNode, setActiveNode] = useState<TocNode | null>(null);
  const [markdownContent, setMarkdownContent] = useState<string>('');
  const [headings, setHeadings] = useState<HeadingItem[]>([]);
  const [showLanding, setShowLanding] = useState<boolean>(false);

  const [isTreeLoading, setIsTreeLoading] = useState<boolean>(false);
  const [isContentLoading, setIsContentLoading] = useState<boolean>(false);

  // Modals state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Reading state & bookmarks
  const repoKey = repoInfo ? `${repoInfo.owner}_${repoInfo.repo}` : 'default';
  const [readingState, setReadingState] = useState<ReadingState>({ completedPaths: [], lastReadPath: null, scrollPositions: {} });
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [notes, setNotes] = useState<UserNote[]>([]);

  // Apply theme & font settings to html/body
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
    document.documentElement.setAttribute('data-font', settings.fontFamily);
    document.documentElement.setAttribute('data-size', settings.fontSize);
  }, [settings]);

  // Handle GitHub OAuth Redirect Callback (?code=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      // Clean up URL code query param
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);

      handleOAuthCodeExchange(code)
        .then((profile) => {
          setUserProfile(profile);
          localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
          setSettings((prev) => {
            const updated = { ...prev, githubPat: profile.token || '' };
            saveUserSettings(updated);
            return updated;
          });
        })
        .catch((err) => {
          console.log('OAuth SSO notice:', err.message);
        });
    }
  }, []);

  // Load reading progress, bookmarks, notes whenever repoKey changes
  useEffect(() => {
    if (!repoInfo) return;
    const rState = loadReadingState(repoKey);
    setReadingState(rState);
    setBookmarks(loadBookmarks(repoKey));
    setNotes(loadUserNotes(repoKey));
  }, [repoKey, repoInfo]);

  // Handle GitHub Login
  const handleGithubLogin = async (token: string) => {
    const res = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!res.ok) {
      throw new Error('Invalid GitHub token. Could not fetch profile.');
    }

    const data = await res.json();
    const profile: UserProfile = {
      username: data.login,
      name: data.name || data.login,
      avatarUrl: data.avatar_url,
      bio: data.bio || '',
      token,
      loggedInAt: Date.now(),
    };

    setUserProfile(profile);
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));

    // Update settings PAT token
    setSettings((prev) => {
      const updated = { ...prev, githubPat: token };
      saveUserSettings(updated);
      return updated;
    });
  };

  const handleGithubLogout = () => {
    setUserProfile(null);
    localStorage.removeItem(USER_PROFILE_KEY);
    setSettings((prev) => {
      const updated = { ...prev, githubPat: '' };
      saveUserSettings(updated);
      return updated;
    });
  };

  // Load a repository by owner and repo
  const loadRepository = useCallback(
    async (owner: string, repo: string, targetFilePath?: string) => {
      setIsTreeLoading(true);
      setMarkdownContent('');
      setActiveNode(null);
      setToc([]);
      setShowLanding(false);

      try {
        const repoDetails = await fetchRepoDetails(owner, repo, settings.githubPat);
        setRepoInfo(repoDetails);

        const treeItems = await fetchGitTreeItems(
          owner,
          repo,
          repoDetails.branch,
          settings.githubPat
        );

        // Filter for markdown files and standalone diagram files (.excalidraw, .mermaid, .puml, .svg)
        const mdTreeItems = treeItems.filter((item) => {
          const p = item.path.toLowerCase();
          return (
            item.type === 'tree' ||
            p.endsWith('.md') ||
            p.endsWith('.mdx') ||
            p.endsWith('.excalidraw') ||
            p.endsWith('.excalidraw.json') ||
            p.endsWith('.mermaid') ||
            p.endsWith('.puml') ||
            p.endsWith('.plantuml') ||
            p.endsWith('.svg')
          );
        });

        // Check for SUMMARY.md first
        const summaryFile = treeItems.find((item) => item.path.toLowerCase() === 'summary.md');
        let generatedToc: TocNode[] = [];

        if (summaryFile) {
          try {
            const summaryText = await fetchFileContent(
              owner,
              repo,
              repoDetails.branch,
              summaryFile.path,
              settings.githubPat
            );
            generatedToc = parseSummaryMd(summaryText);
          } catch (e) {
            generatedToc = buildTocFromGitTree(mdTreeItems);
          }
        } else {
          generatedToc = buildTocFromGitTree(mdTreeItems);
        }

        setToc(generatedToc);

        // Select specific file or first chapter
        const flat = flattenToc(generatedToc);
        if (flat.length > 0) {
          const savedProgress = loadReadingState(`${owner}_${repo}`);
          const targetNode = targetFilePath
            ? flat.find((n) => n.path.toLowerCase() === targetFilePath.toLowerCase() || n.path.toLowerCase().endsWith(targetFilePath.toLowerCase()))
            : flat.find((n) => n.path === savedProgress.lastReadPath) || flat[0];

          setActiveNode(targetNode || flat[0]);
        }

        // Log analytics event
        logUserActivity(userProfile?.username || 'Anonymous', `${owner}/${repo}`, targetFilePath || 'root', 'search_repo');
      } catch (err: any) {
        console.error('Error loading repository:', err);
        alert(err.message || 'Failed to load GitHub repository');
      } finally {
        setIsTreeLoading(false);
      }
    },
    [settings.githubPat, userProfile]
  );

  // Deep link parsing on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const repoParam = params.get('repo');
    const fileParam = params.get('file');

    if (repoParam && repoParam.includes('/')) {
      const [owner, repo] = repoParam.split('/');
      loadRepository(owner, repo, fileParam || undefined);
    } else {
      // Default to first preset
      const defaultPreset = PRESET_REPOSITORIES[0];
      loadRepository(defaultPreset.owner, defaultPreset.repo);
    }
  }, [loadRepository]);

  // Fetch content whenever activeNode changes
  useEffect(() => {
    if (!repoInfo || !activeNode) return;

    let isMounted = true;
    setIsContentLoading(true);

    fetchFileContent(
      repoInfo.owner,
      repoInfo.repo,
      repoInfo.branch,
      activeNode.path,
      settings.githubPat
    )
      .then((rawMd) => {
        if (!isMounted) return;
        const resolved = resolveMarkdownAssetUrls(
          rawMd,
          repoInfo.owner,
          repoInfo.repo,
          repoInfo.branch,
          activeNode.path
        );
        setMarkdownContent(resolved);

        // Save last read path
        setReadingState((prev) => {
          const updated = { ...prev, lastReadPath: activeNode.path };
          saveReadingState(repoKey, updated);
          return updated;
        });

        // Log chapter view event
        logUserActivity(userProfile?.username || 'Anonymous', `${repoInfo.owner}/${repoInfo.repo}`, activeNode.path, 'view_chapter');
      })
      .catch((err) => {
        if (!isMounted) return;
        setMarkdownContent(`# Error Loading File\n\nCould not fetch content for \`${activeNode.path}\`. ${err.message}`);
      })
      .finally(() => {
        if (isMounted) setIsContentLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeNode, repoInfo, settings.githubPat, repoKey, userProfile]);

  const handleUpdateSettings = (newSet: Partial<UserSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSet };
      saveUserSettings(updated);
      return updated;
    });
  };

  const handleToggleComplete = (path: string) => {
    setReadingState((prev) => {
      const isComp = prev.completedPaths.includes(path);
      const nextCompleted = isComp
        ? prev.completedPaths.filter((p) => p !== path)
        : [...prev.completedPaths, path];

      const updated = { ...prev, completedPaths: nextCompleted };
      saveReadingState(repoKey, updated);

      if (!isComp && repoInfo) {
        logUserActivity(userProfile?.username || 'Anonymous', `${repoInfo.owner}/${repoInfo.repo}`, path, 'complete_chapter');
      }
      return updated;
    });
  };

  const handleAddBookmark = (snippet: string) => {
    if (!activeNode) return;
    const newBookmark: Bookmark = {
      id: Date.now().toString(),
      repoKey,
      path: activeNode.path,
      chapterTitle: activeNode.title,
      snippet: snippet.replace(/\n+/g, ' ').substring(0, 150),
      createdAt: Date.now(),
    };
    const updated = [newBookmark, ...bookmarks];
    setBookmarks(updated);
    saveBookmarks(repoKey, updated);
    setIsNotesOpen(true);

    if (repoInfo) {
      logUserActivity(userProfile?.username || 'Anonymous', `${repoInfo.owner}/${repoInfo.repo}`, activeNode.path, 'add_bookmark');
    }
  };

  const handleDeleteBookmark = (id: string) => {
    const updated = bookmarks.filter((b) => b.id !== id);
    setBookmarks(updated);
    saveBookmarks(repoKey, updated);
  };

  const handleSaveNote = (text: string) => {
    if (!activeNode) return;
    const newNote: UserNote = {
      id: Date.now().toString(),
      repoKey,
      path: activeNode.path,
      chapterTitle: activeNode.title,
      text,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const updated = [newNote, ...notes];
    setNotes(updated);
    saveUserNotes(repoKey, updated);
  };

  const handleDeleteNote = (id: string) => {
    const updated = notes.filter((n) => n.id !== id);
    setNotes(updated);
    saveUserNotes(repoKey, updated);
  };

  // Prev / Next Chapter Navigation
  const flatNodes = useMemo(() => flattenToc(toc), [toc]);
  const currentIndex = activeNode ? flatNodes.findIndex((n) => n.path === activeNode.path) : -1;

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < flatNodes.length - 1;

  const handleNavigatePrev = () => {
    if (hasPrev) setActiveNode(flatNodes[currentIndex - 1]);
  };

  const handleNavigateNext = () => {
    if (hasNext) setActiveNode(flatNodes[currentIndex + 1]);
  };

  const handleNavigateToPath = (targetPath: string) => {
    const flat = flattenToc(toc);
    const targetNode = flat.find(
      (n) => n.path.toLowerCase() === targetPath.toLowerCase() || n.path.toLowerCase().endsWith(targetPath.toLowerCase())
    );
    if (targetNode) {
      setActiveNode(targetNode);
    } else {
      setActiveNode({
        id: targetPath,
        title: targetPath.split('/').pop() || targetPath,
        path: targetPath,
        type: 'file',
        level: 1,
      });
    }
  };

  return (
    <div className="app-container">
      {/* Top Header */}
      <Header
        repoInfo={repoInfo}
        settings={settings}
        userProfile={userProfile}
        onUpdateSettings={handleUpdateSettings}
        onSelectRepo={(owner, repo) => loadRepository(owner, repo)}
        onGoHome={() => setShowLanding(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenNotes={() => setIsNotesOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onExportPdf={exportToPdf}
        onExportHtml={() => exportToHtml(repoInfo, activeNode?.title || 'File', markdownContent)}
        bookmarksCount={bookmarks.length}
        notesCount={notes.length}
      />

      {/* Main Layout Grid vs Landing Hero */}
      {showLanding ? (
        <LandingHero onSelectRepo={(owner, repo) => loadRepository(owner, repo)} />
      ) : (
        <div className="main-layout">
          {/* Left Sidebar Tree */}
          <Sidebar
            toc={toc}
            activePath={activeNode?.path || null}
            completedPaths={readingState.completedPaths}
            onSelectNode={(node) => setActiveNode(node)}
            onToggleComplete={handleToggleComplete}
            isLoading={isTreeLoading}
          />

          {/* Center File Reader & Code Viewer */}
          <Reader
            currentPath={activeNode?.path || null}
            chapterTitle={activeNode?.title || ''}
            markdownContent={markdownContent}
            fileCategory={activeNode?.fileCategory}
            language={activeNode?.language}
            isLoading={isContentLoading}
            isCompleted={activeNode ? readingState.completedPaths.includes(activeNode.path) : false}
            onToggleComplete={handleToggleComplete}
            onAddBookmark={handleAddBookmark}
            onNavigatePrev={handleNavigatePrev}
            onNavigateNext={handleNavigateNext}
            hasPrev={hasPrev}
            hasNext={hasNext}
            onHeadingsExtracted={(hList) => setHeadings(hList)}
            onNavigateToPath={handleNavigateToPath}
          />

          {/* Right OnPage TOC Outline (for markdown files) */}
          <OnPageToc headings={headings} />
        </div>
      )}

      {/* Modals & Drawers */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        toc={toc}
        onSelectNode={(node) => setActiveNode(node)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        userProfile={userProfile}
        onLogin={handleGithubLogin}
        onLogout={handleGithubLogout}
      />

      <AdminDashboard
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        userProfile={userProfile}
      />

      <NotesDrawer
        isOpen={isNotesOpen}
        onClose={() => setIsNotesOpen(false)}
        bookmarks={bookmarks}
        notes={notes}
        currentPath={activeNode?.path || null}
        currentChapterTitle={activeNode?.title || ''}
        onSelectChapter={(path) => {
          const target = flatNodes.find((n) => n.path === path);
          if (target) setActiveNode(target);
        }}
        onDeleteBookmark={handleDeleteBookmark}
        onSaveNote={handleSaveNote}
        onDeleteNote={handleDeleteNote}
      />
    </div>
  );
}

export default App;
