'use client';

import { useState, useEffect, useRef } from 'react';
import { marked } from 'marked';
import destinations from '../../data/destinations.json';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

marked.setOptions({ breaks: true, gfm: true });

function MarkdownContent({ content }) {
  const cleaned = (content || '').replace(/!\[([^\]]*)\]\([^)]+\)/g, '');
  const html = marked.parse(cleaned);
  return <div className="markdown-body" dangerouslySetInnerHTML={{ __html: html }} />;
}

export default function ItineraryPage() {
  const [departDate, setDepartDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [departFrom, setDepartFrom] = useState('Sunnyvale, CA');
  const [returnTo, setReturnTo] = useState('Sunnyvale, CA');
  const [travelers, setTravelers] = useState('4人（2大2小）');
  const [selectedDests, setSelectedDests] = useState([]);
  const [itinerary, setItinerary] = useState('');
  const [loading, setLoading] = useState(false);
  const [savedPlans, setSavedPlans] = useState([]);
  const [expandedPlanId, setExpandedPlanId] = useState(null);
  const resultRef = useRef(null);

  // Load selected destinations
  useEffect(() => {
    const saved = localStorage.getItem('travel-selected-destinations');
    let ids = [];
    if (saved) {
      try { ids = JSON.parse(saved); } catch {}
    } else {
      ids = destinations.filter(d => d.selected).map(d => d.id);
    }
    setSelectedDests(destinations.filter(d => ids.includes(d.id)));
  }, []);

  // Load saved plans
  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    if (!isSupabaseConfigured()) return;
    try {
      const { data } = await supabase
        .from('itinerary_plans')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) setSavedPlans(data);
    } catch {}
  };

  const generateItinerary = async () => {
    if (!departDate || !returnDate) {
      alert('请填写出发和返回日期');
      return;
    }
    if (selectedDests.length === 0) {
      alert('请先在"景点"页面中选择想去的景点');
      return;
    }

    setLoading(true);
    setItinerary('');

    const destList = selectedDests.map(d =>
      `- ${d.nameCN}（${d.name}）- ${d.address} - 驾车${d.driveTime} - 亮点: ${d.highlights?.join('、')}`
    ).join('\n');

    const prompt = `请根据以下信息，生成一份详细的家庭旅行行程计划。

## 旅行信息
- 出发地点：${departFrom}
- 出发日期：${departDate}
- 返回地点：${returnTo}
- 返回日期：${returnDate}
- 旅行人数：${travelers}

## 想去的景点（共${selectedDests.length}个）
${destList}

## 要求
1. 根据地理位置合理规划路线，避免走回头路
2. 每天的行程不要太紧凑，适合家庭出游节奏
3. 包含每天的：
   - 出发/到达时间
   - 驾车路线和预计时间
   - 景点游玩建议和时长
   - 住宿建议（附近的城市/酒店区域）
   - 餐饮建议
4. 如果景点太多无法在时间内覆盖，请给出取舍建议
5. 如果需要飞机，请建议航班时间
6. 在开头给出行程概览/摘要
7. 使用 Markdown 格式，清晰易读
8. 不要包含图片`;

    try {
      const res = await fetch('https://api.minimax.chat/v1/text/chatcompletion_v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_MINIMAX_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'MiniMax-Text-01',
          messages: [
            { role: 'system', content: '你是一个专业的旅行规划师，擅长为家庭旅行设计合理的行程。请用中文回答，使用 Markdown 格式。' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 4096,
        }),
      });

      const data = await res.json();
      const reply = data?.choices?.[0]?.message?.content
        || data?.reply
        || '抱歉，生成失败，请稍后重试。';

      setItinerary(reply);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch {
      setItinerary('网络错误，请稍后重试。');
    }
    setLoading(false);
  };

  const savePlan = async () => {
    if (!isSupabaseConfigured() || !itinerary) return;
    try {
      const { error } = await supabase
        .from('itinerary_plans')
        .insert([{
          id: 'plan_' + Date.now(),
          depart_date: departDate,
          return_date: returnDate,
          depart_from: departFrom,
          destinations: selectedDests.map(d => d.nameCN).join('、'),
          content: itinerary,
          created_at: new Date().toISOString(),
        }]);
      if (!error) {
        alert('✅ 行程已保存');
        loadPlans();
      }
    } catch {
      alert('保存失败');
    }
  };

  const deletePlan = async (id) => {
    if (!isSupabaseConfigured()) return;
    await supabase.from('itinerary_plans').delete().eq('id', id);
    loadPlans();
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>🗓️ AI 行程规划</h1>
        <p>填写旅行信息，AI 为你生成最佳行程方案</p>
      </div>

      {/* Trip Info Form */}
      <div className="itinerary-form">
        <h2>📋 旅行信息</h2>
        <div className="form-grid">
          <div className="form-field">
            <label>🛫 出发地点</label>
            <input
              type="text"
              value={departFrom}
              onChange={(e) => setDepartFrom(e.target.value)}
              placeholder="例如：Sunnyvale, CA"
            />
          </div>
          <div className="form-field">
            <label>🛬 返程地点</label>
            <input
              type="text"
              value={returnTo}
              onChange={(e) => setReturnTo(e.target.value)}
              placeholder="例如：Sunnyvale, CA"
            />
          </div>
          <div className="form-field">
            <label>👥 旅行人数</label>
            <input
              type="text"
              value={travelers}
              onChange={(e) => setTravelers(e.target.value)}
              placeholder="例如：4人（2大2小）"
            />
          </div>
          <div className="form-field">
            <label>📅 出发日期</label>
            <input
              type="date"
              value={departDate}
              onChange={(e) => setDepartDate(e.target.value)}
            />
          </div>
          <div className="form-field">
            <label>📅 返回日期</label>
            <input
              type="date"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Selected Destinations */}
      <div className="itinerary-selected">
        <h2>⭐ 已选景点（{selectedDests.length}个）</h2>
        {selectedDests.length === 0 ? (
          <p style={{ color: '#888', fontSize: '0.9rem' }}>
            还没有选择景点，请先去「景点」页面选择想去的地方
          </p>
        ) : (
          <div className="selected-chips">
            {selectedDests.map(d => (
              <span key={d.id} className="selected-chip">
                {d.nameCN}
                <span style={{ fontSize: '0.75rem', color: '#888', marginLeft: '4px' }}>
                  🚗{d.driveTime}
                </span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Generate Button */}
      <button
        className="generate-btn"
        onClick={generateItinerary}
        disabled={loading}
      >
        {loading ? '🔄 生成中...' : '🤖 AI 生成行程方案'}
      </button>

      {/* Generated Itinerary */}
      {itinerary && (
        <div className="itinerary-result" ref={resultRef}>
          <div className="result-header">
            <h2>📋 行程方案</h2>
            <button className="save-plan-btn" onClick={savePlan}>💾 保存行程</button>
          </div>
          <div className="result-content">
            <MarkdownContent content={itinerary} />
          </div>
        </div>
      )}

      {/* Saved Plans */}
      {savedPlans.length > 0 && (
        <div className="saved-plans">
          <h2>📂 历史行程</h2>
          {savedPlans.map(plan => {
            const isExpanded = expandedPlanId === plan.id;
            return (
              <div key={plan.id} className="saved-plan-card">
                <div
                  className="plan-header-row"
                  onClick={() => setExpandedPlanId(isExpanded ? null : plan.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <span style={{ color: '#999', fontSize: '0.85rem' }}>{isExpanded ? '▼' : '▶'}</span>
                  <div style={{ flex: 1 }}>
                    <strong>{plan.depart_date} → {plan.return_date}</strong>
                    <span style={{ color: '#888', fontSize: '0.8rem', marginLeft: '8px' }}>
                      {plan.destinations?.slice(0, 40)}{plan.destinations?.length > 40 ? '...' : ''}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#aaa' }}>
                    {new Date(plan.created_at).toLocaleDateString('zh-CN')}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); deletePlan(plan.id); }}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem', padding: '2px 4px', marginLeft: '8px' }}
                  >🗑️</button>
                </div>
                {isExpanded && (
                  <div className="plan-expanded">
                    <MarkdownContent content={plan.content} />
                    <div style={{ textAlign: 'right', marginTop: '12px' }}>
                      <button
                        onClick={() => deletePlan(plan.id)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem' }}
                      >
                        🗑️ 删除此行程
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
