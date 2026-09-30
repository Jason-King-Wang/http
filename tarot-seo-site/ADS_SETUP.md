# AdSense 設定與改版規則

這份文件是塔羅書房的廣告操作手冊。網站可以持續改版；AdSense 核准不是把廣告綁定在固定像素位置，但每次改版後仍需重新檢查新位置是否容易造成誤點。

## 目前狀態

- 程式已支援 AdSense，但正式環境尚未填入 AdSense publisher ID 與廣告單元 ID。
- 沒有 `NEXT_PUBLIC_ADSENSE_CLIENT` 時，正式網站不會載入 Google 廣告程式。
- 訪客未同意 Cookie 時，不會載入廣告。
- `/ads.txt` 會依 publisher ID 自動產生內容。

## Sites 正式環境變數

正式值只能設定在 Sites，不要寫進 GitHub。

| 名稱 | 用途 | 範例或格式 |
|---|---|---|
| `SITE_URL` | canonical、sitemap 與正式網址 | `https://example.com` |
| `NEXT_PUBLIC_ADSENSE_CLIENT` | AdSense publisher ID | `ca-pub-xxxxxxxxxxxxxxxx` |
| `NEXT_PUBLIC_ADSENSE_SLOT_HOME` | 首頁廣告單元 ID | AdSense 後台提供 |
| `NEXT_PUBLIC_ADSENSE_SLOT_READING` | 抽牌頁廣告單元 ID | AdSense 後台提供 |
| `NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE` | 指南文章廣告單元 ID | AdSense 後台提供 |
| `NEXT_PUBLIC_GA_ID` | 選用的 Google Analytics ID | `G-XXXXXXXXXX` |

## 目前三個預留版位

1. 首頁：主視覺區塊之後、牌陣選擇區之前。
2. 抽牌頁：完整抽牌互動工具之後、教學內容之前。
3. 指南文章：文章完整內容之後。

抽牌頁版位不可以移到「抽牌、重新抽牌、翻牌、選牌」按鈕旁邊，也不能讓廣告看起來像網站功能、牌卡或導覽選項。

## 首次啟用流程

1. 確認正式網域、隱私權、聯絡方式與主要內容完整。
2. 在 Google AdSense 新增網站並完成審查。
3. 在 AdSense 建立首頁、抽牌頁與文章三種廣告單元。
4. 將五個正式值設定到 Sites；不要建立包含正式值的 `.env` 文件並提交。
5. 重新發布網站。
6. 實際檢查 `/ads.txt`、Cookie 同意、手機版與桌面版。
7. 自己與開發人員不得點擊正式廣告進行測試。

## 大改版模式

每次大改版固定依照以下順序：

1. 在 Sites 暫時移除或停用 `NEXT_PUBLIC_ADSENSE_CLIENT`，重新發布無廣告版本。
2. 修改版面與內容；未完成頁面不可帶著正式廣告公開。
3. 檢查手機、平板與桌面版。
4. 確認廣告遠離所有按鈕、導覽、表單與密集互動區。
5. 確認頁面有足夠原創內容，廣告沒有多於內容。
6. 恢復 Sites 的 AdSense 環境變數並重新發布。
7. 上線後再檢查一次實際版位；若使用自動廣告，排除不適合的區域或頁面。

## 需要重新注意審查的情況

- 同一網域只改版面或內容：通常不需重新申請，但新版仍須符合政策。
- 更換網域：先在 AdSense 新增新網站並等候審查，再顯示廣告。
- AdSense 審查期間：避免把網站改成施工中、空白頁或導覽失效狀態。

## 申請前內容工作

- 持續增加有明確目的、實質內容與人工審閱的指南。
- 不要一次大量發布只有關鍵字不同、內容高度相似的頁面。
- 使用 Search Console 檢查索引、行動裝置體驗與網站錯誤。
- 網站架構只能降低風險，不能保證 AdSense 核准。
