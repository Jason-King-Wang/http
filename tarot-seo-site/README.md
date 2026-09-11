# 塔羅書房

免費線上塔羅工具與牌陣指南網站。網站採公開瀏覽、免登入設計，抽牌問題只存在訪客的瀏覽器中，不會上傳或保存。

## 正式環境

- 正式網站：<https://tarot-reading-room.a90149123456.chatgpt.site>
- 原始碼：`Jason-King-Wang/http` repository 的 `tarot-seo-site/` 目錄
- 託管：OpenAI Sites
- GitHub repository 為公開狀態，禁止提交密碼、登入資料、API 金鑰或其他秘密值。

## 工作分工

- GitHub：保存程式、文件與修改紀錄，作為兩台電腦共同開發的主要來源。
- Sites：保存正式環境變數、網站版本並負責正式發布。
- Google AdSense：保存廣告帳號、審查、付款及廣告單元設定。

## 本機開發

需要 Node.js 22.13.0 以上。

```bash
npm install
npm run dev
npm run build
```

跨電腦修改前，先從 GitHub 取得最新版；修改與測試完成後先更新 GitHub，再發布至 Sites。不要直接以舊電腦上的副本覆蓋雲端最新版。

## 重要文件

- [AdSense 設定與改版規則](ADS_SETUP.md)
- [SEO 上線檢查清單](SEO_CHECKLIST.md)
- [修改紀錄](CHANGELOG.md)
- [.env.example](.env.example)：只列設定名稱，不包含正式值

## 目前架構

- 10 種塔羅牌陣頁面
- 3 篇原創塔羅指南
- 關於、編輯政策、隱私權、使用條款與聯絡頁
- `sitemap.xml`、`robots.txt`、canonical metadata 與結構化資料
- Cookie 同意後才載入廣告
- AdSense 未設定時，正式網站不會產生空白廣告框

## 安全原則

1. 不把帳號密碼或 AdSense 後台截圖放進 GitHub。
2. `.env`、`.env.local` 等本機值不得提交。
3. 正式環境值只由 Sites 管理。
4. 大改版先停用廣告，確認手機與桌面版位後再恢復。
