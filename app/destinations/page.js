'use client';

import { useState } from 'react';
import destinations from '../../data/destinations.json';

const regionMap = {
  california: { name: '加州（California）', emoji: '☀️' },
  oregon: { name: '俄勒冈（Oregon）', emoji: '🌲' },
  washington: { name: '华盛顿（Washington）', emoji: '🏔️' },
  utah: { name: '犹他（Utah）', emoji: '🏜️' },
  nevada: { name: '内华达（Nevada）', emoji: '🎰' },
};

const categoryFilters = [
  { key: 'all', label: '全部' },
  { key: 'selected', label: '⭐ 已选' },
  { key: 'national-park', label: '🏞️ 国家公园' },
  { key: 'scenic', label: '🌄 自然风光' },
  { key: 'city', label: '🏙️ 城市/小镇' },
  { key: 'lake', label: '💧 湖泊' },
];

export default function DestinationsPage() {
  const [activeFilter, setActiveFilter] = useState('all');

  const filteredDestinations = destinations.filter((d) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'selected') return d.selected;
    return d.category === activeFilter;
  });

  // Group by region
  const grouped = {};
  filteredDestinations.forEach((d) => {
    if (!grouped[d.region]) grouped[d.region] = [];
    grouped[d.region].push(d);
  });

  const regionOrder = ['california', 'oregon', 'washington', 'utah', 'nevada'];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>📍 景点列表</h1>
        <p>浏览所有候选景点，点击地图按钮在 Google Maps 或高德地图中查看位置</p>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        {categoryFilters.map((f) => (
          <button
            key={f.key}
            className={`filter-tab ${activeFilter === f.key ? 'active' : ''}`}
            onClick={() => setActiveFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Destinations by Region */}
      {regionOrder.map((region) => {
        if (!grouped[region] || grouped[region].length === 0) return null;
        const info = regionMap[region] || { name: region, emoji: '📍' };
        return (
          <section key={region} className="region-section">
            <h2>{info.emoji} {info.name}</h2>
            <div className="destinations-grid">
              {grouped[region].map((d) => (
                <div key={d.id} className={`destination-card ${d.selected ? 'selected' : ''}`}>
                  <h3>{d.nameCN}</h3>
                  <div className="name-en">{d.name}</div>
                  <div className="meta">
                    <span>🚗 {d.driveTime}</span>
                    <span>📍 {d.regionCN}</span>
                    <span>🏷️ {d.categoryCN}</span>
                  </div>
                  <p className="description">{d.description}</p>
                  <div className="highlights">
                    {d.highlights.map((h) => (
                      <span key={h} className="highlight-tag">{h}</span>
                    ))}
                  </div>
                  <div className="map-buttons">
                    <a href={d.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="map-btn google">
                      📍 Google Maps
                    </a>
                    <a href={d.amapUrl} target="_blank" rel="noopener noreferrer" className="map-btn amap">
                      📍 高德地图
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}

      {filteredDestinations.length === 0 && (
        <div className="itinerary-empty">
          <span className="emoji">🔍</span>
          <h2>没有找到景点</h2>
          <p>试试切换筛选条件</p>
        </div>
      )}
    </div>
  );
}
