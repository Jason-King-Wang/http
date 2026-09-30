import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = { title: "關於本站", description: "了解塔羅書房的目的、內容範圍與使用原則。", alternates: { canonical: "/about" } };
export default function AboutPage() { return <main className="static-page shell"><span className="eyebrow">About</span><h1>關於塔羅書房</h1><p className="lead">塔羅書房是一個免費、免登入的互動工具站，目的是把抽牌從神秘預言，拉回可理解的問題整理與行動提醒。</p><h2>我們提供什麼</h2><p>本站提供一張到十二張牌的不同牌陣，以及提問、牌陣選擇、正逆位等入門指南。所有問題只在瀏覽器中使用，不需要建立帳號。</p><h2>我們不提供什麼</h2><p>本站不保證未來、不替使用者做重大決策，也不提供醫療、心理、法律、財務或投資建議。牌義由編輯內容與固定規則組成，不是靈媒服務。</p><h2>內容來源與維護</h2><p>本站以通行的大阿爾克那名稱與現代自我反思取向撰寫牌義，並定期檢查誤導風險、隱私與可讀性。更多細節請閱讀 <Link href="/editorial-policy">內容原則</Link>。</p></main>; }

