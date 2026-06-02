export default function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: boolean }) {
  return (
    <div className="py-1">
      <p className={`text-3xl font-bold leading-none ${accent ? 'text-green-400' : 'text-white'}`}>{value}</p>
      <p className="text-slate-500 text-xs mt-1.5">{label}</p>
      {sub && <p className="text-slate-600 text-[11px] mt-0.5">{sub}</p>}
    </div>
  );
}
