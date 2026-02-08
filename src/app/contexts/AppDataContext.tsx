/**
 * Centralized data for Home/Aegis/Activity. Fetched once on mount and refreshed every 1 minute.
 */

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Implementation } from '../../types';
import { fetchAegisBatch, type GetRecordCurrentDecoded } from '../../utils/aegisSession';
import { fetchRecentTxsWithNotes, type RecentTxWithNote } from '../../utils/activitySession';
import config from '../../config/address.json';
import {
  getSelectedNetwork,
  getSavedTokens,
  fetchBalances,
  fetchTokenSymbolNameAndAccountCode,
  isDelegatedToImplementation,
} from '../../utils/tokenSession';
import { getWalletSession } from '../../utils/walletSession';
import { DEFAULT_NETWORKS, DEFAULT_TOKENS_BY_CHAIN } from '../../config/netwotk';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const REFRESH_INTERVAL_MS = 60 * 1000; // 1 minute

function isZeroOrNullAddress(addr: string | null): boolean {
  if (!addr) return true;
  const a = addr.toLowerCase().replace(/^0x/, '').padStart(40, '0');
  return a === '0'.repeat(40) || a === ZERO_ADDRESS.replace(/^0x/, '');
}

function mapRecentRecordToImplementation(
  impl: string,
  name: string,
  summary: string,
  description: string,
  reasons: string,
  verdict: 'Unknown' | 'Safe' | 'Unsafe'
): Implementation {
  const displayUnsafe = verdict !== 'Safe';
  const shortAddr = impl.slice(0, 10) + '...' + impl.slice(-6);
  return {
    id: impl,
    address: impl,
    state: 'registered',
    verdict: displayUnsafe ? 'unsafe' : 'safe',
    title: name?.trim() || shortAddr,
    provider: 'Registry',
    description: description?.trim() || summary?.trim() || reasons?.trim() || 'No description.',
    riskLevel: verdict === 'Safe' ? 'safe' : 'high',
  };
}

function mapGetRecordCurrentToImplementation(
  implementationAddress: string,
  record: GetRecordCurrentDecoded
): Implementation {
  const verdictUnsafe = record.verdict !== 'Safe';
  return {
    id: implementationAddress,
    address: implementationAddress,
    state: 'active',
    verdict: verdictUnsafe ? 'unsafe' : 'safe',
    title: record.name?.trim() || implementationAddress.slice(0, 10) + '...' + implementationAddress.slice(-6),
    provider: 'Registry',
    description: record.description?.trim() || record.summary?.trim() || record.reasons?.trim() || 'No description.',
    riskLevel: record.verdict === 'Safe' ? 'safe' : 'high',
  };
}

export interface AppDataAegis {
  activeImpl: Implementation | null;
  setActiveImpl: React.Dispatch<React.SetStateAction<Implementation | null>>;
  registeredImpls: Implementation[];
  setRegisteredImpls: React.Dispatch<React.SetStateAction<Implementation[]>>;
  registeredLoading: boolean;
  refetchAegisData: () => void | Promise<void>;
}

export interface AppDataActivity {
  txs: RecentTxWithNote[];
  isFrozen: boolean;
  freezeReason: string | null;
  loading: boolean;
  refetchActivity: () => void | Promise<void>;
}

export type AegisSetupStatus = 'not-applied' | 'applied';

export interface AppDataHome {
  ethBalance: string;
  tokenBalances: { address: string; symbol: string; balance: string }[];
  refetchBalances: () => void | Promise<void>;
  fetchTokenSymbolNameAndAccountCode: (
    tokenAddress: string,
    accountAddress: string,
    rpcUrl: string
  ) => Promise<{ symbol: string | null; name: string | null; accountCode: string | null }>;
  aegisSetupStatus: AegisSetupStatus;
  refetchAegisSetupStatus: () => void | Promise<void>;
}

export interface AppDataContextValue {
  aegis: AppDataAegis;
  activity: AppDataActivity;
  home: AppDataHome;
  /** True after the first data load (login → main) has finished. Used for initial loading screen. */
  initialLoadDone: boolean;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider');
  return ctx;
}

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [activeImpl, setActiveImpl] = useState<Implementation | null>(null);
  const [registeredImpls, setRegisteredImpls] = useState<Implementation[]>([]);
  const [registeredLoading, setRegisteredLoading] = useState(true);
  const aegisHasLoadedOnceRef = useRef(false);

  const [activityTxs, setActivityTxs] = useState<RecentTxWithNote[]>([]);
  const [activityIsFrozen, setActivityIsFrozen] = useState(false);
  const [activityFreezeReason, setActivityFreezeReason] = useState<string | null>(null);
  const [activityLoading, setActivityLoading] = useState(true);
  const activityHasLoadedOnceRef = useRef(false);

  const [ethBalance, setEthBalance] = useState('0');
  const [tokenBalances, setTokenBalances] = useState<{ address: string; symbol: string; balance: string }[]>([]);
  const [aegisSetupStatus, setAegisSetupStatus] = useState<AegisSetupStatus>('not-applied');
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  const refetchBalances = useCallback((): Promise<void> => {
    const network = getSelectedNetwork() ?? DEFAULT_NETWORKS[0];
    const walletAddress = getWalletSession()?.address;
    if (!network?.rpcUrl || !walletAddress) {
      setEthBalance('0');
      setTokenBalances([]);
      return Promise.resolve();
    }
    const chainId = network.chainId ?? '';
    const defaultTokens = DEFAULT_TOKENS_BY_CHAIN[chainId] ?? [];
    const savedTokens = getSavedTokens(chainId);
    const allTokens = [
      ...defaultTokens.map((t) => ({ symbol: t.symbol, name: t.name, address: t.address })),
      ...savedTokens.map((t) => ({ symbol: t.symbol, name: t.name, address: t.address })),
    ];
    const tokensForFetch = allTokens.map((t) => ({ address: t.address, symbol: t.symbol }));
    return fetchBalances(network.rpcUrl, walletAddress, tokensForFetch).then(
      ({ ethBalance: eth, tokenBalances: tb }) => {
        setEthBalance(eth);
        setTokenBalances(tb.map((b) => ({ address: b.address, symbol: b.symbol, balance: b.balance })));
      }
    );
  }, []);

  const refetchAegisSetupStatus = useCallback((): Promise<void> => {
    const session = getWalletSession();
    const network = getSelectedNetwork() ?? DEFAULT_NETWORKS[0];
    if (!session?.address || !network?.rpcUrl) return Promise.resolve();
    const delegator = (config as Record<string, string>).AegisGuardDelegator;
    if (!delegator) return Promise.resolve();
    return isDelegatedToImplementation(session.address, network.rpcUrl, delegator).then((delegated) => {
      setAegisSetupStatus(delegated ? 'applied' : 'not-applied');
    });
  }, []);

  const refetchAegisData = useCallback((): Promise<void> => {
    const network = getSelectedNetwork() ?? DEFAULT_NETWORKS[0];
    const rpcUrl = network?.rpcUrl;
    const walletAddress = getWalletSession()?.address;
    if (!rpcUrl) {
      setRegisteredLoading(false);
      setActiveImpl(null);
      return Promise.resolve();
    }
    if (!aegisHasLoadedOnceRef.current) setRegisteredLoading(true);
    return fetchAegisBatch(rpcUrl, config.ImplSafetyRegistry, config.AegisGuardDelegator, walletAddress)
      .then((result) => {
        if (isZeroOrNullAddress(result.implementationAddress)) {
          setActiveImpl(null);
        } else if (result.implementationAddress && result.getRecordCurrent) {
          setActiveImpl(
            mapGetRecordCurrentToImplementation(result.implementationAddress, result.getRecordCurrent)
          );
        } else {
          setActiveImpl(null);
        }
        if (result.getRecentRecords) {
          const r = result.getRecentRecords;
          const list: Implementation[] = r.impls.map((impl, i) =>
            mapRecentRecordToImplementation(
              impl,
              r.names[i] ?? '',
              r.summaries[i] ?? '',
              r.descriptions[i] ?? '',
              r.reasonsList[i] ?? '',
              r.verdicts[i] ?? 'Unknown'
            )
          );
          setRegisteredImpls(list);
        }
      })
      .catch(() => {
        setRegisteredImpls([]);
        setActiveImpl(null);
      })
      .finally(() => {
        setRegisteredLoading(false);
        aegisHasLoadedOnceRef.current = true;
      });
  }, []);

  const refetchActivity = useCallback((): Promise<void> => {
    const network = getSelectedNetwork() ?? DEFAULT_NETWORKS[0];
    const rpcUrl = network?.rpcUrl;
    const walletAddress = getWalletSession()?.address;
    if (!rpcUrl) {
      setActivityLoading(false);
      setActivityTxs([]);
      return Promise.resolve();
    }
    if (!activityHasLoadedOnceRef.current) setActivityLoading(true);
    return fetchRecentTxsWithNotes(rpcUrl, walletAddress)
      .then(({ txs, isFrozen, freezeReason }) => {
        setActivityTxs(txs);
        setActivityIsFrozen(isFrozen);
        setActivityFreezeReason(freezeReason);
      })
      .catch(() => {
        setActivityTxs([]);
        setActivityIsFrozen(false);
        setActivityFreezeReason(null);
      })
      .finally(() => {
        setActivityLoading(false);
        activityHasLoadedOnceRef.current = true;
      });
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      refetchAegisData(),
      refetchActivity(),
      refetchBalances(),
      refetchAegisSetupStatus(),
    ]).finally(() => {
      if (!cancelled) setInitialLoadDone(true);
    });
    const id = setInterval(() => {
      refetchAegisData();
      refetchActivity();
      refetchBalances();
      refetchAegisSetupStatus();
    }, REFRESH_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [refetchAegisData, refetchActivity, refetchBalances, refetchAegisSetupStatus]);

  const value: AppDataContextValue = {
    aegis: {
      activeImpl,
      setActiveImpl,
      registeredImpls,
      setRegisteredImpls,
      registeredLoading,
      refetchAegisData,
    },
    activity: {
      txs: activityTxs,
      isFrozen: activityIsFrozen,
      freezeReason: activityFreezeReason,
      loading: activityLoading,
      refetchActivity,
    },
    home: {
      ethBalance,
      tokenBalances,
      refetchBalances,
      fetchTokenSymbolNameAndAccountCode,
      aegisSetupStatus,
      refetchAegisSetupStatus,
    },
    initialLoadDone,
  };

  return (
    <AppDataContext.Provider value={value}>
      {children}
    </AppDataContext.Provider>
  );
}
