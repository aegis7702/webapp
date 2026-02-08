/**
 * EIP-7702 apply flow: send type-4 delegated transaction to Aegis implementation contract
 * with authorizationList (address, nonce = user nonce + 1 per EIP-7702) and wait for confirmation.
 */

import { Interface, JsonRpcProvider, Wallet } from 'ethers';

export const AEGIS_DELEGATOR_ABI = [
  "function aegis_setSentinel(address sentinel) external",
] as const;


export type ApplyResult =
  | { success: true; txHash: string }
  | { success: false; error: string };

export interface SendEIP7702ApplyParams {
  /** Decrypted private key (0x-prefixed hex). */
  privateKey: string;
  /** RPC URL for the chain (e.g. from getSelectedNetwork()). */
  rpcUrl: string;
  /** Chain ID (decimal string or number). */
  chainId: string | number;
  /** Aegis implementation contract address (delegation target). */
  contractAddress: string;
}

/**
 * Sends an EIP-7702 type-4 transaction with authorizationList containing
 * [chainId, address, nonce]. Per EIP-7702, the authorization nonce is the
 * account's current nonce + 1. Waits for receipt and returns success or error.
 */
export async function sendEIP7702ApplyTransaction(
  params: SendEIP7702ApplyParams
): Promise<ApplyResult> {
  const { privateKey, rpcUrl, chainId, contractAddress } = params;

  try {
    const provider = new JsonRpcProvider(rpcUrl);
    const wallet = new Wallet(privateKey, provider);

    const chainIdBigInt = BigInt(chainId);
    const currentNonce = await provider.getTransactionCount(wallet.address, 'pending');
    const authNonce = BigInt(currentNonce) + 1n;

    const authorization = await wallet.authorize({
      address: contractAddress,
      nonce: authNonce,
      chainId: chainIdBigInt,
    });

    const tx = await wallet.sendTransaction({
      type: 4,
      to: contractAddress as `0x${string}`,
      data: '0x',
      value: 0n,
      authorizationList: [authorization],
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

export async function sendEIP7702ApplyTransactionAndSetSentinel(
  params: SendEIP7702ApplyParams,
  sentinel
): Promise<ApplyResult> {
  const { privateKey, rpcUrl, chainId, contractAddress } = params;

  try {
    const provider = new JsonRpcProvider(rpcUrl);
    const wallet = new Wallet(privateKey, provider);

    const chainIdBigInt = BigInt(chainId);
    const currentNonce = await provider.getTransactionCount(wallet.address, 'pending');
    const authNonce = BigInt(currentNonce) + 1n;

    const authorization = await wallet.authorize({
      address: contractAddress,
      nonce: authNonce,
      chainId: chainIdBigInt,
    });

    const iface = new Interface(AEGIS_DELEGATOR_ABI);
    const data = iface.encodeFunctionData('aegis_setSentinel', [sentinel]);

    const tx = await wallet.sendTransaction({
      type: 4,
      to: wallet.address as `0x${string}`,
      data,
      value: 0n,
      authorizationList: [authorization],
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
