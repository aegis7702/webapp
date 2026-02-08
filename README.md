# Aegis Wallet

## Run locally

```bash
npm i
npm run dev
```

Opens the app in the browser. You can create/import a wallet, view balances and tokens, manage Aegis implementations, and see recent activity.

## Chrome Extension (side panel)

1. Build: `pnpm run build:extension` (or `npm run build:extension`).
2. In Chrome go to `chrome://extensions` → turn on **Developer mode** → **Load unpacked** → select the **dist-extension** folder.
3. Click the extension icon to open the wallet in the side panel (Chrome 114+).

**Custom icon:** Replace `logo.png` in the project root and rebuild, or add `icon16.png`, `icon48.png`, and `icon128.png` under `extension/icons/`.
