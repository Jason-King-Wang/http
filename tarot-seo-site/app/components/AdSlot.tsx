"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

type AdSlotProps = {
  label: string;
  slot?: string;
};

export function AdSlot({ label, slot }: AdSlotProps) {
  const pushed = useRef(false);
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

  useEffect(() => {
    if (!client || !slot || pushed.current) return;
    const show = () => {
      if (localStorage.getItem("tarot-consent") !== "accepted") return;
      try {
        window.adsbygoogle = window.adsbygoogle || [];
        window.adsbygoogle.push({});
        pushed.current = true;
      } catch {
        // Google may retry after its script finishes loading.
      }
    };
    show();
    window.addEventListener("tarot-consent-changed", show);
    return () => window.removeEventListener("tarot-consent-changed", show);
  }, [client, slot]);

  if (!client || !slot) {
    if (process.env.NODE_ENV !== "development") return null;
    return <aside className="ad-slot ad-slot-preview" aria-label={`${label}預留廣告版位`}><span>廣告版位預留</span><small>{label}</small></aside>;
  }

  return (
    <aside className="ad-slot" aria-label={label}>
      <span className="ad-label">廣告</span>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}

