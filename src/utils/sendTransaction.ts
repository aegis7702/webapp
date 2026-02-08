/**
 * Sign and send a transaction using the wallet's private key.
 */

import { JsonRpcProvider, Wallet } from 'ethers';

export interface SendTxParams {
  privateKey: string;
  rpcUrl: string;
  chainId?: number;
  to: string;
  value: string;
  data?: string;
}

export type SendTxResult =
  | { success: true; txHash: string }
  | { success: false; error: string };

export async function sendTransaction(params: SendTxParams): Promise<SendTxResult> {
  const { privateKey, rpcUrl, chainId, to, value, data } = params;
  try {
    const provider = new JsonRpcProvider(rpcUrl);
    const wallet = new Wallet(privateKey, provider);
    const valueWei = BigInt(value);
    const tx = await wallet.sendTransaction({
      to: to as `0x${string}`,
      value: valueWei,
      data: (data && data !== '0x' ? data : undefined) as `0x${string}` | undefined,
      ...(chainId != null && { chainId }),
    });
    const receipt = await tx.wait();
    if (receipt == null) {
      return { success: false, error: 'Transaction did not produce a receipt' };
    }
    if (receipt.status === 0) {
      return { success: false, error: 'Transaction reverted on-chain' };
    }
    return { success: true, txHash: receipt.hash };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { success: false, error: message };
  }
}
