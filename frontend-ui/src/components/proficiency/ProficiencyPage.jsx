import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, FlaskConical, RefreshCw, AlertCircle } from 'lucide-react';
import { fetchProficiency, getApiErrorMessage } from '../../services/api';
import { CBSE_CHAPTERS } from '../../data/syllabus';
import { Skeleton, ColdStartBanner } from '../common/Skeleton';

const ProficiencyPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [coldStart, setColdStart] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      if (active) setColdStart(true);
    }, 4500);

    (async () => {
      try {
        const res = await fetchProficiency(controller.signal);
        if (!active) return;
        setData(res.data);
        setError('');
      } catch (err) {
        if (!active || err?.name === 'CanceledError') return;
        setError(getApiErrorMessage(err, 'Unable to load proficiency data.'));
      } finally {
        if (active) {
          clearTimeout(timer);
          setColdStart(false);
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [refreshTick]);

  const handleRefresh = () => {
    setLoading(true);
    setError('');
    setColdStart(false);
    setRefreshTick((t) => t + 1);
  };

  const profList = Array.isArray(data?.proficiencies) ? data.proficiencies : [];
  const profByChapter = new Map(profList.map((p) => [p.chapter?.toLowerCase(), p]));

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <ColdStartBanner visible={coldStart} onRetry={handleRefresh} />

      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">
            Student Progress
          </p>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Proficiency Map</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Chapter-level Bloom&apos;s taxonomy depth across CBSE Class 12 Chemistry.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg border border-border bg-card hover:bg-accent transition-colors"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </header>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((n) => (
            <Skeleton key={n} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-card rounded-xl border border-border p-10 text-center space-y-3">
          <AlertCircle size={28} className="mx-auto text-destructive" />
          <p className="text-sm font-medium text-destructive">{error}</p>
          <button
            type="button"
            onClick={handleRefresh}
            className="px-4 py-2 text-xs font-semibold rounded-lg border border-border hover:bg-accent"
          >
            Retry
          </button>
        </div>
      ) : profList.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center shadow-2xs">
          <BarChart3 size={36} className="mx-auto text-muted-foreground mb-3" />
          <h3 className="font-serif text-xl font-bold mb-1">No proficiency attempts recorded yet</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-5">
            Solve practice questions to populate your chapter mastery breakdown.
          </p>
          <Link
            to="/solve"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:opacity-90"
          >
            <FlaskConical size={14} /> Go to Student Solve
          </Link>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border shadow-xs overflow-hidden divide-y divide-border">
          {CBSE_CHAPTERS.map((chapter) => {
            const entry = profByChapter.get(chapter.toLowerCase());
            const depth = entry?.depthLevel ?? 0;

            return (
              <div
                key={chapter}
                className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-foreground">{chapter}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {entry ? entry.mastery : 'Not assessed yet'}
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:w-52">
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${Math.min(100, (depth / 6) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-muted-foreground tabular-nums w-9 text-right">
                    {depth}/6
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProficiencyPage;
