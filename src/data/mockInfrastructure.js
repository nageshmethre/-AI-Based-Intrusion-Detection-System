/**
 * Geospatial data representing global cloud infrastructure,
 * CDN edge nodes, and distributed Git contributor origins.
 */

export const CLOUD_REGIONS = [
  {
    id: 'ap-south-1',
    name: 'Mumbai (Asia Pacific)',
    provider: 'AWS / GCP Node',
    role: 'Regional Gateway & Edge Replica',
    coords: [19.076, 72.8777],
    status: 'Operational',
    health: '100%',
    latency: '18ms',
    traffic: '1.4 Gbps',
    activeServices: ['Auth Microservice', 'Edge Cache', 'Static Assets']
  },
  {
    id: 'us-east-1',
    name: 'N. Virginia (US East)',
    provider: 'Primary Cloud Hub',
    role: 'Primary DB & Core Engine',
    coords: [38.0322, -78.4811],
    status: 'Operational',
    health: '99.98%',
    latency: '142ms',
    traffic: '4.8 Gbps',
    activeServices: ['PostgreSQL Master', 'Payment API', 'Kafka Stream']
  },
  {
    id: 'eu-central-1',
    name: 'Frankfurt (Europe Central)',
    provider: 'AWS / Equinix',
    role: 'EU Gateway & Backup DB',
    coords: [50.1109, 8.6821],
    status: 'Operational',
    health: '100%',
    latency: '115ms',
    traffic: '2.9 Gbps',
    activeServices: ['EU Ingestion', 'Redis Cache', 'Analytics Worker']
  },
  {
    id: 'ap-northeast-1',
    name: 'Tokyo (East Asia)',
    provider: 'GCP Edge Point',
    role: 'Edge Cache & WebSocket Cluster',
    coords: [35.6762, 139.6503],
    status: 'Operational',
    health: '100%',
    latency: '85ms',
    traffic: '1.8 Gbps',
    activeServices: ['WebSocket Gateway', 'CDN Edge']
  },
  {
    id: 'sa-east-1',
    name: 'São Paulo (South America)',
    provider: 'Cloudflare PoP',
    role: 'Regional CDN PoP',
    coords: [-23.5505, -46.6333],
    status: 'Operational',
    health: '99.95%',
    latency: '240ms',
    traffic: '850 Mbps',
    activeServices: ['DNS Resolver', 'DDoS Protection']
  },
  {
    id: 'ap-southeast-2',
    name: 'Sydney (Oceania)',
    provider: 'AWS Edge',
    role: 'Oceania Edge Cache',
    coords: [-33.8688, 151.2093],
    status: 'Operational',
    health: '100%',
    latency: '170ms',
    traffic: '620 Mbps',
    activeServices: ['Edge Cache', 'Static Delivery']
  }
];

export const CONTRIBUTORS_GEO = [
  {
    name: 'Nagesh (Lead Architect)',
    location: 'Bengaluru / Hyderabad, India',
    coords: [12.9716, 77.5946],
    commits: 142,
    avatar: '👨‍💻'
  },
  {
    name: 'Core Reviewer',
    location: 'San Francisco, USA',
    coords: [37.7749, -122.4194],
    commits: 78,
    avatar: '👩‍💻'
  },
  {
    name: 'UI / 3D Specialist',
    location: 'Berlin, Germany',
    coords: [52.52, 13.405],
    commits: 54,
    avatar: '👨‍🎨'
  },
  {
    name: 'Backend Dev',
    location: 'Singapore',
    coords: [1.3521, 103.8198],
    commits: 39,
    avatar: '🧑‍💻'
  }
];

export const NETWORK_BACKBONE = [
  { from: 'us-east-1', to: 'eu-central-1', label: 'Transatlantic Fiber (85ms)' },
  { from: 'us-east-1', to: 'ap-south-1', label: 'Pacific Transit (145ms)' },
  { from: 'eu-central-1', to: 'ap-south-1', label: 'Eurasia Cable (115ms)' },
  { from: 'ap-south-1', to: 'ap-northeast-1', label: 'Asia Subsea Link (85ms)' },
  { from: 'ap-northeast-1', to: 'ap-southeast-2', label: 'Southern Cross (92ms)' }
];
