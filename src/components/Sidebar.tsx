import React, { useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  CheckCircle,
  Circle,
  FileText,
  Folder,
  FolderOpen,
  Filter,
  Code2,
  FileCode,
  Image,
  Database,
  File,
  Layers,
} from 'lucide-react';
import { TocNode } from '../types';

interface SidebarProps {
  toc: TocNode[];
  activePath: string | null;
  completedPaths: string[];
  onSelectNode: (node: TocNode) => void;
  onToggleComplete: (path: string) => void;
  isLoading: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  toc,
  activePath,
  completedPaths,
  onSelectNode,
  onToggleComplete,
  isLoading,
}) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  const countFiles = (nodes: TocNode[]): { total: number; completed: number } => {
    let total = 0;
    let completed = 0;
    function traverse(list: TocNode[]) {
      for (const item of list) {
        if (item.path && item.type !== 'folder') {
          total++;
          if (completedPaths.includes(item.path)) {
            completed++;
          }
        }
        if (item.children) traverse(item.children);
      }
    }
    traverse(nodes);
    return { total, completed };
  };

  const { total, completed } = countFiles(toc);
  const percentComplete = total > 0 ? Math.round((completed / total) * 100) : 0;

  const renderFileIcon = (node: TocNode) => {
    if (node.type === 'folder') {
      return expandedFolders[node.id] !== false ? (
        <FolderOpen size={16} color="var(--accent-primary)" />
      ) : (
        <Folder size={16} color="var(--accent-primary)" />
      );
    }

    const ext = node.extension || (node.path ? node.path.split('.').pop()?.toLowerCase() || '' : '');
    const isDiagram = ['excalidraw', 'mermaid', 'puml', 'plantuml', 'drawio', 'svg'].includes(ext) || node.path.toLowerCase().endsWith('.excalidraw.json');

    if (isDiagram) {
      return <Layers size={15} color="#ec4899" />;
    }

    const cat = node.fileCategory || 'other';
    switch (cat) {
      case 'markdown':
        return <FileText size={15} color="var(--accent-primary)" />;
      case 'code':
        return <Code2 size={15} color="#818cf8" />;
      case 'image':
        return <Image size={15} color="#f59e0b" />;
      case 'data':
        return <Database size={15} color="#10b981" />;
      default:
        return <File size={15} color="var(--text-muted)" />;
    }
  };

  const renderTocItem = (node: TocNode) => {
    const isFolder = node.children && node.children.length > 0;
    const isExpanded = expandedFolders[node.id] !== false; // Default expanded
    const isActive = activePath === node.path;
    const isCompleted = completedPaths.includes(node.path);

    // Apply filter query if any
    if (filterQuery.trim()) {
      const matchQuery = (n: TocNode): boolean => {
        if (n.title.toLowerCase().includes(filterQuery.toLowerCase())) return true;
        if (n.path.toLowerCase().includes(filterQuery.toLowerCase())) return true;
        if (n.children && n.children.some(matchQuery)) return true;
        return false;
      };
      if (!matchQuery(node)) return null;
    }

    return (
      <div key={node.id} style={{ marginLeft: `${(node.level - 1) * 10}px` }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.38rem 0.6rem',
            borderRadius: '0.45rem',
            margin: '0.12rem 0',
            cursor: 'pointer',
            background: isActive ? 'var(--bg-tertiary)' : 'transparent',
            borderLeft: isActive ? '3px solid var(--accent-primary)' : '3px solid transparent',
            color: isActive ? 'var(--accent-primary)' : 'var(--text-main)',
            fontWeight: isActive ? 600 : 400,
            transition: 'all 0.15s ease',
          }}
          onClick={() => {
            if (isFolder) {
              toggleFolder(node.id);
              const readmeChild = node.children?.find((c) => c.path.toLowerCase().endsWith('readme.md'));
              if (readmeChild) {
                onSelectNode(readmeChild);
              }
            } else {
              onSelectNode(node);
            }
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flex: 1, overflow: 'hidden' }}>
            {isFolder && (
              <span style={{ display: 'flex', color: 'var(--text-dim)' }}>
                {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
              </span>
            )}
            <span style={{ display: 'flex', alignItems: 'center' }}>{renderFileIcon(node)}</span>
            <span
              style={{
                fontSize: '0.85rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                fontFamily: node.type !== 'folder' && node.fileCategory === 'code' ? 'var(--font-mono)' : 'var(--font-sans)',
              }}
              title={node.path}
            >
              {node.title}
            </span>
          </div>

          {node.type !== 'folder' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleComplete(node.path);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: isCompleted ? 'var(--accent-success)' : 'var(--text-dim)',
                display: 'flex',
                alignItems: 'center',
                padding: '0.1rem',
              }}
              title={isCompleted ? 'Mark as unread' : 'Mark as read'}
            >
              {isCompleted ? <CheckCircle size={14} /> : <Circle size={14} />}
            </button>
          )}
        </div>

        {isFolder && isExpanded && node.children && (
          <div style={{ marginTop: '0.1rem' }}>
            {node.children.map((child) => renderTocItem(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside
      className="sidebar-container glass-panel"
      style={{
        width: 'var(--sidebar-width)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid var(--border-color)',
        background: 'var(--bg-secondary)',
        userSelect: 'none',
      }}
    >
      {/* Search Filter Header */}
      <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="input-field" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.75rem' }}>
          <Filter size={14} color="var(--text-dim)" />
          <input
            type="text"
            placeholder="Filter repo files & chapters..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-main)',
              fontSize: '0.85rem',
              width: '100%',
            }}
          />
        </div>

        {/* Progress Bar */}
        <div style={{ marginTop: '0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
            <span>Reading Progress</span>
            <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>
              {completed} / {total} ({percentComplete}%)
            </span>
          </div>
          <div style={{ width: '100%', height: '6px', background: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${percentComplete}%`,
                height: '100%',
                background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-success))',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>
      </div>

      {/* Chapter & Code Tree Container */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 0.5rem' }}>
        {isLoading ? (
          <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.875rem' }}>
            Loading repository tree...
          </div>
        ) : toc.length === 0 ? (
          <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.875rem' }}>
            No files found in this repo.
          </div>
        ) : (
          toc.map((node) => renderTocItem(node))
        )}
      </div>
    </aside>
  );
};
