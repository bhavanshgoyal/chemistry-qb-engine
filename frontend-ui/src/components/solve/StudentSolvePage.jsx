import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Video,
  SkipForward,
} from 'lucide-react';
import {
  fetchQuestion,
  fetchQuestions,
  submitAnswer,
  saveDiagnosticProgress,
  getApiErrorMessage,
} from '../../services/api';
import { isValidVideoUrl, toYouTubeEmbedUrl } from '../../data/syllabus';
import { Skeleton, ColdStartBanner } from '../common/Skeleton';
import MathText from '../common/MathText';
import BloomBadge from '../common/BloomBadge';
import QuestionPicker from './QuestionPicker';

const SolveWorkspace = ({ questionId }) => {
  const [question, setQuestion] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [coldStart, setColdStart] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  const [answer, setAnswer] = useState('');
  const [confidence, setConfidence] = useState(3);
  const [showHint, setShowHint] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [diagnosticFeedback, setDiagnosticFeedback] = useState('');
  const [remediation, setRemediation] = useState(null);
  const startedAtRef = useRef(0);

  useEffect(() => {
    startedAtRef.current = Date.now();
    let active = true;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      if (active) setColdStart(true);
    }, 4500);

    (async () => {
      try {
        if (questionId) {
          const res = await fetchQuestion(questionId, controller.signal);
          if (!active) return;
          setQuestion(res.data);
        } else {
          const res = await fetchQuestions(controller.signal);
          if (!active) return;
          const data = Array.isArray(res.data) ? res.data : (res.data?.content ?? []);
          setQuestions(Array.isArray(data) ? data : []);
        }
        setError('');
      } catch (err) {
        if (!active || err?.name === 'CanceledError') return;
        setError(getApiErrorMessage(err, 'Could not load question from the server.'));
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
  }, [questionId, refreshTick]);

  const handleRefresh = () => {
    setLoading(true);
    setError('');
    setColdStart(false);
    setRefreshTick((t) => t + 1);
  };

  const sendDiagnosticAttempt = async ({ skipped }) => {
    if (!question?.id) return;
    setSubmitting(true);
    const elapsedSeconds = Math.max(
      1,
      Math.round((Date.now() - (startedAtRef.current || Date.now())) / 1000)
    );

    const [bridgeRes, progressRes] = await Promise.allSettled([
      submitAnswer({
        questionId: question.id,
        bloomLevel: question.bloomLevel || 1,
        topic: question.chapter || question.topic || 'General',
        isCorrect: !skipped,
        confidence,
      }),
      saveDiagnosticProgress([
        {
          studentId: 'stu_123',
          questionId: question.id,
          isCorrect: !skipped,
          isSkipped: skipped,
          confidenceLevel: confidence,
          timeSpentSeconds: elapsedSeconds,
        },
      ]),
    ]);

    if (bridgeRes.status === 'fulfilled' && bridgeRes.value?.data?.recommendedAction) {
      setDiagnosticFeedback(bridgeRes.value.data.recommendedAction);
    }
    if (progressRes.status === 'fulfilled' && progressRes.value?.data) {
      setRemediation(progressRes.value.data);
    }

    setSubmitted(true);
    setSubmitting(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (answer.trim().length < 10 || submitting) return;
    await sendDiagnosticAttempt({ skipped: false });
  };

  const handleSkipForVideo = async () => {
    if (submitting) return;
    await sendDiagnosticAttempt({ skipped: true });
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto flex flex-col gap-4">
        <ColdStartBanner visible={coldStart} onRetry={handleRefresh} />
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-44 w-full rounded-xl" />
        <Skeleton className="h-36 w-full rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto text-center py-14 space-y-4">
        <AlertTriangle size={36} className="mx-auto text-destructive" />
        <p className="text-sm font-medium text-destructive">{error}</p>
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleRefresh}
            className="px-4 py-2 text-sm font-semibold rounded-lg border border-border hover:bg-accent"
          >
            Retry
          </button>
          <Link to="/questions" className="text-sm font-semibold text-primary hover:underline">
            Browse Question Bank
          </Link>
        </div>
      </div>
    );
  }

  if (!questionId) {
    return <QuestionPicker questions={questions} />;
  }

  if (!question) {
    return (
      <div className="max-w-2xl mx-auto text-center py-14 space-y-3">
        <p className="text-sm text-muted-foreground">Question not found.</p>
        <Link to="/solve" className="text-sm font-semibold text-primary hover:underline">
          ← Choose another question
        </Link>
      </div>
    );
  }

  const effectiveVideoUrl = isValidVideoUrl(remediation?.videoUrl)
    ? remediation.videoUrl
    : isValidVideoUrl(question.videoUrl)
      ? question.videoUrl
      : null;
  const embedUrl = effectiveVideoUrl ? toYouTubeEmbedUrl(effectiveVideoUrl) : null;

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          to="/solve"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={14} /> All Practice Questions
        </Link>
        <span className="text-xs font-mono text-muted-foreground">Question #{question.id}</span>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap items-center gap-2">
        {question.chapter && (
          <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
            {question.chapter}
          </span>
        )}
        {question.topic && (
          <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground border border-border">
            {question.topic}
          </span>
        )}
        {question.subTopic && (
          <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
            {question.subTopic}
          </span>
        )}
        <BloomBadge level={question.bloomLevel} showCode />
      </div>

      {/* Editorial Reading Prompt Card */}
      <article className="bg-card rounded-xl border border-border p-6 sm:p-7 shadow-xs">
        <div className="font-serif text-lg sm:text-xl leading-relaxed text-foreground">
          <MathText text={question.questionText} />
        </div>

        {/* Hint hidden behind Show Hint toggle */}
        {question.explanation && (
          <div className="mt-5 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setShowHint((v) => !v)}
              aria-expanded={showHint}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              <span>{showHint ? 'Hide Hint' : 'Show Hint'}</span>
              {showHint ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>

            {showHint && (
              <div className="mt-3 p-3.5 rounded-lg bg-muted/50 border border-border text-sm text-muted-foreground leading-relaxed">
                <MathText text={question.explanation} />
              </div>
            )}
          </div>
        )}
      </article>

      {/* Answer Form or Remediation Result */}
      {!submitted ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="student-answer" className="text-sm font-semibold text-foreground">
              Your Working &amp; Answer
            </label>
            <span className="text-xs text-muted-foreground tabular-nums">
              {answer.trim().length < 10
                ? `${Math.max(0, 10 - answer.trim().length)} more chars to unlock`
                : 'Ready to submit'}
            </span>
          </div>

          <textarea
            id="student-answer"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Write your derivation, equation steps, or final reasoning to unlock the video walkthrough…"
            className="w-full min-h-[160px] p-4 text-sm rounded-xl border border-input bg-card text-foreground focus:border-ring focus:ring-1 focus:ring-ring outline-none resize-y leading-relaxed"
          />

          {/* Confidence Slider (1–5) */}
          <div className="flex items-center gap-4 px-4 py-3 rounded-xl border border-border bg-card">
            <label
              htmlFor="confidence-slider"
              className="text-xs font-semibold text-muted-foreground whitespace-nowrap tabular-nums"
            >
              Confidence: <strong className="text-foreground">{confidence}/5</strong>
            </label>
            <input
              id="confidence-slider"
              type="range"
              min="1"
              max="5"
              value={confidence}
              onChange={(e) => setConfidence(Number(e.target.value))}
              className="flex-1 accent-primary cursor-pointer"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <button
              type="submit"
              disabled={answer.trim().length < 10 || submitting}
              className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-all"
            >
              {submitting && <Loader2 size={15} className="animate-spin" />}
              {submitting ? 'Submitting…' : 'Submit to Unlock Video Solution'}
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={handleSkipForVideo}
              className="inline-flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl text-sm font-medium border border-border bg-card hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            >
              <SkipForward size={14} /> Skip
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-col gap-4 animate-slide-up">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 dark:bg-emerald-950/40 dark:border-emerald-800/60 dark:text-emerald-200">
            <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
            <div className="space-y-1 text-sm">
              <div className="font-semibold">Response Recorded</div>
              {remediation?.message && <p className="text-xs opacity-90">{remediation.message}</p>}
              {diagnosticFeedback && <p className="text-xs opacity-90">{diagnosticFeedback}</p>}
            </div>
          </div>

          {embedUrl ? (
            <div
              className="rounded-xl overflow-hidden border border-border bg-muted shadow-xs"
              style={{ paddingTop: '56.25%', position: 'relative' }}
            >
              <iframe
                className="absolute inset-0 w-full h-full"
                src={embedUrl}
                title="Video Solution"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : effectiveVideoUrl ? (
            <div className="bg-card rounded-xl border border-border p-5 flex items-center justify-between gap-3">
              <span className="text-sm font-medium">Remediation video available:</span>
              <a
                href={effectiveVideoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold"
              >
                <Video size={14} /> Watch Video
              </a>
            </div>
          ) : (
            <div className="bg-card rounded-xl border border-border p-8 text-center">
              <div className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center mx-auto mb-3">
                <Video size={18} className="text-muted-foreground" />
              </div>
              <p className="text-sm font-semibold text-foreground">
                No remediation video is linked to this question yet.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Ask your teacher to link a matching walkthrough in the Video Library.
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                setAnswer('');
                setDiagnosticFeedback('');
                setRemediation(null);
              }}
              className="flex-1 py-2.5 px-4 rounded-xl text-sm font-medium border border-border bg-card hover:bg-accent transition-colors"
            >
              Revise My Answer
            </button>
            <Link
              to="/solve"
              className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold text-center bg-secondary text-secondary-foreground hover:opacity-90 transition-opacity"
            >
              Pick Another Question
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

const StudentSolvePage = () => {
  const { questionId } = useParams();
  return <SolveWorkspace key={questionId || 'picker'} questionId={questionId} />;
};

export default StudentSolvePage;
