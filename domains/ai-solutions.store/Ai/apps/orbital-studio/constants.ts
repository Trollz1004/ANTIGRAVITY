
import { ChannelType, ConnectionStatus, Connector, Product, SeparationLog } from './types';

export const MOCK_CONNECTORS: Connector[] = [
  { id: '1', type: ChannelType.EBAY, status: ConnectionStatus.CONNECTED, lastSync: '10 mins ago', icon: 'shopping-bag' },
  { id: '2', type: ChannelType.SQUARE, status: ConnectionStatus.CONNECTED, lastSync: '1 hour ago', icon: 'credit-card' },
  { id: '3', type: ChannelType.GOOGLE_MERCHANT, status: ConnectionStatus.DISCONNECTED, icon: 'search' },
  { id: '4', type: ChannelType.META, status: ConnectionStatus.PENDING, icon: 'facebook' },
  { id: '5', type: ChannelType.MERCARI_SHOPS, status: ConnectionStatus.DISCONNECTED, icon: 'globe' },
  { id: '6', type: ChannelType.POSHMARK, status: ConnectionStatus.CONNECTED, lastSync: 'Manual Export', icon: 'tag' },
];

export const MOCK_PRODUCTS: Product[] = [
  { 
    id: 'p1', 
    sku: 'SKU-001', 
    name: 'Vintage Leather Jacket', 
    price: 120.00, 
    stock: 5, 
    description: 'A classic vintage leather jacket, distressed perfectly over time to offer a rugged, authentic look. Crafted from heavy-duty genuine leather, this jacket provides unmatched durability and timeless style. Ideal for motorcycle enthusiasts or anyone seeking a classic edge to their wardrobe. SEO keywords: vintage leather jacket, distressed leather, authentic motorcycle jacket, retro menswear.', 
    channels: [ChannelType.EBAY, ChannelType.POSHMARK],
    weight: 2.5,
    dimensions: { l: 14, w: 12, h: 4 }
  },
  { 
    id: 'p2', 
    sku: 'SKU-002', 
    name: 'Ceramic Vase Set', 
    price: 45.50, 
    stock: 12, 
    description: 'Handmade ceramic vases.', 
    channels: [ChannelType.SQUARE],
    weight: 4.0,
    dimensions: { l: 10, w: 10, h: 10 }
  },
  { 
    id: 'p3', 
    sku: 'SKU-003', 
    name: 'Mechanical Keyboard', 
    price: 89.99, 
    stock: 20, 
    description: 'Clicky blue switches.', 
    channels: [ChannelType.EBAY, ChannelType.MERCARI_SHOPS],
    weight: 1.8,
    dimensions: { l: 18, w: 6, h: 2 }
  },
  { 
    id: 'p4', 
    sku: 'SKU-004', 
    name: 'Wool Scarf', 
    price: 25.00, 
    stock: 50, 
    description: 'Warm winter scarf.', 
    channels: [ChannelType.SQUARE, ChannelType.META],
    weight: 0.5,
    dimensions: { l: 10, w: 8, h: 1 }
  },
  { 
    id: 'p5', 
    sku: 'SKU-005', 
    name: 'Wooden Coffee Table', 
    price: 150.00, 
    stock: 2, 
    description: 'Mid-century modern style.', 
    channels: [ChannelType.GOOGLE_MERCHANT],
    weight: 35.0,
    dimensions: { l: 40, w: 20, h: 18 }
  },
];

export const SEPARATION_LOGS: SeparationLog[] = [
  { id: 'log1', timestamp: '2023-10-27 10:00:01', event: 'Preflight Check', status: 'PASS', details: 'Host verified: NEW_HARDWARE (192.168.20.5)' },
  { id: 'log2', timestamp: '2023-10-27 10:00:05', event: 'Network Scan', status: 'PASS', details: 'Subnet 192.168.20.0/24 isolated.' },
  { id: 'log3', timestamp: '2023-10-27 10:05:22', event: 'Connection Attempt', status: 'BLOCK', details: 'Blocked outbound traffic to T5500 (192.168.1.50)' },
  { id: 'log4', timestamp: '2023-10-27 11:30:00', event: 'Asset Resolution', status: 'BLOCK', details: 'Hostname "9020-DELL" resolved to reserved list.' },
  { id: 'log5', timestamp: '2023-10-27 12:00:00', event: 'Environment', status: 'PASS', details: 'No forbidden keys found in ENV.' },
];
