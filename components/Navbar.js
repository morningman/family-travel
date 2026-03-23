'use client';

import { useState } from 'react';

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <a href="/" className="navbar-logo">
          <span>🌲</span> 西海岸之旅
        </a>
        <ul className={`navbar-links ${open ? 'open' : ''}`} id="nav-links">
          <li><a href="/" onClick={() => setOpen(false)}>首页</a></li>
          <li><a href="/destinations" onClick={() => setOpen(false)}>景点</a></li>
          <li><a href="/itinerary" onClick={() => setOpen(false)}>行程</a></li>
          <li><a href="/messages" onClick={() => setOpen(false)}>留言</a></li>
          <li><a href="/tips" onClick={() => setOpen(false)}>攻略</a></li>
        </ul>
        <button className="menu-toggle" aria-label="菜单"
          onClick={() => setOpen(!open)}>
          {open ? '✕' : '☰'}
        </button>
      </div>
    </nav>
  );
}
