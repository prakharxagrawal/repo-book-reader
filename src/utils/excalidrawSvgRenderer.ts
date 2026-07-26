export function renderExcalidrawToSvg(jsonContent: string): string {
  try {
    const parsed = typeof jsonContent === 'string' ? JSON.parse(jsonContent) : jsonContent;
    const elements: any[] = parsed.elements || (Array.isArray(parsed) ? parsed : []);

    if (!elements || elements.length === 0) {
      return `<div style="padding: 2rem; color: var(--text-dim); text-align: center;">Empty Excalidraw Diagram</div>`;
    }

    // Calculate bounding box bounds
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    elements.forEach((el) => {
      if (el.isDeleted) return;
      const x = el.x || 0;
      const y = el.y || 0;
      const w = el.width || 50;
      const h = el.height || 50;

      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x + w > maxX) maxX = x + w;
      if (y + h > maxY) maxY = y + h;
    });

    if (minX === Infinity) {
      minX = 0; minY = 0; maxX = 800; maxY = 600;
    }

    const padding = 40;
    const viewBoxX = minX - padding;
    const viewBoxY = minY - padding;
    const viewBoxW = Math.max(200, maxX - minX + padding * 2);
    const viewBoxH = Math.max(150, maxY - minY + padding * 2);

    // Build SVG elements
    let svgItems = '';

    elements.forEach((el) => {
      if (el.isDeleted) return;

      const x = el.x || 0;
      const y = el.y || 0;
      const w = el.width || 0;
      const h = el.height || 0;

      const stroke = el.strokeColor && el.strokeColor !== 'transparent' ? el.strokeColor : '#38bdf8';
      const fill = el.backgroundColor && el.backgroundColor !== 'transparent' ? el.backgroundColor : 'rgba(56, 189, 248, 0.08)';
      const strokeWidth = el.strokeWidth || 2;
      const opacity = el.opacity !== undefined ? el.opacity / 100 : 1;

      switch (el.type) {
        case 'rectangle':
          svgItems += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" ry="8" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" opacity="${opacity}" />`;
          break;

        case 'ellipse':
          const cx = x + w / 2;
          const cy = y + h / 2;
          const rx = w / 2;
          const ry = h / 2;
          svgItems += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" opacity="${opacity}" />`;
          break;

        case 'diamond':
          const topX = x + w / 2, topY = y;
          const rightX = x + w, rightY = y + h / 2;
          const bottomX = x + w / 2, bottomY = y + h;
          const leftX = x, leftY = y + h / 2;
          svgItems += `<polygon points="${topX},${topY} ${rightX},${rightY} ${bottomX},${bottomY} ${leftX},${leftY}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" opacity="${opacity}" />`;
          break;

        case 'arrow':
        case 'line':
          if (el.points && el.points.length >= 2) {
            const startX = x + el.points[0][0];
            const startY = y + el.points[0][1];
            const endX = x + el.points[el.points.length - 1][0];
            const endY = y + el.points[el.points.length - 1][1];

            svgItems += `<line x1="${startX}" y1="${startY}" x2="${endX}" y2="${endY}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-dasharray="${el.strokeStyle === 'dashed' ? '6,6' : 'none'}" marker-end="url(#excalidraw-arrowhead)" opacity="${opacity}" />`;
          } else {
            svgItems += `<line x1="${x}" y1="${y}" x2="${x + w}" y2="${y + h}" stroke="${stroke}" stroke-width="${strokeWidth}" marker-end="url(#excalidraw-arrowhead)" opacity="${opacity}" />`;
          }
          break;

        case 'text':
          const fontSize = el.fontSize || 16;
          const textAnchor = el.textAlign === 'center' ? 'middle' : el.textAlign === 'right' ? 'end' : 'start';
          const textX = el.textAlign === 'center' ? x + w / 2 : el.textAlign === 'right' ? x + w : x;
          const textY = y + fontSize * 0.85;

          const lines = (el.text || '').split('\n');
          lines.forEach((lineText: string, idx: number) => {
            svgItems += `<text x="${textX}" y="${textY + idx * fontSize * 1.25}" fill="${stroke}" font-family="Inter, system-ui, sans-serif" font-size="${fontSize}px" font-weight="600" text-anchor="${textAnchor}" opacity="${opacity}">${escapeXml(lineText)}</text>`;
          });
          break;

        default:
          if (w > 0 && h > 0) {
            svgItems += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" opacity="${opacity}" />`;
          }
          break;
      }
    });

    return `
      <div className="excalidraw-canvas-container" style="margin: 1.5rem 0; padding: 1.5rem; background: #090d16; border: 1px solid var(--border-color); border-radius: 0.85rem; overflow-x: auto; box-shadow: var(--shadow-lg); text-align: center;">
        <div style="font-size: 0.75rem; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 1rem; display: flex; alignItems: center; justify-content: space-between;">
          <span>🎨 Excalidraw Hand-Drawn Sketch Canvas</span>
          <span>${elements.length} vector elements</span>
        </div>
        <svg viewBox="${viewBoxX} ${viewBoxY} ${viewBoxW} ${viewBoxH}" style="width: 100%; max-width: 900px; height: auto; display: block; margin: 0 auto;">
          <defs>
            <marker id="excalidraw-arrowhead" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--accent-primary)" />
            </marker>
            <pattern id="excalidraw-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="rgba(255, 255, 255, 0.05)" />
            </pattern>
          </defs>
          <rect x="${viewBoxX}" y="${viewBoxY}" width="${viewBoxW}" height="${viewBoxH}" fill="url(#excalidraw-grid)" />
          ${svgItems}
        </svg>
      </div>
    `;
  } catch (e: any) {
    return `<div style="padding: 1.5rem; color: var(--accent-danger); background: rgba(239, 68, 68, 0.1); border-radius: 0.5rem; border: 1px solid var(--accent-danger);">Excalidraw SVG Render Error: ${e.message}</div>`;
  }
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
