import type { Metadata } from "next";
export const metadata: Metadata = { title: "聯絡方式", description: "回報塔羅書房的內容錯誤、網站問題或合作需求。", alternates: { canonical: "/contact" } };
export default function ContactPage() { return <main className="static-page shell"><span className="eyebrow">Contact</span><h1>聯絡我們</h1><p className="lead">你可以回報內容錯誤、無法使用的功能、隱私問題或廣告顯示問題。</p><h2>目前聯絡管道</h2><p>網站仍在建立獨立網域與商務信箱。現階段可透過網站擁有者的公開 GitHub 頁面聯絡：</p><p><a className="button button-secondary" href="https://github.com/Jason-King-Wang" target="_blank" rel="noreferrer">前往 GitHub 個人頁面</a></p><h2>回報時請提供</h2><p>頁面網址、裝置與瀏覽器、問題發生時間，以及不含個資的問題描述。請勿傳送密碼、證件、付款資料或私密占卜內容。</p></main>; }

