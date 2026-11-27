import { Skeleton } from '../common/Skeleton';

const KpiCard = ({
  icon: Icon,
  label,
  value,
  sub,
  badgeText,
  badgeVariant = 'neutral',
  loading = false,
  accentClass = 'bg-primary/10 text-primary',
}) => {
  const badgeClasses = {
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60',
    error: 'bg-destructive/10 text-destructive border-destructive/25',
    connecting: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60',
    neutral: 'bg-secondary text-secondary-foreground border-border',
  }[badgeVariant];

  return (
    <div className="bg-card rounded-xl border border-border p-5 shadow-xs">
      <div className="flex items-start justify-between gap-2 mb-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${accentClass}`}>
          <Icon size={18} />
        </div>
        <span
          className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${badgeClasses}`}
        >
          {badgeVariant === 'connecting' && (
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
          )}
          {badgeText}
        </span>
      </div>

      {loading ? (
        <Skeleton className="h-9 w-20 mb-1" />
      ) : (
        <div className="font-serif text-3xl font-bold text-foreground tabular-nums leading-none">
          {value}
        </div>
      )}

      <div className="text-sm font-medium text-foreground mt-2">{label}</div>
      {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
};

export default KpiCard;
