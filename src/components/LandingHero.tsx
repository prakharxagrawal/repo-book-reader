import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  Code,
  Zap,
  Star,
  Sparkles,
  ArrowRight,
  Bookmark,
  Layers,
  Terminal,
  Cpu,
  Globe,
  FileCode2,
} from 'lucide-react';
import { PRESET_REPOSITORIES } from '../data/presets';

interface LandingHeroProps {
  onSelectRepo: (owner: string, repo: string) => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({ onSelectRepo }) => {
  const [repoInput, setRepoInput] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoInput.trim()) return;

    let input = repoInput.trim();
    if (input.includes('github.com/')) {
      const parts = input.split('github.com/')[1].split('?')[0].split('#')[0].split('/');
      if (parts.length >= 2) {
        onSelectRepo(parts[0], parts[1]);
        return;
      }
    }

    const parts = input.split('/');
    if (parts.length === 2) {
      onSelectRepo(parts[0], parts[1]);
    } else {
      alert('Please enter a valid format: "owner/repo" or full GitHub URL');
    }
  };

  const categories = ['All', 'System Design', 'Web & Frameworks', 'Computer Science', 'AI & Machine Learning'];

  const filteredPresets = PRESET_REPOSITORIES.filter((preset) => {
    if (activeCategory === 'All') return true;
    return preset.category.toLowerCase().includes(activeCategory.toLowerCase());
  });

  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '3rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: 'radial-gradient(ellipse at top, var(--accent-glow) 0%, transparent 70%)',
      }}
    >
      {/* Hero Header Badge */}
      <div
        className="badge"
        style={{
          padding: '0.4rem 1rem',
          fontSize: '0.85rem',
          marginBottom: '1.5rem',
          gap: '0.5rem',
          borderRadius: '9999px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--accent-glow)',
        }}
      >
        <Sparkles size={16} color="var(--accent-primary)" />
        <span>Universal Repository Reader & Code Viewer</span>
      </div>

      {/* Main Title */}
      <h1
        style={{
          fontSize: 'clamp(2.2rem, 5vw, 3.5rem)',
          fontWeight: 800,
          textAlign: 'center',
          maxWidth: '850px',
          lineHeight: 1.15,
          color: 'var(--text-main)',
          marginBottom: '1.25rem',
          letterSpacing: '-0.02em',
        }}
      >
        Turn Any GitHub Repo into an <span style={{ color: 'var(--accent-primary)' }}>Interactive Book</span>
      </h1>

      <p
        style={{
          fontSize: '1.1rem',
          color: 'var(--text-muted)',
          textAlign: 'center',
          maxWidth: '650px',
          marginBottom: '2.5rem',
          lineHeight: 1.6,
        }}
      >
        Paste any public GitHub repository link or search term to read documentation like a textbook or inspect source code with syntax highlighting, bookmarks, and notes.
      </p>

      {/* Primary Input Box */}
      <form
        onSubmit={handleFormSubmit}
        style={{
          width: '100%',
          maxWidth: '680px',
          marginBottom: '3.5rem',
          display: 'flex',
          gap: '0.75rem',
          background: 'var(--bg-secondary)',
          padding: '0.6rem 0.75rem',
          borderRadius: '0.75rem',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', paddingLeft: '0.5rem', color: 'var(--accent-primary)' }}>
          <Search size={22} />
        </div>
        <input
          type="text"
          placeholder="Paste GitHub URL (e.g. facebook/react, torvalds/linux, owner/repo)..."
          value={repoInput}
          onChange={(e) => setRepoInput(e.target.value)}
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
        <button type="submit" className="btn btn-primary" style={{ padding: '0.65rem 1.4rem', fontSize: '0.95rem' }}>
          Explore Repo <ArrowRight size={18} />
        </button>
      </form>

      {/* Preset Category Pills */}
      <div style={{ maxWidth: '1000px', width: '100%', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Globe size={20} color="var(--accent-primary)" />
            <span>Popular & Curated Repositories</span>
          </div>

          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {categories.map((cat) => (
              <button
                key={cat}
                className={`btn ${activeCategory === cat ? 'btn-primary' : ''}`}
                onClick={() => setActiveCategory(cat)}
                style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', borderRadius: '9999px' }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Preset Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {filteredPresets.map((preset) => (
            <div
              key={preset.id}
              onClick={() => onSelectRepo(preset.owner, preset.repo)}
              className="glass-panel"
              style={{
                padding: '1.25rem',
                borderRadius: '0.85rem',
                cursor: 'pointer',
                transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.borderColor = 'var(--accent-primary)';
                e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <span className="badge" style={{ fontSize: '0.7rem' }}>
                    {preset.category}
                  </span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-warning)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <Star size={14} fill="var(--accent-warning)" />
                    {preset.starsBadge}
                  </span>
                </div>

                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                  {preset.name}
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', marginBottom: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                  {preset.owner}/{preset.repo}
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '1rem' }}>
                  {preset.description}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-primary)' }}>
                <span>Read & Inspect</span>
                <ArrowRight size={14} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Highlights Section */}
      <div style={{ maxWidth: '1000px', width: '100%', marginTop: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
          <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '0.75rem' }}>
            <BookOpen size={24} color="var(--accent-primary)" style={{ marginBottom: '0.75rem' }} />
            <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.35rem', color: 'var(--text-main)' }}>
              Textbook Reading Mode
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Parses markdown documents into clean chapters with word counts, estimated reading time, callouts, and on-page TOC.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '0.75rem' }}>
            <FileCode2 size={24} color="var(--accent-primary)" style={{ marginBottom: '0.75rem' }} />
            <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.35rem', color: 'var(--text-main)' }}>
              Universal Code Viewer
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Inspect TypeScript, Python, Go, Rust, C++, JSON, and config files with line numbers and 1-click code copy.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '0.75rem' }}>
            <Bookmark size={24} color="var(--accent-primary)" style={{ marginBottom: '0.75rem' }} />
            <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.35rem', color: 'var(--text-main)' }}>
              Personal Study Notes
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Bookmark key snippets and save study notes per repository stored locally in your browser.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
