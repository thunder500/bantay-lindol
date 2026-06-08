import { Quake } from '@/lib/types';

interface Props { quake: Quake; onClose: () => void; }

export default function DetailCard({ quake, onClose }: Props) {
  const pht = new Date(quake.time).toLocaleString('en-PH', { timeZone: 'Asia/Manila' });
  return (
    <div className="rounded-xl bg-white/10 backdrop-blur-md p-4 border border-white/15 text-white">
      <div className="flex justify-between items-start">
        <div className="text-2xl font-bold">M {quake.magnitude.toFixed(1)}</div>
        <button onClick={onClose} className="text-white/60 hover:text-white">✕</button>
      </div>
      <div className="text-sm text-white/80 mt-1">{quake.location}</div>
      <dl className="mt-3 text-xs grid grid-cols-2 gap-y-1 text-white/70">
        <dt>Depth</dt><dd className="text-white">{quake.depthKm} km</dd>
        <dt>When (PHT)</dt><dd className="text-white">{pht}</dd>
        <dt>Coordinates</dt><dd className="text-white">{quake.lat.toFixed(2)}, {quake.lon.toFixed(2)}</dd>
        <dt>Source</dt><dd className="text-white uppercase">{quake.source}</dd>
      </dl>
      {quake.url && (
        <a href={quake.url} target="_blank" rel="noreferrer"
           className="mt-3 inline-block text-xs text-sky-300 hover:underline">
          View source bulletin →
        </a>
      )}
    </div>
  );
}
