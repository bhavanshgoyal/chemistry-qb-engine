import { useState, useEffect } from 'react';
import { X, AlertCircle, Loader2 } from 'lucide-react';
import { BLOOM_LEVELS, CBSE_CHAPTERS } from '../../data/syllabus';
import { getApiErrorMessage } from '../../services/api';

const EMPTY_FORM = {
  title: '',
  chapter: '',
  topic: '',
  subTopic: '',
  bloomLevel: '',
  youtubeUrl: '',
  description: '',
};

const VideoFormModal = ({ initial, onSave, onClose }) => {
  const [form, setForm] = useState(initial ? { ...EMPTY_FORM, ...initial, bloomLevel: initial.bloomLevel ?? '' } : EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [urlError, setUrlError] = useState('');
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const validateYT = (url) => {
    if (!url) return 'YouTube URL is required.';
    if (!url.includes('youtube.com/watch?v=') && !url.includes('youtu.be/')) {
      return 'Must be a valid YouTube URL (youtube.com/watch?v=... or youtu.be/...).';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ytErr = validateYT(form.youtubeUrl);
    if (ytErr) {
      setUrlError(ytErr);
      return;
    }

    setSaving(true);
    setSubmitError('');
    try {
      await onSave({
        ...form,
        bloomLevel: form.bloomLevel ? Number(form.bloomLevel) : null,
      });
    } catch (err) {
      setSubmitError(getApiErrorMessage(err, 'Could not save video resource.'));
    } finally {
      setSaving(false);
    }
  };

  const fieldCls =
    'w-full px-3 py-2 text-sm rounded-lg border border-input bg-background text-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={initial ? 'Edit video resource' : 'Add video resource'}
    >
      <div className="absolute inset-0 bg-foreground/25" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-card rounded-xl border border-border shadow-xl max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="sticky top-0 bg-card border-b border-border px-5 py-4 flex items-center justify-between z-10">
          <h3 className="font-serif text-lg font-bold text-foreground">
            {initial ? 'Edit Video Resource' : 'Add Video Resource'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-md hover:bg-accent text-muted-foreground"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          {submitError && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/25 text-xs text-destructive">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{submitError}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">
              YouTube URL *
            </label>
            <input
              type="url"
              required
              placeholder="https://www.youtube.com/watch?v=..."
              value={form.youtubeUrl}
              onChange={(e) => {
                set('youtubeUrl', e.target.value);
                setUrlError('');
              }}
              className={`${fieldCls} ${urlError ? 'border-destructive focus:ring-destructive' : ''}`}
            />
            {urlError && <p className="text-xs text-destructive mt-1">{urlError}</p>}
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">
              Video Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Nernst Equation — Derivation & Numericals"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              className={fieldCls}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                Chapter *
              </label>
              <select
                required
                value={form.chapter}
                onChange={(e) => set('chapter', e.target.value)}
                className={fieldCls}
              >
                <option value="">Select chapter…</option>
                {CBSE_CHAPTERS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                Bloom&apos;s Level
              </label>
              <select
                value={form.bloomLevel}
                onChange={(e) => set('bloomLevel', e.target.value)}
                className={fieldCls}
              >
                <option value="">Any level</option>
                {Object.entries(BLOOM_LEVELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.short} — {v.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                Topic
              </label>
              <input
                type="text"
                placeholder="e.g. Nernst Equation"
                value={form.topic}
                onChange={(e) => set('topic', e.target.value)}
                className={fieldCls}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                Sub-topic
              </label>
              <input
                type="text"
                placeholder="e.g. Cell Potential"
                value={form.subTopic}
                onChange={(e) => set('subTopic', e.target.value)}
                className={fieldCls}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">
              Description
            </label>
            <textarea
              placeholder="Concepts and problem types covered in this video…"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              className={`${fieldCls} min-h-[84px] resize-y`}
            />
          </div>

          <div className="pt-3 border-t border-border flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-accent transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !form.title || !form.chapter || !form.youtubeUrl}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {saving ? 'Saving…' : initial ? 'Save Changes' : 'Add Video'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VideoFormModal;
