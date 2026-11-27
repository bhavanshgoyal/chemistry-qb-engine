import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { BLOOM_LEVELS, CBSE_CHAPTERS } from '../../data/syllabus';
import { Skeleton } from '../common/Skeleton';

const ChapterMasteryBento = ({ questions = [], proficiency = null, loading = false }) => {
  const proficiencyList = Array.isArray(proficiency?.proficiencies) ? proficiency.proficiencies : [];
  const proficiencyByChapter = new Map(
    proficiencyList.map((p) => [p.chapter?.toLowerCase(), p])
  );

  // Merge canonical CBSE chapters with any additional chapters returned from DB or ProficiencyController
  const allChapters = [
    ...CBSE_CHAPTERS,
    ...questions
      .map((q) => q.chapter)
      .filter((ch) => ch && !CBSE_CHAPTERS.includes(ch)),
    ...proficiencyList
      .map((p) => p.chapter)
      .filter((ch) => ch && !CBSE_CHAPTERS.includes(ch)),
  ];
  const uniqueChapters = [...new Set(allChapters)];

  const questionCountsByChapter = questions.reduce((acc, q) => {
    if (q.chapter) {
      acc[q.chapter] = (acc[q.chapter] || 0) + 1;
    }
    return acc;
  }, {});

  const bloomCounts = Object.keys(BLOOM_LEVELS).reduce((acc, lvl) => {
    acc[lvl] = questions.filter((q) => Number(q.bloomLevel) === Number(lvl)).length;
    return acc;
  }, {});
  const maxBloomCount = Math.max(1, ...Object.values(bloomCounts));

  return (
    <section aria-labelledby="bento-heading">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
        <h2 id="bento-heading" className="text-xl font-semibold text-foreground">
          Syllabus &amp; Mastery Overview
        </h2>
        <Link
          to="/proficiency"
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          View Proficiency Map <ArrowUpRight size={13} />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 10-Chapter CBSE Syllabus Coverage & Proficiency Bento Tile */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-5 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                CBSE Class 12 Chapter Coverage
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {proficiencyList.length > 0
                  ? `${proficiencyList.length} chapter${proficiencyList.length !== 1 ? 's' : ''} with recorded mastery telemetry`
                  : 'No student attempts recorded yet — showing syllabus chapters'}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <Skeleton key={n} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {uniqueChapters.map((chapter) => {
                const prof = proficiencyByChapter.get(chapter.toLowerCase());
                const qCount = questionCountsByChapter[chapter] || 0;
                const depth = prof?.depthLevel ?? 0;

                return (
                  <Link
                    key={chapter}
                    to={`/questions?chapter=${encodeURIComponent(chapter)}`}
                    className="group flex flex-col justify-between gap-2 p-3 rounded-lg border border-border bg-background/60 hover:border-primary/40 hover:bg-card transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
                        {chapter}
                      </span>
                      <span className="text-[11px] font-mono text-muted-foreground tabular-nums shrink-0">
                        {qCount} Q
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${Math.min(100, (depth / 6) * 100)}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-muted-foreground shrink-0">
                        {prof ? prof.mastery : 'Not assessed'}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Bloom's Taxonomy Breakdown Bar */}
        <div className="bg-card rounded-xl border border-border p-5 shadow-xs flex flex-col">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-foreground">Bloom&apos;s Taxonomy Distribution</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {questions.length > 0
                ? `Across ${questions.length} synced question${questions.length !== 1 ? 's' : ''}`
                : 'Cognitive layers in your question bank'}
            </p>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <Skeleton key={n} className="h-6 w-full" />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3 flex-1 justify-center">
              {Object.entries(BLOOM_LEVELS).map(([level, meta]) => {
                const count = bloomCounts[level] || 0;
                const widthPct = questions.length > 0 ? Math.round((count / maxBloomCount) * 100) : 0;

                return (
                  <div key={level} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground">
                        <span className="font-mono text-muted-foreground mr-1.5">{meta.short}</span>
                        {meta.label}
                      </span>
                      <span className="font-mono text-muted-foreground tabular-nums">{count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ChapterMasteryBento;
