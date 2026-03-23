'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const targetDate = new Date('2026-04-01T00:00:00');
    
    const updateCountdown = () => {
      const now = new Date();
      const diff = targetDate - now;
      
      if (diff <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      
      setCountdown({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      {/* Hero */}
      <section className="hero">
        <h1>🇺🇸 美国西海岸之旅</h1>
        <p className="subtitle">2026年4月 · 约20天 · 国家公园 & 自然风光</p>
        <div className="hero-info">
          <div className="hero-info-item">
            <span className="emoji">👨</span>
            <span className="label">旅行者</span>
            <span className="value">父亲</span>
          </div>
          <div className="hero-info-item">
            <span className="emoji">📍</span>
            <span className="label">出发地</span>
            <span className="value">Sunnyvale, CA</span>
          </div>
          <div className="hero-info-item">
            <span className="emoji">🏔️</span>
            <span className="label">主题</span>
            <span className="value">自然风光</span>
          </div>
          <div className="hero-info-item">
            <span className="emoji">📅</span>
            <span className="label">时长</span>
            <span className="value">~20天</span>
          </div>
        </div>
      </section>

      <div className="page-container">
        {/* Countdown */}
        <section className="countdown-section">
          <h2>⏰ 距离出发还有</h2>
          <div className="countdown-grid">
            <div className="countdown-item">
              <span className="number">{countdown.days}</span>
              <span className="unit">天</span>
            </div>
            <div className="countdown-item">
              <span className="number">{countdown.hours}</span>
              <span className="unit">时</span>
            </div>
            <div className="countdown-item">
              <span className="number">{countdown.minutes}</span>
              <span className="unit">分</span>
            </div>
            <div className="countdown-item">
              <span className="number">{countdown.seconds}</span>
              <span className="unit">秒</span>
            </div>
          </div>
        </section>

        {/* Quick Navigation */}
        <section className="quick-nav">
          <a href="/destinations" className="quick-nav-card">
            <span className="card-emoji">📍</span>
            <h3>景点列表</h3>
            <p>浏览所有候选景点，点击查看地图</p>
          </a>
          <a href="/itinerary" className="quick-nav-card">
            <span className="card-emoji">🗓️</span>
            <h3>行程计划</h3>
            <p>查看详细的每日行程安排</p>
          </a>
          <a href="/messages" className="quick-nav-card">
            <span className="card-emoji">💬</span>
            <h3>留言板</h3>
            <p>留下你的想法和建议</p>
          </a>
          <a href="/tips" className="quick-nav-card">
            <span className="card-emoji">📋</span>
            <h3>实用攻略</h3>
            <p>行前准备和注意事项</p>
          </a>
        </section>
      </div>
    </>
  );
}
