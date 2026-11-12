import React, { useRef, useEffect, useState } from 'react';
import {
  Navigation2,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Crosshair,
  MapPin,
  Compass
} from 'lucide-react';

export default function GoogleMinimap({
  layout,
  cameraPos,
  cameraTarget,
  onTeleportToLocation
}) {
  const canvasRef = useRef(null);
  const [collapsed, setCollapsed] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1.0);

  // Render Minimap Radar on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !layout || collapsed) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear background (Dark Google Maps Cyber Theme)
    ctx.fillStyle = '#050b14';
    ctx.fillRect(0, 0, width, height);

    // Grid Lines
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.12)';
    ctx.lineWidth = 1;
    const step = 25 * zoomLevel;
    for (let x = 0; x <= width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // World to Canvas coordinate mapper
    const citySize = Math.max(layout.citySize, 120);
    const scale = (width / (citySize * 2.2)) * zoomLevel;
    const centerX = width / 2;
    const centerY = height / 2;

    const toCanvasX = (wx) => centerX + wx * scale;
    const toCanvasY = (wz) => centerY + wz * scale;

    // 1. Draw Districts (Parcels)
    layout.districts.forEach((d) => {
      const dx = toCanvasX(d.worldX - d.width / 2);
      const dy = toCanvasY(d.worldZ - d.depth / 2);
      const dw = d.width * scale;
      const dh = d.depth * scale;

      // Parcel background
      ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
      ctx.fillRect(dx, dy, dw, dh);

      // Border
      ctx.strokeStyle = 'rgba(14, 165, 233, 0.5)';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(dx, dy, dw, dh);

      // District Label (if zoomed in enough)
      if (zoomLevel >= 0.8) {
        ctx.fillStyle = '#38bdf8';
        ctx.font = '9px "Space Grotesk", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        const cleanName = d.district.name.replace('District: /', '').replace('Metropolis Central ', '');
        ctx.fillText(cleanName.slice(0, 12), dx + dw / 2, dy + 2);
      }
    });

    // 2. Draw Buildings (Dots)
    layout.buildings.forEach((b) => {
      const bx = toCanvasX(b.x);
      const by = toCanvasY(b.z);

      ctx.fillStyle = b.file.isMonolith ? '#ef4444' : b.file.language.color;
      const dotSize = Math.max(2, (b.w / 2) * scale);
      ctx.fillRect(bx - dotSize / 2, by - dotSize / 2, dotSize, dotSize);
    });

    // 3. Draw Camera Position & Cone of Vision (GPS Beacon)
    if (cameraPos && cameraTarget) {
      const camX = toCanvasX(cameraPos.x);
      const camY = toCanvasY(cameraPos.z);
      const targetX = toCanvasX(cameraTarget.x);
      const targetY = toCanvasY(cameraTarget.z);

      // Angle of camera orientation
      const angle = Math.atan2(targetY - camY, targetX - camX);

      // Radar view cone
      const coneLength = 32 * zoomLevel;
      const fov = 0.5; // ~30 degrees spread

      ctx.fillStyle = 'rgba(6, 182, 212, 0.2)';
      ctx.beginPath();
      ctx.moveTo(camX, camY);
      ctx.arc(camX, camY, coneLength, angle - fov, angle + fov);
      ctx.closePath();
      ctx.fill();

      // Camera Beacon Center Pulse
      ctx.beginPath();
      ctx.arc(camX, camY, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#06b6d4';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Target Crosshair
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.arc(targetX, targetY, 3, 0, Math.PI * 2);
      ctx.stroke();
    }
  }, [layout, cameraPos, cameraTarget, zoomLevel, collapsed]);

  // Click on minimap to teleport camera
  const handleMinimapClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas || !layout || !onTeleportToLocation) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const width = canvas.width;
    const height = canvas.height;
    const citySize = Math.max(layout.citySize, 120);
    const scale = (width / (citySize * 2.2)) * zoomLevel;

    // Convert click back to 3D world coordinates
    const worldX = (clickX - width / 2) / scale;
    const worldZ = (clickY - height / 2) / scale;

    onTeleportToLocation(worldX, worldZ);
  };

  return (
    <div className="fixed bottom-6 right-4 z-30 transition-all duration-300">
      <div className="bg-slate-950/90 backdrop-blur-xl border border-cyan-500/40 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 bg-slate-900/80 border-b border-slate-800">
          <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400">
            <Compass className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
            <span>GPS RADAR MAP</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
              className="p-1 rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-800"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.25))}
              className="p-1 rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-800"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 ml-1"
              title={collapsed ? 'Expand Minimap' : 'Collapse Minimap'}
            >
              {collapsed ? (
                <Maximize2 className="w-3.5 h-3.5" />
              ) : (
                <Minimize2 className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Radar Canvas Body */}
        {!collapsed && (
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={200}
              height={180}
              onClick={handleMinimapClick}
              className="cursor-crosshair block"
              title="Click anywhere on the radar map to teleport the 3D camera there"
            />
            {/* GPS Telemetry Overlay */}
            <div className="absolute bottom-1 left-2 right-2 flex items-center justify-between text-[9px] font-mono text-cyan-400/80 bg-slate-950/75 px-1.5 py-0.5 rounded pointer-events-none">
              <span>
                X: {cameraPos ? Math.round(cameraPos.x) : 0} | Z:{' '}
                {cameraPos ? Math.round(cameraPos.z) : 0}
              </span>
              <span className="text-slate-400">Click to Teleport</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
