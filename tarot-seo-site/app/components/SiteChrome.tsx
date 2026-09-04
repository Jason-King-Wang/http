import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="shell nav-shell">
        <Link className="brand" href="/" aria-label="塔羅書房首頁">
          <span className="brand-mark" aria-hidden="true">✦</span>
          <span>
            <strong>塔羅書房</strong>
            <small>Tarot Reading Room</small>
          </span>
        </Link>
        <nav className="nav-links" aria-label="主要導覽">
          <Link href="/daily-tarot">每日塔羅</Link>
          <Link href="/love-tarot">感情塔羅</Link>
          <Link href="/career-tarot">工作塔羅</Link>
          <Link href="/guides/tarot-spreads-guide">塔羅指南</Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div>
          <strong>塔羅書房</strong>
          <p>用牌陣整理問題，把答案帶回現實行動。</p>
          <p className="fine-print">所有占卜內容僅供休閒與自我整理，不取代醫療、心理、法律、財務或其他專業意見。</p>
        </div>
        <div className="footer-links">
          <Link href="/about">關於本站</Link>
          <Link href="/editorial-policy">內容原則</Link>
          <Link href="/privacy">隱私權</Link>
          <Link href="/terms">使用條款</Link>
          <Link href="/contact">聯絡方式</Link>
        </div>
      </div>
    </footer>
  );
}

