import { Quake } from '@/lib/types';

interface Props {
  quake: Quake | null;
  onClose: () => void;
}

function phtTime(ms: number): string {
  return new Date(ms).toLocaleString('en-US', {
    timeZone: 'Asia/Manila',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

export default function AlertBanner({ quake, onClose }: Props) {
  if (!quake) return null;
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1100] w-[min(92vw,30rem)]
                    animate-[eqDrop_0.25s_ease-out]">
      <div className="flex items-start gap-3 rounded-xl bg-red-600/95 text-white
                      shadow-2xl ring-1 ring-white/20 px-4 py-3">
        <span className="text-2xl leading-none mt-0.5" aria-hidden>🔔</span>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm">
            New earthquake — Magnitude {quake.magnitude.toFixed(1)}
          </div>
          <div className="text-sm text-white/90 truncate">{quake.location}</div>
          <div className="text-xs text-white/70 mt-0.5">
            Depth {quake.depthKm} km · {phtTime(quake.time)} PHT
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss alert"
          className="shrink-0 text-white/80 hover:text-white text-lg leading-none px-1"
        >
          ×
        </button>
      </div>
    </div>
  );
}
