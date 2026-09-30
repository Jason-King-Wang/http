"use client";

import { useEffect } from "react";

export function AdSenseLoader() {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

  useEffect(() => {
    if (!client) return;
    const load = () => {
      if (localStorage.getItem("tarot-consent") !== "accepted") return;
      if (document.querySelector("script[data-tarot-adsense]")) return;
      const script = document.createElement("script");
      script.async = true;
      script.crossOrigin = "anonymous";
      script.dataset.tarotAdsense = "true";
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`;
      document.head.appendChild(script);
    };
    load();
    window.addEventListener("tarot-consent-changed", load);
    return () => window.removeEventListener("tarot-consent-changed", load);
  }, [client]);

  return null;
}

