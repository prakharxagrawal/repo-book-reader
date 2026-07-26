import { RepoInfo } from '../types';

export interface GitTreeItem {
  path: string;
  mode: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
  url: string;
}

export async function fetchRepoDetails(owner: string, repo: string, token?: string): Promise<RepoInfo> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
  };
  if (token && token.trim() !== '') {
    headers.Authorization = `token ${token.trim()}`;
  }

  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(`Repository "${owner}/${repo}" not found or private.`);
    }
    if (res.status === 403) {
      throw new Error(`GitHub API rate limit exceeded. Add a Personal Access Token in settings.`);
    }
    throw new Error(`GitHub API error: ${res.statusText}`);
  }

  const data = await res.json();
  return {
    owner: data.owner?.login || owner,
    repo: data.name || repo,
    branch: data.default_branch || 'main',
    title: data.name,
    description: data.description || 'GitHub Repository',
    stars: data.stargazers_count || 0,
    url: data.html_url,
    defaultBranch: data.default_branch || 'main',
  };
}

export async function fetchGitTreeItems(
  owner: string,
  repo: string,
  branch: string,
  token?: string
): Promise<GitTreeItem[]> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
  };
  if (token && token.trim() !== '') {
    headers.Authorization = `token ${token.trim()}`;
  }

  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
    { headers }
  );

  if (!res.ok) {
    if (res.status === 403) {
      throw new Error(`GitHub API rate limit exceeded. Add a PAT token in settings.`);
    }
    throw new Error(`Failed to fetch repo structure (${res.status})`);
  }

  const data = await res.json();
  return (data.tree || []) as GitTreeItem[];
}

export function normalizePath(path: string): string {
  let clean = path.trim().replace(/^\/+/, '').replace(/^\.\//, '');
  clean = clean.replace(/\/+/g, '/');
  // Strip fragment identifier (#...) or query params (?...) for path resolution
  clean = clean.split('#')[0].split('?')[0];

  const parts = clean.split('/');
  const stack: string[] = [];
  for (const part of parts) {
    if (part === '.' || part === '') continue;
    if (part === '..') {
      if (stack.length > 0) stack.pop();
    } else {
      stack.push(part);
    }
  }
  return stack.join('/');
}

export async function fetchFileContent(
  owner: string,
  repo: string,
  branch: string,
  filePath: string,
  token?: string
): Promise<string> {
  const cleanPath = normalizePath(filePath);
  const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${cleanPath}`;
  
  const headers: Record<string, string> = {};
  if (token && token.trim() !== '') {
    headers.Authorization = `token ${token.trim()}`;
  }

  const res = await fetch(rawUrl, { headers });
  if (!res.ok) {
    throw new Error(`Could not load markdown content for file: ${cleanPath}`);
  }
  return await res.text();
}

/**
 * Transforms relative image sources in markdown to absolute GitHub raw URLs
 */
export function resolveMarkdownAssetUrls(
  markdown: string,
  owner: string,
  repo: string,
  branch: string,
  currentFilePath: string
): string {
  const normalizedCurrent = normalizePath(currentFilePath);
  const directory = normalizedCurrent.includes('/')
    ? normalizedCurrent.substring(0, normalizedCurrent.lastIndexOf('/'))
    : '';

  const rawBaseUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}`;

  // Replace markdown image syntax ![alt](src)
  let result = markdown.replace(/!\[(.*?)\]\((.*?)\)/g, (match, alt, src) => {
    if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) {
      return match;
    }

    const cleanSrc = src.trim();
    const combinedPath = directory ? `${directory}/${cleanSrc}` : cleanSrc;
    const absolutePath = normalizePath(combinedPath);

    const fullUrl = `${rawBaseUrl}/${absolutePath}`;
    return `![${alt}](${fullUrl})`;
  });

  // Handle HTML <img src="..."> tags inside markdown
  result = result.replace(/<img([^>]+)src=["']([^"']+)["']([^>]*)>/gi, (match, before, src, after) => {
    if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) {
      return match;
    }
    const combinedPath = directory ? `${directory}/${src.trim()}` : src.trim();
    const absolutePath = normalizePath(combinedPath);
    const fullUrl = `${rawBaseUrl}/${absolutePath}`;
    return `<img${before}src="${fullUrl}"${after}>`;
  });

  return result;
}
