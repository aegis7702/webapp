import React, { useState } from 'react';
import { X, FileText, Link2, MessageCircle, CheckCircle2, XCircle } from 'lucide-react';
import { getWalletSession, decryptPrivateKey } from '../../../utils/walletSession';
import { getLoginPasswordInMemory } from '../../../utils/authMemory';
import { getSelectedNetwork } from '../../../utils/tokenSession';
import { DEFAULT_NETWORKS } from '../../../config/netwotk';
import { txPrecheck, type TxPrecheckResponse } from '../../../utils/auditApi';
import { sendTransaction } from '../../../utils/sendTransaction';
import { useAppData } from '../../contexts/AppDataContext';
import { UnifiedModal } from '../aegis/UnifiedModal';

const WEI_PER_ETH = BigInt(1e18);

function ethToWei(eth: string): string {
  const trimmed = eth.trim();
  if (!trimmed) return '0';
  const [intPart = '0', decPart = ''] = trimmed.split('.');
  const paddedDec = decPart.slice(0, 18).padEnd(18, '0');
  const wei = BigInt(intPart) * WEI_PER_ETH + BigInt(paddedDec || '0');
  return wei.toString();
}

type Step = 'precheck' | 'prechecking' | 'send' | 'sending' | 'complete';

export interface SignTransactionModalProps {
  onClose: () => void;
  requestId?: string;
  onResolve?: (id: string, result: string | null) => void;
  onReject?: (id: string, error: string) => void;
  initialTo?: string;
  initialValueEth?: string;
  initialData?: string;
}

function ModalFrame({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-stone-50 flex flex-col">
      <div className="border-b border-stone-200 px-6 py-4 flex items-center justify-between shrink-0">
        <h1 className="text-lg font-semibold text-stone-900">{title}</h1>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-200 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-stone-600" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}

function ProgressModal({ title, text, subtext }: { title: string; text: string; subtext: string }) {
  return (
    <UnifiedModal
      isOpen
      fullScreen
      title={title}
      showCloseButton={false}
    >
      <div className="py-12">
        <div className="flex flex-col items-center justify-center text-center space-y-6">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
              <MessageCircle className="w-10 h-10 text-white animate-pulse" />
            </div>
            <div className="absolute inset-0 w-20 h-20 bg-orange-400 rounded-full animate-ping opacity-20" />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-stone-900">{text}</p>
            <p className="text-xs text-stone-600">{subtext}</p>
          </div>
        </div>
      </div>
    </UnifiedModal>
  );
}

export function SignTransactionModal({
  onClose,
  requestId,
  onResolve,
  onReject,
  initialTo = '',
  initialValueEth = '',
  initialData = '',
}: SignTransactionModalProps) {
  const { activity } = useAppData();
  const [step, setStep] = useState<Step>('precheck');
  const [precheckResult, setPrecheckResult] = useState<TxPrecheckResponse | null>(null);
  const [precheckError, setPrecheckError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [completeSuccess, setCompleteSuccess] = useState<boolean | null>(null);
  const [completeError, setCompleteError] = useState<string | null>(null);

  const to = initialTo.trim();
  const valueEth = initialValueEth.trim() || '0';
  const data = (initialData.trim() || '0x').toLowerCase();

  const network = getSelectedNetwork() ?? DEFAULT_NETWORKS[0];
  const session = getWalletSession();
  const from = session?.address ?? '';
  const chainId = network ? Number(network.chainId) : 0;

  const handlePrecheck = async () => {
    setPrecheckError(null);
    setPrecheckResult(null);
    if (!to) {
      setPrecheckError('Missing "To" address');
      return;
    }
    if (!from) {
      setPrecheckError('Wallet not connected');
      return;
    }
    if (!network?.rpcUrl) {
      setPrecheckError('No network selected');
      return;
    }
    setStep('prechecking');
    const valueWei = ethToWei(valueEth);
    try {
      const result = await txPrecheck({
        chainId,
        from,
        to,
        value: valueWei,
        data: data || '0x',
        txType: 0,
        authorizationList: [],
      });
      setPrecheckResult(result);
    } catch (e) {
      setPrecheckError(e instanceof Error ? e.message : String(e));
    } finally {
      setStep('send');
    }
  };

  const handleSend = async () => {
    if (!precheckResult?.allow) return;
    setSendError(null);
    const password = getLoginPasswordInMemory();
    if (!password || !session?.encryptedPk) {
      setCompleteSuccess(false);
      setCompleteError('Session expired. Please log out and log in again to sign.');
      setStep('complete');
      return;
    }
    if (!network?.rpcUrl) {
      setCompleteSuccess(false);
      setCompleteError('No network selected');
      setStep('complete');
      return;
    }
    setStep('sending');
    const valueWei = ethToWei(valueEth);
    try {
      const privateKey = await decryptPrivateKey(session.encryptedPk, password);
      const result = await sendTransaction({
        privateKey,
        rpcUrl: network.rpcUrl,
        chainId,
        to,
        value: valueWei,
        data: data && data !== '0x' ? data : undefined,
      });
      if (result.success) {
        setTxHash(result.txHash);
        activity.refetchActivity();
        setCompleteSuccess(true);
      } else {
        setCompleteSuccess(false);
        setCompleteError(result.error);
      }
    } catch (e) {
      setCompleteSuccess(false);
      setCompleteError(e instanceof Error ? e.message : String(e));
    } finally {
      setStep('complete');
    }
  };

  const handleClose = () => {
    if (requestId && onReject) onReject(requestId, 'User rejected');
    setStep('precheck');
    setPrecheckResult(null);
    setPrecheckError(null);
    setTxHash(null);
    setCompleteSuccess(null);
    setCompleteError(null);
    onClose();
  };

  const handleDoneSuccess = () => {
    if (requestId && onResolve && txHash) onResolve(requestId, txHash);
    onClose();
  };

  const handleCloseFailure = () => {
    if (requestId && onReject) onReject(requestId, completeError ?? 'Transaction failed');
    onClose();
  };

  const txDetailsBlock = (
    <>
      {network && (
        <div className="flex items-center gap-2 mb-4">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white border border-stone-200 text-xs font-medium text-stone-600">
            <Link2 className="w-3.5 h-3.5 flex-shrink-0" />
            {network.name}
            {network.chainId && (
              <span className="text-stone-400"> · Chain {network.chainId}</span>
            )}
          </span>
        </div>
      )}
      <div className="rounded-xl border border-stone-200 bg-gradient-to-br from-stone-50 to-stone-100/80 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white border border-stone-200 shadow-sm flex-shrink-0">
            <FileText className="w-4 h-4 text-orange-500" />
          </div>
          <span className="text-sm font-semibold text-stone-800">Request from dApp</span>
        </div>
        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-1">To</p>
            <p className="font-mono text-sm text-stone-800 break-all select-all bg-white/80 rounded-lg border border-stone-200 px-3 py-2.5">
              {to || '—'}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-1">Value (ETH)</p>
            <p className="font-mono text-sm text-stone-800 bg-white/80 rounded-lg border border-stone-200 px-3 py-2.5">
              {valueEth || '0'}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-1">Data</p>
            <p className="font-mono text-xs text-stone-800 break-all select-all bg-white/80 rounded-lg border border-stone-200 px-3 py-2.5 max-h-24 overflow-y-auto">
              {data && data !== '0x' ? data : '0x (none)'}
            </p>
          </div>
        </div>
      </div>
    </>
  );

  if (step === 'prechecking') {
    return (
      <ProgressModal
        title="Prechecking"
        text="Prechecking transaction…"
        subtext="This may take a few seconds"
      />
    );
  }

  if (step === 'sending') {
    return (
      <ProgressModal
        title="Sending transaction"
        text="Executing delegated transaction…"
        subtext="This may take a few seconds"
      />
    );
  }

  if (step === 'precheck') {
    return (
      <ModalFrame title="Precheck" onClose={handleClose}>
        <div className="max-w-2xl mx-auto px-6 py-6 space-y-6">
          <h2 className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Transaction details</h2>
          {txDetailsBlock}
          <button
            type="button"
            onClick={handlePrecheck}
            disabled={!to}
            className="w-full min-h-[44px] bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 active:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
          >
            Precheck transaction
          </button>
          {precheckError && (
            <div className="rounded-xl p-4 bg-red-50 border border-red-200">
              <p className="text-sm font-medium text-red-800">{precheckError}</p>
            </div>
          )}
        </div>
      </ModalFrame>
    );
  }

  if (step === 'send') {
    return (
      <ModalFrame title="Send Transaction" onClose={handleClose}>
        <div className="max-w-2xl mx-auto px-6 py-10 sm:py-12 space-y-8 min-h-[320px]">
          {precheckError && (
            <div className="rounded-xl p-5 sm:p-6 bg-red-50 border border-red-200">
              <p className="font-semibold text-red-800">Precheck failed</p>
              <p className="text-sm text-stone-700 mt-2">{precheckError}</p>
            </div>
          )}
          {precheckResult && (
            <div
              className={`rounded-xl p-5 sm:p-6 border ${
                precheckResult.allow
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <p
                className={`font-semibold ${
                  precheckResult.allow ? 'text-green-800' : 'text-red-800'
                }`}
              >
                {precheckResult.allow ? 'Precheck passed' : 'Precheck failed'}
              </p>
              <p className="text-sm text-stone-700 mt-2">
                {precheckResult.audit?.summary ?? precheckResult.reasonsText ?? ''}
              </p>
              {precheckResult.reasonsText && (
                <pre className="text-xs text-stone-600 mt-3 whitespace-pre-wrap font-sans leading-relaxed">
                  {precheckResult.reasonsText}
                </pre>
              )}
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setStep('precheck')}
              className="flex-1 min-h-[44px] bg-stone-100 text-stone-800 py-3 rounded-xl font-semibold hover:bg-stone-200 transition-colors touch-manipulation"
            >
              Back
            </button>
            {precheckResult?.allow && (
              <button
                type="button"
                onClick={handleSend}
                className="flex-1 min-h-[44px] bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 active:bg-orange-700 transition-colors touch-manipulation"
              >
                Next Sign
              </button>
            )}
          </div>
          {sendError && (
            <div className="rounded-xl p-5 sm:p-6 bg-red-50 border border-red-200">
              <p className="text-sm font-medium text-red-800">{sendError}</p>
            </div>
          )}
        </div>
      </ModalFrame>
    );
  }

  if (step === 'complete') {
    const isSuccess = completeSuccess === true;
    return (
      <ModalFrame
        title={isSuccess ? 'Transaction sent' : 'Transaction failed'}
        onClose={isSuccess ? handleDoneSuccess : handleCloseFailure}
      >
        <div className="max-w-2xl mx-auto px-6 py-6 space-y-6">
          {isSuccess ? (
            <>
              <div className="flex flex-col items-center justify-center text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <p className="font-semibold text-green-800 text-lg">Transaction sent successfully</p>
                <p className="text-xs text-stone-600 mt-2">Tx hash (copy to explore)</p>
                <p className="font-mono text-sm text-stone-800 break-all select-all bg-white rounded-lg border border-stone-200 px-3 py-2.5 mt-2 w-full">
                  {txHash}
                </p>
                {network?.blockExplorer && txHash && (
                  <a
                    href={`${network.blockExplorer.replace(/\/$/, '')}/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 text-orange-600 hover:underline text-sm font-medium"
                  >
                    View on explorer
                  </a>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col items-center justify-center text-center py-8">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <XCircle className="w-8 h-8 text-red-600" />
                </div>
                <p className="font-semibold text-red-800 text-lg">Transaction failed</p>
                <p className="text-sm text-stone-700 mt-2">{completeError ?? 'Unknown error'}</p>
              </div>
            </>
          )}
          <button
            type="button"
            onClick={isSuccess ? handleDoneSuccess : handleCloseFailure}
            className="w-full min-h-[44px] bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 active:bg-orange-700 transition-colors touch-manipulation"
          >
            {isSuccess ? 'Done' : 'Close'}
          </button>
        </div>
      </ModalFrame>
    );
  }

  return null;
}
