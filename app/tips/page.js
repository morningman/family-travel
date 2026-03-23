import tips from '../../data/tips.json';

export default function TipsPage() {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1>📋 实用攻略</h1>
        <p>行前准备、必备物品、安全须知等实用信息</p>
      </div>

      <div className="tips-grid">
        {tips.sections.map((section) => (
          <div key={section.id} className="tip-card">
            <h3>{section.title}</h3>
            <ul>
              {section.items.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
