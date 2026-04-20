# Trading Dashboard Hub

This folder is the unified external-ready site that combines:

- `sell-model-dashboard-public`
- `SinoPac Auto Trading` report outputs

Main entrypoints:

- `index.html`
- `sell-model/index.html`
- `auto-trading/index.html`

The embed content is synced into:

- `sell-model-embed/`
- `auto-trading-embed/`
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

Current deployment reality:

- The site structure is ready for external hosting.
- This machine does not currently have a git repo configured for this site.
- Until a repo / Pages target exists, this remains an external-ready local build rather than a live public URL.

Local-open compatibility:

- The portal writes both JSON and JS manifest files.
- That means opening `index.html` directly from `file:///` still works without requiring a local web server first.

Unified navigation:

- `index.html` is the home portal.
- `sell-model/index.html` wraps the Sell Model site with common navigation.
- `auto-trading/index.html` wraps the SinoPac Auto Trading site with common navigation and page switching buttons.
