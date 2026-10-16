import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdSlot } from "../components/AdSlot";
import { TarotReading } from "../components/TarotReading";
import { getSpread, spreads } from "../data/tarot";

export function generateStaticParams() {
  return spreads.map((spread) => ({ slug: spread.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const spread = getSpread(slug);
  if (!spread) return {};
  return {
    title: spread.title,
    description: `${spread.description} 免費使用、免登入，問題不會上傳。`,
    alternates: { canonical: `/${spread.slug}` },
    openGraph: { title: spread.title, description: spread.description, url: `/${spread.slug}`, images: ["/og.png"] },
  };
}

export default async function SpreadPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const spread = getSpread(slug);
  if (!spread) notFound();

  const faqSchema = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: spread.faqs.map((faq) => ({ "@type": "Question", name: faq.question, acceptedAnswer: { "@type": "Answer", text: faq.answer } })) };
  const appSchema = { "@context": "https://schema.org", "@type": "SoftwareApplication", name: spread.title, applicationCategory: "EntertainmentApplication", operatingSystem: "Web", offers: { "@type": "Offer", price: "0", priceCurrency: "TWD" }, description: spread.description };

  return (
    <main className="spread-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }} />
      <section className="spread-hero shell">
        <div>
          <nav className="breadcrumbs" aria-label="麵包屑"><Link href="/">首頁</Link><span>／</span><span>{spread.shortTitle}</span></nav>
          <span className="eyebrow">{spread.eyebrow}・免費免登入</span>
          <h1>{spread.title}</h1>
          <p>{spread.description}</p>
          <div className="spread-facts"><span>{spread.cardCount} 張牌</span><span>問題不上傳</span><span>休閒參考</span></div>
        </div>
      </section>

      <div className="shell"><TarotReading spread={spread} /></div>
      <AdSlot label="抽牌結果後" slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_READING} />

      <section className="content-section shell content-columns">
        <article className="prose-card">
          <span className="section-kicker">使用方式</span>
          <h2>{spread.title}怎麼使用？</h2>
          {spread.intro.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          <ol>{spread.positions.map((position, index) => <li key={position}><strong>第 {index + 1} 張：{position}</strong><span>先閱讀位置，再把牌義連回你的問題與現況。</span></li>)}</ol>
        </article>
        <aside className="side-card">
          <span className="section-kicker">提問提醒</span>
          <h2>讓問題更有用</h2>
          <ul><li>一次只處理一個主題</li><li>設定合理時間範圍</li><li>聚焦自己的可控行動</li><li>避免輸入他人個資</li></ul>
          <Link className="text-link" href="/guides/tarot-question-guide">完整提問指南 →</Link>
        </aside>
      </section>

      <section className="content-section shell faq-section">
        <span className="section-kicker">常見問題</span>
        <h2>關於{spread.shortTitle}</h2>
        {spread.faqs.map((faq) => <details key={faq.question}><summary>{faq.question}</summary><p>{faq.answer}</p></details>)}
      </section>

      <section className="content-section shell related-section">
        <div><span className="section-kicker">繼續探索</span><h2>其他適合的牌陣</h2></div>
        <div className="related-links">{spreads.filter((item) => item.slug !== spread.slug).slice(0, 3).map((item) => <Link href={`/${item.slug}`} key={item.slug}><strong>{item.shortTitle}</strong><span>{item.cardCount} 張牌 →</span></Link>)}</div>
      </section>
    </main>
  );
}

