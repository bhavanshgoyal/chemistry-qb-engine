import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, FlaskConical, ExternalLink, ChevronDown, ChevronUp, Video } from 'lucide-react';
import MathText from '../common/MathText';
import BloomBadge from '../common/BloomBadge';
import { isValidVideoUrl, toYouTubeEmbedUrl } from '../../data/syllabus';

const QuestionInspectorDrawer = ({ question, onClose }) => {
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    if (!question) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [question, onClose]);

  if (!question) return null;

  const hasVideo = isValidVideoUrl(question.videoUrl);
  const embedUrl = hasVideo ? toYouTubeEmbedUrl(question.videoUrl) : null;

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label={`Inspect question ${question.id}`}
    >
      <div className="absolute inset-0 bg-foreground/25" onClick={onClose} />

      <aside className="absolute right-0 top-0 bottom-0 w-full max-w-lg bg-card border-l border-border shadow-xl overflow-y-auto animate-slide-over flex flex-col">
        {/* Drawer Header */}
        <div className="sticky top-0 bg-card border-b border-border px-5 py-4 flex items-center justify-between z-10">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Question Inspector
            </p>
            <h3 className="font-serif text-lg font-bold text-foreground">
              Question #{question.id}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md border border-border hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close inspector"
          >
            <X size={16} />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="p-5 flex-1 flex flex-col gap-5">
          {/* Taxonomy Badges */}
          <div className="flex flex-wrap gap-2">
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

          {/* Full KaTeX Prompt */}
          <div className="p-5 rounded-xl bg-background border border-border">
            <div className="font-serif text-lg leading-relaxed text-foreground">
              <MathText text={question.questionText} />
            </div>
          </div>

          {/* Collapsible Hint */}
          {question.explanation && (
            <div className="rounded-xl border border-border bg-muted/30 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowHint((v) => !v)}
                className="w-full px-4 py-3 flex items-center justify-between text-sm font-semibold text-foreground hover:bg-muted/50 transition-colors"
              >
                <span>Solution Hint</span>
                {showHint ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>
              {showHint && (
                <div className="px-4 pb-4 pt-1 text-sm text-muted-foreground leading-relaxed border-t border-border">
                  <MathText text={question.explanation} />
                </div>
              )}
            </div>
          )}

          {/* Linked Video Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Remediation Video
              </h4>
              {hasVideo && (
                <a
                  href={question.videoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                  Open on YouTube <ExternalLink size={12} />
                </a>
              )}
            </div>

            {embedUrl ? (
              <div
                className="rounded-xl overflow-hidden border border-border bg-muted"
                style={{ paddingTop: '56.25%', position: 'relative' }}
              >
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src={embedUrl}
                  title={`Video preview for question ${question.id}`}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : hasVideo ? (
              <a
                href={question.videoUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 p-3 rounded-lg border border-border bg-background hover:bg-accent text-sm font-medium"
              >
                <Video size={16} className="text-primary" />
                <span>Watch linked video</span>
              </a>
            ) : (
              <div className="p-4 rounded-lg border border-dashed border-border text-xs text-muted-foreground">
                No video linked yet. Add a matching video in the Video Library.
              </div>
            )}
          </div>
        </div>

        {/* Drawer Footer CTA */}
        <div className="sticky bottom-0 bg-card border-t border-border px-5 py-4 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg text-sm font-medium border border-border hover:bg-accent transition-colors"
          >
            Close
          </button>
          <Link
            to={`/solve/${question.id}`}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <FlaskConical size={15} /> Solve Question
          </Link>
        </div>
      </aside>
    </div>
  );
};

export default QuestionInspectorDrawer;
