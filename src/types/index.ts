export type TabType = 'home' | 'aegis' | 'agent' | 'activity';
export type AppScreen = 'launch' | 'get-started' | 'wallet-setup' | 'create-wallet' | 'import-key' | 'password-setup' | 'protection-confirmation' | 'login' | 'main';

export interface Token {
  symbol: string;
  amount: string;
}

export interface Implementation {
  id: string;
  state: 'active' | 'registered';
  verdict: 'safe' | 'unsafe';
  title: string;
  provider: string;
  description: string;
  riskLevel: 'safe' | 'low' | 'high' | 'unknown';
  details?: string;
}
