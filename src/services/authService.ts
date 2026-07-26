import { UserProfile } from '../types';

const CLIENT_ID_KEY = 'gitbookify_oauth_client_id';
const DEFAULT_CLIENT_ID = 'Ov23liXXXXXXXXXXXXXX';
const GITHUB_GATEKEEPER_URL = 'https://gatekeeper-gitbookify.vercel.app/authenticate';

export function getOAuthClientId(): string {
  return localStorage.getItem(CLIENT_ID_KEY) || DEFAULT_CLIENT_ID;
}

export function saveOAuthClientId(clientId: string): void {
  localStorage.setItem(CLIENT_ID_KEY, clientId.trim());
}

export function initiateGithubOAuth(overrideClientId?: string): void {
  const clientId = (overrideClientId || getOAuthClientId()).trim();
  const redirectUri = window.location.origin + window.location.pathname;
  const scope = 'read:user gist';

  const oauthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=${encodeURIComponent(
    scope
  )}&redirect_uri=${encodeURIComponent(redirectUri)}`;

  window.location.href = oauthUrl;
}

export async function fetchUserProfile(token: string): Promise<UserProfile> {
  const res = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `token ${token.trim()}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch GitHub profile: ${res.statusText}`);
  }

  const data = await res.json();
  return {
    username: data.login,
    name: data.name || data.login,
    avatarUrl: data.avatar_url,
    bio: data.bio || '',
    token: token.trim(),
    loggedInAt: Date.now(),
  };
}

export async function handleOAuthCodeExchange(code: string): Promise<UserProfile> {
  try {
    const res = await fetch(`${GITHUB_GATEKEEPER_URL}/${code}`);
    if (!res.ok) {
      throw new Error('OAuth token exchange proxy unavailable');
    }
    const data = await res.json();
    if (!data.token) {
      throw new Error('No token returned from OAuth provider');
    }
    return await fetchUserProfile(data.token);
  } catch (err) {
    throw err;
  }
}
