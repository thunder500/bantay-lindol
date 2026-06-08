interface Props { checked: boolean; onChange: (v: boolean) => void; label: string; }

export default function Toggle({ checked, onChange, label }: Props) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs uppercase tracking-wide text-white/70">{label}</span>
      <button type="button" role="switch" aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition-colors ${checked ? 'bg-sky-500' : 'bg-white/20'}`}>
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  );
}
