import React, { useState } from 'react';
import { Bookmark, FileEdit, Trash2, X, ExternalLink, Plus } from 'lucide-react';
import { Bookmark as BookmarkType, UserNote } from '../types';

interface NotesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  bookmarks: BookmarkType[];
  notes: UserNote[];
  currentPath: string | null;
  currentChapterTitle: string;
  onSelectChapter: (path: string) => void;
  onDeleteBookmark: (id: string) => void;
  onSaveNote: (noteText: string) => void;
  onDeleteNote: (id: string) => void;
}

export const NotesDrawer: React.FC<NotesDrawerProps> = ({
  isOpen,
  onClose,
  bookmarks,
  notes,
  currentPath,
  currentChapterTitle,
  onSelectChapter,
  onDeleteBookmark,
  onSaveNote,
  onDeleteNote,
}) => {
  const [activeTab, setActiveTab] = useState<'bookmarks' | 'notes'>('bookmarks');
  const [newNoteInput, setNewNoteInput] = useState('');

  if (!isOpen) return null;

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteInput.trim()) return;
    onSaveNote(newNoteInput.trim());
    setNewNoteInput('');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '550px' }} onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className={`btn ${activeTab === 'bookmarks' ? 'btn-primary' : ''}`}
              onClick={() => setActiveTab('bookmarks')}
              style={{ fontSize: '0.85rem' }}
            >
              <Bookmark size={15} /> Bookmarks ({bookmarks.length})
            </button>
            <button
              className={`btn ${activeTab === 'notes' ? 'btn-primary' : ''}`}
              onClick={() => setActiveTab('notes')}
              style={{ fontSize: '0.85rem' }}
            >
              <FileEdit size={15} /> Notes ({notes.length})
            </button>
          </div>
          <button className="btn btn-icon" onClick={onClose} style={{ background: 'transparent', border: 'none' }}>
            <X size={18} />
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ padding: '1.25rem', overflowY: 'auto', flex: 1, maxHeight: '450px' }}>
          {activeTab === 'bookmarks' ? (
            bookmarks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dim)', fontSize: '0.875rem' }}>
                No bookmarks saved yet. Click the "Bookmark" button while reading any chapter!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {bookmarks.map((b) => (
                  <div
                    key={b.id}
                    style={{
                      padding: '0.85rem 1rem',
                      borderRadius: '0.5rem',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <div
                        style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--accent-primary)', cursor: 'pointer' }}
                        onClick={() => {
                          onSelectChapter(b.path);
                          onClose();
                        }}
                      >
                        {b.chapterTitle}
                      </div>
                      <button
                        onClick={() => onDeleteBookmark(b.id)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--accent-danger)', cursor: 'pointer' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      "{b.snippet}..."
                    </p>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div>
              {/* Add Note Form */}
              {currentPath ? (
                <form onSubmit={handleAddNote} style={{ marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '0.4rem' }}>
                    Add study note for: <strong>{currentChapterTitle}</strong>
                  </div>
                  <textarea
                    rows={3}
                    className="input-field"
                    placeholder="Write key takeaways, questions, or architectural summary..."
                    value={newNoteInput}
                    onChange={(e) => setNewNoteInput(e.target.value)}
                    style={{ width: '100%', marginBottom: '0.5rem', fontFamily: 'var(--font-sans)' }}
                  />
                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                    <Plus size={15} /> Save Study Note
                  </button>
                </form>
              ) : (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '1rem', fontStyle: 'italic' }}>
                  Open a chapter to attach personal notes.
                </div>
              )}

              {/* Saved Notes List */}
              {notes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-dim)', fontSize: '0.875rem' }}>
                  No study notes saved.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {notes.map((n) => (
                    <div
                      key={n.id}
                      style={{
                        padding: '0.85rem 1rem',
                        borderRadius: '0.5rem',
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <div
                          style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)', cursor: 'pointer' }}
                          onClick={() => {
                            onSelectChapter(n.path);
                            onClose();
                          }}
                        >
                          {n.chapterTitle}
                        </div>
                        <button
                          onClick={() => onDeleteNote(n.id)}
                          style={{ background: 'transparent', border: 'none', color: 'var(--accent-danger)', cursor: 'pointer' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'pre-wrap' }}>
                        {n.text}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
