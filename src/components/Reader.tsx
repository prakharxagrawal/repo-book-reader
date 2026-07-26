import React, { useEffect, useMemo, useRef, useState } from 'react';
import { marked } from 'marked';
import {
  Clock,
  BookOpen,
  CheckCircle,
  Circle,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  FileText,
  FileCode,
  Code2,
  Play,
  Terminal,
  Layers,
} from 'lucide-react';
import { HeadingItem, FileCategory } from '../types';
import { normalizePath } from '../services/githubApi';
import { renderExcalidrawToSvg } from '../utils/excalidrawSvgRenderer';
import { InteractiveCanvas } from './InteractiveCanvas';

declare global {
  interface Window {
    mermaid?: any;
  }
}

interface ReaderProps {
  currentPath: string | null;
  chapterTitle: string;
  markdownContent: string;
  fileCategory?: FileCategory;
  language?: string;
  isLoading: boolean;
  isCompleted: boolean;
  onToggleComplete: (path: string) => void;
  onAddBookmark: (snippet: string) => void;
  onNavigatePrev: () => void;
  onNavigateNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  onHeadingsExtracted: (headings: HeadingItem[]) => void;
  onNavigateToPath?: (path: string) => void;
}

export const Reader: React.FC<ReaderProps> = ({
  currentPath,
  chapterTitle,
  markdownContent,
  fileCategory = 'markdown',
  language = 'text',
  isLoading,
  isCompleted,
  onToggleComplete,
  onAddBookmark,
  onNavigatePrev,
  onNavigateNext,
  hasPrev,
  hasNext,
  onHeadingsExtracted,
  onNavigateToPath,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const isMarkdown = fileCategory === 'markdown' || (currentPath && currentPath.toLowerCase().endsWith('.md'));
  const isStandaloneDiagram = !!(currentPath && (
    currentPath.toLowerCase().endsWith('.excalidraw') ||
    currentPath.toLowerCase().endsWith('.excalidraw.json') ||
    currentPath.toLowerCase().endsWith('.mermaid') ||
    currentPath.toLowerCase().endsWith('.puml') ||
    currentPath.toLowerCase().endsWith('.plantuml') ||
    currentPath.toLowerCase().endsWith('.svg')
  ));

  // Initialize Mermaid
  useEffect(() => {
    if (window.mermaid) {
      try {
        window.mermaid.initialize({
          startOnLoad: false,
          theme: 'dark',
          securityLevel: 'loose',
        });
      } catch (e) {
        console.error('Mermaid initialization error', e);
      }
    }
  }, []);

  // Compute Word Count & Reading Time
  const { wordCount, readingTimeMinutes, lineCount } = useMemo(() => {
    if (!markdownContent) return { wordCount: 0, readingTimeMinutes: 0, lineCount: 0 };
    const lines = markdownContent.split('\n');
    const words = markdownContent.trim().split(/\s+/).filter(Boolean).length;
    const time = Math.ceil(words / 200);
    return { wordCount: words, readingTimeMinutes: time, lineCount: lines.length };
  }, [markdownContent]);

  // Render Markdown HTML
  const parsedHtml = useMemo(() => {
    if (!markdownContent || !isMarkdown) return '';

    marked.setOptions({
      gfm: true,
      breaks: true,
    });

    let html = marked.parse(markdownContent) as string;

    // Transform blockquotes alerts
    const alertRegex = /<blockquote>\s*<p>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*(?:<br\/?>)?([\s\S]*?)<\/p>\s*<\/blockquote>/gi;
    html = html.replace(alertRegex, (match, type, content) => {
      const alertType = type.toLowerCase();
      return `
        <div class="callout-alert ${alertType}">
          <div class="callout-header">
            <span>[${type}]</span>
          </div>
          <div>${content}</div>
        </div>
      `;
    });

    // Intercept Mermaid blocks & Code blocks
    let blockIndex = 0;
    html = html.replace(/<pre><code(?:\s+class="language-([^"]+)")?>([\s\S]*?)<\/code><\/pre>/gi, (match, lang, code) => {
      blockIndex++;
      const langName = (lang || 'code').toLowerCase();

      // Mermaid diagram block
      if (langName === 'mermaid') {
        const diagramId = `mermaid-diagram-${blockIndex}`;
        return `
          <div class="mermaid-wrapper" id="${diagramId}" data-mermaid="${encodeURIComponent(code)}">
            <div class="mermaid-target">Loading diagram...</div>
          </div>
        `;
      }

      // Excalidraw diagram block
      if (langName === 'excalidraw' || langName === 'excalidraw-json') {
        return `
          <div class="mermaid-wrapper excalidraw-wrapper" data-excalidraw="${encodeURIComponent(code)}">
            <div class="excalidraw-target">Rendering Excalidraw Diagram...</div>
          </div>
        `;
      }

      // Executable code block (JS/TS/Python) vs regular code block
      const canRun = ['javascript', 'js', 'typescript', 'ts', 'python', 'py'].includes(langName);

      return `
        <div class="code-block-wrapper" id="code-block-container-${blockIndex}">
          <div class="code-block-header">
            <span>${langName}</span>
            <div style="display: flex; gap: 0.4rem;">
              ${
                canRun
                  ? `<button class="btn btn-icon run-code-btn" data-code="${encodeURIComponent(
                      code
                    )}" data-lang="${langName}" data-target="code-block-container-${blockIndex}" style="background: var(--bg-tertiary); border: 1px solid var(--border-color); padding: 0.2rem 0.5rem; cursor: pointer; color: var(--accent-primary); font-size: 0.75rem; border-radius: 4px;">
                      Run Snippet
                    </button>`
                  : ''
              }
              <button class="btn btn-icon copy-code-btn" data-code="${encodeURIComponent(code)}" style="background: transparent; border: none; padding: 0.2rem 0.5rem; cursor: pointer; color: var(--text-muted); font-size: 0.75rem;">
                Copy
              </button>
            </div>
          </div>
          <pre><code>${code}</code></pre>
        </div>
      `;
    });

    return html;
  }, [markdownContent, isMarkdown]);

  // Asynchronously render Mermaid diagrams
  useEffect(() => {
    if (!containerRef.current || (!isMarkdown && !isStandaloneDiagram) || !window.mermaid) return;
    const mermaidContainers = containerRef.current.querySelectorAll('.mermaid-wrapper');

    mermaidContainers.forEach((wrapper, idx) => {
      const rawCode = wrapper.getAttribute('data-mermaid');
      const target = wrapper.querySelector('.mermaid-target');
      if (rawCode && target) {
        const decoded = decodeURIComponent(rawCode)
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&');

        const uniqueId = `mermaid-svg-${Date.now()}-${idx}`;
        window.mermaid
          .render(uniqueId, decoded)
          .then(({ svg }: { svg: string }) => {
            target.innerHTML = svg;
          })
          .catch((err: unknown) => {
            console.error('Mermaid render error', err);
            target.innerHTML = `<div style="color: var(--accent-danger); font-size: 0.85rem;">Failed to render Mermaid diagram</div>`;
          });
      }
    });
  }, [parsedHtml, isMarkdown, isStandaloneDiagram, markdownContent]);

  // Asynchronously render Excalidraw diagrams
  useEffect(() => {
    if (!containerRef.current || (!isMarkdown && !isStandaloneDiagram)) return;
    const excalidrawContainers = containerRef.current.querySelectorAll('.excalidraw-wrapper');

    excalidrawContainers.forEach((wrapper) => {
      const rawCode = wrapper.getAttribute('data-excalidraw');
      const target = wrapper.querySelector('.excalidraw-target');
      if (rawCode && target) {
        try {
          const decoded = decodeURIComponent(rawCode);
          target.innerHTML = renderExcalidrawToSvg(decoded);
        } catch (e) {
          target.innerHTML = `<div style="color: var(--accent-danger); font-size: 0.85rem;">Excalidraw diagram syntax error</div>`;
        }
      }
    });
  }, [parsedHtml, isMarkdown, isStandaloneDiagram, markdownContent]);

  // Extract Headings
  useEffect(() => {
    if (!containerRef.current || !isMarkdown) {
      onHeadingsExtracted([]);
      return;
    }
    const headingElements = containerRef.current.querySelectorAll('h1, h2, h3');
    const headingsList: HeadingItem[] = [];

    headingElements.forEach((el, index) => {
      const text = el.textContent || '';
      const level = parseInt(el.tagName.replace('H', ''), 10);
      const id = el.id || `heading-${index}-${text.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
      el.id = id;
      headingsList.push({ id, text, level });
    });

    onHeadingsExtracted(headingsList);
  }, [parsedHtml, isMarkdown, onHeadingsExtracted]);

  // Attach event listeners for Copy Code and Run Code
  useEffect(() => {
    if (!containerRef.current || !isMarkdown) return;

    // Handle Copy Buttons
    const copyBtns = containerRef.current.querySelectorAll('.copy-code-btn');
    const handleCopy = (e: Event) => {
      const target = e.currentTarget as HTMLButtonElement;
      const rawCode = target.getAttribute('data-code');
      if (rawCode) {
        const decoded = decodeURIComponent(rawCode)
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&');
        navigator.clipboard.writeText(decoded);
        target.innerText = 'Copied!';
        setTimeout(() => {
          target.innerText = 'Copy';
        }, 2000);
      }
    };
    copyBtns.forEach((btn) => btn.addEventListener('click', handleCopy));

    // Handle Run Code Buttons (In-Browser Execution Console Sandbox)
    const runBtns = containerRef.current.querySelectorAll('.run-code-btn');
    const handleRun = (e: Event) => {
      const target = e.currentTarget as HTMLButtonElement;
      const rawCode = target.getAttribute('data-code');
      const containerId = target.getAttribute('data-target');

      if (rawCode && containerId) {
        const decoded = decodeURIComponent(rawCode)
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&');

        const wrapper = document.getElementById(containerId);
        if (!wrapper) return;

        // Existing console output
        let consoleBox = wrapper.querySelector('.code-console-output');
        if (!consoleBox) {
          consoleBox = document.createElement('div');
          consoleBox.className = 'code-console-output';
          wrapper.appendChild(consoleBox);
        }

        const logs: string[] = [];
        const customConsole = {
          log: (...args: any[]) => logs.push(args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')),
          error: (...args: any[]) => logs.push('[Error] ' + args.join(' ')),
          warn: (...args: any[]) => logs.push('[Warning] ' + args.join(' ')),
        };

        try {
          // Execute in isolated Function sandbox
          const runFn = new Function('console', decoded);
          const result = runFn(customConsole);

          let outputText = logs.join('\n');
          if (result !== undefined) {
            outputText += (outputText ? '\n' : '') + `=> Return: ${JSON.stringify(result)}`;
          }

          consoleBox.innerHTML = `
            <div class="code-console-header">Console Output</div>
            <pre style="margin: 0; white-space: pre-wrap;">${outputText || 'Snippet executed cleanly with no output.'}</pre>
          `;
        } catch (err: any) {
          consoleBox.innerHTML = `
            <div class="code-console-header" style="color: var(--accent-danger);">Execution Error</div>
            <pre style="margin: 0; color: var(--accent-danger); white-space: pre-wrap;">${err.message}</pre>
          `;
        }
      }
    };
    runBtns.forEach((btn) => btn.addEventListener('click', handleRun));

    return () => {
      copyBtns.forEach((btn) => btn.removeEventListener('click', handleCopy));
      runBtns.forEach((btn) => btn.removeEventListener('click', handleRun));
    };
  }, [parsedHtml, isMarkdown]);

  // Scroll to top on chapter change
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [currentPath]);

  // In-Page Anchor & Hyperlink Navigation
  useEffect(() => {
    if (!containerRef.current || !isMarkdown) return;

    const handleLinkClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a');
      if (!target) return;

      const href = target.getAttribute('href');
      if (!href) return;

      // External links
      if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:')) {
        target.setAttribute('target', '_blank');
        target.setAttribute('rel', 'noopener noreferrer');
        return;
      }

      // Smooth in-page anchor link scrolling (#heading-id or anchor target)
      if (href.startsWith('#')) {
        e.preventDefault();
        const targetId = href.substring(1);
        let targetEl = document.getElementById(targetId);

        if (!targetEl && containerRef.current) {
          // Search headings by text if ID doesn't match
          const headings = containerRef.current.querySelectorAll('h1, h2, h3, h4');
          headings.forEach((h) => {
            if (h.textContent?.toLowerCase().replace(/[^a-z0-9]+/g, '-').includes(targetId.toLowerCase())) {
              targetEl = h as HTMLElement;
            }
          });
        }

        if (targetEl && containerRef.current) {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        return;
      }

      // Relative markdown file link navigation
      if (onNavigateToPath && (href.toLowerCase().includes('.md') || !href.includes(':'))) {
        e.preventDefault();
        const dir = currentPath && currentPath.includes('/') ? currentPath.substring(0, currentPath.lastIndexOf('/')) : '';
        const combined = dir ? `${dir}/${href}` : href;
        const targetPath = normalizePath(combined);
        onNavigateToPath(targetPath);
      }
    };

    const container = containerRef.current;
    container.addEventListener('click', handleLinkClick);
    return () => {
      container.removeEventListener('click', handleLinkClick);
    };
  }, [parsedHtml, currentPath, isMarkdown, onNavigateToPath]);

  const handleCopyFullFile = () => {
    navigator.clipboard.writeText(markdownContent);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  if (isLoading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.2rem', marginBottom: '0.5rem', fontWeight: 600 }}>Loading file content...</div>
          <div style={{ fontSize: '0.875rem' }}>Fetching repository file from GitHub</div>
        </div>
      </div>
    );
  }

  if (!currentPath) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', padding: '2rem' }}>
        <div style={{ textAlign: 'center', maxWidth: '450px' }}>
          <BookOpen size={48} color="var(--accent-primary)" style={{ marginBottom: '1rem' }} />
          <h2 style={{ color: 'var(--text-main)', marginBottom: '0.5rem' }}>Select a File or Chapter to Inspect</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Choose any file or documentation chapter from the sidebar tree to start reading or viewing code.
          </p>
        </div>
      </div>
    );
  }

  const codeLines = markdownContent ? markdownContent.split('\n') : [];

  return (
    <main
      className="reader-canvas"
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '2.5rem 3.5rem',
        maxWidth: isMarkdown ? '920px' : '1100px',
        margin: '0 auto',
      }}
    >
      {/* File Top Header */}
      <div style={{ marginBottom: '2rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', fontWeight: 600, marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {isMarkdown ? <FileText size={15} /> : <Code2 size={15} />}
          <span>{isMarkdown ? 'Documentation Chapter' : `${language.toUpperCase()} Source File`}</span>
        </div>

        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1rem' }}>
          {chapterTitle}
        </h1>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            {isMarkdown ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Clock size={16} color="var(--accent-primary)" />
                {readingTimeMinutes} min read ({wordCount} words)
              </span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Code2 size={16} color="var(--accent-primary)" />
                {lineCount} lines ({wordCount} words)
              </span>
            )}
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
              {currentPath}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Copy Full File / Code */}
            <button className="btn" onClick={handleCopyFullFile} style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}>
              {copiedCode ? <Check size={14} color="var(--accent-success)" /> : <Copy size={14} />}
              {copiedCode ? 'Copied File!' : 'Copy Code'}
            </button>

            {/* Add Bookmark */}
            <button className="btn" onClick={() => onAddBookmark(markdownContent.substring(0, 150))} style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}>
              <Bookmark size={14} /> Bookmark
            </button>

            {/* Complete Chapter Button */}
            <button
              className={`btn ${isCompleted ? 'btn-primary' : ''}`}
              onClick={() => onToggleComplete(currentPath)}
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
            >
              {isCompleted ? <CheckCircle size={14} /> : <Circle size={14} />}
              {isCompleted ? 'Completed' : 'Mark Read'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Body: Markdown vs Standalone Diagram vs Code Viewer */}
      {isStandaloneDiagram ? (
        <div>
          {currentPath?.toLowerCase().endsWith('.mermaid') ? (
            <div className="mermaid-wrapper" data-mermaid={encodeURIComponent(markdownContent)}>
              <div className="mermaid-target">Rendering Mermaid Diagram...</div>
            </div>
          ) : currentPath?.toLowerCase().endsWith('.excalidraw') || currentPath?.toLowerCase().endsWith('.excalidraw.json') ? (
            <InteractiveCanvas
              svgMarkup={renderExcalidrawToSvg(markdownContent)}
              title={`🎨 Excalidraw Sketch: ${currentPath?.split('/').pop()}`}
            />
          ) : currentPath?.toLowerCase().endsWith('.svg') ? (
            <InteractiveCanvas
              svgMarkup={markdownContent}
              title={`📐 SVG Diagram: ${currentPath?.split('/').pop()}`}
            />
          ) : (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: '#e2e8f0', background: '#090d16', padding: '1.5rem', borderRadius: '0.5rem', textAlign: 'left', whiteSpace: 'pre-wrap' }}>
              {markdownContent}
            </div>
          )}
        </div>
      ) : isMarkdown ? (
        <div ref={containerRef} className="markdown-body" dangerouslySetInnerHTML={{ __html: parsedHtml }} />
      ) : (
        <div ref={containerRef} className="code-viewer-container">
          <table className="code-viewer-table">
            <tbody>
              {codeLines.map((line, idx) => (
                <tr key={idx}>
                  <td className="code-line-number">{idx + 1}</td>
                  <td className="code-line-content">
                    <code>{line || ' '}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer Navigation */}
      <div
        className="reader-controls"
        style={{
          marginTop: '4rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <button
          className="btn"
          onClick={onNavigatePrev}
          disabled={!hasPrev}
          style={{ opacity: hasPrev ? 1 : 0.4, cursor: hasPrev ? 'pointer' : 'not-allowed' }}
        >
          <ChevronLeft size={16} /> Previous File
        </button>

        <button
          className="btn btn-primary"
          onClick={onNavigateNext}
          disabled={!hasNext}
          style={{ opacity: hasNext ? 1 : 0.4, cursor: hasNext ? 'pointer' : 'not-allowed' }}
        >
          Next File <ChevronRight size={16} />
        </button>
      </div>
    </main>
  );
};
