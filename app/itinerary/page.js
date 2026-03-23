export default function ItineraryPage() {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1>🗓️ 行程计划</h1>
        <p>详细的每日行程安排</p>
      </div>

      <div className="itinerary-empty">
        <span className="emoji">🗺️</span>
        <h2>行程规划中</h2>
        <p>
          我们正在根据候选景点规划最佳路线，行程确定后会在这里更新。
          欢迎去「留言板」分享你想去的景点和想法！
        </p>
      </div>
    </div>
  );
}
