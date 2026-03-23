'use client';

import { useState, useEffect, useRef } from 'react';
import destinations from '../../data/destinations.json';
import ChatModal from '../../components/ChatModal';

const coordsMap = {
  'yosemite':        [37.7459, -119.5332],
  'sequoia':         [36.5649, -118.7726],
  'death-valley':    [36.4624, -116.8668],
  'redwood':         [41.3829, -124.0046],
  'pinnacles':       [36.4906, -121.1825],
  'joshua-tree':     [33.8734, -115.9010],
  'channel-islands': [34.2512, -119.2637],
  'lassen':          [40.4977, -121.4607],
  'big-sur':         [36.3714, -121.9026],
  'point-reyes':     [38.0057, -122.9988],
  'mono-lake':       [37.9987, -119.1195],
  'bodie':           [38.2138, -119.0128],
  'burney-falls':    [41.0121, -121.6514],
  'glass-beach':     [39.4521, -123.8137],
  'pfeiffer-beach':  [36.2380, -121.8158],
  'alabama-hills':   [36.6039, -118.1109],
  'morro-bay':       [35.3711, -120.8685],
  'mendocino':       [39.3051, -123.7994],
  'lake-tahoe':      [38.9534, -120.0968],
  'san-francisco':   [37.8199, -122.4783],
  'monterey':        [36.6183, -121.9018],
  'santa-cruz':      [36.9641, -122.0217],
  'solvang':         [34.5959, -120.1376],
  'hearst-castle':   [35.6852, -121.1685],
  'crater-lake':     [42.9446, -122.1090],
  'cannon-beach':    [45.8918, -123.9615],
  'thors-well':      [44.2830, -124.1114],
  'painted-hills':   [44.6619, -120.2497],
  'samuel-boardman': [42.1582, -124.3537],
  'multnomah-falls': [45.5762, -122.1158],
  'smith-rock':      [44.3622, -121.1421],
  'mount-rainier':   [46.7853, -121.7353],
  'olympic':         [47.8600, -123.9381],
  'north-cascades':  [48.7718, -121.0749],
  'san-juan-islands':[48.5326, -123.0286],
  'zion':            [37.2982, -113.0263],
  'bryce-canyon':     [37.5930, -112.1871],
  'capitol-reef':    [38.2854, -111.2615],
  'goblin-valley':   [38.5672, -110.7068],
  'great-basin':     [38.9833, -114.2628],
  'fly-geyser':      [40.8593, -119.3313],
};

const categoryColors = {
  'national-park': '#2d6a4f',
  'scenic':        '#e76f51',
  'city':          '#457b9d',
  'lake':          '#0077b6',
  'selected':      '#f4a261',
};

const filters = [
  { key: 'all',           label: '全部' },
  { key: 'selected',      label: '⭐ 已选' },
  { key: 'national-park', label: '🏞️ 国家公园' },
  { key: 'scenic',        label: '🌄 风光/秘境' },
  { key: 'city',          label: '🏙️ 城市/小镇' },
  { key: 'lake',          label: '💧 湖泊' },
];

const categoryLabels = {
  'national-park': '国家公园',
  'scenic':        '风光/秘境',
  'city':          '城市/小镇',
  'lake':          '湖泊',
};

export default function MapPage() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const leafletRef = useRef(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [mapReady, setMapReady] = useState(false);
  const [chatDest, setChatDest] = useState(null);

  // Load selected destinations
  useEffect(() => {
    const saved = localStorage.getItem('travel-selected-destinations');
    if (saved) {
      try { setSelectedIds(new Set(JSON.parse(saved))); } catch {}
    } else {
      const defaults = destinations.filter(d => d.selected).map(d => d.id);
      setSelectedIds(new Set(defaults));
    }
  }, []);

  // Listen for "ask" button clicks from Leaflet popups
  useEffect(() => {
    const handler = (e) => {
      const btn = e.target.closest('[data-ask-dest]');
      if (btn) {
        const destId = btn.getAttribute('data-ask-dest');
        const dest = destinations.find(d => d.id === destId);
        if (dest) setChatDest(dest);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  // Initialize map once
  useEffect(() => {
    if (mapInstanceRef.current) return;

    import('leaflet').then((leaflet) => {
      const L = leaflet.default;
      leafletRef.current = L;

      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      const map = L.map(mapRef.current, {
        center: [38.5, -120.5],
        zoom: 6,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 18,
      }).addTo(map);

      // Static "My Place" star marker
      const homeIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="font-size:24px;line-height:1;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.5))">⭐</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
      L.marker([37.3882, -122.0310], { icon: homeIcon, zIndexOffset: 1000 })
        .addTo(map)
        .bindPopup(`
          <div style="font-family:system-ui;min-width:160px">
            <h3 style="margin:0 0 4px;font-size:14px">🏠 My Place</h3>
            <div style="color:#666;font-size:12px">450 N Mathilda Ave, Sunnyvale, CA 94085</div>
          </div>
        `);

      mapInstanceRef.current = map;
      setMapReady(true);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers when filter or selectedIds change
  useEffect(() => {
    if (!mapReady || !leafletRef.current || !mapInstanceRef.current) return;
    const L = leafletRef.current;
    const map = mapInstanceRef.current;

    // Clear existing markers
    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];

    // Filter destinations
    const filtered = destinations.filter(d => {
      if (activeFilter === 'all') return true;
      if (activeFilter === 'selected') return selectedIds.has(d.id);
      return d.category === activeFilter;
    });

    // Add markers
    filtered.forEach((d) => {
      const coords = coordsMap[d.id];
      if (!coords) return;

      const isSelected = selectedIds.has(d.id);
      const color = categoryColors[d.category] || '#666';
      const size = isSelected ? 16 : 12;
      const border = isSelected ? '3px solid #f4a261' : '2px solid white';

      const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="
          background: ${color};
          width: ${size}px; height: ${size}px;
          border-radius: 50%;
          border: ${border};
          box-shadow: 0 1px 4px rgba(0,0,0,0.4);
        "></div>`,
        iconSize: [size + 6, size + 6],
        iconAnchor: [(size + 6) / 2, (size + 6) / 2],
      });

      const marker = L.marker(coords, { icon }).addTo(map);

      marker.bindPopup(`
        <div style="min-width:220px;font-family:system-ui">
          <h3 style="margin:0 0 4px;font-size:14px">${isSelected ? '⭐ ' : ''}${d.nameCN}</h3>
          <div style="color:#666;font-size:12px;margin-bottom:6px">${d.name}</div>
          <div style="font-size:12px;margin-bottom:4px">${d.description}</div>
          <div style="font-size:11px;color:#888;margin-bottom:4px">📮 ${d.address}</div>
          <div style="font-size:11px;color:#888;margin-bottom:8px">🚗 ${d.driveTime} · ${categoryLabels[d.category] || d.categoryCN}</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <a href="${d.googleMapsUrl}" target="_blank" rel="noopener" style="font-size:11px;color:#4285f4;text-decoration:none;padding:3px 8px;border:1px solid #4285f4;border-radius:4px;white-space:nowrap">📍 Google Maps</a>
            <a href="${d.amapUrl}" target="_blank" rel="noopener" style="font-size:11px;color:#28a745;text-decoration:none;padding:3px 8px;border:1px solid #28a745;border-radius:4px;white-space:nowrap">📍 高德地图</a>
            <button data-ask-dest="${d.id}" style="font-size:11px;color:white;background:#7c3aed;border:none;padding:3px 10px;border-radius:4px;cursor:pointer;white-space:nowrap">🤖 问问</button>
          </div>
        </div>
      `);

      markersRef.current.push(marker);
    });

    // Auto-fit bounds if filtering
    if (activeFilter !== 'all' && filtered.length > 0) {
      const bounds = filtered
        .map(d => coordsMap[d.id])
        .filter(Boolean);
      if (bounds.length > 1) {
        map.fitBounds(bounds, { padding: [40, 40] });
      } else if (bounds.length === 1) {
        map.setView(bounds[0], 10);
      }
    }
  }, [activeFilter, selectedIds, mapReady]);

  return (
    <div className="page-container" style={{ maxWidth: '100%', padding: 0 }}>
      <div style={{ padding: '24px 20px 12px' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>🗺️ 景点地图</h1>
        <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '12px' }}>
          在地图上浏览景点位置，点击标记查看详情
        </p>

        <div className="filter-tabs" style={{ marginBottom: '12px' }}>
          {filters.map((f) => (
            <button
              key={f.key}
              className={`filter-tab ${activeFilter === f.key ? 'active' : ''}`}
              onClick={() => setActiveFilter(f.key)}
            >
              {f.label}
              {f.key === 'selected' ? ` (${selectedIds.size})` : ''}
            </button>
          ))}
        </div>

        <div className="map-legend">
          {Object.entries(categoryColors).filter(([k]) => k !== 'selected').map(([key, color]) => (
            <span key={key} className="legend-item">
              <span className="legend-dot" style={{ background: color }} />
              {categoryLabels[key]}
            </span>
          ))}
          <span className="legend-item">
            <span className="legend-dot" style={{ background: '#f4a261', border: '2px solid #f4a261' }} />
            已选标记
          </span>
        </div>
      </div>

      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"
      />

      <div
        ref={mapRef}
        style={{
          width: '100%',
          height: 'calc(100vh - 240px)',
          minHeight: '450px',
          background: '#e8e8e8',
        }}
      />

      {chatDest && (
        <ChatModal destination={chatDest} onClose={() => setChatDest(null)} />
      )}
    </div>
  );
}
