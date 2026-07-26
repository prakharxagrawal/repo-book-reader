import { TocNode, FileCategory } from '../types';
import { GitTreeItem, normalizePath } from './githubApi';

export function detectFileCategory(path: string): { category: FileCategory; language: string; extension: string } {
  const ext = path.includes('.') ? path.split('.').pop()?.toLowerCase() || '' : '';

  if (['md', 'markdown', 'mdown', 'mdx'].includes(ext)) {
    return { category: 'markdown', language: 'markdown', extension: ext };
  }

  const langMap: Record<string, string> = {
    ts: 'typescript',
    tsx: 'tsx',
    js: 'javascript',
    jsx: 'jsx',
    py: 'python',
    go: 'go',
    rs: 'rust',
    java: 'java',
    c: 'c',
    cpp: 'cpp',
    cc: 'cpp',
    h: 'c',
    hpp: 'cpp',
    cs: 'csharp',
    rb: 'ruby',
    php: 'php',
    swift: 'swift',
    kt: 'kotlin',
    html: 'html',
    css: 'css',
    scss: 'scss',
    json: 'json',
    yaml: 'yaml',
    yml: 'yaml',
    sh: 'bash',
    bash: 'bash',
    sql: 'sql',
    toml: 'toml',
    xml: 'xml',
    dockerfile: 'dockerfile',
  };

  const imgExts = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico'];
  if (imgExts.includes(ext)) {
    return { category: 'image', language: ext, extension: ext };
  }

  if (langMap[ext]) {
    return { category: 'code', language: langMap[ext], extension: ext };
  }

  const dataExts = ['json', 'csv', 'yaml', 'yml', 'xml', 'toml', 'env'];
  if (dataExts.includes(ext)) {
    return { category: 'data', language: ext, extension: ext };
  }

  return { category: 'other', language: ext || 'text', extension: ext };
}

function formatTitle(name: string): string {
  let clean = name.replace(/\.[a-z0-9]+$/i, '');
  clean = clean.replace(/^(\d+)[-_]/, '$1. ');
  clean = clean.replace(/[-_]/g, ' ');
  return clean
    .split(' ')
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ''))
    .join(' ');
}

export function parseSummaryMd(summaryText: string): TocNode[] {
  const lines = summaryText.split('\n');
  const rootNodes: TocNode[] = [];
  const stack: { node: TocNode; indent: number }[] = [];

  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/;

  for (const line of lines) {
    if (!line.trim().startsWith('*') && !line.trim().startsWith('-')) continue;

    const indent = line.search(/\S/);
    const match = line.match(linkRegex);

    if (match) {
      const title = match[1].trim();
      const rawPath = match[2].trim();
      const path = normalizePath(rawPath);
      const meta = detectFileCategory(path);

      const node: TocNode = {
        id: path,
        title,
        path,
        type: 'chapter',
        level: 1,
        fileCategory: meta.category,
        language: meta.language,
        extension: meta.extension,
        children: [],
      };

      while (stack.length > 0 && stack[stack.length - 1].indent >= indent) {
        stack.pop();
      }

      if (stack.length === 0) {
        node.level = 1;
        rootNodes.push(node);
      } else {
        const parent = stack[stack.length - 1].node;
        node.level = parent.level + 1;
        node.type = 'section';
        if (!parent.children) parent.children = [];
        parent.children.push(node);
      }

      stack.push({ node, indent });
    }
  }

  return rootNodes;
}

export function buildTocFromGitTree(treeItems: GitTreeItem[]): TocNode[] {
  // Exclude unwanted git metadata or heavy build artifacts
  const filteredFiles = treeItems.filter((item) => {
    const p = item.path.toLowerCase();
    return (
      item.type === 'blob' &&
      !p.startsWith('.git/') &&
      !p.startsWith('node_modules/') &&
      !p.startsWith('dist/') &&
      !p.startsWith('build/') &&
      !p.endsWith('.lock') &&
      !p.endsWith('package-lock.json')
    );
  });

  // Sort files logically: root README first, then markdown files, then code files
  filteredFiles.sort((a, b) => {
    const pathA = a.path.toLowerCase();
    const pathB = b.path.toLowerCase();

    if (pathA === 'readme.md') return -1;
    if (pathB === 'readme.md') return 1;

    const isMdA = pathA.endsWith('.md');
    const isMdB = pathB.endsWith('.md');

    if (isMdA && !isMdB) return -1;
    if (!isMdA && isMdB) return 1;

    return pathA.localeCompare(pathB, undefined, { numeric: true, sensitivity: 'base' });
  });

  const treeMap: Record<string, TocNode> = {};
  const rootNodes: TocNode[] = [];

  for (const file of filteredFiles) {
    const parts = file.path.split('/');
    const meta = detectFileCategory(file.path);

    // Root level file
    if (parts.length === 1) {
      const isReadme = parts[0].toLowerCase() === 'readme.md';
      rootNodes.push({
        id: file.path,
        title: isReadme ? 'Overview & Readme' : parts[0],
        path: file.path,
        type: 'file',
        level: 1,
        sha: file.sha,
        size: file.size,
        fileCategory: meta.category,
        language: meta.language,
        extension: meta.extension,
      });
      continue;
    }

    // Nested file in directory
    let currentPath = '';
    let parentNode: TocNode | null = null;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      currentPath = currentPath ? `${currentPath}/${part}` : part;

      if (!isFile) {
        // Directory Node
        if (!treeMap[currentPath]) {
          const folderNode: TocNode = {
            id: currentPath,
            title: part,
            path: currentPath,
            type: 'folder',
            level: i + 1,
            children: [],
          };
          treeMap[currentPath] = folderNode;

          if (parentNode) {
            if (!parentNode.children) parentNode.children = [];
            parentNode.children.push(folderNode);
          } else {
            rootNodes.push(folderNode);
          }
        }
        parentNode = treeMap[currentPath];
      } else {
        // File Node
        const isIndexReadme = part.toLowerCase() === 'readme.md';
        const fileNode: TocNode = {
          id: file.path,
          title: part,
          path: file.path,
          type: 'file',
          level: i + 1,
          sha: file.sha,
          size: file.size,
          fileCategory: meta.category,
          language: meta.language,
          extension: meta.extension,
        };

        if (parentNode) {
          if (!parentNode.children) parentNode.children = [];
          if (isIndexReadme) {
            parentNode.children.unshift(fileNode);
          } else {
            parentNode.children.push(fileNode);
          }
        } else {
          rootNodes.push(fileNode);
        }
      }
    }
  }

  return rootNodes;
}

export function flattenToc(nodes: TocNode[]): TocNode[] {
  const result: TocNode[] = [];
  function traverse(list: TocNode[]) {
    for (const node of list) {
      if (node.path && node.type !== 'folder') {
        result.push(node);
      }
      if (node.children && node.children.length > 0) {
        traverse(node.children);
      }
    }
  }
  traverse(nodes);
  return result;
}
