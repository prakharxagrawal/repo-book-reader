import { TocNode } from '../types';
import { GitTreeItem, normalizePath } from './githubApi';

function formatTitle(name: string): string {
  // Remove file extension
  let clean = name.replace(/\.md$/i, '');
  // Format numbers like 01-intro -> 01. Intro
  clean = clean.replace(/^(\d+)[-_]/, '$1. ');
  // Replace hyphens and underscores with spaces
  clean = clean.replace(/[-_]/g, ' ');
  // Capitalize words
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

      const node: TocNode = {
        id: path,
        title,
        path,
        type: 'chapter',
        level: 1,
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
  // Filter for markdown files
  const mdFiles = treeItems.filter(
    (item) => item.type === 'blob' && item.path.toLowerCase().endsWith('.md')
  );

  // Exclude meta files like LICENSE, CODE_OF_CONDUCT, CONTRIBUTING if not part of main docs
  const filteredFiles = mdFiles.filter((file) => {
    const name = file.path.toLowerCase();
    return (
      !name.startsWith('.github') &&
      !name.includes('license') &&
      !name.includes('code_of_conduct') &&
      !name.includes('contributing')
    );
  });

  // Organize by directories
  const treeMap: Record<string, TocNode> = {};
  const rootNodes: TocNode[] = [];

  // Sort files logically: root README first, then numerical folders, then alphabetical
  filteredFiles.sort((a, b) => {
    const pathA = a.path.toLowerCase();
    const pathB = b.path.toLowerCase();

    if (pathA === 'readme.md') return -1;
    if (pathB === 'readme.md') return 1;

    return pathA.localeCompare(pathB, undefined, { numeric: true, sensitivity: 'base' });
  });

  // Group files into folder-based nodes
  for (const file of filteredFiles) {
    const parts = file.path.split('/');
    
    // Root level file
    if (parts.length === 1) {
      const isReadme = parts[0].toLowerCase() === 'readme.md';
      rootNodes.push({
        id: file.path,
        title: isReadme ? 'Overview & Introduction' : formatTitle(parts[0]),
        path: file.path,
        type: 'chapter',
        level: 1,
        sha: file.sha,
      });
      continue;
    }

    // Nested file in folder
    let currentPath = '';
    let parentNode: TocNode | null = null;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      currentPath = currentPath ? `${currentPath}/${part}` : part;

      if (!isFile) {
        // Directory node
        if (!treeMap[currentPath]) {
          const folderNode: TocNode = {
            id: currentPath,
            title: formatTitle(part),
            path: currentPath,
            type: 'chapter',
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
        // File node inside directory
        const isIndexReadme = part.toLowerCase() === 'readme.md';
        const fileNode: TocNode = {
          id: file.path,
          title: isIndexReadme ? `${formatTitle(parts[i - 1])} - Chapter Overview` : formatTitle(part),
          path: file.path,
          type: 'section',
          level: i + 1,
          sha: file.sha,
        };

        if (parentNode) {
          if (!parentNode.children) parentNode.children = [];
          // Put README.md as the first child of a folder
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

  // Clean up folder nodes that only have 1 file with no path
  return rootNodes;
}

export function flattenToc(nodes: TocNode[]): TocNode[] {
  const result: TocNode[] = [];
  function traverse(list: TocNode[]) {
    for (const node of list) {
      if (node.path.endsWith('.md')) {
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
