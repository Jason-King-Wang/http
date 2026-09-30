import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AdSlot } from "./components/AdSlot";
import { spreads } from "./data/tarot";

export const metadata: Metadata = {
  title: "免費線上塔羅占卜與牌陣指南",
  description: "免費線上塔羅書房：每日塔羅、感情塔羅、工作塔羅、三張牌、凱爾特十字與年度牌陣，搭配清楚的牌陣教學與使用邊界。",
  alternates: { canonical: "/" },
};

const featured = spreads.slice(0, 5);

export default function Home() {
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "塔羅書房｜免費線上塔羅占卜",
    description: "提供多種免費塔羅牌陣與使用指南。",
    mainEntity: spreads.map((spread) => ({ "@type": "SoftwareApplication", name: spread.title, applicationCategory: "EntertainmentApplication", url: `/${spread.slug}` })),
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }} />
      <section className="hero shell">
        <div className="hero-copy">
          <span className="eyebrow">免費線上塔羅工具</span>
          <h1>把混亂的問題，<br />整理成下一步。</h1>
          <p>從每日一張到凱爾特十字，選一個牌陣，讀懂當下線索，再把答案帶回現實行動。</p>
          <div className="hero-actions">
            <Link className="button button-primary" href="/daily-tarot">抽每日塔羅</Link>
            <Link className="button button-secondary" href="/three-card-tarot">抽三張牌</Link>
          </div>
          <small className="trust-line">免登入・問題不會上傳・僅供休閒與自我整理</small>
        </div>
        <div className="hero-visual">
          <Image src="/images/hero-tarot-reading.webp" alt="桌面上的塔羅牌與閱讀筆記" width={880} height={1040} priority sizes="(max-width: 900px) 92vw, 46vw" />
          <div className="hero-note"><strong>今天先問：</strong><span>我真正能控制的是什麼？</span></div>
        </div>
      </section>

      <AdSlot label="首頁首屏後" slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME} />

      <section className="section shell">
        <div className="section-heading">
          <span className="section-kicker">從這裡開始</span>
          <h2>依問題大小，選擇適合的牌陣</h2>
          <p>問題越單純，用越少張牌；因素越複雜，再使用五張以上的牌陣。</p>
        </div>
        <div className="tool-grid">
          {featured.map((spread, index) => (
            <Link className={`tool-card ${index === 0 ? "tool-card-featured" : ""}`} href={`/${spread.slug}`} key={spread.slug}>
              <span>{spread.eyebrow}</span>
              <h3>{spread.title}</h3>
              <p>{spread.description}</p>
              <small>{spread.cardCount} 張牌・立即使用 →</small>
            </Link>
          ))}
        </div>
        <details className="more-tools">
          <summary>查看全部十種牌陣</summary>
          <div className="tool-list">
            {spreads.slice(5).map((spread) => <Link key={spread.slug} href={`/${spread.slug}`}><strong>{spread.shortTitle}</strong><span>{spread.description}</span></Link>)}
          </div>
        </details>
      </section>

      <section className="section section-tint">
        <div className="shell split-section">
          <div>
            <span className="section-kicker">先學會怎麼問</span>
            <h2>好的問題，比抽到哪張牌更重要。</h2>
            <p>避免問「命運一定會怎樣」，改問「目前有哪些條件」「我能採取什麼行動」。這會讓牌義更容易轉成現實中的觀察與選擇。</p>
            <Link className="text-link" href="/guides/tarot-question-guide">閱讀塔羅問題指南 →</Link>
          </div>
          <div className="principle-list">
            <article><span>01</span><div><strong>問題要具體</strong><p>限定一個主題與合理時間範圍。</p></div></article>
            <article><span>02</span><div><strong>回到可控範圍</strong><p>聚焦自己的選擇，而不是監控別人。</p></div></article>
            <article><span>03</span><div><strong>轉成現實行動</strong><p>每次解讀只留下少數可驗證步驟。</p></div></article>
          </div>
        </div>
      </section>

      <section className="section shell guide-grid">
        <Link href="/guides/tarot-spreads-guide"><span>牌陣入門</span><h3>一張、三張、五張與十張牌，該怎麼選？</h3><p>用問題複雜度和時間範圍選牌陣。</p></Link>
        <Link href="/guides/upright-reversed"><span>牌義基礎</span><h3>正位與逆位，不等於好牌與壞牌</h3><p>理解能量流動、阻力與提醒的差異。</p></Link>
        <Link href="/editorial-policy"><span>內容原則</span><h3>我們如何寫牌義與控制誤導風險</h3><p>公開工具的來源、邊界與修訂原則。</p></Link>
      </section>

      <section className="section shell safety-note">
        <span aria-hidden="true">✦</span>
        <div><strong>塔羅是整理問題的工具，不是專業判斷。</strong><p>涉及健康、安全、暴力、法律、債務或投資時，請優先尋求合格專業人士與可信任的現實資源。</p></div>
      </section>
    </main>
  );
}

