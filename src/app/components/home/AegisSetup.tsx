import React, { useState } from 'react';
import { Shield, Loader2, CheckCircle2, Copy, Check, XCircle, MessageCircle } from 'lucide-react';
import { UnifiedModal } from '../aegis/UnifiedModal';
import { getWalletSession, decryptPrivateKey } from '../../../utils/walletSession';
import { getLoginPasswordInMemory } from '../../../utils/authMemory';
import { getSelectedNetwork } from '../../../utils/tokenSession';
import { sendEIP7702ApplyTransaction, sendEIP7702ApplyTransactionAndSetSentinel } from '../../../utils/eip7702';
import config from '../../../config/address.json';
import { useAppData } from '../../contexts/AppDataContext';

type ModalStep = 'confirmation' | 'executing' | 'success' | 'failure' | null;

// Official Aegis Implementation Contract
const AEGIS_CONTRACT_ADDRESS = config.AegisGuardDelegator;

export function AegisSetup() {
  const { home } = useAppData();
  const { aegisSetupStatus: status, refetchAegisSetupStatus } = home;

  const [modalStep, setModalStep] = useState<ModalStep>(null);
  const [copied, setCopied] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(AEGIS_CONTRACT_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyClick = () => {
    setModalStep('confirmation');
    setTxError(null);
  };

  const handleConfirmApply = async () => {
    setTxError(null);
    const session = getWalletSession();
    const network = getSelectedNetwork();
    if (!session?.encryptedPk) {
      setTxError('Wallet session not found. Please log in again.');
      return;
    }
    if (!network?.rpcUrl) {
      setTxError('No network selected. Choose a network in Settings.');
      return;
    }
    const password = getLoginPasswordInMemory();
    if (!password) {
      setTxError('Session expired. Please log out and log in again to sign transactions.');
      return;
    }

    setModalStep('executing');
    let privateKey: string;
    try {
      privateKey = await decryptPrivateKey(session.encryptedPk, password);
    } catch {
      setModalStep('confirmation');
      setTxError('Decryption failed. Please log out and log in again.');
      return;
    }

    // const result = await sendEIP7702ApplyTransaction({
    //   privateKey,
    //   rpcUrl: network.rpcUrl,
    //   chainId: network.chainId,
    //   contractAddress: AEGIS_CONTRACT_ADDRESS,
    // });
    const result = await sendEIP7702ApplyTransactionAndSetSentinel({
      privateKey,
      rpcUrl: network.rpcUrl,
      chainId: network.chainId,
      contractAddress: AEGIS_CONTRACT_ADDRESS,
    },
    config.SentinelAddress as `0x${string}`
  );

    if (result.success) {
      setTxHash(result.txHash);
      setModalStep('success');
    } else {
      setTxError(result.error);
      setModalStep('failure');
    }
  };

  const handleCancel = () => {
    setModalStep(null);
    setTxError(null);
  };

  const handleSuccess = () => {
    refetchAegisSetupStatus();
    setModalStep(null);
    setTxHash(null);
  };

  const handleDismissFailure = () => {
    setModalStep('confirmation');
    setTxError(null);
  };

  // Shared Contract Address Display Component
  const ContractAddressDisplay = ({ showLabel = true }: { showLabel?: boolean }) => (
    <div className="bg-stone-50 border border-stone-200 rounded-lg p-3">
      {showLabel && (
        <p className="text-xs font-medium text-stone-600 mb-1">
          Contract Address:
        </p>
      )}
      <div className="flex items-center justify-between gap-2">
        <code className="text-sm font-mono text-stone-900 break-all">
          {AEGIS_CONTRACT_ADDRESS}
        </code>
        <button
          onClick={handleCopyAddress}
          className="flex-shrink-0 p-1.5 hover:bg-stone-200 rounded transition-colors"
          title="Copy address"
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-600" />
          ) : (
            <Copy className="w-4 h-4 text-stone-600" />
          )}
        </button>
      </div>
    </div>
  );

  // Show content immediately (no loading block). Status updates when check completes.
  // State 1: Not Applied — show Aegis Security Implementation (Apply) screen
  if (status === 'not-applied') {
    return (
      <>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200 mb-6">
          <div className="flex items-start gap-4">
            {/* <div className="flex-shrink-0 w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-orange-500" />
            </div> */}

            <div className="flex-1">
              <h3 className="font-semibold text-base text-stone-900 mb-3">
                Aegis Security Implementation
              </h3>

              {/* Contract Address */}
              <ContractAddressDisplay />

              {/* Description */}
              <p className="text-sm text-stone-600 mt-3 mb-3 leading-relaxed">
                Official Aegis implementation used to secure delegated executions and enable security analysis.
              </p>

              {/* Status */}
              <div className="flex items-center gap-2 mb-4">
                <p className="text-sm text-stone-700">
                  <span className="font-medium">Status:</span> Not Applied
                </p>
              </div>

              {/* Warning Notice */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-amber-900 leading-relaxed">
                  <span className="font-semibold">Required:</span> This implementation must be applied before other implementations can be analyzed or monitored.
                </p>
              </div>

              {/* Apply Button */}
              <button
                onClick={handleApplyClick}
                className="w-full bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
              >
                <Shield className="w-4 h-4" />
                Apply Implementation
              </button>
            </div>
          </div>
        </div>

        {/* Confirmation Modal */}
        <UnifiedModal
          isOpen={modalStep === 'confirmation'}
          onClose={handleCancel}
          fullScreen
          title="Apply Aegis Implementation"
          footer={
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="flex-1 bg-stone-100 text-stone-800 py-3 rounded-xl font-semibold hover:bg-stone-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleConfirmApply()}
                className="flex-1 bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 transition-colors"
              >
                Yes, Apply
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            {/* Delegation Explanation */}
            <div>
              <p className="text-sm font-medium text-stone-900 mb-2">
                What is delegation?
              </p>
              <p className="text-sm text-stone-700 leading-relaxed">
                This action will execute an <span className="font-semibold">on-chain delegated transaction (EIP-7702)</span> that grants the following contract authority to manage security analysis for your address.
              </p>
            </div>

            {/* Contract Address in Modal */}
            <ContractAddressDisplay />

            {/* Security Notice */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="text-xs text-orange-900 leading-relaxed">
                <span className="font-semibold">Important:</span> This is the official Aegis implementation contract. Verify the address before proceeding.
              </p>
            </div>

            {/* What happens next */}
            <div>
              <p className="text-sm font-medium text-stone-900 mb-2">
                What happens after applying?
              </p>
              <p className="text-sm text-stone-700 leading-relaxed">
                Your address will be secured by the Aegis implementation, enabling security analysis and monitoring for all delegated executions.
              </p>
            </div>
            {txError && modalStep === 'confirmation' && (
              <p className="text-sm text-red-600">{txError}</p>
            )}
          </div>
        </UnifiedModal>

        {/* Executing Modal */}
        <UnifiedModal
          isOpen={modalStep === 'executing'}
          fullScreen
          title="Applying Aegis Implementation"
          showCloseButton={false}
        >
          {/* <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-4" />
            <p className="text-sm text-stone-700 mb-2">
              Executing delegated transaction…
            </p>
            <p className="text-xs text-stone-500">
              Please wait while the transaction is processed
            </p>
          </div> */}
          <div className="py-12">
            <div className="flex flex-col items-center justify-center text-center space-y-6">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-10 h-10 text-white animate-pulse" />
                </div>
                <div className="absolute inset-0 w-20 h-20 bg-orange-400 rounded-full animate-ping opacity-20"></div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-stone-900">
                  Executing delegated transaction…
                </p>
                <p className="text-xs text-stone-600">
                  This may take a few seconds
                </p>
              </div>
            </div>
          </div>
        </UnifiedModal>

        {/* Success Modal */}
        <UnifiedModal
          isOpen={modalStep === 'success'}
          onClose={handleSuccess}
          fullScreen
          title="Aegis Implementation Applied"
          footer={
            <button
              onClick={handleSuccess}
              className="w-full bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 transition-colors"
            >
              Confirm
            </button>
          }
        >
          <div className="space-y-4">
            <div className="flex items-center justify-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <p className="text-sm text-stone-700 leading-relaxed">
              The Aegis implementation has been successfully applied to your address.
            </p>

            <ContractAddressDisplay showLabel={false} />

            <p className="text-sm text-stone-700 leading-relaxed">
              Your address is now secured by the Aegis implementation. Delegated executions will be monitored and analyzed.
            </p>
            {txHash && (
              <p className="text-xs text-stone-500 font-mono break-all">
                Tx: {txHash}
              </p>
            )}
          </div>
        </UnifiedModal>

        {/* Failure Modal */}
        <UnifiedModal
          isOpen={modalStep === 'failure'}
          onClose={handleDismissFailure}
          fullScreen
          title="Transaction failed"
          footer={
            <button
              onClick={handleDismissFailure}
              className="w-full bg-stone-800 text-white py-3 rounded-xl font-semibold hover:bg-stone-700 transition-colors"
            >
              Try again
            </button>
          }
        >
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center py-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-3">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <p className="text-sm text-stone-700 text-center">
                The EIP-7702 transaction could not be completed.
              </p>
            </div>
            {txError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-xs text-red-900 break-words">{txError}</p>
              </div>
            )}
          </div>
        </UnifiedModal>
      </>
    );
  }

  // State 2: Applied / Active
  return (
    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 shadow-sm border border-orange-200 mb-6">
      <div className="flex items-start gap-4">
        {/* <div className="flex-shrink-0 w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
          <Shield className="w-6 h-6 text-orange-600" />
        </div> */}

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="font-semibold text-base text-stone-900">
              Aegis Security Implementation
            </h3>
            <div className="flex items-center gap-1 bg-orange-600 text-white px-2 py-0.5 rounded-full text-xs font-semibold">
              <CheckCircle2 className="w-3 h-3" />
              Active
            </div>
          </div>

          {/* Contract Address */}
          <ContractAddressDisplay />

          {/* Active Status Message */}
          <p className="text-sm text-stone-700 mt-3 mb-1 font-medium">
            Your address is now secured by the Aegis implementation.
          </p>
          <p className="text-xs text-stone-600">
            Delegated executions are monitored and analyzed.
          </p>

          {/* Status Line */}
          {/* <div className="flex items-center gap-2 mt-3 pt-3 border-t border-orange-200">
            <p className="text-sm text-stone-700">
              <span className="font-medium">Status:</span> <span className="text-orange-700 font-semibold">Active</span>
            </p>
          </div> */}
        </div>
      </div>
    </div>
  );
}
