import { RefreshCw } from 'lucide-react';

const Skeleton = ({ className = '', ...props }) => (
  <div
    className={`animate-pulse rounded-md bg-muted ${className}`}
    {...props}
  />
);

const ColdStartBanner = ({ visible, onRetry }) => {
  if (!visible) return null;
  return (
    <div
      role="status"
      className="px-4 py-3 rounded-lg border border-border bg-card flex flex-wrap items-center gap-3 text-sm shadow-2xs animate-slide-up"
    >
      <span className="shrink-0 w-2 h-2 rounded-full bg-chart-4 animate-pulse" />
      <p className="flex-1 text-muted-foreground min-w-[200px]">
        Waking up backend server on Render — this can take ~30–50s on first load…
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border border-border bg-background hover:bg-accent transition-colors"
        >
          <RefreshCw size={12} />
          Retry
        </button>
      )}
    </div>
  );
};

export { Skeleton, ColdStartBanner };
