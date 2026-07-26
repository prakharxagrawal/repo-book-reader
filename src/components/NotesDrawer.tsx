import React, { useState } from 'react';
import { X, Bookmark, FileText, Plus, Trash2, Edit3, Save, Download } from 'lucide-react';
import { Bookmark as BookmarkType, UserNote } from '../types';

interface NotesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  bookmarks: BookmarkType[];
  notes: UserNote[];
  currentPath: string;
  chapterTitle: string;
  repoKey: string;
  onAddNote: (noteText: string) => void;
  onDeleteNote: (id: string) => void;
  onDeleteBookmark: (id: string) => void;
}

export const NotesDrawer: React.FC<NotesDrawerProps> = ({
  isOpen,
  onClose,
  bookmarks,
  notes,
  currentPath,
  chapterTitle,
  repoKey,
  onAddNote,
  onDeleteNote,
  onDeleteBookmark,
}) => {
  const [activeTab, setActiveTab] = useState<'notes' | 'bookmarks'>('notes');
  const [newNoteText, setNewNoteText] = useState('');

  if (!isOpen) return null;

  const currentRepoNotes = notes.filter((n) => n.repoKey === repoKey);
  const currentRepoBookmarks = bookmarks.filter((b) => b.repoKey === repoKey);

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    onAddNote(newNoteText);
    setNewNoteText('');
  };

  const handleExportNotes = () => {
    const textContent = currentRepoNotes
      .map((n) => `## Note for ${n.chapterTitle} (${n.path})\n${n.text}\n---\n`)
      .join('\n');
    const blob = new Blob([textContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notes-${repoKey.replace('/', '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: '420px',
        maxWidth: '100vw',
        background: 'var(--bg-secondary)',
        borderLeft: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-xl)',
        zIndex: 1100,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileText size={20} color="var(--accent-primary)" />
          <span>Study Notes & Bookmarks</span>
        </div>
        <button className="btn btn-icon" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-tertiary)' }}>
        <button
          style={{
            flex: 1,
            padding: '0.75rem',
            border: 'none',
            background: 'transparent',
            color: activeTab === 'notes' ? 'var(--accent-primary)' : 'var(--text-muted)',
            fontWeight: activeTab === 'notes' ? 600 : 400,
            borderBottom: activeTab === 'notes' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            cursor: 'pointer',
          }}
          onClick={() => setActiveTab('notes')}
        >
          Notes ({currentRepoNotes.length})
        </button>
        <button
          style={{
            flex: 1,
            padding: '0.75rem',
            border: 'none',
            background: 'transparent',
            color: activeTab === 'bookmarks' ? 'var(--accent-primary)' : 'var(--text-muted)',
            fontWeight: activeTab === 'bookmarks' ? 600 : 400,
            borderBottom: activeTab === 'bookmarks' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            cursor: 'pointer',
          }}
          onClick={() => setActiveTab('bookmarks')}
        >
          Bookmarks ({currentRepoBookmarks.length})
        </button>
      </div>

      {/* Content Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
        {activeTab === 'notes' ? (
          <div>
            {/* New Note Form */}
            <form onSubmit={handleCreateNote} style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 600 }}>
                Add Note for "{chapterTitle}":
              </div>
              <textarea
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder="Write your study note or summary here..."
                style={{
                  width: '100%',
                  height: '90px',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem',
                  resize: 'vertical',
                  marginBottom: '0.5rem',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {currentRepoNotes.length > 0 && (
                  <button type="button" className="btn" onClick={handleExportNotes} style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}>
                    <Download size={14} /> Export .md
                  </button>
                )}
                <button type="submit" className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', marginLeft: 'auto' }}>
                  <Plus size={14} /> Add Note
                </button>
              </div>
            </form>

            {/* Existing Notes List */}
            {currentRepoNotes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                No notes added yet for this repository. Type a note above to save your study annotations!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {currentRepoNotes.map((note) => (
                  <div
                    key={note.id}
                    style={{
                      padding: '1rem',
                      background: 'var(--bg-tertiary)',
                      borderRadius: '0.6rem',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-primary)' }}>
                        {note.chapterTitle}
                      </div>
                      <button
                        className="btn btn-icon"
                        onClick={() => onDeleteNote(note.id)}
                        style={{ color: 'var(--accent-danger)', padding: '0.2rem' }}
                        title="Delete Note"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                      {note.text}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                      {new Date(note.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            {currentRepoBookmarks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                No bookmarks added yet. Click the "Bookmark" button in the chapter header to save quick reference locations!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {currentRepoBookmarks.map((bm) => (
                  <div
                    key={bm.id}
                    style={{
                      padding: '1rem',
                      background: 'var(--bg-tertiary)',
                      borderRadius: '0.6rem',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Bookmark size={14} />
                        {bm.chapterTitle}
                      </div>
                      <button
                        className="btn btn-icon"
                        onClick={() => onDeleteBookmark(bm.id)}
                        style={{ color: 'var(--accent-danger)', padding: '0.2rem' }}
                        title="Remove Bookmark"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {bm.snippet}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
