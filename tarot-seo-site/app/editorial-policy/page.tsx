import type { Metadata } from "next";
export const metadata: Metadata = { title: "內容原則與修訂政策", description: "塔羅書房如何撰寫、審查與修訂塔羅牌義和指南。", alternates: { canonical: "/editorial-policy" } };
export default function EditorialPage() { return <main className="static-page shell"><span className="eyebrow">Editorial Policy</span><h1>內容原則與修訂政策</h1><p className="lead">我們希望內容有用、清楚，而且不把不確定的占卜包裝成事實。</p><h2>牌義撰寫</h2><p>牌義採用大阿爾克那的常見象徵，再轉譯成情緒、選擇、風險與行動的語言。正位與逆位不被簡化成好壞二分。</p><h2>風險邊界</h2><p>涉及健康、安全、暴力、法律、債務與投資時，內容會明確引導使用者尋求現實資訊與專業協助。本站不使用保證、恐嚇或製造依賴的文案。</p><h2>原創與更新</h2><p>工具說明與指南由本站重新編寫，不大量複製外部文章。頁面會標示更新日期；發現錯誤、過時資訊或誤導風險時會修訂。</p><h2>廣告與編輯獨立</h2><p>未來若加入廣告，廣告收入不會決定抽牌結果或牌義。廣告會有清楚標示，不偽裝成內容或操作按鈕。</p></main>; }

