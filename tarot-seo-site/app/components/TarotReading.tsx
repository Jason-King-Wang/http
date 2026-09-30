"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { Spread, TarotCard } from "../data/tarot";
import { tarotCards } from "../data/tarot";

type DrawnCard = TarotCard & { orientation: "正位" | "逆位" };

function drawCards(count: number): DrawnCard[] {
  const pool = [...tarotCards];
  const result: DrawnCard[] = [];
  while (result.length < count && pool.length) {
    const index = Math.floor(Math.random() * pool.length);
    const [card] = pool.splice(index, 1);
    result.push({ ...card, orientation: Math.random() > 0.38 ? "正位" : "逆位" });
  }
  return result;
}

function domainMeaning(card: DrawnCard, spread: Spread) {
  if (spread.key === "love" || spread.key === "loveFive") return card.love;
  if (spread.key === "career") return card.career;
  return card.orientation === "正位" ? card.upright : card.reversed;
}

function summary(cards: DrawnCard[], spread: Spread) {
  const score = cards.reduce((total, card) => total + card.score * (card.orientation === "正位" ? 1 : -0.55), 0);
  const upright = cards.filter((card) => card.orientation === "正位").length;
  const lead = [...cards].sort((a, b) => Math.abs(b.score) - Math.abs(a.score))[0];
  if (spread.key === "yesno") {
    if (score > 0.55) return { tone: "偏向可以", text: "目前條件較支持前進，但仍要確認現實風險與時間點。" };
    if (score < -0.25) return { tone: "建議先暫停", text: "阻力或資訊缺口較多，先處理條件，再決定是否行動。" };
    return { tone: "條件未明", text: "答案不是單純的肯定或否定，先補充資訊並設定停損點。" };
  }
  const tone = score > 1.2 ? "整體偏向推進" : score < -0.8 ? "整體需要調整" : "整體仍在形成";
  return { tone, text: `${upright} 張正位、${cards.length - upright} 張逆位。主題牌是「${lead.name}${lead.orientation}」，先從它指出的行動開始。` };
}

export function TarotReading({ spread }: { spread: Spread }) {
  const [question, setQuestion] = useState(spread.prompt);
  const [cards, setCards] = useState<DrawnCard[]>([]);
  const readingSummary = useMemo(() => cards.length ? summary(cards, spread) : null, [cards, spread]);

  const draw = () => {
    setCards(drawCards(spread.cardCount));
    window.dispatchEvent(new CustomEvent("tarot-draw", { detail: { spread: spread.key, cardCount: spread.cardCount } }));
  };

  return (
    <section className="reading-tool" aria-labelledby="reading-tool-title">
      <div className="reading-form">
        <div>
          <span className="section-kicker">免費互動工具</span>
          <h2 id="reading-tool-title">先寫下問題，再抽牌</h2>
          <p>問題只留在你的瀏覽器，不會傳送或儲存在本站。</p>
        </div>
        <label>
          <span>這次想整理的問題</span>
          <input value={question} onChange={(event) => setQuestion(event.target.value)} maxLength={120} />
        </label>
        <button className="button button-primary" type="button" onClick={draw}>{cards.length ? "重新抽牌" : spread.button}</button>
      </div>

      {!cards.length ? (
        <div className="reading-empty">
          <span aria-hidden="true">✦</span>
          <p>準備好後按下抽牌。先把它當成整理思路的提示，而不是替你決定未來。</p>
        </div>
      ) : (
        <div className="reading-results" aria-live="polite">
          <section className="reading-summary">
            <span>{spread.eyebrow}</span>
            <h2>{readingSummary?.tone}</h2>
            <p>{readingSummary?.text}</p>
            {question && <small>你的問題：{question}</small>}
          </section>
          <div className={`card-grid card-grid-${Math.min(cards.length, 5)}`}>
            {cards.map((card, index) => (
              <article className="reading-card" key={`${card.name}-${index}`}>
                <div className={`card-image-wrap ${card.orientation === "逆位" ? "is-reversed" : ""}`}>
                  <Image src={`/images/tarot-cards/${card.image}`} alt={`${card.name}塔羅牌`} width={320} height={560} sizes="(max-width: 700px) 78vw, 260px" priority={index < 3} />
                </div>
                <div className="reading-card-copy">
                  <span>{spread.positions[index] ?? `第 ${index + 1} 張`}</span>
                  <h3>{card.roman}・{card.name}<small>{card.orientation}</small></h3>
                  <p>{domainMeaning(card, spread)}</p>
                  <strong>可以怎麼做</strong>
                  <p>{card.orientation === "正位" ? "選一個今天能完成的小行動，觀察它帶來的實際變化。" : "先減少風險、補足資訊，再決定是否繼續投入。"}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

