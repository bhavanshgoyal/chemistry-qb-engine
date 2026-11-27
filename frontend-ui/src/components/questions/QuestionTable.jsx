import { Link } from 'react-router-dom';
import { FlaskConical, Video } from 'lucide-react';
import MathText from '../common/MathText';
import BloomBadge from '../common/BloomBadge';
import { isValidVideoUrl } from '../../data/syllabus';

const QuestionTable = ({
  questions,
  selectedIds,
  onToggleSelect,
  onTogglePageSelect,
  onInspect,
}) => {
  const allPageSelected =
    questions.length > 0 && questions.every((q) => selectedIds.has(q.id));

  return (
    <div className="hidden md:block overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th className="w-11 px-4 py-3 text-left">
              <input
                type="checkbox"
                checked={allPageSelected}
                onChange={onTogglePageSelect}
                aria-label="Select all questions on this page"
                className="rounded border-input accent-primary cursor-pointer"
              />
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-bold tracking-wider uppercase text-muted-foreground">
              Chapter
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-bold tracking-wider uppercase text-muted-foreground">
              Topic / Sub-topic
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-bold tracking-wider uppercase text-muted-foreground">
              Bloom&apos;s Level
            </th>
            <th className="px-4 py-3 text-left text-[11px] font-bold tracking-wider uppercase text-muted-foreground">
              Question
            </th>
            <th className="px-4 py-3 text-right text-[11px] font-bold tracking-wider uppercase text-muted-foreground">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {questions.map((q) => {
            const hasVideo = isValidVideoUrl(q.videoUrl);
            const isChecked = selectedIds.has(q.id);

            return (
              <tr
                key={q.id}
                onClick={() => onInspect(q)}
                className={`transition-colors cursor-pointer ${
                  isChecked ? 'bg-primary/5' : 'hover:bg-muted/30'
                }`}
              >
                <td className="px-4 py-3.5 align-top" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => onToggleSelect(q.id)}
                    aria-label={`Select question ${q.id}`}
                    className="mt-0.5 rounded border-input accent-primary cursor-pointer"
                  />
                </td>

                <td className="px-4 py-3.5 align-top text-sm font-semibold text-foreground whitespace-nowrap">
                  {q.chapter || '—'}
                </td>

                <td className="px-4 py-3.5 align-top min-w-[150px]">
                  <div className="text-sm font-medium text-foreground">{q.topic || '—'}</div>
                  {q.subTopic && (
                    <div className="text-xs text-muted-foreground mt-0.5">{q.subTopic}</div>
                  )}
                </td>

                <td className="px-4 py-3.5 align-top whitespace-nowrap">
                  <BloomBadge level={q.bloomLevel} showCode />
                </td>

                <td className="px-4 py-3.5 align-top max-w-md">
                  <div className="text-sm text-foreground leading-relaxed line-clamp-2">
                    <MathText text={q.questionText || '—'} />
                  </div>
                </td>

                <td
                  className="px-4 py-3.5 align-top whitespace-nowrap text-right"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="inline-flex items-center justify-end gap-2">
                    <Link
                      to={`/solve/${q.id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                    >
                      <FlaskConical size={12} /> Solve
                    </Link>

                    {hasVideo && (
                      <a
                        href={q.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md border border-border bg-background hover:bg-accent text-foreground transition-colors"
                      >
                        <Video size={12} /> Watch
                      </a>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default QuestionTable;
