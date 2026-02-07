export function ActivityContent() {
  return (
    <div className="flex-1 overflow-y-auto bg-stone-50">
      <div className="px-6 md:px-12 py-8 md:py-12 max-w-4xl mx-auto w-full">
        <h2 className="text-xl font-bold mb-6 text-stone-900">Transaction History</h2>
        <div className="space-y-3">
          {[
            { action: 'Sent ETH', time: '5 min ago', amount: '-$125.50', type: 'send' },
            { action: 'Received USDC', time: '1 hour ago', amount: '+$500.00', type: 'receive' },
            { action: 'Sent ETH', time: '3 hours ago', amount: '-$75.25', type: 'send' },
            { action: 'Swap ETH → USDC', time: '1 day ago', amount: '$1,000.00', type: 'swap' },
          ].map((item, i) => (
            <div key={i} className="bg-white border border-stone-100 rounded-xl p-4 shadow-sm">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium text-sm text-stone-900">{item.action}</p>
                  <p className="text-xs text-stone-500 mt-1">{item.time}</p>
                </div>
                <p className={`font-semibold text-sm ${
                  item.type === 'receive' ? 'text-orange-600' : 'text-stone-800'
                }`}>
                  {item.amount}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
