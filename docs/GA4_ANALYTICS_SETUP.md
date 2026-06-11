# GA4 後台數據看板設定指南

這份文件用來啟用 xqcamille.com 的後台數據看板。完成後，你可以用後台密碼登入：

https://xqcamille.com/admin/analytics

看板會讀取 Google Analytics 4 Data API，顯示訪客數、頁面瀏覽、熱門頁面、流量來源、裝置比例、設備型號、城市來源與轉化事件。

## 需要準備的 Vercel Environment Variables

請到 Vercel 專案新增以下欄位：

```env
ADMIN_PASSWORD=你的後台密碼
ADMIN_SESSION_SECRET=你的後台 session secret
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
GA4_PROPERTY_ID=123456789
GA4_CLIENT_EMAIL=service-account@project-id.iam.gserviceaccount.com
GA4_PRIVATE_KEY_BASE64=base64_encoded_private_key
```

不要把真實密碼、session secret、service account JSON 或 private key commit 到 GitHub。

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

## 3. 建立 Google Cloud Service Account

1. 進入 Google Cloud Console
2. 選擇一個專案，或建立新專案
3. 到「IAM 與管理」→「服務帳戶」
4. 點「建立服務帳戶」
5. 名稱可以填 `xqcamille-ga4-reader`
6. 建立完成後，進入這個服務帳戶
7. 到「金鑰」
8. 點「新增金鑰」→「建立新的金鑰」
9. 選擇 JSON
10. 下載 `service-account.json`

這個 JSON 不能上傳 GitHub，也不要傳給別人。

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

## 5. 取得 GA4_CLIENT_EMAIL

打開剛剛下載的 `service-account.json`，找到：

```json
{
  "client_email": "service-account@project-id.iam.gserviceaccount.com"
}
```

把它填到：

```env
GA4_CLIENT_EMAIL=service-account@project-id.iam.gserviceaccount.com
```

## 6. 把 private_key 轉成 Base64

請把 `service-account.json` 暫時放在專案根目錄，執行：

```bash
node -e "const key=require('./service-account.json').private_key; console.log(Buffer.from(key).toString('base64'))"
```

終端機會輸出一長串 base64 字串，把它填到：

```env
GA4_PRIVATE_KEY_BASE64=base64_encoded_private_key
```

注意：

- 只轉換 `private_key` 欄位
- 不要轉整份 JSON
- 不要把 `service-account.json` commit 到 GitHub
- 設定完成後，可以把 `service-account.json` 刪除或移到安全位置

## 7. 把 Service Account 加到 GA4 權限

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
GA4_CLIENT_EMAIL=service-account@project-id.iam.gserviceaccount.com
GA4_PRIVATE_KEY_BASE64=base64_encoded_private_key
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
