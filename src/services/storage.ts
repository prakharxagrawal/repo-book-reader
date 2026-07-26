import { UserSettings, ReadingState, Bookmark, UserNote } from '../types';

const SETTINGS_KEY = 'gitbookify_settings_v1';
const READING_STATE_PREFIX = 'gitbookify_progress_';
const BOOKMARKS_PREFIX = 'gitbookify_bookmarks_';
const NOTES_PREFIX = 'gitbookify_notes_';

export const DEFAULT_SETTINGS: UserSettings = {
  theme: 'dark',
  fontFamily: 'sans',
  fontSize: 'base',
  githubPat: '',
};

export function loadUserSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    console.error('Error loading settings from localStorage', e);
    return DEFAULT_SETTINGS;
  }
}

export function saveUserSettings(settings: UserSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving settings to localStorage', e);
  }
}

export function loadReadingState(repoKey: string): ReadingState {
  try {
    const raw = localStorage.getItem(`${READING_STATE_PREFIX}${repoKey}`);
    if (!raw) {
      return { completedPaths: [], lastReadPath: null, scrollPositions: {} };
    }
    return JSON.parse(raw);
  } catch (e) {
    return { completedPaths: [], lastReadPath: null, scrollPositions: {} };
  }
}

export function saveReadingState(repoKey: string, state: ReadingState): void {
  try {
    localStorage.setItem(`${READING_STATE_PREFIX}${repoKey}`, JSON.stringify(state));
  } catch (e) {
    console.error('Error saving reading state', e);
  }
}

export function loadBookmarks(repoKey: string): Bookmark[] {
  try {
    const raw = localStorage.getItem(`${BOOKMARKS_PREFIX}${repoKey}`);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveBookmarks(repoKey: string, bookmarks: Bookmark[]): void {
  try {
    localStorage.setItem(`${BOOKMARKS_PREFIX}${repoKey}`, JSON.stringify(bookmarks));
  } catch (e) {
    console.error('Error saving bookmarks', e);
  }
}

export function loadUserNotes(repoKey: string): UserNote[] {
  try {
    const raw = localStorage.getItem(`${NOTES_PREFIX}${repoKey}`);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveUserNotes(repoKey: string, notes: UserNote[]): void {
  try {
    localStorage.setItem(`${NOTES_PREFIX}${repoKey}`, JSON.stringify(notes));
  } catch (e) {
    console.error('Error saving notes', e);
  }
}
