'use client';

import { useState, useRef, useEffect } from 'react';
import { marked } from 'marked';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Configure marked for safe rendering
marked.setOptions({
  breaks: true,
  gfm: true,
});

function MarkdownContent({ content }) {
  const html = marked.parse(content || '');
  return (
    <div
      className="markdown-body"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export default function ChatModal({ destination, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [savedNotes, setSavedNotes] = useState([]);
  const [showNotes, setShowNotes] = useState(false);
  const [expandedNoteId, setExpandedNoteId] = useState(null);
  const chatEndRef = useRef(null);

  // Load saved notes for this destination
  useEffect(() => {
    loadNotes();
  }, [destination.id]);

  const loadNotes = async () => {
    if (!isSupabaseConfigured()) return;
    try {
      const { data } = await supabase
        .from('destination_notes')
        .select('*')
        .eq('destination_id', destination.id)
        .order('created_at', { ascending: false });
      if (data) setSavedNotes(data);
    } catch {}
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const systemPrompt = `你是一个专业的旅行顾问。用户正在了解以下景点：
名称：${destination.nameCN}（${destination.name}）
地址：${destination.address}
描述：${destination.description}
亮点：${destination.highlights?.join('、')}
驾车时间（从 Sunnyvale, CA 出发）：${destination.driveTime}

请用中文回答用户的问题，提供实用、详细的旅行建议。回答要简洁实用，适合家庭出游参考。使用 Markdown 格式让回答更易读。`;

      const res = await fetch('https://api.minimax.chat/v1/text/chatcompletion_v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_MINIMAX_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'MiniMax-Text-01',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: userMsg },
          ],
          temperature: 0.7,
          max_tokens: 1024,
        }),
      });

      const data = await res.json();
      const reply = data?.choices?.[0]?.message?.content
        || data?.reply
        || '抱歉，暂时无法回答，请稍后再试。';

      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '网络错误，请稍后重试。',
      }]);
    }
    setLoading(false);
  };

  const saveNote = async (content) => {
    if (!isSupabaseConfigured()) {
      alert('Supabase 未配置，无法保存');
      return;
    }
    try {
      const { error } = await supabase
        .from('destination_notes')
        .insert([{
          id: 'note_' + Date.now(),
          destination_id: destination.id,
          content: content,
          created_at: new Date().toISOString(),
        }]);
      if (!error) {
        alert('✅ 已保存');
        loadNotes();
      }
    } catch {
      alert('保存失败');
    }
  };

  const deleteNote = async (noteId) => {
    if (!isSupabaseConfigured()) return;
    const { error } = await supabase
      .from('destination_notes')
      .delete()
      .eq('id', noteId);
    if (!error) loadNotes();
  };

  return (
    <div className="chat-overlay" onClick={onClose}>
      <div className="chat-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="chat-header">
          <div>
            <h3>💬 {destination.nameCN}</h3>
            <p style={{ fontSize: '0.75rem', color: '#aaa', margin: 0 }}>{destination.name}</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              className="chat-notes-toggle"
              onClick={() => setShowNotes(!showNotes)}
            >
              📋 {showNotes ? '对话' : `笔记 (${savedNotes.length})`}
            </button>
            <button className="chat-close" onClick={onClose}>✕</button>
          </div>
        </div>

        {showNotes ? (
          /* Saved Notes View */
          <div className="chat-notes">
            {savedNotes.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#888', padding: '40px' }}>
                <p>📝 还没有保存的笔记</p>
                <p style={{ fontSize: '0.8rem' }}>在对话中点击「💾 保存」按钮保存内容</p>
              </div>
            ) : (
              savedNotes.map((note) => {
                const isExpanded = expandedNoteId === note.id;
                const firstLine = note.content.split('\n').find(l => l.trim()) || note.content.slice(0, 60);
                return (
                  <div key={note.id} className="saved-note">
                    <div
                      className="note-header-row"
                      onClick={() => setExpandedNoteId(isExpanded ? null : note.id)}
                      style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      <span style={{ fontSize: '0.8rem', color: '#999' }}>{isExpanded ? '▼' : '▶'}</span>
                      {!isExpanded && (
                        <span style={{ fontSize: '0.85rem', color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                          {firstLine.replace(/^#+\s*/, '').slice(0, 60)}
                        </span>
                      )}
                    </div>
                    {isExpanded && (
                      <>
                        <div style={{ marginTop: '8px' }}>
                          <MarkdownContent content={note.content} />
                        </div>
                        <div className="note-footer">
                          <span>{new Date(note.created_at).toLocaleString('zh-CN')}</span>
                          <button onClick={() => deleteNote(note.id)}>🗑️ 删除</button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* Chat View */
          <>
            <div className="chat-messages">
              {messages.length === 0 && (
                <div className="chat-welcome">
                  <p>👋 你好！我可以回答关于 <strong>{destination.nameCN}</strong> 的任何问题。</p>
                  <div className="quick-questions">
                    {['最佳游玩时间？', '有什么注意事项？', '推荐游玩路线？', '附近有什么美食？'].map(q => (
                      <button key={q} onClick={() => { setInput(q); }}>{q}</button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`chat-msg ${msg.role}`}>
                  <div className="msg-content">
                    {msg.role === 'assistant' ? (
                      <MarkdownContent content={msg.content} />
                    ) : (
                      msg.content
                    )}
                  </div>
                  {msg.role === 'assistant' && (
                    <button
                      className="save-btn"
                      onClick={() => saveNote(msg.content)}
                    >
                      💾 保存
                    </button>
                  )}
                </div>
              ))}
              {loading && (
                <div className="chat-msg assistant">
                  <div className="msg-content typing">思考中...</div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="chat-input">
              <input
                type="text"
                placeholder="输入问题..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                disabled={loading}
              />
              <button onClick={sendMessage} disabled={loading || !input.trim()}>
                发送
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
