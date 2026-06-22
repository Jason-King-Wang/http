# Trading Dashboard Hub

This folder is the unified external-ready site that combines:

- `sell-model-dashboard-public`
- `SinoPac Auto Trading` report outputs
- `C:\Users\User\Documents\New project 6\hub\trading-system-app-map`

Main entrypoints:

- `index.html`
- `sell-model/index.html`
- `auto-trading/index.html`
- `trading-system-app-map/index.html`

The embed content is synced into:

- `sell-model-embed/`
- `auto-trading-embed/`
- `trading-system-app-map/`
- `data/portal-manifest.json`
- `data/portal-manifest.js`

Use the sync script to refresh the site data:

```powershell
python scripts/sync_market_dashboard_site.py
```

Linked publish path:

- `sell-model-dashboard-sync/publish_public_data.ps1` now also refreshes this unified portal
- that means the existing public sell-model publish schedule can keep the portal in sync
- on this machine, the scheduled task name is `SellModelPublicPublish`
- the public repo deploys the unified portal under the `hub/` subpath

Current deployment reality:

- The local site structure is still kept in `market-dashboard-site`.
- `交易系統app地圖` canonical HTML is kept in `C:\Users\User\Documents\New project 6\hub\trading-system-app-map\index.html`; this public site only carries the synced display copy.
- The live public route is now published through the existing `sell-model-dashboard-public` repo under `hub/`.
- Public URL: `https://jason-king-wang.github.io/http/hub/`

Local-open compatibility:

- The portal writes both JSON and JS manifest files.
- That means opening `index.html` directly from `file:///` still works without requiring a local web server first.

Unified navigation:

- `index.html` is the home portal.
- `sell-model/index.html` wraps the Sell Model site with common navigation.
- `auto-trading/index.html` wraps the SinoPac Auto Trading site with common navigation and page switching buttons.
- `trading-system-app-map/index.html` shows the beginner-readable product map for the trading system app.
