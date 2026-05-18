import { useState, useEffect } from 'react';
import api from '../services/api';

const CHAPTERS = [
  'Solutions', 'Electrochemistry', 'Chemical Kinetics',
  'Surface Chemistry', 'Isolation of Elements',
  'p-Block Elements', 'd and f Block Elements',
  'Coordination Compounds', 'Haloalkanes and Haloarenes',
  'Alcohols, Phenols and Ethers', 'Aldehydes, Ketones and Carboxylic Acids',
  'Amines', 'Biomolecules',
];

const BLOOM_LABELS = {
  1: 'Remembering', 2: 'Understanding', 3: 'Applying',
  4: 'Analyzing',   5: 'Evaluating',    6: 'Creating',
};

const EMPTY_FORM = {
  title: '', chapter: '', topic: '', subTopic: '',
  bloomLevel: '', youtubeUrl: '', description: '',
};

// ── Icons ───────────────────────────────────────────────────────────────────
const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
);
const TrashIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
);
const EditIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
);
const VideoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
);
const XIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
);

// ── Modal Form ──────────────────────────────────────────────────────────────
const VideoForm = ({ initial, onSave, onClose }) => {
  const [form, setForm]       = useState(initial || EMPTY_FORM);
  const [saving, setSaving]   = useState(false);
  const [urlError, setUrlError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validateYT = (url) => {
    if (!url) return 'YouTube URL is required.';
    if (!url.includes('youtube.com/watch?v=') && !url.includes('youtu.be/'))
      return 'Must be a valid YouTube URL (youtube.com/watch?v=... or youtu.be/...).';
    return '';
  };

  const handleSave = async () => {
    const err = validateYT(form.youtubeUrl);
    if (err) { setUrlError(err); return; }
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  };

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: 10, fontSize: 13,
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.2)',
    color: '#e2d9f3', outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  };
  const labelStyle = { fontSize: 11, fontWeight: 700, color: '#7c6fa0', marginBottom: 6, display: 'block' };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: 520, padding: 28, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <h3 style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 800, fontSize: 16, color: '#f0eaff', margin: 0 }}>
            {initial ? 'Edit Video Resource' : 'Add Video Resource'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7c6fa0', display: 'flex' }}>
            <XIcon />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* YouTube URL — primary field */}
          <div>
            <label style={labelStyle}>YouTube URL * (unlisted links are fine)</label>
            <input style={{ ...inputStyle, borderColor: urlError ? 'rgba(239,68,68,0.5)' : 'rgba(139,92,246,0.2)' }}
              type="url" placeholder="https://www.youtube.com/watch?v=..."
              value={form.youtubeUrl}
              onChange={e => { set('youtubeUrl', e.target.value); setUrlError(''); }}
            />
            {urlError && <div style={{ fontSize: 11, color: '#f87171', marginTop: 4 }}>{urlError}</div>}
            <div style={{ fontSize: 10, color: '#4c4168', marginTop: 4 }}>
              Tip: Use unlisted YouTube videos for private classroom content.
            </div>
          </div>

          {/* Title */}
          <div>
            <label style={labelStyle}>Video Title *</label>
            <input style={inputStyle} type="text" placeholder="e.g. Nernst Equation — Full Explanation"
              value={form.title} onChange={e => set('title', e.target.value)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {/* Chapter */}
            <div>
              <label style={labelStyle}>Chapter *</label>
              <select style={inputStyle} value={form.chapter} onChange={e => set('chapter', e.target.value)}>
                <option value="">Select chapter…</option>
                {CHAPTERS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Bloom's level */}
            <div>
              <label style={labelStyle}>Bloom's Level (optional)</label>
              <select style={inputStyle} value={form.bloomLevel} onChange={e => set('bloomLevel', e.target.value ? Number(e.target.value) : '')}>
                <option value="">Any level</option>
                {Object.entries(BLOOM_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{k} — {v}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Topic */}
          <div>
            <label style={labelStyle}>Topic</label>
            <input style={inputStyle} type="text" placeholder="e.g. Electrochemical Cells"
              value={form.topic} onChange={e => set('topic', e.target.value)} />
          </div>

          {/* Sub-topic */}
          <div>
            <label style={labelStyle}>Sub-topic (optional — for precise matching)</label>
            <input style={inputStyle} type="text" placeholder="e.g. EMF Calculation using Nernst Equation"
              value={form.subTopic} onChange={e => set('subTopic', e.target.value)} />
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Description (optional)</label>
            <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
              placeholder="What concept does this video cover?"
              value={form.description} onChange={e => set('description', e.target.value)} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 22, justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn-ghost" style={{ fontSize: 12 }}>Cancel</button>
          <button onClick={handleSave} className="btn-primary" disabled={saving || !form.title || !form.chapter || !form.youtubeUrl}
            style={{ fontSize: 12 }}>
            {saving ? 'Saving…' : (initial ? 'Save Changes' : 'Add Video')}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main VideoManager ────────────────────────────────────────────────────────
const VideoManager = () => {
  const [videos,      setVideos]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [showForm,    setShowForm]    = useState(false);
  const [editTarget,  setEditTarget]  = useState(null);
  const [filterChapter, setFilterChapter] = useState('All');

  const fetchVideos = async () => {
    setLoading(true); setError('');
    try {
      const res = await api.get('/api/videos');
      setVideos(Array.isArray(res.data) ? res.data : []);
    } catch { setError('Failed to load videos. Server may be unavailable.'); }
    finally   { setLoading(false); }
  };

  useEffect(() => { fetchVideos(); }, []);

  const handleAdd = async (form) => {
    await api.post('/api/videos', { ...form, bloomLevel: form.bloomLevel || null });
    setShowForm(false);
    fetchVideos();
  };

  const handleEdit = async (form) => {
    await api.put(`/api/videos/${editTarget.id}`, { ...form, bloomLevel: form.bloomLevel || null });
    setEditTarget(null);
    fetchVideos();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this video resource?')) return;
    await api.delete(`/api/videos/${id}`);
    fetchVideos();
  };

  const allChapters = ['All', ...new Set(videos.map(v => v.chapter).filter(Boolean))];
  const filtered = filterChapter === 'All' ? videos : videos.filter(v => v.chapter === filterChapter);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22, maxWidth: 900 }}>

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 className="heading-xl" style={{ marginBottom: 4 }}>Video Library</h2>
          <p className="text-sub">
            Register YouTube video URLs tagged to chapters & Bloom's levels. Uploaded questions auto-link to matching videos.
          </p>
        </div>
        <button className="btn-primary" onClick={() => { setEditTarget(null); setShowForm(true); }}>
          <PlusIcon /> Add Video
        </button>
      </div>

      {/* Chapter filter tabs */}
      {videos.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {allChapters.map(ch => (
            <button
              key={ch}
              onClick={() => setFilterChapter(ch)}
              style={{
                fontSize: 11, fontWeight: 700, padding: '5px 14px', borderRadius: 20, cursor: 'pointer',
                background: filterChapter === ch ? 'rgba(168,85,247,0.25)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${filterChapter === ch ? 'rgba(168,85,247,0.5)' : 'rgba(255,255,255,0.08)'}`,
                color: filterChapter === ch ? '#c4b5fd' : '#7c6fa0',
                transition: 'all 0.2s',
              }}
            >{ch === 'All' ? `All (${videos.length})` : ch}</button>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div style={{ padding: 60, textAlign: 'center' }}>
          <svg className="spin" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2">
            <path d="M21 12a9 9 0 11-6.219-8.56"/>
          </svg>
        </div>
      ) : error ? (
        <div className="glass-panel" style={{ padding: 24, textAlign: 'center', color: '#f87171', fontSize: 13 }}>{error}</div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel" style={{ padding: 48, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 14 }}>🎬</div>
          <div style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 800, fontSize: 16, color: '#f0eaff', marginBottom: 8 }}>
            {videos.length === 0 ? 'No videos in your library yet' : 'No videos for this chapter'}
          </div>
          <p className="text-sub" style={{ marginBottom: 20, maxWidth: 380, margin: '0 auto 20px' }}>
            Add unlisted YouTube links here and they will automatically be attached to matching questions when you upload PDFs.
          </p>
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            <PlusIcon /> Add Your First Video
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {filtered.map(v => (
            <div key={v.id} className="glass-inner" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Thumbnail preview from YouTube */}
              <div style={{
                height: 130, borderRadius: 10, overflow: 'hidden',
                background: 'rgba(0,0,0,0.4)', position: 'relative',
              }}>
                {v.youtubeUrl && (
                  <img
                    src={`https://img.youtube.com/vi/${extractYTId(v.youtubeUrl)}/hqdefault.jpg`}
                    alt={v.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                )}
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.7))',
                }}>
                  <a href={v.youtubeUrl} target="_blank" rel="noreferrer" style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: 'rgba(168,85,247,0.9)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', color: '#fff', textDecoration: 'none',
                  }}>
                    <VideoIcon />
                  </a>
                </div>
              </div>

              {/* Info */}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#f0eaff', marginBottom: 4, lineHeight: 1.35 }}>
                  {v.title}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: v.description ? 8 : 0 }}>
                  {v.chapter && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#c4b5fd',
                      background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)',
                      padding: '2px 8px', borderRadius: 999 }}>{v.chapter}</span>
                  )}
                  {v.bloomLevel && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#f0abfc',
                      background: 'rgba(217,70,239,0.1)', border: '1px solid rgba(217,70,239,0.2)',
                      padding: '2px 8px', borderRadius: 999 }}>
                      L{v.bloomLevel} {BLOOM_LABELS[v.bloomLevel]}
                    </span>
                  )}
                </div>
                {v.description && (
                  <p style={{ fontSize: 11, color: '#7c6fa0', lineHeight: 1.5, margin: 0,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {v.description}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <button
                  onClick={() => { setEditTarget(v); setShowForm(true); }}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                    fontSize: 11, fontWeight: 700, padding: '7px 0', borderRadius: 8, cursor: 'pointer',
                    background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)',
                    color: '#c4b5fd',
                  }}>
                  <EditIcon /> Edit
                </button>
                <button
                  onClick={() => handleDelete(v.id)}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                    fontSize: 11, fontWeight: 700, padding: '7px 0', borderRadius: 8, cursor: 'pointer',
                    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                    color: '#fca5a5',
                  }}>
                  <TrashIcon /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showForm && <VideoForm initial={editTarget} onSave={editTarget ? handleEdit : handleAdd} onClose={() => { setShowForm(false); setEditTarget(null); }} />}
    </div>
  );
};

// Extract YouTube video ID from URL
function extractYTId(url) {
  if (!url) return '';
  const match = url.match(/(?:v=|youtu\.be\/)([^&\s?]+)/);
  return match ? match[1] : '';
}

export default VideoManager;
