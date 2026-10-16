import Link from "next/link";
export default function NotFound() { return <main className="static-page shell"><span className="eyebrow">404</span><h1>這一頁沒有找到</h1><p className="lead">網址可能已變更，或這個牌陣還沒有開放。</p><Link className="button button-primary" href="/">回到塔羅書房</Link></main>; }

