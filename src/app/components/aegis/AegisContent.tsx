import { useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import { ImplementationCard } from './ImplementationCard';
import { AegisSearchArea } from './SafeguardSearchBar';
import { ImplementationDetailPage } from './ImplementationDetailPage';
import { mockActiveImplementation, mockRegisteredImplementations, demoImplementations } from '../../../data/mockData';
import { Implementation } from '../../../types';

type ViewMode = 'normal' | 'selecting-replacement';

export function AegisContent() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<Implementation[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  
  // State management
  const [activeImpl, setActiveImpl] = useState<Implementation | null>(demoImplementations[0]);
  const [registeredImpls, setRegisteredImpls] = useState<Implementation[]>([demoImplementations[1], demoImplementations[2]]);
  
  // Modals and modes
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [showDiagnosisModal, setShowDiagnosisModal] = useState(false);
  const [showDiagnosisResult, setShowDiagnosisResult] = useState(false);
  const [showCompatibilityCheck, setShowCompatibilityCheck] = useState(false);
  const [showCompatibilityResult, setShowCompatibilityResult] = useState(false);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [isCompatible, setIsCompatible] = useState(true);
  const [compatibilityStatus, setCompatibilityStatus] = useState<'safe' | 'unsafe' | 'unknown'>('safe');
  const [acknowledgeRisk, setAcknowledgeRisk] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('normal');
  const [selectedForReplacement, setSelectedForReplacement] = useState<string | null>(null);
  const [detailImpl, setDetailImpl] = useState<Implementation | null>(null);
  const [diagnosingImpl, setDiagnosingImpl] = useState<Implementation | null>(null);
  const [activatingImpl, setActivatingImpl] = useState<Implementation | null>(null);
  const [compatibilityChecks, setCompatibilityChecks] = useState<{
    label: string;
    status: 'loading' | 'pass' | 'warning' | 'fail';
  }[]>([]);

  const handleToggle = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleSearch = (network: string, address: string) => {
    setHasSearched(true);
    if (address.trim()) {
      setSearchResults([...demoImplementations]);
    } else {
      setSearchResults([]);
    }
  };

  const handleRunDiagnosis = (impl: Implementation) => {
    setDiagnosingImpl(impl);
    setShowDiagnosisModal(true);
    
    // Simulate diagnosis
    setTimeout(() => {
      setShowDiagnosisModal(false);
      setShowDiagnosisResult(true);
    }, 2000);
  };

  const handleDiagnosisComplete = () => {
    if (diagnosingImpl) {
      // Move to registered
      setRegisteredImpls([...registeredImpls, diagnosingImpl]);
      // Remove from search results
      setSearchResults(searchResults.filter(i => i.id !== diagnosingImpl.id));
    }
    setShowDiagnosisResult(false);
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
    setAcknowledgeRisk(false);
    startCompatibilityCheck();
  };

  const startCompatibilityCheck = () => {
    // Start compatibility check
    setShowCompatibilityCheck(true);
    
    const checks = [
      { label: 'Storage structure compatibility', status: 'loading' as const },
      { label: 'Upgrade safety', status: 'loading' as const },
      { label: 'State collision risk', status: 'loading' as const },
      { label: 'Execution assumptions', status: 'loading' as const }
    ];
    
    setCompatibilityChecks(checks);
    
    // Simulate checks one by one
    checks.forEach((_, index) => {
      setTimeout(() => {
        setCompatibilityChecks(prev => {
          const updated = [...prev];
          const results: ('pass' | 'warning' | 'fail')[] = ['pass', 'pass', 'warning', 'pass'];
          updated[index] = { ...updated[index], status: results[index] };
          return updated;
        });
        
        // After last check, show result
        if (index === checks.length - 1) {
          setTimeout(() => {
            setShowCompatibilityCheck(false);
            // Determine overall status
            const hasWarning = true; // For demo
            const hasFail = Math.random() > 0.7; // 30% fail for demo
            
            if (hasFail) {
              setCompatibilityStatus('unsafe');
            } else if (hasWarning) {
              setCompatibilityStatus('safe'); // Can still proceed
            } else {
              setCompatibilityStatus('safe');
            }
            
            setShowCompatibilityResult(true);
          }, 500);
        }
      }, (index + 1) * 1000);
    });
  };

  const handleCompatibilityResult = () => {
    if ((compatibilityStatus === 'safe' || (compatibilityStatus === 'unsafe' && acknowledgeRisk)) && selectedForReplacement) {
      const selectedImpl = registeredImpls.find(i => i.id === selectedForReplacement) || activatingImpl;
      if (selectedImpl && activeImpl) {
        // Swap active and selected
        setRegisteredImpls([...registeredImpls.filter(i => i.id !== selectedForReplacement), activeImpl]);
        setActiveImpl(selectedImpl);
      } else if (selectedImpl && !activeImpl) {
        // Just activate
        setActiveImpl(selectedImpl);
        setRegisteredImpls(registeredImpls.filter(i => i.id !== selectedImpl.id));
      }
    }
    setShowCompatibilityResult(false);
    setViewMode('normal');
    setSelectedForReplacement(null);
    setAcknowledgeRisk(false);
    setActivatingImpl(null);
  };

  const handleActivate = (impl: Implementation) => {
    setActivatingImpl(impl);
    setShowActivateModal(true);
  };

  const confirmActivate = () => {
    setShowActivateModal(false);
    
    if (activeImpl) {
      // If there's already an active implementation, go through compatibility check
      setSelectedForReplacement(activatingImpl!.id);
      startCompatibilityCheck();
    } else {
      // If no active implementation, activate directly
      if (activatingImpl) {
        setActiveImpl(activatingImpl);
        setRegisteredImpls(registeredImpls.filter(i => i.id !== activatingImpl.id));
      }
      setActivatingImpl(null);
    }
  };

  const handleViewDetail = (impl: Implementation) => {
    setDetailImpl(impl);
  };

  if (detailImpl) {
    return <ImplementationDetailPage implementation={detailImpl} onBack={() => setDetailImpl(null)} />;
  }

  return (
    <div className="flex-1 overflow-y-auto bg-stone-50 relative">
      <div className="max-w-4xl mx-auto w-full pb-20">
        {/* Search Implementation Section */}
        <div className="px-6 py-6">
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
                    {searchResults.map((impl) => (
                      <ImplementationCard 
                        key={impl.id}
                        implementation={impl}
                        isExpanded={expandedId === impl.id}
                        onToggle={() => handleToggle(impl.id)}
                        cardType="search-result"
                        onRunDiagnosis={() => handleRunDiagnosis(impl)}
                        onViewDetail={() => handleViewDetail(impl)}
                      />
                    ))}
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
        <div className="px-6 py-6">
          <h2 className="text-sm font-semibold text-stone-900 mb-3">Active Implementation</h2>
          {activeImpl ? (
            <ImplementationCard 
              implementation={activeImpl}
              isExpanded={expandedId === activeImpl.id}
              onToggle={() => handleToggle(activeImpl.id)}
              cardType="active"
              onDeactivate={handleDeactivate}
              onChange={handleChange}
              onViewDetail={() => handleViewDetail(activeImpl)}
            />
          ) : (
            <div className="bg-white rounded-2xl p-6 border border-stone-200 text-center">
              <p className="text-sm text-stone-500">No active implementation</p>
            </div>
          )}
        </div>

        {/* Registered Implementations Section */}
        <div className="px-6 py-6">
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
                  onViewDetail={() => handleViewDetail(impl)}
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
        <div className="fixed bottom-28 left-0 right-0 bg-white border-t border-stone-200 p-4 flex gap-3 max-w-4xl mx-auto z-40 shadow-lg">
          <button
            onClick={handleCancelSelection}
            className="flex-1 bg-stone-100 text-stone-800 py-3 rounded-xl font-semibold hover:bg-stone-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmSelection}
            disabled={!selectedForReplacement}
            className={`flex-1 py-3 rounded-xl font-semibold transition-colors ${
              selectedForReplacement 
                ? 'bg-orange-500 text-white hover:bg-orange-600' 
                : 'bg-stone-200 text-stone-400 cursor-not-allowed'
            }`}
          >
            Select
          </button>
        </div>
      )}

      {/* AI Assistant Floating Button - Always visible */}
      {!showAiAssistant && (
        <button
          onClick={() => setShowAiAssistant(true)}
          className="fixed bottom-24 right-8 w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-all z-50"
        >
          <MessageCircle className="w-6 h-6 text-white" />
        </button>
      )}

      {/* AI Chat Interface - Expanded */}
      {showAiAssistant && (
        <div className="fixed bottom-24 right-8 left-8 md:left-auto md:w-96 bg-white border border-stone-200 rounded-2xl p-4 shadow-lg z-50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-sm">
                <MessageCircle className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-semibold text-sm text-stone-900">Aegis Assistant</h3>
            </div>
            <button onClick={() => setShowAiAssistant(false)} className="text-stone-400 hover:text-stone-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="bg-stone-50 rounded-xl px-4 py-3 mb-3">
            <p className="text-xs text-stone-600">
              Ask Aegis about implementations, security risks, or EIP-7702 compliance…
            </p>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Type your question..."
              className="flex-1 bg-stone-100 rounded-lg px-4 py-2 text-sm text-stone-800 placeholder-stone-400 outline-none border border-stone-200"
            />
            <button className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors shadow-sm">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Deactivate Confirmation Modal */}
      {showDeactivateModal && (
        <div className="fixed inset-0 bg-stone-900/50 flex items-center justify-center z-50 px-8">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-semibold text-lg text-stone-900 mb-4">Deactivate Implementation</h3>
            <p className="text-sm text-stone-700 mb-6">
              Do you want to deactivate the current implementation?
            </p>
            <div className="flex gap-3">
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
          </div>
        </div>
      )}

      {/* Change Confirmation Modal */}
      {showChangeModal && (
        <div className="fixed inset-0 bg-stone-900/50 flex items-center justify-center z-50 px-8">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-semibold text-lg text-stone-900 mb-4">Change Implementation</h3>
            <p className="text-sm text-stone-700 mb-6">
              Do you want to change the active implementation to the selected one?
            </p>
            <div className="flex gap-3">
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
          </div>
        </div>
      )}

      {/* Diagnosis Processing Modal */}
      {showDiagnosisModal && (
        <div className="fixed inset-0 bg-stone-900/50 flex items-center justify-center z-50 px-8">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full mx-auto mb-4 flex items-center justify-center">
              <MessageCircle className="w-8 h-8 text-white animate-pulse" />
            </div>
            <h3 className="font-semibold text-lg text-stone-900 mb-2">Running Diagnosis</h3>
            <p className="text-sm text-stone-600">
              Agent is analyzing {diagnosingImpl?.title}...
            </p>
          </div>
        </div>
      )}

      {/* Diagnosis Result Modal */}
      {showDiagnosisResult && diagnosingImpl && (
        <div className="fixed inset-0 bg-stone-900/50 flex items-center justify-center z-50 px-8 overflow-y-auto py-8">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl">
            <h3 className="font-semibold text-xl text-stone-900 mb-4">Diagnosis Report</h3>
            
            {/* Placeholder for diagnosis template */}
            <div className="space-y-4 mb-6">
              <div className="bg-stone-50 rounded-xl p-4 border border-stone-200">
                <h4 className="font-semibold text-sm text-stone-900 mb-2">What this implementation does</h4>
                <p className="text-sm text-stone-700">
                  {diagnosingImpl.description}
                </p>
                <p className="text-xs text-stone-500 mt-2 italic">
                  [Diagnosis report template to be finalized]
                </p>
              </div>

              <div className="bg-stone-50 rounded-xl p-4 border border-stone-200">
                <h4 className="font-semibold text-sm text-stone-900 mb-2">Safety Assessment</h4>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    diagnosingImpl.riskLevel === 'safe' ? 'bg-green-100 text-green-800' :
                    diagnosingImpl.riskLevel === 'low' ? 'bg-amber-100 text-amber-800' :
                    diagnosingImpl.riskLevel === 'high' ? 'bg-red-100 text-red-800' :
                    'bg-stone-200 text-stone-700'
                  }`}>
                    {diagnosingImpl.riskLevel === 'safe' ? 'Safe' :
                     diagnosingImpl.riskLevel === 'low' ? 'Low Risk' :
                     diagnosingImpl.riskLevel === 'high' ? 'Unsafe' : 'Unknown'}
                  </div>
                </div>
                <p className="text-sm text-stone-700">
                  This implementation has been verified according to EIP-7702 standards.
                </p>
              </div>

              <div className="bg-stone-50 rounded-xl p-4 border border-stone-200">
                <h4 className="font-semibold text-sm text-stone-900 mb-2">Storage Structure</h4>
                <p className="text-sm text-stone-700">
                  Compatible storage layout detected. No conflicts found.
                </p>
                <p className="text-xs text-stone-500 mt-2 italic">
                  [Detailed storage analysis placeholder]
                </p>
              </div>

              <div className="bg-stone-50 rounded-xl p-4 border border-stone-200">
                <h4 className="font-semibold text-sm text-stone-900 mb-2">Detected Risks & Constraints</h4>
                <ul className="text-sm text-stone-700 space-y-1">
                  <li>• No critical risks detected</li>
                  <li>• Gas optimization recommended</li>
                </ul>
                <p className="text-xs text-stone-500 mt-2 italic">
                  [Risk analysis template placeholder]
                </p>
              </div>
            </div>

            <button
              onClick={handleDiagnosisComplete}
              className="w-full bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 transition-colors"
            >
              Add to Registered
            </button>
          </div>
        </div>
      )}

      {/* Activate Confirmation Modal */}
      {showActivateModal && (
        <div className="fixed inset-0 bg-stone-900/50 flex items-center justify-center z-50 px-8">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-semibold text-lg text-stone-900 mb-4">Activate Implementation</h3>
            <p className="text-sm text-stone-700 mb-6">
              Do you want to activate this implementation?
            </p>
            <div className="flex gap-3">
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
          </div>
        </div>
      )}

      {/* Compatibility Check Panel */}
      {showCompatibilityCheck && (
        <div className="fixed inset-0 bg-stone-900/50 flex items-center justify-center z-50 px-8">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg">
            <h3 className="font-semibold text-xl text-stone-900 mb-6">Checking Compatibility</h3>
            
            <div className="space-y-3 mb-6">
              {compatibilityChecks.map((check, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                  <span className="text-sm text-stone-800">{check.label}</span>
                  {check.status === 'loading' && (
                    <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                  )}
                  {check.status === 'pass' && (
                    <span className="text-green-600 text-lg">✓</span>
                  )}
                  {check.status === 'warning' && (
                    <span className="text-amber-600 text-lg">⚠️</span>
                  )}
                  {check.status === 'fail' && (
                    <span className="text-red-600 text-lg">✕</span>
                  )}
                </div>
              ))}
            </div>

            <p className="text-xs text-stone-500 text-center">
              Please wait while Agent analyzes compatibility...
            </p>
          </div>
        </div>
      )}

      {/* Compatibility Result Modal */}
      {showCompatibilityResult && (
        <div className="fixed inset-0 bg-stone-900/50 flex items-center justify-center z-50 px-8 overflow-y-auto py-8">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg">
            {/* Overall Status */}
            <div className="mb-6">
              <h3 className="font-semibold text-xl text-stone-900 mb-4">Compatibility Analysis</h3>
              <div className={`p-4 rounded-xl border-2 ${
                compatibilityStatus === 'safe' ? 'bg-green-50 border-green-200' :
                compatibilityStatus === 'unsafe' ? 'bg-red-50 border-red-200' :
                'bg-stone-50 border-stone-200'
              }`}>
                <p className={`font-semibold text-lg ${
                  compatibilityStatus === 'safe' ? 'text-green-800' :
                  compatibilityStatus === 'unsafe' ? 'text-red-800' :
                  'text-stone-800'
                }`}>
                  {compatibilityStatus === 'safe' ? 'Safe to Change' :
                   compatibilityStatus === 'unsafe' ? 'Unsafe to Change' :
                   'Unknown Status'}
                </p>
              </div>
            </div>

            {/* Detailed Results */}
            <div className="mb-6">
              <h4 className="font-semibold text-sm text-stone-900 mb-3">Analysis Details</h4>
              <div className="space-y-2">
                {compatibilityChecks.map((check, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    {check.status === 'pass' && <span className="text-green-600">✓</span>}
                    {check.status === 'warning' && <span className="text-amber-600">⚠️</span>}
                    {check.status === 'fail' && <span className="text-red-600">✕</span>}
                    <span className="text-stone-700">{check.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Unsafe Warning */}
            {compatibilityStatus === 'unsafe' && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-800 font-semibold mb-3">
                  This implementation may be unsafe. Do you still want to proceed?
                </p>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acknowledgeRisk}
                    onChange={(e) => setAcknowledgeRisk(e.target.checked)}
                    className="mt-1 w-4 h-4 accent-red-600"
                  />
                  <span className="text-xs text-red-800">
                    I have read and understand the risks, and I acknowledge the potential consequences.
                  </span>
                </label>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCompatibilityResult(false);
                  setViewMode('normal');
                  setSelectedForReplacement(null);
                  setAcknowledgeRisk(false);
                  setActivatingImpl(null);
                }}
                className="flex-1 bg-stone-100 text-stone-800 py-3 rounded-xl font-semibold hover:bg-stone-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCompatibilityResult}
                disabled={compatibilityStatus === 'unsafe' && !acknowledgeRisk}
                className={`flex-1 py-3 rounded-xl font-semibold transition-colors ${
                  (compatibilityStatus === 'safe' || (compatibilityStatus === 'unsafe' && acknowledgeRisk))
                    ? 'bg-orange-500 text-white hover:bg-orange-600'
                    : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                }`}
              >
                Change
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}