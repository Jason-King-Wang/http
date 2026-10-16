import type { Metadata } from "next";
import { Noto_Sans_TC, Noto_Serif_TC } from "next/font/google";
import { AdSenseLoader } from "./components/AdSenseLoader";
import { ConsentBanner } from "./components/ConsentBanner";
import { SiteFooter, SiteHeader } from "./components/SiteChrome";
import "./globals.css";

const sans = Noto_Sans_TC({ variable: "--font-sans", subsets: ["latin"], display: "swap" });
const serif = Noto_Serif_TC({ variable: "--font-serif", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || "http://localhost:3000"),
  title: { default: "塔羅書房｜免費線上塔羅占卜", template: "%s｜塔羅書房" },
  description: "免費塔羅工具與牌陣指南，把抽牌結果整理成可理解、可行動的提醒。",
  applicationName: "塔羅書房",
  authors: [{ name: "塔羅書房編輯室" }],
  creator: "塔羅書房編輯室",
  category: "entertainment",
  openGraph: {
    type: "website",
    locale: "zh_TW",
    siteName: "塔羅書房",
    title: "塔羅書房｜免費線上塔羅占卜",
    description: "從每日一張到凱爾特十字，把問題整理成下一步。",
    images: [{ url: "/og.png", width: 1731, height: 909, alt: "塔羅書房" }],
  },
  twitter: { card: "summary_large_image", title: "塔羅書房", description: "免費線上塔羅工具與牌陣指南", images: ["/og.png"] },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant-TW">
      <body className={`${sans.variable} ${serif.variable}`}>
        <a className="skip-link" href="#main-content">跳到主要內容</a>
        <SiteHeader />
        <div id="main-content">{children}</div>
        <SiteFooter />
        <AdSenseLoader />
        <ConsentBanner />
      </body>
    </html>
  );
}
