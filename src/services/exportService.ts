import { RepoInfo, TocNode } from '../types';

export function exportToPdf() {
  window.print();
}

export function exportToHtml(repoInfo: RepoInfo | null, currentTitle: string, htmlContent: string) {
  const repoName = repoInfo ? `${repoInfo.owner}/${repoInfo.repo}` : 'GitBookify Book';
  const fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${currentTitle} - ${repoName}</title>
  <style>
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      line-height: 1.7;
      color: #1a202c;
      background: #f7fafc;
      margin: 0;
      padding: 2rem;
    }
    .container {
      max-width: 850px;
      margin: 0 auto;
      background: #ffffff;
      padding: 3rem;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    h1, h2, h3, h4 { color: #2d3748; margin-top: 1.8rem; }
    h1 { border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem; }
    pre { background: #1a202c; color: #e2e8f0; padding: 1rem; border-radius: 6px; overflow-x: auto; }
    code { font-family: 'Consolas', 'Fira Code', monospace; font-size: 0.9em; }
    blockquote { border-left: 4px solid #3182ce; padding-left: 1rem; color: #4a5568; margin: 1.5rem 0; font-style: italic; }
    table { width: 100%; border-collapse: collapse; margin: 1.5rem 0; }
    th, td { border: 1px solid #cbd5e0; padding: 0.5rem 0.8rem; text-align: left; }
    th { background: #edf2f7; }
    .header-meta { font-size: 0.9rem; color: #718096; margin-bottom: 2rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 1rem; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header-meta">
      Exported from GitBookify &bull; Repository: ${repoName} &bull; Date: ${new Date().toLocaleDateString()}
    </div>
    <h1>${currentTitle}</h1>
    ${htmlContent}
  </div>
</body>
</html>
  `;

  const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${repoName.replace('/', '-')}-${currentTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
