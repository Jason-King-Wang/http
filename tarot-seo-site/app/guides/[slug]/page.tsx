import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdSlot } from "../../components/AdSlot";

const guides = {
  "tarot-question-guide": {
    title: "塔羅問題怎麼問？從模糊預言改成可行動問題",
    description: "學會設定主題、時間範圍與可控行動，讓塔羅解讀更具體，也避免把占卜當成替你決定未來的工具。",
    updated: "2026-07-14",
    sections: [
      { heading: "先決定你真正想整理的是什麼", paragraphs: ["很多人一開始會問「我未來會幸福嗎」「他是不是命中注定」。這類問題範圍太大，也把答案交給不可驗證的命運。比較有用的做法，是先找出你現在卡住的決定、情緒或資訊缺口。", "例如把「他愛不愛我」改成「這段互動目前有哪些可觀察的投入與界線」，或把「我會不會成功」改成「未來三個月，我該先改善哪一項工作條件」。"] },
      { heading: "一次只問一個主題", paragraphs: ["同時把感情、工作、財務與家庭塞進一個牌陣，結果通常只會變得模糊。先選一個最需要處理的主題，再用後續問題補充。", "若一件事包含多個決策，可以先問整體局面，再分別用不同牌陣處理選項，但不要反覆抽到出現想要的答案。"] },
      { heading: "加入合理的時間範圍", paragraphs: ["「未來」沒有清楚邊界。對一般問題，數週到三個月通常比數年更容易連回現實條件。年度牌陣則適合做每月提醒，不適合當成必然事件表。", "時間範圍不是為了讓預測更精準，而是讓你知道什麼時候回來檢查：哪些觀察成立、哪些行動需要調整。"] },
      { heading: "把焦點放回自己的選擇", paragraphs: ["塔羅不應用來監控別人的思想、忠誠或私密行為。更有建設性的問法是：「我需要哪些事實才能判斷」「我能設定什麼界線」「下一步如何溝通」。", "涉及安全、健康、暴力、法律、債務或投資時，請把專業協助放在占卜之前。牌面只能協助整理情緒，不能代替診斷、證據或專業判斷。"] },
    ],
  },
  "upright-reversed": {
    title: "塔羅正位與逆位怎麼看？不是好牌與壞牌的二分法",
    description: "理解塔羅正位、逆位、能量受阻與內在化的常見讀法，避免看見逆位就直接判定負面結果。",
    updated: "2026-07-14",
    sections: [
      { heading: "正位通常代表能量較直接", paragraphs: ["正位可以理解為牌的主題比較容易被看見或運用。例如「力量」正位常指向耐心、自我調節與柔韌；它不保證事情一定順利，而是提醒你有哪些資源可用。", "同一張正位牌在不同位置也會改變重點。放在「阻礙」位置時，優點可能變成過度使用；放在「建議」位置時，才比較像要採取的方向。"] },
      { heading: "逆位可能是受阻、過度或內在化", paragraphs: ["逆位不等於災難。它可能表示牌的能量尚未成熟、被壓抑、使用過度，或主要發生在內在感受而不是外在事件。", "例如「皇帝」逆位可能提醒控制過度，也可能表示缺乏結構；需要結合問題、位置與現實資訊才能判斷。"] },
      { heading: "先看整體，再看單張", paragraphs: ["一個牌陣中正逆位的比例可以用來感受整體流動，但不要只靠數量下結論。更重要的是哪些主題重複、關鍵位置出現什麼牌，以及它們是否與你的現況相符。", "當兩張牌看似矛盾，可以把它們放在不同層次理解：一張描述內在期待，另一張描述外在條件；一張說明資源，另一張提醒成本。"] },
      { heading: "解讀最後一定要回到行動", paragraphs: ["不論正位或逆位，最後都應留下可觀察、可調整的行動。正位可以問「如何善用」，逆位可以問「哪裡需要補足或降低風險」。", "若解讀只增加恐懼，卻沒有任何可驗證的方向，就應先停下來，回到現實資訊與可信任的支持。"] },
    ],
  },
  "tarot-spreads-guide": {
    title: "塔羅牌陣怎麼選？一張、三張、五張與凱爾特十字比較",
    description: "依問題複雜度、時間範圍與需要的細節，選擇一張牌、三張牌、五張牌、七張牌或凱爾特十字。",
    updated: "2026-07-14",
    sections: [
      { heading: "一張牌：快速提醒", paragraphs: ["一張牌適合每日提醒、單一焦點或是非問題。優點是簡潔，不容易過度解讀；限制是無法同時處理多個因素。", "使用時把結果轉成一個問題或一個小行動。例如抽到「節制」，可以檢查今天哪一項安排需要重新平衡。"] },
      { heading: "三張牌：看見基本脈絡", paragraphs: ["三張牌是最實用的入門牌陣。可以使用過去、現在、未來，也可以改成現況、阻力、建議，或我的狀態、關係線索、下一步。", "它提供足夠的比較，又不會因牌太多而失焦，適合大多數日常問題。"] },
      { heading: "五到七張牌：拆解複雜因素", paragraphs: ["當問題已持續一段時間，或涉及內外多個因素，可以用五張或七張牌。先定義每個位置，避免抽完才任意替牌安排意義。", "牌數增加後，解讀要收斂成兩到三個主要主題。不是每張牌都要變成獨立預言。"] },
      { heading: "凱爾特十字與年度牌陣", paragraphs: ["凱爾特十字用十張牌看核心、阻礙、過去、未來、個人立場與環境，適合重要而複雜的議題。年度十二張則適合建立每月提醒與回顧節奏。", "這兩種牌陣資訊量很大，不代表比較準。若你只是需要一個短期行動，三張牌通常更清楚。"] },
    ],
  },
} as const;

export function generateStaticParams() { return Object.keys(guides).map((slug) => ({ slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const guide = guides[slug as keyof typeof guides];
  if (!guide) return {};
  return { title: guide.title, description: guide.description, alternates: { canonical: `/guides/${slug}` }, openGraph: { title: guide.title, description: guide.description, type: "article", images: ["/og.png"] } };
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = guides[slug as keyof typeof guides];
  if (!guide) notFound();
  const schema = { "@context": "https://schema.org", "@type": "Article", headline: guide.title, description: guide.description, datePublished: guide.updated, dateModified: guide.updated, author: { "@type": "Organization", name: "塔羅書房編輯室" } };
  return (
    <main className="article-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <article className="article-shell shell">
        <nav className="breadcrumbs" aria-label="麵包屑"><Link href="/">首頁</Link><span>／</span><span>塔羅指南</span></nav>
        <header><span className="eyebrow">塔羅入門指南</span><h1>{guide.title}</h1><p>{guide.description}</p><small>最後更新：2026 年 7 月 14 日・塔羅書房編輯室</small></header>
        <div className="article-layout">
          <div className="article-body">
            {guide.sections.map((section, index) => <section key={section.heading}><span>0{index + 1}</span><h2>{section.heading}</h2>{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</section>)}
            <div className="article-disclaimer"><strong>重要提醒</strong><p>本站內容只供休閒與自我整理，不提供醫療、心理、法律或財務建議。</p></div>
          </div>
          <aside className="article-side"><strong>開始使用</strong><Link href="/daily-tarot">每日一張塔羅</Link><Link href="/three-card-tarot">過去現在未來</Link><Link href="/celtic-cross-tarot">凱爾特十字</Link></aside>
        </div>
      </article>
      <AdSlot label="指南文章結尾" slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE} />
    </main>
  );
}

