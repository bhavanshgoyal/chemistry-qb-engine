import { FileDown, Loader2, X } from 'lucide-react';

const BulkExportDock = ({ count, exporting, onExport, onClear }) => {
  if (count <= 0) return null;

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 px-4 w-full max-w-md animate-slide-up">
      <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-card border border-border shadow-lg">
        <span className="text-sm font-semibold text-foreground tabular-nums">
          {count} selected
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onExport}
            disabled={exporting}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {exporting ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <FileDown size={13} />
            )}
            {exporting ? 'Exporting…' : 'Export QR PDF'}
          </button>

          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={12} /> Clear
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkExportDock;
