import React, { useEffect, useMemo, useRef, useState } from 'react';
import { marked } from 'marked';
import {
  Clock,
  BookOpen,
  CheckCircle,
  Circle,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  FileText,
  FileCode,
  Code2,
} from 'lucide-react';
import { HeadingItem, FileCategory } from '../types';
import { normalizePath } from '../services/githubApi';

interface ReaderProps {
  currentPath: string | null;
  chapterTitle: string;
  markdownContent: string;
  fileCategory?: FileCategory;
  language?: string;
  isLoading: boolean;
  isCompleted: boolean;
  onToggleComplete: (path: string) => void;
  onAddBookmark: (snippet: string) => void;
  onNavigatePrev: () => void;
  onNavigateNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  onHeadingsExtracted: (headings: HeadingItem[]) => void;
  onNavigateToPath?: (path: string) => void;
}

export const Reader: React.FC<ReaderProps> = ({
  currentPath,
  chapterTitle,
  markdownContent,
  fileCategory = 'markdown',
  language = 'text',
  isLoading,
  isCompleted,
  onToggleComplete,
  onAddBookmark,
  onNavigatePrev,
  onNavigateNext,
  hasPrev,
  hasNext,
  onHeadingsExtracted,
  onNavigateToPath,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const isMarkdown = fileCategory === 'markdown' || (currentPath && currentPath.toLowerCase().endsWith('.md'));

  // Compute Word Count & Reading Time
  const { wordCount, readingTimeMinutes, lineCount } = useMemo(() => {
    if (!markdownContent) return { wordCount: 0, readingTimeMinutes: 0, lineCount: 0 };
    const lines = markdownContent.split('\n');
    const words = markdownContent.trim().split(/\s+/).filter(Boolean).length;
    const time = Math.ceil(words / 200);
    return { wordCount: words, readingTimeMinutes: time, lineCount: lines.length };
  }, [markdownContent]);

  // Render Markdown HTML
  const parsedHtml = useMemo(() => {
    if (!markdownContent || !isMarkdown) return '';

    marked.setOptions({
      gfm: true,
      breaks: true,
    });

    let html = marked.parse(markdownContent) as string;

    // Transform blockquotes alerts
    const alertRegex = /<blockquote>\s*<p>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*(?:<br\/?>)?([\s\S]*?)<\/p>\s*<\/blockquote>/gi;
    html = html.replace(alertRegex, (match, type, content) => {
      const alertType = type.toLowerCase();
      return `
        <div class="callout-alert ${alertType}">
          <div class="callout-header">
            <span>[${type}]</span>
          </div>
          <div>${content}</div>
        </div>
      `;
    });

    // Code blocks header
    let codeIndex = 0;
    html = html.replace(/<pre><code(?:\s+class="language-([^"]+)")?>([\s\S]*?)<\/code><\/pre>/gi, (match, lang, code) => {
      codeIndex++;
      const langName = lang || 'code';
      return `
        <div class="code-block-wrapper">
          <div class="code-block-header">
            <span>${langName}</span>
            <button class="btn btn-icon copy-code-btn" data-code="${encodeURIComponent(code)}" style="background: transparent; border: none; padding: 0.2rem 0.5rem; cursor: pointer; color: var(--text-muted);">
              Copy
            </button>
          </div>
          <pre><code>${code}</code></pre>
        </div>
      `;
    });

    return html;
  }, [markdownContent, isMarkdown]);

  // Extract Headings
  useEffect(() => {
    if (!containerRef.current || !isMarkdown) {
      onHeadingsExtracted([]);
      return;
    }
    const headingElements = containerRef.current.querySelectorAll('h1, h2, h3');
    const headingsList: HeadingItem[] = [];

    headingElements.forEach((el, index) => {
      const text = el.textContent || '';
      const level = parseInt(el.tagName.replace('H', ''), 10);
      const id = el.id || `heading-${index}-${text.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
      el.id = id;
      headingsList.push({ id, text, level });
    });

    onHeadingsExtracted(headingsList);
  }, [parsedHtml, isMarkdown, onHeadingsExtracted]);

  // Copy code handler for code blocks
  useEffect(() => {
    if (!containerRef.current || !isMarkdown) return;
    const buttons = containerRef.current.querySelectorAll('.copy-code-btn');

    const handleCopy = (e: Event) => {
      const target = e.currentTarget as HTMLButtonElement;
      const rawCode = target.getAttribute('data-code');
      if (rawCode) {
        const decoded = decodeURIComponent(rawCode)
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&');
        navigator.clipboard.writeText(decoded);
        target.innerText = 'Copied!';
        setTimeout(() => {
          target.innerText = 'Copy';
        }, 2000);
      }
    };

    buttons.forEach((btn) => btn.addEventListener('click', handleCopy));
    return () => {
      buttons.forEach((btn) => btn.removeEventListener('click', handleCopy));
    };
  }, [parsedHtml, isMarkdown]);

  // Scroll to top on chapter change
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [currentPath]);

  // Intercept links in markdown
  useEffect(() => {
    if (!containerRef.current || !onNavigateToPath || !currentPath || !isMarkdown) return;

    const handleLinkClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a');
      if (!target) return;

      const href = target.getAttribute('href');
      if (!href) return;

      if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:')) {
        target.setAttribute('target', '_blank');
        target.setAttribute('rel', 'noopener noreferrer');
        return;
      }

      if (href.startsWith('#')) return;

      e.preventDefault();
      const dir = currentPath.includes('/') ? currentPath.substring(0, currentPath.lastIndexOf('/')) : '';
      const combined = dir ? `${dir}/${href}` : href;
      const targetPath = normalizePath(combined);
      onNavigateToPath(targetPath);
    };

    const container = containerRef.current;
    container.addEventListener('click', handleLinkClick);
    return () => {
      container.removeEventListener('click', handleLinkClick);
    };
  }, [parsedHtml, currentPath, isMarkdown, onNavigateToPath]);

  const handleCopyFullFile = () => {
    navigator.clipboard.writeText(markdownContent);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  if (isLoading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.2rem', marginBottom: '0.5rem', fontWeight: 600 }}>Loading file content...</div>
          <div style={{ fontSize: '0.875rem' }}>Fetching repository file from GitHub</div>
        </div>
      </div>
    );
  }

  if (!currentPath) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', padding: '2rem' }}>
        <div style={{ textAlign: 'center', maxWidth: '450px' }}>
          <BookOpen size={48} color="var(--accent-primary)" style={{ marginBottom: '1rem' }} />
          <h2 style={{ color: 'var(--text-main)', marginBottom: '0.5rem' }}>Select a File or Chapter to Inspect</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Choose any file or documentation chapter from the sidebar tree to start reading or viewing code.
          </p>
        </div>
      </div>
    );
  }

  const codeLines = markdownContent ? markdownContent.split('\n') : [];

  return (
    <main
      className="reader-canvas"
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '2.5rem 3.5rem',
        maxWidth: isMarkdown ? '920px' : '1100px',
        margin: '0 auto',
      }}
    >
      {/* File Top Header */}
      <div style={{ marginBottom: '2rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', fontWeight: 600, marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {isMarkdown ? <FileText size={15} /> : <Code2 size={15} />}
          <span>{isMarkdown ? 'Documentation Chapter' : `${language.toUpperCase()} Source File`}</span>
        </div>

        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1rem' }}>
          {chapterTitle}
        </h1>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            {isMarkdown ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Clock size={16} color="var(--accent-primary)" />
                {readingTimeMinutes} min read ({wordCount} words)
              </span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Code2 size={16} color="var(--accent-primary)" />
                {lineCount} lines ({wordCount} words)
              </span>
            )}
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
              {currentPath}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Copy Full File / Code */}
            <button className="btn" onClick={handleCopyFullFile} style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}>
              {copiedCode ? <Check size={14} color="var(--accent-success)" /> : <Copy size={14} />}
              {copiedCode ? 'Copied File!' : 'Copy Code'}
            </button>

            {/* Add Bookmark */}
            <button className="btn" onClick={() => onAddBookmark(markdownContent.substring(0, 150))} style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}>
              <Bookmark size={14} /> Bookmark
            </button>

            {/* Complete Chapter Button */}
            <button
              className={`btn ${isCompleted ? 'btn-primary' : ''}`}
              onClick={() => onToggleComplete(currentPath)}
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
            >
              {isCompleted ? <CheckCircle size={14} /> : <Circle size={14} />}
              {isCompleted ? 'Completed' : 'Mark Read'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Body: Markdown vs Code Viewer */}
      {isMarkdown ? (
        <div ref={containerRef} className="markdown-body" dangerouslySetInnerHTML={{ __html: parsedHtml }} />
      ) : (
        <div ref={containerRef} className="code-viewer-container">
          <table className="code-viewer-table">
            <tbody>
              {codeLines.map((line, idx) => (
                <tr key={idx}>
                  <td className="code-line-number">{idx + 1}</td>
                  <td className="code-line-content">
                    <code>{line || ' '}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer Navigation */}
      <div
        className="reader-controls"
        style={{
          marginTop: '4rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <button
          className="btn"
          onClick={onNavigatePrev}
          disabled={!hasPrev}
          style={{ opacity: hasPrev ? 1 : 0.4, cursor: hasPrev ? 'pointer' : 'not-allowed' }}
        >
          <ChevronLeft size={16} /> Previous File
        </button>

        <button
          className="btn btn-primary"
          onClick={onNavigateNext}
          disabled={!hasNext}
          style={{ opacity: hasNext ? 1 : 0.4, cursor: hasNext ? 'pointer' : 'not-allowed' }}
        >
          Next File <ChevronRight size={16} />
        </button>
      </div>
    </main>
  );
};
