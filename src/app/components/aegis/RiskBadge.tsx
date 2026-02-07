export function RiskBadge({ risk }: { risk: 'safe' | 'low' | 'high' | 'unknown' }) {
  const styles = {
    safe: 'bg-green-100 text-green-800 border border-green-200',
    low: 'bg-amber-100 text-amber-800 border border-amber-200',
    high: 'bg-red-100 text-red-800 border border-red-200',
    unknown: 'bg-stone-200 text-stone-700 border border-stone-300'
  };
  
  const labels = {
    safe: 'Safe',
    low: 'Low Risk',
    high: 'Unsafe',
    unknown: 'Unknown'
  };

  return (
    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[risk]}`}>
      {labels[risk]}
    </div>
  );
}