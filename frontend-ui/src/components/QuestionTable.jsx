import { useState, useEffect } from 'react';
import api from '../services/api';

// Bloom level integer → human label + badge class
const BLOOM = {
  1: { label: 'Remembering',    cls: 'badge badge-emerald' },
  2: { label: 'Understanding',  cls: 'badge badge-teal'    },
  3: { label: 'Applying',       cls: 'badge badge-cyan'    },
  4: { label: 'Analyzing',      cls: 'badge badge-indigo'  },
  5: { label: 'Evaluating',     cls: 'badge badge-violet'  },
  6: { label: 'Creating',       cls: 'badge badge-fuchsia' },
};

const QuestionTable = ({ refreshTrigger }) => {
  const [questions,  setQuestions]  = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  const fetchQuestions = async () => {
    setLoading(true); setError('');
    try {
      const res  = await api.get('/api/questions');
      const data = res.data.content || res.data || [];
      setQuestions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch questions. The server might be cold-starting.');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchQuestions(); }, [refreshTrigger]);

  const filtered = questions.filter((q) => {
    const s = searchTerm.toLowerCase();
    return (
      q.chapter?.toLowerCase().includes(s)      ||
      q.topic?.toLowerCase().includes(s)        ||
      q.subTopic?.toLowerCase().includes(s)     ||
      // FIX: use bloomLevel (integer) not bloomsLevel
      String(q.bloomLevel)?.includes(s)         ||
      BLOOM[q.bloomLevel]?.label.toLowerCase().includes(s) ||
      q.questionText?.toLowerCase().includes(s)
    );
  });

  const bloom = (level) => BLOOM[level] || { label: 'N/A', cls: 'badge badge-default' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>

      {/* Search */}
      <div style={{ padding: '14px 22px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(4,2,16,0.5)' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: 340 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4c4168" strokeWidth="2"
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className="glass-input" style={{ paddingLeft: 36, width: '100%' }}
            type="text" placeholder="Search chapter, topic, bloom level…"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto', maxHeight: 520, overflowY: 'auto' }}>
        <table className="q-table">
          <thead>
            <tr>
              <th>Chapter</th>
              <th>Topic / Sub-topic</th>
              <th>Bloom's Level</th>
              <th>Question</th>
              <th>Video</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '60px 24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                  <svg className="spin" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2">
                    <path d="M21 12a9 9 0 11-6.219-8.56"/>
                  </svg>
                  <span className="text-sub">Loading questions… (waking up server)</span>
                </div>
              </td></tr>
            ) : error ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '60px 24px', color: '#fca5a5', fontSize: 13, fontWeight: 600 }}>
                {error}
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '60px 24px' }}>
                <span className="text-dim" style={{ fontSize: 13 }}>
                  {searchTerm ? 'No questions match your search.' : 'No questions yet — upload a document to generate some!'}
                </span>
              </td></tr>
            ) : (
              filtered.map((q, i) => {
                const b = bloom(q.bloomLevel);
                return (
                  <tr key={q.id || i}>
                    <td style={{ whiteSpace: 'nowrap', minWidth: 130 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#e2d9f3' }}>{q.chapter || '—'}</div>
                    </td>
                    <td style={{ minWidth: 140 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#c4b5fd' }}>{q.topic || '—'}</div>
                      {/* FIX: subTopic (camelCase) now exists on entity */}
                      {q.subTopic && <div className="text-sub" style={{ marginTop: 2 }}>{q.subTopic}</div>}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span className={b.cls}>{b.label}</span>
                    </td>
                    <td style={{ maxWidth: 400 }}>
                      <p style={{
                        fontSize: 12, fontWeight: 500, color: '#a89cc8', lineHeight: 1.6, margin: 0,
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      }}>
                        {q.questionText || '—'}
                      </p>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {q.videoUrl ? (
                        <a href={q.videoUrl} target="_blank" rel="noreferrer"
                          style={{ fontSize: 11, fontWeight: 700, color: '#a855f7', textDecoration: 'none',
                            padding: '4px 10px', borderRadius: 6, background: 'rgba(168,85,247,0.12)',
                            border: '1px solid rgba(168,85,247,0.3)' }}>
                          ▶ Watch
                        </a>
                      ) : (
                        <span style={{ fontSize: 11, color: '#4c4168' }}>No video</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer count */}
      {!loading && !error && filtered.length > 0 && (
        <div style={{
          padding: '9px 22px', borderTop: '1px solid rgba(255,255,255,0.05)',
          background: 'rgba(4,2,16,0.65)', fontSize: 11, fontWeight: 600, color: '#4c4168',
        }}>
          Showing <strong style={{ color: '#c4b5fd' }}>{filtered.length}</strong>{' '}
          of <strong style={{ color: '#c4b5fd' }}>{questions.length}</strong> questions
        </div>
      )}
    </div>
  );
};

export default QuestionTable;
