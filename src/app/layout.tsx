import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "自動量化交易系統｜把交易規則變成可量化、可驗證、可執行的流程",
  description: "一套展示交易規則量化、歷史回測、安裝部署與手機遠端控制流程的 SaaS 工具網站。",
  openGraph: {
    title: "自動量化交易系統",
    description: "從交易想法到策略規格、回測、部署與手機端控制，讓交易流程更清楚可控。",
    type: "website",
    locale: "zh_TW"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
