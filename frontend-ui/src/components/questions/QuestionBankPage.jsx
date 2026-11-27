import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  RefreshCw,
  Search,
  FileDown,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2,
  X,
} from 'lucide-react';
import { fetchQuestions, exportPdf, getApiErrorMessage } from '../../services/api';
import { BLOOM_LEVELS, CBSE_CHAPTERS } from '../../data/syllabus';
import { Skeleton, ColdStartBanner } from '../common/Skeleton';
import QuestionTable from './QuestionTable';
import QuestionMobileList from './QuestionMobileList';
import QuestionInspectorDrawer from './QuestionInspectorDrawer';
import BulkExportDock from './BulkExportDock';

const PER_PAGE = 15;

const QuestionBankPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [coldStart, setColdStart] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  const [searchTerm, setSearchTerm] = useState('');
  const [bloomFilter, setBloomFilter] = useState('');
  const [page, setPage] = useState(1);

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [inspecting, setInspecting] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');

  const chapterFilter = searchParams.get('chapter') || '';

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      if (active) setColdStart(true);
    }, 4500);

    (async () => {
      try {
        const res = await fetchQuestions(controller.signal);
        if (!active) return;
        const data = Array.isArray(res.data) ? res.data : (res.data?.content ?? []);
        setQuestions(Array.isArray(data) ? data : []);
        setError('');
      } catch (err) {
        if (!active || err?.name === 'CanceledError') return;
        setError(getApiErrorMessage(err, 'Failed to fetch questions from the server.'));
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

  const chapterOptions = [
    ...new Set([
      ...CBSE_CHAPTERS,
      ...questions.map((q) => q.chapter).filter(Boolean),
    ]),
  ];

  const filtered = questions.filter((q) => {
    const term = searchTerm.trim().toLowerCase();
    const bloomLabel = BLOOM_LEVELS[q.bloomLevel]?.label?.toLowerCase() || '';
    const matchSearch =
      !term ||
      [q.chapter, q.topic, q.subTopic, q.questionText, bloomLabel, String(q.bloomLevel)]
        .some((val) => val?.toLowerCase().includes(term));

    const matchChapter = !chapterFilter || q.chapter === chapterFilter;
    const matchBloom = !bloomFilter || Number(q.bloomLevel) === Number(bloomFilter);

    return matchSearch && matchChapter && matchBloom;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const togglePageSelect = () => {
    const allSelected = paginated.length > 0 && paginated.every((q) => selectedIds.has(q.id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      paginated.forEach((q) => {
        if (allSelected) next.delete(q.id);
        else next.add(q.id);
      });
      return next;
    });
  };

  const handleChapterChange = (val) => {
    setPage(1);
    const nextParams = new URLSearchParams(searchParams);
    if (val) nextParams.set('chapter', val);
    else nextParams.delete('chapter');
    nextParams.delete('export');
    setSearchParams(nextParams, { replace: true });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setBloomFilter('');
    handleChapterChange('');
  };

  const handleExport = async (useSelectedIds = false) => {
    setExporting(true);
    setExportError('');
    try {
      if (useSelectedIds && selectedIds.size > 0) {
        await exportPdf({ ids: Array.from(selectedIds) });
      } else if (searchTerm || bloomFilter) {
        const ids = filtered.map((q) => q.id).filter(Boolean);
        if (ids.length === 0) {
          setExportError('No questions match the current filters to export.');
          return;
        }
        await exportPdf({ ids, chapter: chapterFilter || 'Filtered' });
      } else {
        await exportPdf({ chapter: chapterFilter || 'All' });
      }
    } catch (err) {
      setExportError(getApiErrorMessage(err, 'PDF export failed. Please verify the backend is running.'));
    } finally {
      setExporting(false);
    }
  };

  const exportBannerVisible = searchParams.get('export') === '1';
  const hasActiveFilters = Boolean(searchTerm || chapterFilter || bloomFilter);

  return (
    <div className="flex flex-col gap-5">
      <ColdStartBanner visible={coldStart} onRetry={handleRefresh} />

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">
            Repository
          </p>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Question Bank</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Search, inspect KaTeX prompts, filter by Bloom&apos;s level, or export QR-linked worksheets.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleExport(selectedIds.size > 0)}
            disabled={exporting || loading || questions.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            {exporting ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
            {selectedIds.size > 0
              ? `Export Selected (${selectedIds.size})`
              : 'Export PDF (with QR)'}
          </button>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg border border-border bg-card hover:bg-accent disabled:opacity-60 transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </header>

      {exportBannerVisible && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-lg border border-primary/25 bg-primary/5 text-sm">
          <span className="text-foreground">
            Filter by chapter or check specific rows below, then click <strong>Export PDF (with QR)</strong> to download a printable worksheet.
          </span>
          <button
            type="button"
            onClick={() => {
              const nextParams = new URLSearchParams(searchParams);
              nextParams.delete('export');
              setSearchParams(nextParams, { replace: true });
            }}
            className="text-xs font-semibold text-primary hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {exportError && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg border border-destructive/30 bg-destructive/10 text-sm text-destructive"
        >
          <div className="flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{exportError}</span>
          </div>
          <button
            type="button"
            onClick={() => setExportError('')}
            aria-label="Dismiss error"
            className="p-1 rounded hover:bg-destructive/10"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Filter Controls */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search question text, topic, sub-topic…"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-input bg-card focus:border-ring focus:ring-1 focus:ring-ring outline-none"
            />
          </div>

          <select
            value={chapterFilter}
            onChange={(e) => handleChapterChange(e.target.value)}
            aria-label="Filter by chapter"
            className="sm:w-64 px-3 py-2 text-sm rounded-lg border border-input bg-card focus:border-ring outline-none"
          >
            <option value="">All CBSE Chapters</option>
            {chapterOptions.map((ch) => (
              <option key={ch} value={ch}>
                {ch}
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="px-3 py-2 text-xs font-semibold rounded-lg border border-border bg-card hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Bloom's Level Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter by Bloom's level">
          <button
            type="button"
            onClick={() => {
              setBloomFilter('');
              setPage(1);
            }}
            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
              !bloomFilter
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card text-muted-foreground border-border hover:bg-accent hover:text-foreground'
            }`}
          >
            All Levels
          </button>
          {Object.entries(BLOOM_LEVELS).map(([lvl, meta]) => {
            const active = Number(bloomFilter) === Number(lvl);
            return (
              <button
                key={lvl}
                type="button"
                onClick={() => {
                  setBloomFilter(active ? '' : lvl);
                  setPage(1);
                }}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                  active
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-muted-foreground border-border hover:bg-accent hover:text-foreground'
                }`}
              >
                {meta.short} · {meta.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table / Mobile Cards Container */}
      <div className="bg-card rounded-xl border border-border shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3, 4, 5].map((n) => (
              <Skeleton key={n} className="h-14 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="p-10 text-center space-y-3">
            <AlertCircle size={28} className="mx-auto text-destructive" />
            <p className="text-sm font-medium text-destructive">{error}</p>
            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg border border-border hover:bg-accent"
            >
              <RefreshCw size={12} /> Try Again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <p className="text-sm font-medium text-foreground">
              {hasActiveFilters
                ? 'No questions match the selected filters.'
                : 'No questions in the database yet.'}
            </p>
            <p className="text-xs text-muted-foreground">
              {hasActiveFilters
                ? 'Try clearing your search or selecting a different chapter.'
                : 'Upload a PDF or TXT file to populate your question bank.'}
            </p>
          </div>
        ) : (
          <>
            <QuestionTable
              questions={paginated}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
              onTogglePageSelect={togglePageSelect}
              onInspect={setInspecting}
            />

            <QuestionMobileList
              questions={paginated}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
              onInspect={setInspecting}
            />

            {/* Footer & Pagination */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-border bg-muted/20 text-xs text-muted-foreground">
              <span className="tabular-nums">
                Showing <strong className="text-foreground">{(safePage - 1) * PER_PAGE + 1}</strong>–
                <strong className="text-foreground">{Math.min(safePage * PER_PAGE, filtered.length)}</strong> of{' '}
                <strong className="text-foreground">{filtered.length}</strong> question{filtered.length !== 1 ? 's' : ''}
              </span>

              {totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                    aria-label="Previous page"
                    className="p-1.5 rounded-md border border-border bg-card hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="px-2 font-mono font-medium text-foreground tabular-nums">
                    {safePage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safePage === totalPages}
                    aria-label="Next page"
                    className="p-1.5 rounded-md border border-border bg-card hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <BulkExportDock
        count={selectedIds.size}
        exporting={exporting}
        onExport={() => handleExport(true)}
        onClear={() => setSelectedIds(new Set())}
      />

      <QuestionInspectorDrawer
        key={inspecting?.id ?? 'closed'}
        question={inspecting}
        onClose={() => setInspecting(null)}
      />
    </div>
  );
};

export default QuestionBankPage;
