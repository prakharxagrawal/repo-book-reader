import React, { useState, useEffect } from 'react';
import { Search, X, FileText, ArrowRight } from 'lucide-react';
import { TocNode } from '../types';
import { flattenToc } from '../services/tocParser';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  toc: TocNode[];
  onSelectNode: (node: TocNode) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  toc,
  onSelectNode,
}) => {
  const [query, setQuery] = useState('');

  // Handle Ctrl+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const allMarkdownFiles = flattenToc(toc);

  const filteredResults = query.trim()
    ? allMarkdownFiles.filter(
        (node) =>
          node.title.toLowerCase().includes(query.toLowerCase()) ||
          node.path.toLowerCase().includes(query.toLowerCase())
      )
    : allMarkdownFiles.slice(0, 10);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Search Header */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)', gap: '0.75rem' }}>
          <Search size={20} color="var(--accent-primary)" />
          <input
            type="text"
            autoFocus
            placeholder="Type to search repository chapters & topics..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-main)',
              fontSize: '1.05rem',
              fontFamily: 'var(--font-sans)',
            }}
          />
          <button className="btn btn-icon" onClick={onClose} style={{ background: 'transparent', border: 'none' }}>
            <X size={18} />
          </button>
        </div>

        {/* Search Results List */}
        <div style={{ padding: '1rem', overflowY: 'auto', maxHeight: '400px' }}>
          {filteredResults.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.9rem' }}>
              No matching chapters found for "{query}"
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {filteredResults.map((node) => (
                <div
                  key={node.id}
                  onClick={() => {
                    onSelectNode(node);
                    onClose();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.5rem',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s, background 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent-primary)';
                    e.currentTarget.style.background = 'var(--bg-tertiary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    e.currentTarget.style.background = 'var(--bg-primary)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <FileText size={18} color="var(--accent-primary)" />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                        {node.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {node.path}
                      </div>
                    </div>
                  </div>
                  <ArrowRight size={16} color="var(--text-dim)" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Search Footer */}
        <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-primary)', fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', justifyContent: 'space-between' }}>
          <span>Navigation: Select chapter to open</span>
          <span>ESC to close</span>
        </div>
      </div>
    </div>
  );
};
