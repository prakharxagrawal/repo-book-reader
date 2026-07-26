import { UserActivityLog, AdminAnalytics, UserProfile } from '../types';

const LOCAL_LOGS_KEY = 'gitbookify_analytics_logs_v1';
const GIST_ID_KEY = 'gitbookify_analytics_gist_id';
const USER_PROFILE_KEY = 'gitbookify_user_profile_v1';

let autoSyncTimer: any = null;

export function logUserActivity(
  username: string,
  repo: string,
  chapterPath: string,
  action: UserActivityLog['action']
): void {
  try {
    const raw = localStorage.getItem(LOCAL_LOGS_KEY);
    const existing: UserActivityLog[] = raw ? JSON.parse(raw) : [];

    const newLog: UserActivityLog = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 6),
      username: username || 'Anonymous Reader',
      repo,
      chapterPath,
      action,
      timestamp: Date.now(),
    };

    // Keep last 200 logs locally
    const updated = [newLog, ...existing].slice(0, 200);
    localStorage.setItem(LOCAL_LOGS_KEY, JSON.stringify(updated));

    // Debounced automatic background sync to Gist
    scheduleAutoSync();
  } catch (e) {
    console.error('Error logging user activity', e);
  }
}

function scheduleAutoSync(): void {
  if (autoSyncTimer) clearTimeout(autoSyncTimer);

  autoSyncTimer = setTimeout(() => {
    try {
      const rawProfile = localStorage.getItem(USER_PROFILE_KEY);
      if (rawProfile) {
        const profile: UserProfile = JSON.parse(rawProfile);
        if (profile.token) {
          syncAnalyticsToGist(profile.token).catch((err) => {
            console.log('Background auto-sync note:', err.message);
          });
        }
      }
    } catch (e) {
      // Ignore background sync errors silently
    }
  }, 10000); // Auto-sync 10 seconds after user activity
}

export function loadLocalAnalytics(): AdminAnalytics {
  try {
    const raw = localStorage.getItem(LOCAL_LOGS_KEY);
    const logs: UserActivityLog[] = raw ? JSON.parse(raw) : [];

    // Calculate aggregated stats
    const uniqueUsers = new Set(logs.map((l) => l.username)).size;
    const chaptersRead = logs.filter((l) => l.action === 'complete_chapter' || l.action === 'view_chapter').length;

    const repoCounts: Record<string, number> = {};
    logs.forEach((l) => {
      if (l.repo) {
        repoCounts[l.repo] = (repoCounts[l.repo] || 0) + 1;
      }
    });

    const topRepos = Object.entries(repoCounts)
      .map(([repo, views]) => ({ repo, views }))
      .sort((a, b) => b.views - a.views);

    return {
      totalReaders: Math.max(1, uniqueUsers),
      totalChaptersRead: chaptersRead,
      activeReposCount: Object.keys(repoCounts).length,
      topRepos,
      logs,
      lastSyncedAt: Date.now(),
    };
  } catch (e) {
    return {
      totalReaders: 1,
      totalChaptersRead: 0,
      activeReposCount: 0,
      topRepos: [],
      logs: [],
      lastSyncedAt: Date.now(),
    };
  }
}

/**
 * Syncs analytics data to a private GitHub Gist using GitHub API (Zero-database backend!)
 */
export async function syncAnalyticsToGist(token: string): Promise<string> {
  if (!token || !token.trim()) {
    throw new Error('GitHub PAT Token is required to sync admin analytics.');
  }

  const analyticsData = loadLocalAnalytics();
  const gistContent = JSON.stringify(analyticsData, null, 2);

  const headers: Record<string, string> = {
    Authorization: `token ${token.trim()}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };

  const existingGistId = localStorage.getItem(GIST_ID_KEY);

  if (existingGistId) {
    // Update existing Gist
    const res = await fetch(`https://api.github.com/gists/${existingGistId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        description: 'GitBookify Admin Usage Analytics & Reader Logs',
        files: {
          'gitbookify-analytics.json': {
            content: gistContent,
          },
        },
      }),
    });
    if (res.ok) {
      return existingGistId;
    }
  }

  // Create new Gist
  const res = await fetch('https://api.github.com/gists', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      description: 'GitBookify Admin Usage Analytics & Reader Logs',
      public: false,
      files: {
        'gitbookify-analytics.json': {
          content: gistContent,
        },
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to sync analytics Gist: ${res.statusText}`);
  }

  const data = await res.json();
  const gistId = data.id;
  localStorage.setItem(GIST_ID_KEY, gistId);
  return gistId;
}
