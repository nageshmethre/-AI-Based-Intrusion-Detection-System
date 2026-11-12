import * as THREE from 'three';

// Language Color Palette
export const LANGUAGE_PALETTE = {
  // JavaScript & TypeScript
  js: { name: 'JavaScript', color: '#f7df1e', emissive: '#857500', category: 'script' },
  jsx: { name: 'React JSX', color: '#61dafb', emissive: '#007094', category: 'frontend' },
  ts: { name: 'TypeScript', color: '#3178c6', emissive: '#144175', category: 'script' },
  tsx: { name: 'React TSX', color: '#29b6f6', emissive: '#0277bd', category: 'frontend' },

  // Web Styles & Markup
  html: { name: 'HTML', color: '#e34f26', emissive: '#8f270a', category: 'markup' },
  css: { name: 'CSS', color: '#264de4', emissive: '#0c2285', category: 'style' },
  scss: { name: 'SCSS', color: '#c6538c', emissive: '#6b1945', category: 'style' },
  vue: { name: 'Vue', color: '#42b883', emissive: '#1f6645', category: 'frontend' },
  svelte: { name: 'Svelte', color: '#ff3e00', emissive: '#942200', category: 'frontend' },

  // Backend & Systems
  py: { name: 'Python', color: '#3776ab', emissive: '#144670', category: 'backend' },
  java: { name: 'Java', color: '#b07219', emissive: '#593403', category: 'backend' },
  c: { name: 'C', color: '#555555', emissive: '#262626', category: 'systems' },
  cpp: { name: 'C++', color: '#f34b7d', emissive: '#871a3c', category: 'systems' },
  cs: { name: 'C#', color: '#178600', emissive: '#0b4a00', category: 'backend' },
  go: { name: 'Go', color: '#00add8', emissive: '#005b73', category: 'backend' },
  rs: { name: 'Rust', color: '#dea584', emissive: '#73462c', category: 'systems' },
  php: { name: 'PHP', color: '#4f5d95', emissive: '#21294d', category: 'backend' },
  rb: { name: 'Ruby', color: '#701516', emissive: '#3b0607', category: 'backend' },

  // Data & Config
  json: { name: 'JSON', color: '#a0aec0', emissive: '#4a5568', category: 'config' },
  yaml: { name: 'YAML', color: '#cb171e', emissive: '#6b0509', category: 'config' },
  yml: { name: 'YAML', color: '#cb171e', emissive: '#6b0509', category: 'config' },
  md: { name: 'Markdown', color: '#0891b2', emissive: '#0e4654', category: 'doc' },
  sql: { name: 'SQL', color: '#e38c00', emissive: '#7a4b00', category: 'database' },
  sh: { name: 'Shell', color: '#89e051', emissive: '#3e751b', category: 'script' },
  env: { name: 'Config/ENV', color: '#eab308', emissive: '#856404', category: 'config' },

  // Fallback
  default: { name: 'Other', color: '#64748b', emissive: '#334155', category: 'other' }
};

export function getLanguageInfo(filename) {
  if (!filename) return LANGUAGE_PALETTE.default;
  const ext = filename.split('.').pop().toLowerCase();
  return LANGUAGE_PALETTE[ext] || LANGUAGE_PALETTE.default;
}

// Generate procedural cyber window textures
const textureCache = new Map();

export function getBuildingTexture(colorHex, isMonolith = false) {
  const cacheKey = `${colorHex}-${isMonolith ? 'mono' : 'norm'}`;
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey);
  }

  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // Dark metallic building facade
  ctx.fillStyle = '#0b1120';
  ctx.fillRect(0, 0, 128, 256);

  // Structural vertical beams
  ctx.fillStyle = '#1e293b';
  for (let x = 0; x <= 128; x += 32) {
    ctx.fillRect(x, 0, 3, 256);
  }

  // Draw cyber windows
  const rows = 32;
  const cols = 4;
  const winW = 18;
  const winH = 4;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const isLit = Math.random() > 0.4;
      const x = 5 + c * 31;
      const y = 6 + r * 7.5;

      if (isLit) {
        // Window glow
        ctx.fillStyle = isMonolith ? '#ef4444' : colorHex;
        ctx.shadowColor = isMonolith ? '#ff0000' : colorHex;
        ctx.shadowBlur = 4;
        ctx.fillRect(x, y, winW, winH);
        ctx.shadowBlur = 0;
      } else {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(x, y, winW, winH);
      }
    }
  }

  // Neon accent edge line at top & bottom
  ctx.fillStyle = isMonolith ? '#ef4444' : colorHex;
  ctx.fillRect(0, 0, 128, 3);
  ctx.fillRect(0, 253, 128, 3);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);

  textureCache.set(cacheKey, texture);
  return texture;
}
