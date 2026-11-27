import { Link } from 'react-router-dom';
import { FlaskConical, Video } from 'lucide-react';
import MathText from '../common/MathText';
import BloomBadge from '../common/BloomBadge';
import { isValidVideoUrl } from '../../data/syllabus';

const QuestionMobileList = ({ questions, selectedIds, onToggleSelect, onInspect }) => {
  return (
    <div className="md:hidden divide-y divide-border">
      {questions.map((q) => {
        const hasVideo = isValidVideoUrl(q.videoUrl);
        const isChecked = selectedIds.has(q.id);

        return (
          <div
            key={q.id}
            onClick={() => onInspect(q)}
            className={`p-4 transition-colors cursor-pointer ${
              isChecked ? 'bg-primary/5' : 'hover:bg-muted/30'
            }`}
          >
            <div className="flex items-start gap-3">
              <div onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => onToggleSelect(q.id)}
                  aria-label={`Select question ${q.id}`}
                  className="mt-1 rounded border-input accent-primary"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="text-xs font-semibold text-primary">
                    {q.chapter || '—'}
                  </span>
                  <BloomBadge level={q.bloomLevel} showCode />
                </div>

                {(q.topic || q.subTopic) && (
                  <p className="text-xs text-muted-foreground mb-1.5 truncate">
                    {q.topic}
                    {q.subTopic ? ` · ${q.subTopic}` : ''}
                  </p>
                )}

                <div className="text-sm text-foreground leading-relaxed line-clamp-3">
                  <MathText text={q.questionText || '—'} />
                </div>

                <div
                  className="flex flex-wrap items-center gap-2 mt-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Link
                    to={`/solve/${q.id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md bg-primary text-primary-foreground"
                  >
                    <FlaskConical size={12} /> Solve
                  </Link>

                  {hasVideo && (
                    <a
                      href={q.videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md border border-border bg-background text-foreground"
                    >
                      <Video size={12} /> Watch video
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default QuestionMobileList;
