interface GaugeBarProps {
  count: number;
  capacity: number;
}

export function GaugeBar({ count, capacity }: GaugeBarProps) {
  const ratio = capacity > 0 ? Math.min(1, count / capacity) : 0;
  const percent = Math.round(ratio * 100);
  const isFull = count >= capacity;

  let barColor = 'bg-[#DC2626]'; // rouge < 50 %
  let statusTextColor = 'text-[#B91C1C]';
  let statusLabel = 'Besoin de renfort';

  if (isFull) {
    barColor = 'bg-[#16A34A]'; // vert si complet
    statusTextColor = 'text-[#15803D]';
    statusLabel = 'Complet – merci !';
  } else if (percent >= 50) {
    barColor = 'bg-[#D97706]'; // orange entre 50 et 99 %
    statusTextColor = 'text-[#B45309]';
    statusLabel = 'Presque complet';
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="font-semibold text-[#14203B] tabular-nums">
          {count} / {capacity} bénévoles
        </span>
        <span className={`font-medium text-xs sm:text-sm ${statusTextColor}`}>{statusLabel}</span>
      </div>
      <div
        className="h-2.5 w-full rounded-full bg-slate-200 overflow-hidden"
        role="progressbar"
        aria-valuenow={count}
        aria-valuemin={0}
        aria-valuemax={capacity}
        aria-label={`${count} inscrits sur ${capacity} bénévoles (${statusLabel})`}
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
