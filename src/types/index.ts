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

export type TransactionStatus = 'success' | 'failed' | 'pending';
export type TransactionType = 'send' | 'receive' | 'swap' | 'eip7702';
export type MonitoringStatus = 'monitored' | 'anomaly-detected' | 'no-anomaly';

export interface Transaction {
  id: string;
  action: string;
  time: string;
  amount: string;
  type: TransactionType;
  status: TransactionStatus;
  to?: string; // Target address
  tokenSymbol?: string; // Token symbol for clarity
  
  // EIP-7702 specific fields
  is7702?: boolean;
  implementationName?: string;
  delegatedExecution?: boolean;
  monitoringStatus?: MonitoringStatus;
  hash?: string;
  executionPath?: string;
  
  // Post-execution monitoring
  postExecutionData?: {
    eventsMonitored: string[];
    stateChanges: string[];
    anomalyDetected: boolean;
    riskLevel?: 'none' | 'low' | 'high' | 'critical';
    riskDescription?: string;
  };
  
  // Freeze action
  freezeAction?: {
    isFrozen: boolean;
    freezeReason: string;
    frozenBy: string;
    frozenAt: string;
  };
}