import type { Metadata } from "next";
export const metadata: Metadata = { title: "隱私權政策", description: "塔羅書房的資料處理、Cookie、分析與廣告說明。", alternates: { canonical: "/privacy" } };
export default function PrivacyPage() { return <main className="static-page shell"><span className="eyebrow">Privacy</span><h1>隱私權政策</h1><p className="lead">最後更新：2026 年 7 月 14 日</p><h2>抽牌問題</h2><p>你輸入的問題只在目前瀏覽器頁面中用來顯示結果，本站不會把問題送到伺服器、建立帳號或保存到資料庫。請仍避免輸入姓名、電話、地址、身分證字號等個人資料。</p><h2>必要的本機資料</h2><p>本站可能使用瀏覽器儲存空間記錄你的 Cookie 選擇。這項資料只存在你的裝置。</p><h2>分析與廣告</h2><p>只有在你同意且本站完成設定後，才會載入分析或 Google AdSense 等第三方廣告服務。第三方可能使用 Cookie、裝置資訊與一般瀏覽資料來衡量成效或提供廣告。你可以拒絕非必要用途，仍能使用抽牌工具。</p><h2>資料分享</h2><p>本站不販售你輸入的塔羅問題，也不會故意將其分享給第三方。託管服務可能處理一般伺服器紀錄，例如請求時間、瀏覽器類型與 IP 位址，以維持安全與穩定。</p><h2>政策變更</h2><p>新增分析、廣告或其他資料處理方式時，我們會更新本頁並標示日期。</p></main>; }

