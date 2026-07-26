export type Theme = 'dark' | 'obsidian' | 'sepia' | 'light';
export type FontFamily = 'sans' | 'serif' | 'mono';
export type FontSize = 'sm' | 'base' | 'lg' | 'xl';
export type FileCategory = 'markdown' | 'code' | 'image' | 'data' | 'other';

export interface RepoInfo {
  owner: string;
  repo: string;
  branch: string;
  title: string;
  description: string;
  stars?: number;
  url: string;
  defaultBranch?: string;
  isPreset?: boolean;
}

export interface TocNode {
  id: string;
  title: string;
  path: string;
  type: 'chapter' | 'section' | 'file' | 'folder';
  level: number;
  children?: TocNode[];
  downloadUrl?: string;
  sha?: string;
  isCompleted?: boolean;
  fileCategory?: FileCategory;
  extension?: string;
  language?: string;
  size?: number;
}

export interface HeadingItem {
  id: string;
  text: string;
  level: number;
}

export interface ChapterContent {
  path: string;
  title: string;
  content: string;
  fileCategory: FileCategory;
  language: string;
  wordCount: number;
  readingTimeMinutes: number;
  headings: HeadingItem[];
}

export interface Bookmark {
  id: string;
  repoKey: string;
  path: string;
  chapterTitle: string;
  snippet: string;
  createdAt: number;
}

export interface UserNote {
  id: string;
  repoKey: string;
  path: string;
  chapterTitle: string;
  text: string;
  createdAt: number;
  updatedAt: number;
}

export interface ReadingState {
  completedPaths: string[];
  lastReadPath: string | null;
  scrollPositions: Record<string, number>;
}

export interface UserSettings {
  theme: Theme;
  fontFamily: FontFamily;
  fontSize: FontSize;
  githubPat: string;
}

export interface PresetRepo {
  id: string;
  name: string;
  owner: string;
  repo: string;
  branch: string;
  description: string;
  starsBadge: string;
  category: string;
  sampleToc: TocNode[];
}
