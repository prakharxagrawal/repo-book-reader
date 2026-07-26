import { UserProfile } from '../types';

// Default OAuth Client ID for GitHub SSO (or user provided app)
const GITHUB_OAUTH_CLIENT_ID = 'Ov23liXXXXXXXXXXXXXX'; 
const GITHUB_GATEKEEPER_URL = 'https://gatekeeper-gitbookify.vercel.app/authenticate';

export function initiateGithubOAuth(): void {
  const redirectUri = window.location.origin + window.location.pathname;
  const scope = 'read:user gist';

  const oauthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_OAUTH_CLIENT_ID}&scope=${encodeURIComponent(
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
    // If gatekeeper proxy is unavailable, prompt fallback
    throw err;
  }
}
