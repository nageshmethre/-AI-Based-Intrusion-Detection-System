/**
 * Preloaded demo codebases for immediate 1-click visualization and testing.
 */

export const DEMO_REPOSITORIES = {
  codecity: {
    name: 'CodeCity Architecture (Meta Mode)',
    description: "CodeCity visualizing its own internal codebase in real-time.",
    files: [
      {
        path: 'src/main.jsx',
        content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`
      },
      {
        path: 'src/App.jsx',
        content: `import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar.jsx';
import CityCanvas from './components/CityCanvas.jsx';
import BuildingDetails from './components/BuildingDetails.jsx';
import CityMetricsHUD from './components/CityMetricsHUD.jsx';
import ControlsLegend from './components/ControlsLegend.jsx';
import FilterPanel from './components/FilterPanel.jsx';
import { analyzeCodebase } from './engine/codeParser.js';
import { computeCityLayout } from './engine/cityLayout.js';
import { DEMO_REPOSITORIES } from './samples/demoRepo.js';

export default function App() {
  const [analysis, setAnalysis] = useState(null);
  const [layout, setLayout] = useState(null);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [activeFilters, setActiveFilters] = useState({ language: 'all', showMonolithsOnly: false });

  useEffect(() => {
    loadRepo(DEMO_REPOSITORIES.codecity.files);
  }, []);

  function loadRepo(files) {
    const analyzed = analyzeCodebase(files);
    const computed = computeCityLayout(analyzed);
    setAnalysis(analyzed);
    setLayout(computed);
    setSelectedBuilding(null);
  }

  return (
    <div className="relative w-screen h-screen bg-slate-950 overflow-hidden select-none">
      <Navbar onLoadRepo={loadRepo} />
      <CityCanvas layout={layout} onSelectBuilding={setSelectedBuilding} selectedBuilding={selectedBuilding} />
      <CityMetricsHUD stats={analysis?.stats} />
      <BuildingDetails building={selectedBuilding} onClose={() => setSelectedBuilding(null)} />
      <ControlsLegend />
      <FilterPanel filters={activeFilters} onFilterChange={setActiveFilters} />
    </div>
  );
}`
      },
      {
        path: 'src/components/CityCanvas.jsx',
        content: `import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { getBuildingTexture } from '../engine/themeColors.js';

export default function CityCanvas({ layout, onSelectBuilding, selectedBuilding }) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);

  useEffect(() => {
    if (!layout || !mountRef.current) return;
    // Setup 3D scene, cameras, fog, lighting, and raycasters
  }, [layout]);

  return <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />;
}`
      },
      {
        path: 'src/components/Navbar.jsx',
        content: `import React, { useState } from 'react';
import { Building2, FolderOpen, Github, Sparkles, Search } from 'lucide-react';
import { DEMO_REPOSITORIES } from '../samples/demoRepo.js';

export default function Navbar({ onLoadRepo }) {
  const [githubUrl, setGithubUrl] = useState('');

  const handleFolderUpload = (e) => {
    const files = Array.from(e.target.files);
    // Parse uploaded directory
  };

  return (
    <header className="absolute top-4 left-4 right-4 z-40 flex items-center justify-between px-6 py-3 bg-slate-900/80 backdrop-blur-md border border-cyan-500/30 rounded-2xl shadow-2xl">
      <div className="flex items-center gap-3">
        <Building2 className="w-7 h-7 text-cyan-400 animate-pulse" />
        <span className="font-bold text-xl tracking-wider text-white">CODE<span className="text-cyan-400">CITY</span> 3D</span>
      </div>
    </header>
  );
}`
      },
      {
        path: 'src/components/BuildingDetails.jsx',
        content: `import React from 'react';
import { X, Code2, Layers, AlertTriangle, GitFork } from 'lucide-react';

export default function BuildingDetails({ building, onClose }) {
  if (!building) return null;

  return (
    <aside className="absolute top-20 right-4 bottom-6 w-96 z-40 bg-slate-950/90 backdrop-blur-xl border border-cyan-500/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <h3 className="font-semibold text-cyan-300">{building.file.name}</h3>
        <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
      </div>
      <div className="flex-1 p-4 overflow-y-auto font-mono text-xs">
        <pre className="text-slate-300">{building.file.content}</pre>
      </div>
    </aside>
  );
}`
      },
      {
        path: 'src/components/CityMetricsHUD.jsx',
        content: `import React from 'react';
import { Activity, FileCode2, Boxes, Flame, ShieldCheck } from 'lucide-react';

export default function CityMetricsHUD({ stats }) {
  if (!stats) return null;

  return (
    <div className="absolute top-20 left-4 z-30 flex flex-col gap-2 p-4 bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-2xl text-slate-200">
      <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
        <Activity className="w-4 h-4" /> METROPOLIS TELEMETRY
      </div>
      <div className="grid grid-cols-2 gap-3 text-xs mt-1">
        <div>Total LOC: <span className="font-bold text-white">{stats.totalLOC}</span></div>
        <div>Files: <span className="font-bold text-white">{stats.totalFiles}</span></div>
        <div>Districts: <span className="font-bold text-white">{stats.totalDistricts}</span></div>
        <div>Health: <span className="font-bold text-emerald-400">{stats.healthScore}%</span></div>
      </div>
    </div>
  );
}`
      },
      {
        path: 'src/components/ControlsLegend.jsx',
        content: `import React from 'react';
import { Compass, Eye, Move3d } from 'lucide-react';

export default function ControlsLegend({ onResetCamera, onTopView, onStreetView }) {
  return (
    <div className="absolute bottom-6 left-4 z-30 flex items-center gap-2 p-2 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-xl text-xs text-slate-400">
      <button onClick={onResetCamera} className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-cyan-900/50 text-slate-200 transition">Isometric</button>
      <button onClick={onTopView} className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-cyan-900/50 text-slate-200 transition">2D Blueprint</button>
      <button onClick={onStreetView} className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-cyan-900/50 text-slate-200 transition">Street View</button>
    </div>
  );
}`
      },
      {
        path: 'src/engine/codeParser.js',
        content: `import { getLanguageInfo } from './themeColors.js';

export function analyzeCodebase(rawFiles) {
  // Parses LOC, Cyclomatic Complexity, and Dependencies
  return { files: [], districts: [], links: [], stats: {} };
}`
      },
      {
        path: 'src/engine/cityLayout.js',
        content: `import * as THREE from 'three';

export function computeCityLayout(analysisData) {
  // Computes 3D coordinates and arches for skyscrapers and roads
  return { districts: [], buildings: [], highways: [] };
}`
      },
      {
        path: 'src/engine/themeColors.js',
        content: `import * as THREE from 'three';

export const LANGUAGE_PALETTE = {
  js: { name: 'JavaScript', color: '#f7df1e' },
  py: { name: 'Python', color: '#3776ab' }
};`
      }
    ]
  },
  ecommerce: {
    name: 'CloudCommerce E-Commerce Engine',
    description: 'Microservices architecture with payment gateways, auth tokens, product catalog, and database schemas.',
    files: [
      {
        path: 'services/auth/authController.js',
        content: `import { generateToken, verifyPassword } from './tokenService.js';
import { findUserByEmail, createSession } from '../database/userModel.js';

export async function login(req, res) {
  const { email, password } = req.body;
  const user = await findUserByEmail(email);
  if (!user) return res.status(401).json({ error: 'Invalid user' });

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: 'Wrong credentials' });

  const token = generateToken(user.id);
  await createSession(user.id, token);
  return res.json({ token, role: user.role });
}`
      },
      {
        path: 'services/auth/tokenService.js',
        content: `import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../../config/constants.js';

export function generateToken(userId) {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}`
      },
      {
        path: 'services/cart/cartService.js',
        content: `import { getProductPrice, checkStock } from '../products/catalogService.js';
import { calculateDiscount } from '../discounts/couponEngine.js';

export class ShoppingCart {
  constructor(userId) {
    this.userId = userId;
    this.items = [];
  }

  async addItem(productId, quantity) {
    const available = await checkStock(productId, quantity);
    if (!available) throw new Error('Out of stock');
    const price = await getProductPrice(productId);
    this.items.push({ productId, quantity, price });
  }

  computeSubtotal() {
    return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }
}`
      },
      {
        path: 'services/products/catalogService.js',
        content: `import { queryDatabase } from '../database/connectionPool.js';

export async function getProductPrice(productId) {
  const row = await queryDatabase('SELECT price FROM products WHERE id = ?', [productId]);
  return row ? row.price : 0;
}

export async function checkStock(productId, qty) {
  const row = await queryDatabase('SELECT stock FROM inventory WHERE product_id = ?', [productId]);
  return row && row.stock >= qty;
}`
      },
      {
        path: 'services/payments/stripeGateway.js',
        content: `import { STRIPE_KEY } from '../../config/constants.js';
import { logPaymentAudit } from '../database/auditLogs.js';

export async function processCharge(amount, currency, customerToken) {
  // Simulating payment charge API
  const chargeId = 'ch_' + Math.random().toString(36).substring(2);
  await logPaymentAudit(customerToken, amount, chargeId);
  return { status: 'success', chargeId, timestamp: Date.now() };
}`
      },
      {
        path: 'services/database/connectionPool.js',
        content: `import { DB_HOST, DB_USER, DB_PASS } from '../../config/constants.js';

export async function queryDatabase(sql, params = []) {
  console.log('Query executed on pool:', sql, params);
  return { id: 1, price: 99.99, stock: 45 };
}`
      },
      {
        path: 'services/database/userModel.js',
        content: `import { queryDatabase } from './connectionPool.js';

export async function findUserByEmail(email) {
  return queryDatabase('SELECT * FROM users WHERE email = ?', [email]);
}

export async function createSession(userId, token) {
  return queryDatabase('INSERT INTO sessions (user_id, token) VALUES (?, ?)', [userId, token]);
}`
      },
      {
        path: 'services/database/auditLogs.js',
        content: `import { queryDatabase } from './connectionPool.js';

export async function logPaymentAudit(userToken, amount, chargeId) {
  return queryDatabase('INSERT INTO audit_logs (token, amount, charge_id) VALUES (?, ?, ?)', [userToken, amount, chargeId]);
}`
      },
      {
        path: 'services/discounts/couponEngine.js',
        content: `export function calculateDiscount(couponCode, total) {
  if (couponCode === 'SAVE20') return total * 0.20;
  if (couponCode === 'FLASH50') return total * 0.50;
  return 0;
}`
      },
      {
        path: 'config/constants.js',
        content: `export const JWT_SECRET = 'cyber-city-super-secret-key-3rd-sem';
export const DB_HOST = '127.0.0.1';
export const DB_USER = 'root';
export const DB_PASS = 'admin123';
export const STRIPE_KEY = 'sk_test_51MockStripeKey';`
      }
    ]
  },
  dsa: {
    name: 'Algorithms & Data Structures Suite',
    description: 'Graph algorithms, balanced trees, and pathfinding implementations.',
    files: [
      {
        path: 'graphs/dijkstra.py',
        content: `import heapq
from graphs.graph_utils import build_adjacency_list

def dijkstra(graph, start_vertex):
    distances = {vertex: float('infinity') for vertex in graph}
    distances[start_vertex] = 0
    priority_queue = [(0, start_vertex)]

    while priority_queue:
        current_distance, current_vertex = heapq.heappop(priority_queue)

        if current_distance > distances[current_vertex]:
            continue

        for neighbor, weight in graph[current_vertex].items():
            distance = current_distance + weight
            if distance < distances[neighbor]:
                distances[neighbor] = distance
                heapq.heappush(priority_queue, (distance, neighbor))

    return distances`
      },
      {
        path: 'graphs/graph_utils.py',
        content: `def build_adjacency_list(edges):
    graph = {}
    for u, v, weight in edges:
        if u not in graph: graph[u] = {}
        if v not in graph: graph[v] = {}
        graph[u][v] = weight
        graph[v][u] = weight
    return graph`
      },
      {
        path: 'trees/red_black_tree.py',
        content: `RED = True
BLACK = False

class Node:
    def __init__(self, key, color=RED):
        self.key = key
        self.color = color
        self.left = None
        self.right = None
        self.parent = None

class RedBlackTree:
    def __init__(self):
        self.NIL = Node(None, color=BLACK)
        self.root = self.NIL

    def left_rotate(self, x):
        y = x.right
        x.right = y.left
        if y.left != self.NIL:
            y.left.parent = x
        y.parent = x.parent
        if x.parent is None:
            self.root = y
        elif x == x.parent.left:
            x.parent.left = y
        else:
            x.parent.right = y
        y.left = x
        x.parent = y`
      },
      {
        path: 'sorting/quick_sort.py',
        content: `def quick_sort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quick_sort(left) + middle + quick_sort(right)`
      },
      {
        path: 'sorting/merge_sort.py',
        content: `def merge_sort(arr):
    if len(arr) <= 1:
        return arr
    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    return merge(left, right)

def merge(left, right):
    result = []
    i = j = 0
    while i < len(left) and j < len(right):
        if left[i] < right[j]:
            result.append(left[i])
            i += 1
        else:
            result.append(right[j])
            j += 1
    result.extend(left[i:])
    result.extend(right[j:])
    return result`
      }
    ]
  }
};
