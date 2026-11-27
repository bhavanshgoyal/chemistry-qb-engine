import { Check } from 'lucide-react';

const STAGES = [
  { key: 'uploading', label: 'Uploading' },
  { key: 'extracting', label: 'Extracting' },
  { key: 'tagging', label: 'Tagging' },
  { key: 'saved', label: 'Saved' },
];

const UploadProgressStages = ({ currentStage, chunkProgress, savedCount }) => {
  if (currentStage < 0) return null;

  return (
    <div className="px-6 py-4 border-b border-border bg-muted/30">
      <div className="flex items-center justify-between gap-2">
        {STAGES.map((stage, idx) => {
          const isCompleted = idx < currentStage || (currentStage === 3 && idx === 3);
          const isActive = idx === currentStage && currentStage < 3;

          return (
            <div key={stage.key} className="flex items-center flex-1 last:flex-none">
              <div
                className={`flex items-center gap-2 ${
                  isCompleted || isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                    isCompleted
                      ? 'bg-primary text-primary-foreground'
                      : isActive
                        ? 'border-2 border-primary text-primary bg-card'
                        : 'border border-border text-muted-foreground bg-card'
                  }`}
                >
                  {isCompleted ? <Check size={12} strokeWidth={3} /> : idx + 1}
                </div>
                <span className="text-xs font-semibold hidden sm:inline">{stage.label}</span>
              </div>

              {idx < STAGES.length - 1 && (
                <div
                  className={`flex-1 h-px mx-2 sm:mx-3 transition-colors ${
                    idx < currentStage ? 'bg-primary' : 'bg-border'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {(chunkProgress?.total > 0 || savedCount > 0) && (
        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            {chunkProgress?.total > 0
              ? `Chunk progress: ${chunkProgress.completed} / ${chunkProgress.total}`
              : 'Preparing document chunks'}
            {chunkProgress?.failed > 0 ? ` (${chunkProgress.failed} failed)` : ''}
          </span>
          {savedCount > 0 && (
            <span className="font-semibold text-foreground tabular-nums">
              {savedCount} question{savedCount !== 1 ? 's' : ''} saved
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default UploadProgressStages;
