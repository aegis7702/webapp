import { Notification } from '../types/notification';

export const mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    severity: 'critical',
    title: 'Wallet Temporarily Frozen',
    preview: 'An anomaly was detected in transaction pattern and your wallet has been automatically frozen for security.',
    fullMessage: 'An unusual transaction pattern was detected attempting to transfer 85% of your wallet balance to an unknown address. For your protection, Aegis has automatically frozen your wallet.\n\nDetected Activity:\n• Destination: 0x8f3a...9c2d (flagged as suspicious)\n• Amount: 4.25 ETH (85% of balance)\n• Risk Score: 0.92 (Critical)\n\nYour wallet will remain frozen until you review and approve this transaction. You can unfreeze your wallet from the Home screen after verifying the transaction details.',
    timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
    isRead: false
  },
  {
    id: 'notif-2',
    severity: 'warning',
    title: 'Potential Risk Detected',
    preview: 'A suspicious contract interaction was detected but no action was taken. Please review the transaction details.',
    fullMessage: 'Aegis detected a potential security risk during a recent transaction attempt.\n\nDetected Activity:\n• Contract: 0x2a4c...7e9f (Uniswap Router Clone)\n• Function: swap()\n• Risk Score: 0.65 (Medium)\n\nReason for Alert:\nThe contract you interacted with has similar code to Uniswap Router but is not verified and has limited transaction history. While this may be legitimate, we recommend extra caution.\n\nRecommended Actions:\n1. Verify the contract address with the official project\n2. Check recent transactions on Etherscan\n3. Consider using the official Uniswap interface\n\nNo automatic freeze was applied as the risk level did not meet the threshold.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    isRead: false
  },
  {
    id: 'notif-3',
    severity: 'warning',
    title: 'Potential Risk Detected',
    preview: 'Multiple approval requests detected within a short timeframe. This could indicate a malicious dApp interaction.',
    fullMessage: 'Aegis detected multiple token approval requests in quick succession.\n\nDetected Activity:\n• Time Window: 30 seconds\n• Approval Count: 3 transactions\n• Tokens: USDC, USDT, DAI\n• Risk Score: 0.58 (Low-Medium)\n\nReason for Alert:\nMalicious dApps often request multiple approvals rapidly to drain multiple tokens. While your interaction may be legitimate (e.g., multi-token DEX), we recommend reviewing each approval carefully.\n\nRecommended Actions:\n1. Verify you trust the dApp requesting approvals\n2. Check approval amounts are reasonable\n3. Consider revoking unnecessary approvals\n\nNo automatic freeze was applied as individual transactions appear standard.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    isRead: true
  }
];
