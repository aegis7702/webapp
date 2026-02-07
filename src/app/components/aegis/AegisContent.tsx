import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { ImplementationCard } from './ImplementationCard';
import { AegisSearchArea } from './SafeguardSearchBar';
import { UnifiedModal } from './UnifiedModal';
import { DiagnosisReportModal } from './DiagnosisReportModal';
import { demoImplementations } from '../../../data/mockData';
import { Implementation } from '../../../types';

type ViewMode = 'normal' | 'selecting-replacement';

export function AegisContent() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<Implementation[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // State management
  const [activeImpl, setActiveImpl] = useState<Implementation | null>(demoImplementations[0]);
  const [registeredImpls, setRegisteredImpls] = useState<Implementation[]>([demoImplementations[1], demoImplementations[2]]);

  // Modals and modes
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [showDiagnosisLoading, setShowDiagnosisLoading] = useState(false);
  const [showDiagnosisReport, setShowDiagnosisReport] = useState(false);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('normal');
  const [selectedForReplacement, setSelectedForReplacement] = useState<string | null>(null);
  const [diagnosingImpl, setDiagnosingImpl] = useState<Implementation | null>(null);
  const [activatingImpl, setActivatingImpl] = useState<Implementation | null>(null);

  // Mock diagnosis data
  const [mockDiagnosisData] = useState({
    label: 'SAFE' as const,
    confidence: 0.87,
    reasons: [
      'Implementation follows standard EIP-7702 delegation patterns',
      'No suspicious external calls detected in contract code',
      'Storage layout is compatible with standard EOA implementations',
      'Gas optimization patterns are safe and efficient'
    ],
    matched_patterns: [
      'StandardDelegationProxy pattern',
      'SafeStorageAccess pattern',
      'EIP7702Compliant interface',
      'NonReentrant modifier usage'
    ],
    analysis_source: 'llm-detail'
  });

  const handleToggle = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleSearch = (network: string, address: string) => {
    setHasSearched(true);
    if (address.trim()) {
      // Simulate search: 50% chance of finding a new unknown implementation
      const isNewDetection = Math.random() > 0.5;

      if (isNewDetection) {
        // Create a new unknown implementation
        const newImpl: Implementation = {
          id: address.trim(),
          state: 'registered',
          verdict: 'safe',
          title: 'New Implementation Detected',
          provider: 'Unknown',
          description: 'This is a previously unknown implementation.',
          riskLevel: 'unknown',
        };
        setSearchResults([newImpl]);
      } else {
        // Return known implementations
        setSearchResults([...demoImplementations]);
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleRunDiagnosis = (impl: Implementation) => {
    setDiagnosingImpl(impl);
    setShowDiagnosisLoading(true);

    // Simulate diagnosis loading
    setTimeout(() => {
      setShowDiagnosisLoading(false);
      setShowDiagnosisReport(true);
    }, 2000);
  };

  const handleDiagnosisRegister = () => {
    if (diagnosingImpl) {
      // Update the implementation with diagnosis results
      const updatedImpl = {
        ...diagnosingImpl,
        riskLevel: mockDiagnosisData.label === 'SAFE' ? 'safe' as const :
          mockDiagnosisData.label === 'LOW_RISK' ? 'low' as const :
            mockDiagnosisData.label === 'UNSAFE' ? 'high' as const : 'unknown' as const,
        verdict: mockDiagnosisData.label === 'SAFE' || mockDiagnosisData.label === 'LOW_RISK' ? 'safe' as const : 'unsafe' as const,
        title: diagnosingImpl.title === 'New Implementation Detected' ?
          `Implementation ${diagnosingImpl.id.substring(0, 8)}` :
          diagnosingImpl.title,
        description: diagnosingImpl.description === 'This is a previously unknown implementation.' ?
          'Verified EIP-7702 implementation with standard delegation patterns.' :
          diagnosingImpl.description
      };

      // Move to registered
      setRegisteredImpls([...registeredImpls, updatedImpl]);
      // Remove from search results
      setSearchResults(searchResults.filter(i => i.id !== diagnosingImpl.id));
    }
    setShowDiagnosisReport(false);
    setDiagnosingImpl(null);
  };

  const handleDeactivate = () => {
    setShowDeactivateModal(true);
  };

  const confirmDeactivate = () => {
    if (activeImpl) {
      setRegisteredImpls([...registeredImpls, activeImpl]);
      setActiveImpl(null);
    }
    setShowDeactivateModal(false);
  };

  const handleChange = () => {
    setViewMode('selecting-replacement');
  };

  const handleSelectForReplacement = (id: string) => {
    setSelectedForReplacement(id);
  };

  const handleCancelSelection = () => {
    setViewMode('normal');
    setSelectedForReplacement(null);
  };

  const handleConfirmSelection = () => {
    setShowChangeModal(true);
  };

  const confirmChange = () => {
    setShowChangeModal(false);

    // Directly swap active and selected implementation
    if (selectedForReplacement) {
      const selectedImpl = registeredImpls.find(i => i.id === selectedForReplacement);
      if (selectedImpl && activeImpl) {
        // Swap active and selected
        setRegisteredImpls([...registeredImpls.filter(i => i.id !== selectedForReplacement), activeImpl]);
        setActiveImpl(selectedImpl);
      }
    }

    setViewMode('normal');
    setSelectedForReplacement(null);
  };

  const handleActivate = (impl: Implementation) => {
    setActivatingImpl(impl);
    setShowActivateModal(true);
  };

  const confirmActivate = () => {
    setShowActivateModal(false);

    if (activatingImpl) {
      if (activeImpl) {
        // Swap active and activating
        setRegisteredImpls([...registeredImpls.filter(i => i.id !== activatingImpl.id), activeImpl]);
        setActiveImpl(activatingImpl);
      } else {
        // Just activate
        setActiveImpl(activatingImpl);
        setRegisteredImpls(registeredImpls.filter(i => i.id !== activatingImpl.id));
      }
      setActivatingImpl(null);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-stone-50 relative">
      <div className="max-w-4xl mx-auto w-full pb-20">
        {/* Search Implementation Section */}
        <div className="px-4 sm:px-6 py-6">
          <h2 className="text-sm font-semibold text-stone-900 mb-3">Search Implementation</h2>

          <div className="bg-white border border-stone-200 rounded-2xl p-4">
            {/* Search Area */}
            <AegisSearchArea onSearch={handleSearch} />

            {/* Search Results - Inside Search Implementation Section */}
            {hasSearched && (
              <div className="mt-4 pt-4 border-t border-stone-200">
                <h3 className="text-xs font-semibold text-stone-700 mb-3">Results</h3>
                {searchResults.length > 0 ? (
                  <div className="space-y-4">
                    {searchResults.map((impl) => {
                      // Check if this implementation is new (unknown risk level)
                      const isNewDetection = impl.riskLevel === 'unknown';

                      // Check if implementation is already registered or active
                      const isAlreadyRegistered = registeredImpls.some(r => r.id === impl.id);
                      const isAlreadyActive = activeImpl?.id === impl.id;
                      const shouldHideDiagnosis = isAlreadyRegistered || isAlreadyActive;

                      return (
                        <ImplementationCard
                          key={impl.id}
                          implementation={impl}
                          isExpanded={expandedId === impl.id}
                          onToggle={() => handleToggle(impl.id)}
                          cardType="search-result"
                          isNewDetection={isNewDetection}
                          onRunDiagnosis={shouldHideDiagnosis ? undefined : () => handleRunDiagnosis(impl)}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-stone-50 rounded-xl p-6 border border-stone-200 text-center">
                    <p className="text-sm text-stone-500">No implementation found.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Active Implementation Section */}
        <div className="px-4 sm:px-6 py-6">
          <h2 className="text-sm font-semibold text-stone-900 mb-3">Active Implementation</h2>
          {activeImpl ? (
            <ImplementationCard
              implementation={activeImpl}
              isExpanded={expandedId === activeImpl.id}
              onToggle={() => handleToggle(activeImpl.id)}
              cardType="active"
              onDeactivate={handleDeactivate}
              onChange={handleChange}
            />
          ) : (
            <div className="bg-white rounded-2xl p-6 border border-stone-200 text-center">
              <p className="text-sm text-stone-500">No active implementation</p>
            </div>
          )}
        </div>

        {/* Registered Implementations Section */}
        <div className="px-4 sm:px-6 py-6">
          <h2 className="text-sm font-semibold text-stone-900 mb-3">Registered Implementations</h2>
          {registeredImpls.length > 0 ? (
            <div className="space-y-4">
              {registeredImpls.map((impl) => (
                <ImplementationCard
                  key={impl.id}
                  implementation={impl}
                  isExpanded={expandedId === impl.id}
                  onToggle={() => handleToggle(impl.id)}
                  cardType="registered"
                  onActivate={() => handleActivate(impl)}
                  isSelectable={viewMode === 'selecting-replacement'}
                  isSelected={selectedForReplacement === impl.id}
                  onSelect={() => handleSelectForReplacement(impl.id)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-6 border border-stone-200 text-center">
              <p className="text-sm text-stone-500">No registered implementations</p>
            </div>
          )}
        </div>
      </div>

      {/* Selection Mode Action Buttons */}
      {viewMode === 'selecting-replacement' && (
        <div className="fixed bottom-24 sm:bottom-28 left-0 right-0 bg-white border-t border-stone-200 p-4 flex gap-3 max-w-4xl mx-auto z-40 shadow-lg">
          <button
            onClick={handleCancelSelection}
            className="flex-1 bg-stone-100 text-stone-800 py-3 rounded-xl font-semibold hover:bg-stone-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmSelection}
            disabled={!selectedForReplacement}
            className={`flex-1 py-3 rounded-xl font-semibold transition-colors ${selectedForReplacement
                ? 'bg-orange-500 text-white hover:bg-orange-600'
                : 'bg-stone-200 text-stone-400 cursor-not-allowed'
              }`}
          >
            Select
          </button>
        </div>
      )}

      {/* Deactivate Confirmation Modal */}
      <UnifiedModal
        isOpen={showDeactivateModal}
        onClose={() => setShowDeactivateModal(false)}
        title="Deactivate Implementation"
        footer={
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setShowDeactivateModal(false)}
              className="flex-1 bg-stone-100 text-stone-800 py-3 rounded-xl font-semibold hover:bg-stone-200 transition-colors"
            >
              No
            </button>
            <button
              onClick={confirmDeactivate}
              className="flex-1 bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 transition-colors"
            >
              Yes
            </button>
          </div>
        }
      >
        <p className="text-sm text-stone-700">
          Do you want to deactivate the current implementation?
        </p>
      </UnifiedModal>

      {/* Change Confirmation Modal */}
      <UnifiedModal
        isOpen={showChangeModal}
        onClose={() => setShowChangeModal(false)}
        title="Change Implementation"
        footer={
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setShowChangeModal(false)}
              className="flex-1 bg-stone-100 text-stone-800 py-3 rounded-xl font-semibold hover:bg-stone-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmChange}
              className="flex-1 bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 transition-colors"
            >
              Confirm
            </button>
          </div>
        }
      >
        <p className="text-sm text-stone-700">
          Do you want to change the active implementation to the selected one?
        </p>
      </UnifiedModal>

      {/* Activate Confirmation Modal */}
      <UnifiedModal
        isOpen={showActivateModal}
        onClose={() => {
          setShowActivateModal(false);
          setActivatingImpl(null);
        }}
        title="Activate Implementation"
        footer={
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                setShowActivateModal(false);
                setActivatingImpl(null);
              }}
              className="flex-1 bg-stone-100 text-stone-800 py-3 rounded-xl font-semibold hover:bg-stone-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmActivate}
              className="flex-1 bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 transition-colors"
            >
              Confirm
            </button>
          </div>
        }
      >
        <p className="text-sm text-stone-700">
          Do you want to activate this implementation?
        </p>
      </UnifiedModal>

      {/* AI Audit Loading Modal */}
      <UnifiedModal
        isOpen={showDiagnosisLoading}
        title="Running AI Audit"
        showCloseButton={false}
      >
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
                Analyzing implementation behavior and risks…
              </p>
              <p className="text-xs text-stone-600">
                This may take a few seconds
              </p>
            </div>
          </div>
        </div>
      </UnifiedModal>

      {/* AI Audit Report Modal */}
      <DiagnosisReportModal
        isOpen={showDiagnosisReport}
        onClose={() => {
          setShowDiagnosisReport(false);
          setDiagnosingImpl(null);
        }}
        onRegister={handleDiagnosisRegister}
        diagnosis={mockDiagnosisData}
        advancedMode={false}
      />
    </div>
  );
}