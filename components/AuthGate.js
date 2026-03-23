'use client';

import { useState, useEffect } from 'react';

const PASSWORD = 'family2026';

export default function AuthGate({ children }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('travel-auth');
    if (saved === PASSWORD) {
      setAuthenticated(true);
    }
    setChecking(false);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === PASSWORD) {
      localStorage.setItem('travel-auth', password);
      setAuthenticated(true);
      setError('');
    } else {
      setError('密码不正确，请重试');
    }
  };

  if (checking) return null;

  if (authenticated) {
    return children;
  }

  return (
    <div className="auth-gate">
      <div className="auth-card">
        <span className="auth-emoji">🌲</span>
        <h1>美国西海岸之旅</h1>
        <p>请输入密码访问旅行计划</p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="请输入密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="auth-input"
            autoFocus
          />
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" className="auth-btn">
            🔓 进入
          </button>
        </form>
      </div>
    </div>
  );
}
