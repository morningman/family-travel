'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

export default function MessagesPage() {
  const [messages, setMessages] = useState([]);
  const [author, setAuthor] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [useCloud, setUseCloud] = useState(false);

  const loadMessages = useCallback(async () => {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .order('timestamp', { ascending: false });

        if (!error && data) {
          setMessages(data);
          setUseCloud(true);
          setLoaded(true);
          return;
        }
      } catch (e) {
        console.warn('Supabase unavailable, falling back to localStorage');
      }
    }

    // Fallback to localStorage
    const saved = localStorage.getItem('travel-messages');
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse messages:', e);
      }
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!author.trim() || !content.trim()) return;

    setIsSubmitting(true);

    const newMessage = {
      id: 'msg_' + Date.now(),
      author: author.trim(),
      content: content.trim(),
      timestamp: new Date().toISOString(),
    };

    if (useCloud && isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from('messages')
          .insert([newMessage]);

        if (!error) {
          // Reload messages from Supabase
          await loadMessages();
          setContent('');
          setIsSubmitting(false);
          return;
        }
      } catch (e) {
        console.warn('Supabase insert failed, saving locally');
      }
    }

    // Fallback to localStorage
    const updated = [newMessage, ...messages];
    localStorage.setItem('travel-messages', JSON.stringify(updated));
    setMessages(updated);
    setContent('');
    setIsSubmitting(false);
  };

  const formatTime = (iso) => {
    const d = new Date(iso);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const hour = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${month}月${day}日 ${hour}:${min}`;
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>💬 留言板</h1>
        <p>分享你的想法、建议和期待，一起规划行程！</p>
        {loaded && (
          <p style={{ fontSize: '0.8rem', color: '#aaa', marginTop: '8px' }}>
            {useCloud ? '☁️ 云端同步已开启' : '💾 本地存储模式'}
          </p>
        )}
      </div>

      <div className="messages-container">
        {/* Message Form */}
        <form className="message-form" onSubmit={handleSubmit}>
          <h2>✍️ 写留言</h2>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="author">你的名字</label>
              <input
                id="author"
                type="text"
                placeholder="例如：爸爸"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                maxLength={20}
              />
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label htmlFor="content">留言内容</label>
            <textarea
              id="content"
              placeholder="写下你的想法或建议..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={500}
              rows={3}
            />
          </div>
          <button
            type="submit"
            className="submit-btn"
            disabled={!author.trim() || !content.trim() || isSubmitting}
          >
            {isSubmitting ? '发送中...' : '📩 发送留言'}
          </button>
        </form>

        {/* Messages List */}
        <div className="messages-list">
          {loaded && messages.length === 0 && (
            <div className="empty-messages">
              <span className="emoji">💭</span>
              <p>还没有留言，来写第一条吧！</p>
            </div>
          )}
          {messages.map((msg) => (
            <div key={msg.id} className="message-item">
              <div className="message-header">
                <span className="author">👤 {msg.author}</span>
                <span className="timestamp">{formatTime(msg.timestamp)}</span>
              </div>
              <p className="content">{msg.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
