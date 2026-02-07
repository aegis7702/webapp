/**
 * Default chain / network config.
 * Ethereum Sepolia as default testnet.
 */

export interface Network {
  name: string;
  rpcUrl: string;
  chainId: string;
  /** Native token symbol; default ETH when omitted. */
  symbol?: string;
  /** Block explorer base URL (optional). */
  blockExplorer?: string;
}

/** Default chains shown in Network list (e.g. Ethereum Sepolia). */
export const DEFAULT_NETWORKS: Network[] = [
  {
    name: 'Ethereum Sepolia',
    rpcUrl: 'https://1rpc.io/sepolia',
    chainId: '11155111',
    symbol: 'ETH',
    blockExplorer: 'https://sepolia.etherscan.io',
  },
];

export interface Token {
  symbol: string;
  address: string;
  /** Display name (optional); used for custom added tokens. */
  name?: string;
}

/** Ethereum Sepolia default token list. */
export const SEPOLIA_DEFAULT_TOKENS: Token[] = [
  { symbol: 'AGT', address: '0x4175046d14cf65BFFcF51ec6A470e4A8FbA1a402' },
//   { symbol: 'USDC', address: '0xf55B2Ab657147E94B228A2575483Ea3C73C88275' },
];

/** Default tokens by chainId (for Home token list). */
export const DEFAULT_TOKENS_BY_CHAIN: Record<string, Token[]> = {
  '11155111': SEPOLIA_DEFAULT_TOKENS,
};

// {
//   name: 'Base Sepolia',
//   rpcUrl: 'https://base-sepolia.drpc.org',
//   chainId: '84532',
//   symbol: 'ETH',
//   blockExplorer: 'https://sepolia.basescan.org',
// },
