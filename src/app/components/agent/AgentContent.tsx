import { MessageCircle } from 'lucide-react';

export function AgentContent() {
  return (
    <div className="flex-1 overflow-y-auto bg-stone-50">
      <div className="px-6 md:px-12 py-8 md:py-12 max-w-4xl mx-auto w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full mx-auto mb-4 flex items-center justify-center shadow-md">
            <MessageCircle className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-xl font-bold mb-2 text-stone-900">AI Security Agent</h2>
          <p className="text-sm text-stone-600">Your 24/7 Aegis security assistant</p>
        </div>
        <div className="space-y-3">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
            <p className="text-sm text-stone-700">
              <span className="font-semibold text-stone-900">Agent:</span> I'm monitoring 3 implementations for your wallet. Everything looks secure!
            </p>
          </div>
          <div className="bg-orange-50 rounded-2xl p-4 ml-8 shadow-sm border border-orange-100">
            <p className="text-sm text-stone-700">
              <span className="font-semibold text-stone-900">You:</span> Check the latest implementation
            </p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
            <p className="text-sm text-stone-700">
              <span className="font-semibold text-stone-900">Agent:</span> The Batch Executor by Uniswap is active and marked as SAFE. It handles batch transactions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
