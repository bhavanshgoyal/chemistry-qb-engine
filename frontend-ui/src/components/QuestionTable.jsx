import { useState, useEffect } from 'react';
import api from '../services/api';

const BADGE = {
  Remembering:  'badge badge-emerald',
  Understanding:'badge badge-teal',
  Applying:     'badge badge-cyan',
  Analyzing:    'badge badge-indigo',
  Evaluating:   'badge badge-violet',
  Creating:     'badge badge-fuchsia',
};

const QuestionTable = ({ refreshTrigger }) => {
  const [questions,   setQuestions]   = useState([]);
  const [searchTerm,  setSearchTerm]  = useState('');
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');

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
      q.topic?.toLowerCase().includes(s)       ||
      q.subTopic?.toLowerCase().includes(s)    ||
      q.bloomsLevel?.toLowerCase().includes(s) ||
      q.questionText?.toLowerCase().includes(s)
    );
  });

  return (
    <div style={{ display:'flex', flexDirection:'column' }}>

      {/* Search */}
      <div style={{ padding:'16px 24px', borderBottom:'1px solid rgba(255,255,255,0.06)', background:'rgba(4,2,16,0.5)' }}>
        <div style={{ position:'relative', width:'100%', maxWidth:340 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4c4168" strokeWidth="2"
            style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className="glass-input"
            style={{ paddingLeft:36, width:'100%' }}
            type="text"
            placeholder="Search topics, taxonomy, questions…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX:'auto', maxHeight:500, overflowY:'auto' }}>
        <table className="q-table">
          <thead>
            <tr>
              <th>Topic &amp; Sub-topic</th>
              <th>Bloom's Level</th>
              <th>Question</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3} style={{ textAlign:'center', padding:'60px 24px' }}>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:14 }}>
                    <svg className="spin" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2">
                      <path d="M21 12a9 9 0 11-6.219-8.56"/>
                    </svg>
                    <span className="text-sub">Loading questions… (waking up server)</span>
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={3} style={{ textAlign:'center', padding:'60px 24px', color:'#fca5a5', fontSize:13, fontWeight:600 }}>
                  {error}
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ textAlign:'center', padding:'60px 24px' }}>
                  <span className="text-dim" style={{ fontSize:13 }}>
                    {searchTerm
                      ? 'No questions match your search.'
                      : 'No questions yet — upload a document to generate some!'}
                  </span>
                </td>
              </tr>
            ) : (
              filtered.map((q, i) => (
                <tr key={q.id || i}>
                  <td style={{ whiteSpace:'nowrap', minWidth:160 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:'#e2d9f3', textShadow:'0 1px 8px rgba(0,0,0,0.5)' }}>
                      {q.topic}
                    </div>
                    <div className="text-sub" style={{ marginTop:3 }}>{q.subTopic}</div>
                  </td>
                  <td style={{ whiteSpace:'nowrap' }}>
                    <span className={BADGE[q.bloomsLevel] || 'badge badge-default'}>
                      {q.bloomsLevel || 'N/A'}
                    </span>
                  </td>
                  <td style={{ maxWidth:480 }}>
                    <p style={{ fontSize:12, fontWeight:500, color:'#a89cc8', lineHeight:1.6, margin:0,
                      display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                      {q.questionText}
                    </p>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Count footer */}
      {!loading && !error && filtered.length > 0 && (
        <div style={{
          padding:'10px 24px', borderTop:'1px solid rgba(255,255,255,0.05)',
          background:'rgba(4,2,16,0.65)', fontSize:11, fontWeight:600, color:'#4c4168',
          display:'flex', justifyContent:'space-between',
        }}>
          <span>
            Showing <strong style={{ color:'#c4b5fd' }}>{filtered.length}</strong>{' '}
            question{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
};

export default QuestionTable;
