import { Link } from 'react-router-dom';
import { FlaskConical, ArrowRight, Upload } from 'lucide-react';
import MathText from '../common/MathText';
import BloomBadge from '../common/BloomBadge';

const QuestionPicker = ({ questions }) => {
  if (questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto bg-card rounded-xl border border-border p-10 text-center shadow-xs">
        <div className="w-12 h-12 rounded-xl bg-muted border border-border flex items-center justify-center mx-auto mb-4">
          <FlaskConical size={22} className="text-muted-foreground" />
        </div>
        <h2 className="font-serif text-xl font-bold text-foreground mb-1.5">
          No practice questions in database yet
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto mb-5">
          Upload CBSE Class 12 Chemistry notes or syllabus PDFs first so students can practice real questions.
        </p>
        <Link
          to="/upload"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:opacity-90"
        >
          <Upload size={14} /> Upload Study Material
        </Link>
      </div>
    );
  }

  const firstQuestion = questions[0];

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <header className="pb-4 border-b border-border flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">
            Student Mode
          </p>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Practice Session</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Jump straight into the first question or pick any prompt from your question bank.
          </p>
        </div>

        <Link
          to={`/solve/${firstQuestion.id}`}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity shrink-0"
        >
          Start Question #{firstQuestion.id} <ArrowRight size={15} />
        </Link>
      </header>

      <div className="flex flex-col gap-2.5">
        {questions.map((q) => (
          <Link
            key={q.id}
            to={`/solve/${q.id}`}
            className="group flex items-start gap-3.5 p-4 rounded-xl border border-border bg-card hover:border-primary/40 shadow-2xs transition-all"
          >
            <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
              <FlaskConical size={16} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-primary">
                  {q.chapter || 'General'}
                </span>
                {q.topic && (
                  <span className="text-xs text-muted-foreground">· {q.topic}</span>
                )}
                <BloomBadge level={q.bloomLevel} showCode />
              </div>

              <div className="font-serif text-base text-foreground leading-snug line-clamp-2">
                <MathText text={q.questionText} />
              </div>
            </div>

            <ArrowRight
              size={16}
              className="text-muted-foreground group-hover:text-primary shrink-0 mt-2 transition-colors"
            />
          </Link>
        ))}
      </div>
    </div>
  );
};

export default QuestionPicker;
