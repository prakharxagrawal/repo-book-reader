import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Move, Grid, Sun, Moon } from 'lucide-react';

interface InteractiveCanvasProps {
  svgMarkup: string;
  title?: string;
  elementsCount?: number;
}

export const InteractiveCanvas: React.FC<InteractiveCanvasProps> = ({
  svgMarkup,
  title = 'Interactive Diagram Canvas',
  elementsCount,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom((prev) => Math.min(Math.max(0.3, prev * zoomFactor), 4.0));
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev * 1.25, 4.0));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev * 0.8, 0.3));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div
      style={{
        margin: '1.5rem 0',
        borderRadius: '0.85rem',
        border: '1px solid var(--border-color)',
        background: 'var(--bg-secondary)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-lg)',
        position: 'relative',
        userSelect: 'none',
      }}
    >
      {/* Top Controls Header */}
      <div
        style={{
          padding: '0.75rem 1.25rem',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-tertiary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.85rem',
          color: 'var(--text-main)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
          <Move size={16} color="var(--accent-primary)" />
          <span>{title}</span>
          {elementsCount !== undefined && (
            <span className="badge" style={{ fontSize: '0.75rem', background: 'rgba(56, 189, 248, 0.1)', color: 'var(--accent-primary)' }}>
              {elementsCount} elements
            </span>
          )}
        </div>

        {/* Floating Zoom Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginRight: '0.4rem' }}>
            {Math.round(zoom * 100)}%
          </span>
          <button className="btn btn-icon" onClick={handleZoomIn} title="Zoom In (+)">
            <ZoomIn size={15} />
          </button>
          <button className="btn btn-icon" onClick={handleZoomOut} title="Zoom Out (-)">
            <ZoomOut size={15} />
          </button>
          <button className="btn btn-icon" onClick={handleReset} title="Reset View (100%)">
            <RotateCcw size={15} />
          </button>
        </div>
      </div>

      {/* Interactive Draggable Canvas Viewport */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{
          height: '520px',
          cursor: isDragging ? 'grabbing' : 'grab',
          overflow: 'hidden',
          position: 'relative',
          background: 'var(--bg-primary)',
          backgroundImage: 'radial-gradient(var(--border-color) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
            maxWidth: '100%',
            maxHeight: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          dangerouslySetInnerHTML={{ __html: svgMarkup }}
        />
      </div>

      {/* Footer Instruction Hint */}
      <div style={{ padding: '0.5rem 1rem', background: 'var(--bg-tertiary)', borderTop: '1px solid var(--border-subtle)', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
        💡 <strong>Click & Drag</strong> to move canvas • <strong>Scroll wheel</strong> to zoom in/out
      </div>
    </div>
  );
};
