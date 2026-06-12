# GA4 後台數據看板設定指南

這份文件用來啟用 xqcamille.com 的後台數據看板。完成後，你可以用後台密碼登入：

https://xqcamille.com/admin/analytics

看板會讀取 Google Analytics 4 Data API，顯示訪客數、頁面瀏覽、熱門頁面、流量來源、裝置比例、設備型號、城市來源與轉化事件。

## 目前建議方案：OAuth

如果 GA4「資源存取權管理」無法加入 Service Account，請改用 OAuth。OAuth 會由你本人具備 GA4 權限的 Google 帳號授權一次，後端用 refresh token 讀取 GA4 Data API。

這個方式不需要把 `xqcamille-ga4-reader@...iam.gserviceaccount.com` 加入 GA4 使用者管理。

## 需要準備的 Vercel Environment Variables

請到 Vercel 專案新增以下欄位：

```env
ADMIN_PASSWORD=你的後台密碼
ADMIN_SESSION_SECRET=你的後台 session secret
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
GA4_PROPERTY_ID=123456789
GA4_OAUTH_CLIENT_ID=google_oauth_client_id
GA4_OAUTH_CLIENT_SECRET=google_oauth_client_secret
GA4_OAUTH_REFRESH_TOKEN=google_oauth_refresh_token
GA4_OAUTH_REDIRECT_URI=https://xqcamille.com/api/admin/ga4/oauth-callback
```

不要把真實密碼、session secret、OAuth client secret、refresh token、service account JSON 或 private key commit 到 GitHub。

## 1. 找 GA4 Measurement ID

1. 進入 Google Analytics
2. 選擇 xqcamille.com 使用的 GA4 資源
3. 左下角點「管理」
4. 在「資料收集與修改」裡點「資料串流」
5. 選擇網站資料串流
6. 找到「評估 ID」或「Measurement ID」
7. 格式會像 `G-XXXXXXXXXX`

把它填到：

```env
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

這個 ID 會放在前端，用來送事件到 GA4。它不是 API key，也不是私密金鑰。

## 2. 找 GA4 Property ID

1. 進入 Google Analytics
2. 左下角點「管理」
3. 確認目前選到的是正確的 GA4 資源
4. 點「資源設定」或「資源詳細資料」
5. 找到「資源 ID」或「Property ID」
6. 這是一串純數字，不是 `G-` 開頭

把它填到：

```env
GA4_PROPERTY_ID=123456789
```

## 3. 建立 Google OAuth Client

1. 進入 Google Cloud Console
2. 選擇你目前啟用 Google Analytics Data API 的專案
3. 到「API 和服務」→「OAuth 同意畫面」
4. 設定應用程式名稱，例如 `xqcamille analytics dashboard`
5. 使用者類型選外部或內部，依你的帳號狀態而定
6. 到「憑證」→「建立憑證」→「OAuth 用戶端 ID」
7. 應用程式類型選「網頁應用程式」
8. 已授權重新導向 URI 加入：

```text
https://xqcamille.com/api/admin/ga4/oauth-callback
```

建立完成後，把用戶端 ID 與密鑰放到 Vercel：

```env
GA4_OAUTH_CLIENT_ID=google_oauth_client_id
GA4_OAUTH_CLIENT_SECRET=google_oauth_client_secret
GA4_OAUTH_REDIRECT_URI=https://xqcamille.com/api/admin/ga4/oauth-callback
```

## 4. 啟用 Google Analytics Data API

1. 進入 Google Cloud Console
2. 確認選到同一個 Google Cloud 專案
3. 到「API 和服務」→「程式庫」
4. 搜尋 `Google Analytics Data API`
5. 點進去後按「啟用」

如果沒有啟用，後台會顯示：

```text
Google Analytics Data API 尚未啟用
```

## 5. 產生 GA4 OAuth refresh token

1. 先確認 Vercel 已設定：

```env
ADMIN_PASSWORD
ADMIN_SESSION_SECRET
VITE_GA_MEASUREMENT_ID
GA4_PROPERTY_ID
GA4_OAUTH_CLIENT_ID
GA4_OAUTH_CLIENT_SECRET
GA4_OAUTH_REDIRECT_URI
```

2. Redeploy 正式站
3. 登入 `https://xqcamille.com/admin/analytics`
4. 點「GA4 OAuth 授權」
5. 使用有 xqcamille GA4 權限的 Google 帳號完成同意
6. callback 頁面會顯示：

```env
GA4_OAUTH_REFRESH_TOKEN=...
```

7. 把這一行加入 Vercel Production Environment Variables
8. 再次 Redeploy

## 6. 備援 Service Account 模式

如果 GA4 可以加入 Service Account，才需要使用這段。若 GA4 顯示「這個電子郵件與 Google 帳戶不符」，請不要再用這條路，改用上面的 OAuth。

打開 `service-account.json`，找到 `client_email`，並把 `private_key` 轉成 base64：

```bash
node -e "const key=require('./service-account.json').private_key; console.log(Buffer.from(key).toString('base64'))"
```

終端機會輸出一長串 base64 字串，把它填到：

```env
GA4_CLIENT_EMAIL=service-account@project-id.iam.gserviceaccount.com
GA4_PRIVATE_KEY_BASE64=base64_encoded_private_key
```

注意：

- 只轉換 `private_key` 欄位
- 不要轉整份 JSON
- 不要把 `service-account.json` commit 到 GitHub
- 設定完成後，可以把 `service-account.json` 刪除或移到安全位置

## 7. Service Account 權限備援

1. 回到 Google Analytics
2. 左下角點「管理」
3. 在 GA4 資源欄位點「資源存取權管理」
4. 點右上角加號
5. 新增使用者
6. Email 填入 `GA4_CLIENT_EMAIL`
7. 權限給 `Viewer` 或 `Analyst`
8. 儲存

如果沒有加權限，後台會顯示：

```text
Service Account 沒有 GA4 權限
```

如果 GA4 不接受 Service Account email，請使用 OAuth，不要卡在這一步。

## 8. 到 Vercel 新增 Environment Variables

1. 進入 Vercel
2. 打開 `xqcamille` 專案
3. 點 `Settings`
4. 點 `Environment Variables`
5. 新增以下欄位

```env
ADMIN_PASSWORD=你的後台密碼
ADMIN_SESSION_SECRET=你的後台 session secret
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
GA4_PROPERTY_ID=123456789
GA4_OAUTH_CLIENT_ID=google_oauth_client_id
GA4_OAUTH_CLIENT_SECRET=google_oauth_client_secret
GA4_OAUTH_REFRESH_TOKEN=google_oauth_refresh_token
GA4_OAUTH_REDIRECT_URI=https://xqcamille.com/api/admin/ga4/oauth-callback
```

建議至少勾選 `Production`。如果你也想在 Preview 部署測試，也可以勾選 `Preview`。

## 9. Redeploy 正式站

Vercel 環境變數新增後，需要重新部署才會生效。

1. 到 Vercel 專案頁
2. 點 `Deployments`
3. 找到最新部署
4. 點右側選單
5. 選 `Redeploy`
6. 等部署完成

## 10. 測試後台是否成功連接

部署完成後打開：

https://xqcamille.com/admin/analytics

用後台密碼登入。

如果設定正確，狀態會顯示：

```text
正常連接 Google Analytics 4 Data API
```

如果尚未完成設定，後台會指出原因，例如：

- 缺少 GA4_PROPERTY_ID
- 缺少 GA4_CLIENT_EMAIL
- 缺少 GA4_PRIVATE_KEY_BASE64
- Google Analytics Data API 尚未啟用
- Service Account 沒有 GA4 權限
- GA4 查無資料

## 事件追蹤項目

網站目前會送出這些 GA4 事件：

```text
click_line
click_contact
click_booking
click_market_note
stay_30_seconds
scroll_70_percent
```

如果網站目前沒有預約按鈕，`click_booking` 會自然顯示 0。等未來有預約入口再接上即可。
