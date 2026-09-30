"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function ConsentBanner() {
  const enabled = Boolean(process.env.NEXT_PUBLIC_ADSENSE_CLIENT || process.env.NEXT_PUBLIC_GA_ID);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (enabled && !localStorage.getItem("tarot-consent")) setVisible(true);
  }, [enabled]);

  if (!visible) return null;

  const choose = (value: "accepted" | "rejected") => {
    localStorage.setItem("tarot-consent", value);
    window.dispatchEvent(new Event("tarot-consent-changed"));
    setVisible(false);
  };

  return (
    <section className="consent-banner" aria-label="Cookie 設定">
      <p>我們會在你同意後才載入分析與廣告服務。你可以拒絕，仍能正常使用塔羅工具。詳見 <Link href="/privacy">隱私權說明</Link>。</p>
      <div>
        <button type="button" className="button button-ghost" onClick={() => choose("rejected")}>只用必要功能</button>
        <button type="button" className="button button-primary" onClick={() => choose("accepted")}>同意分析與廣告</button>
      </div>
    </section>
  );
}

