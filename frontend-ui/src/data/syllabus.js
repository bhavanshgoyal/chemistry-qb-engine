import syllabusData from './cbse_class12_syllabus_2026.json';

export const SYLLABUS = syllabusData;

export const CBSE_CHAPTERS = syllabusData.active_chapters.map((c) => c.chapter_name);

export const CBSE_CHAPTER_DETAILS = syllabusData.active_chapters;

export const BLOOM_LEVELS = {
  1: {
    label: 'Remembering',
    short: 'L1',
    badgeClass:
      'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60',
  },
  2: {
    label: 'Understanding',
    short: 'L2',
    badgeClass:
      'bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-800/60',
  },
  3: {
    label: 'Applying',
    short: 'L3',
    badgeClass:
      'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800/60',
  },
  4: {
    label: 'Analyzing',
    short: 'L4',
    badgeClass:
      'bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800/60',
  },
  5: {
    label: 'Evaluating',
    short: 'L5',
    badgeClass:
      'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60',
  },
  6: {
    label: 'Creating',
    short: 'L6',
    badgeClass:
      'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/60',
  },
};

export function getBloomMeta(level) {
  return (
    BLOOM_LEVELS[level] || {
      label: 'Unclassified',
      short: 'N/A',
      badgeClass: 'bg-muted text-muted-foreground border-border',
    }
  );
}

export function isValidVideoUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function extractYouTubeId(url) {
  if (!isValidVideoUrl(url)) return '';
  const match = url.match(/(?:v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{6,})/);
  return match ? match[1] : '';
}

export function toYouTubeEmbedUrl(url) {
  const id = extractYouTubeId(url);
  return id ? `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1` : null;
}
