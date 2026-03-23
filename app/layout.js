import "./globals.css";
import Navbar from "../components/Navbar";
import AuthGate from "../components/AuthGate";

export const metadata = {
  title: "美国西海岸之旅 🌲",
  description: "家庭旅行计划 — 2026年4月 · 西海岸国家公园深度游",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>
        <AuthGate>
          <Navbar />
          <main>{children}</main>
          <footer className="footer">
            <p>🌲 美国西海岸之旅 · 2026年4月 · Made with ❤️</p>
          </footer>
        </AuthGate>
      </body>
    </html>
  );
}
