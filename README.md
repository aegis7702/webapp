# Aegis Wallet

## Run locally

```bash
npm i
npm run dev
```

Opens the app in the browser. You can create/import a wallet, view balances and tokens, manage Aegis implementations, and see recent activity.

## Chrome Extension (side panel)

1. Build: `pnpm run build:extension` (or `npm run build:extension`).
2. In Chrome go to `chrome://extensions` → turn on **Developer mode** → **Load unpacked** → select the **`dist-extension`** folder (inside this repo, not the repo root).
3. Click the extension icon to open the wallet in the side panel (Chrome 114+).

**If `window.aegis` is undefined on a website:** (1) Load unpacked must point to **dist-extension** (the build output). (2) Use Chrome 102+ (needed for `world: "MAIN"`). (3) Test on an **http/https** page (e.g. open a new tab → `https://example.com` → F12 → Console → type `window.aegis`). (4) After rebuilding, click the refresh icon on your extension in `chrome://extensions`, then reload the test page.

**Custom icon:** Replace `logo.png` in the project root and rebuild, or add `icon16.png`, `icon48.png`, and `icon128.png` under `extension/icons/`.

**dApp integration:** Sites can request the wallet via the EIP-1193–style provider `window.aegis` (injected by the extension on http/https pages):

- `window.aegis.request({ method: 'eth_requestAccounts', params: [] })` → returns `[address]` (or `[]` if not logged in).
- `window.aegis.request({ method: 'eth_sendTransaction', params: [tx] })` → opens the side panel; user runs precheck and confirms; returns the transaction hash or an error. `tx` is `{ to?, value?, data?, ... }` (value in hex).
