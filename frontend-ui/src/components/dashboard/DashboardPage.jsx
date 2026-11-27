import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  RefreshCw,
  BookOpen,
  Layers,
  GraduationCap,
  Upload,
  FileDown,
  FlaskConical,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { fetchQuestions, fetchProficiency, getApiErrorMessage } from '../../services/api';
import { CBSE_CHAPTERS } from '../../data/syllabus';
import { ColdStartBanner } from '../common/Skeleton';
import KpiCard from './KpiCard';
import ChapterMasteryBento from './ChapterMasteryBento';

const DashboardPage = () => {
  const [questions, setQuestions] = useState([]);
  const [proficiency, setProficiency] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [coldStart, setColdStart] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      if (active) setColdStart(true);
    }, 4500);

    (async () => {
      const [qRes, pRes] = await Promise.allSettled([
        fetchQuestions(controller.signal),
        fetchProficiency(controller.signal),
      ]);

      if (!active) return;

      if (qRes.status === 'fulfilled') {
        const data = Array.isArray(qRes.value.data)
          ? qRes.value.data
          : (qRes.value.data?.content ?? []);
        setQuestions(Array.isArray(data) ? data : []);
        setErrorMsg('');
      } else if (qRes.reason?.name !== 'CanceledError') {
        setErrorMsg(getApiErrorMessage(qRes.reason, 'Unable to reach the question bank API.'));
      }

      if (pRes.status === 'fulfilled') {
        setProficiency(pRes.value.data);
      }

      clearTimeout(timer);
      setColdStart(false);
      setLoading(false);
    })();

    return () => {
      active = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [refreshTick]);

  const handleRefresh = () => {
    setLoading(true);
    setErrorMsg('');
    setColdStart(false);
    setRefreshTick((t) => t + 1);
  };

  const dbStatusVariant = errorMsg ? 'error' : loading ? 'connecting' : 'success';
  const dbStatusText = errorMsg ? 'Offline' : loading ? 'Connecting' : 'Synced';

  const quickActions = [
    {
      to: '/upload',
      icon: Upload,
      title: 'Upload Material',
      desc: 'Ingest CBSE PDF or TXT notes',
    },
    {
      to: '/questions',
      icon: BookOpen,
      title: 'Browse Question Bank',
      desc: 'Filter by chapter & Bloom level',
    },
    {
      to: '/questions?export=1',
      icon: FileDown,
      title: 'Export Printable Worksheet',
      desc: 'Download PDF with QR codes',
    },
    {
      to: '/solve',
      icon: FlaskConical,
      title: 'Launch Student Practice',
      desc: 'Active recall & video remediation',
    },
  ];

  return (
    <div className="flex flex-col gap-7">
      <ColdStartBanner visible={coldStart} onRetry={handleRefresh} />

      {/* Editorial Header */}
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-5 border-b border-border">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">
            CBSE Class 12 Chemistry
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Chemistry QB Engine
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-xl">
            Curate Bloom-tagged chemistry assessments, link instructional videos, and export QR-enabled worksheets.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-border bg-card hover:bg-accent disabled:opacity-60 transition-colors"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </header>

      {/* Error alert if backend unavailable */}
      {errorMsg && !loading && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-lg border border-destructive/30 bg-destructive/10 text-sm text-destructive"
        >
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            className="px-3 py-1 text-xs font-semibold rounded-md border border-destructive/30 bg-background hover:bg-destructive/10 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* 3 KPI Cards */}
      <section aria-label="Key metrics" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          icon={BookOpen}
          label="Total Questions"
          value={errorMsg ? '—' : questions.length}
          sub={errorMsg ? 'Database unreachable' : 'Synced from repository'}
          badgeText={dbStatusText}
          badgeVariant={dbStatusVariant}
          loading={loading}
          accentClass="bg-primary/10 text-primary"
        />

        <KpiCard
          icon={Layers}
          label="CBSE Syllabus"
          value={CBSE_CHAPTERS.length}
          sub="Active Class 12 chapters"
          badgeText="Syllabus"
          badgeVariant="neutral"
          accentClass="bg-chart-2/10 text-chart-2"
        />

        <KpiCard
          icon={GraduationCap}
          label="Bloom's Taxonomy"
          value={6}
          sub="Cognitive assessment layers"
          badgeText="Framework"
          badgeVariant="neutral"
          accentClass="bg-chart-4/15 text-chart-4"
        />
      </section>

      {/* Quick Actions */}
      <section aria-labelledby="quick-actions-heading">
        <h2 id="quick-actions-heading" className="text-xl font-semibold text-foreground mb-3">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="group flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary/40 shadow-2xs hover:shadow-sm transition-all"
            >
              <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                <item.icon
                  size={16}
                  className="text-muted-foreground group-hover:text-primary transition-colors"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-foreground leading-snug">
                  {item.title}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                  {item.desc}
                </div>
              </div>
              <ArrowRight
                size={14}
                className="text-muted-foreground group-hover:text-primary shrink-0 transition-colors"
              />
            </Link>
          ))}
        </div>
      </section>

      {/* Chapter Mastery Bento Grid */}
      <ChapterMasteryBento
        questions={questions}
        proficiency={proficiency}
        loading={loading}
      />
    </div>
  );
};

export default DashboardPage;
