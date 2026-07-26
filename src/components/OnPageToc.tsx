import React, { useState, useEffect } from 'react';
import { List, AlignLeft } from 'lucide-react';
import { HeadingItem } from '../types';

interface OnPageTocProps {
  headings: HeadingItem[];
}

export const OnPageToc: React.FC<OnPageTocProps> = ({ headings }) => {
  const [activeHeadingId, setActiveHeadingId] = useState<string>('');

  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveHeadingId(entry.target.id);
          }
        });
      },
      { rootMargin: '-80px 0px -70% 0px' }
    );

    headings.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  const scrollToHeading = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      setActiveHeadingId(id);
    }
  };

  return (
    <aside
      className="onpage-toc-container glass-panel"
      style={{
        width: '240px',
        padding: '1.25rem 1rem',
        borderLeft: '1px solid var(--border-color)',
        background: 'transparent',
        fontSize: '0.85rem',
        overflowY: 'auto',
        maxHeight: '100%',
        userSelect: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontWeight: 600,
          color: 'var(--text-muted)',
          marginBottom: '1rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          fontSize: '0.75rem',
        }}
      >
        <AlignLeft size={14} color="var(--accent-primary)" />
        <span>On This Page</span>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        {headings.map((h) => {
          const isActive = activeHeadingId === h.id;
          const indent = (h.level - 1) * 10;
          return (
            <a
              key={h.id}
              onClick={(e) => {
                e.preventDefault();
                scrollToHeading(h.id);
              }}
              href={`#${h.id}`}
              style={{
                marginLeft: `${indent}px`,
                color: isActive ? 'var(--accent-primary)' : 'var(--text-dim)',
                fontWeight: isActive ? 600 : 400,
                textDecoration: 'none',
                lineHeight: 1.4,
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                transition: 'color 0.15s ease',
              }}
              title={h.text}
            >
              {h.text}
            </a>
          );
        })}
      </nav>
    </aside>
  );
};
