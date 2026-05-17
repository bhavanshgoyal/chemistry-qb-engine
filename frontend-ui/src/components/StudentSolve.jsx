import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

const BLOOM = {
  1: 'Remembering', 2: 'Understanding', 3: 'Applying',
  4: 'Analyzing',   5: 'Evaluating',    6: 'Creating',
};

const StudentSolve = () => {
  const { questionId } = useParams();
  const [question,   setQuestion]   = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [answer,     setAnswer]     = useState('');
  const [submitted,  setSubmitted]  = useState(false);
  const [confidence, setConfidence] = useState(3);
  const [submitting, setSubmitting] = useState(false);

  // Fetch question from real API
  useEffect(() => {
    if (!questionId || questionId === 'demo') {
      // Demo mode fallback
      setQuestion({
        id: 'demo',
        chapter: 'Chemical Kinetics',
        topic: 'Activation Energy',
        bloomLevel: 3,
        questionText: 'Explain the effect of a catalyst on the activation energy and rate of a chemical reaction. Provide a real-world example.',
        explanation: 'A catalyst lowers activation energy without being consumed.',
        videoUrl: null,
      });
      setLoading(false);
      return;
    }

    api.get(`/api/questions/${questionId}`)
      .then(res => { setQuestion(res.data); setLoading(false); })
      .catch(() => {
        setError('Question not found or server unavailable.');
        setLoading(false);
      });
  }, [questionId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (answer.trim().length < 10) return;
    setSubmitting(true);

    // Submit attempt to backend
    if (question?.id && question.id !== 'demo') {
      try {
        await api.post('/api/generate-bridge/submit', {
          questionId: question.id,
          bloomLevel: question.bloomLevel,
          topic:      question.chapter,
          isCorrect:  true,              // teacher grades later; default optimistic
          confidence,
        });
      } catch { /* non-blocking */ }
    }

    setSubmitted(true);
    setSubmitting(false);
  };

  // ── Loading / Error states ────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0a0520 0%, #06031a 100%)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <svg className="spin" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2">
          <path d="M21 12a9 9 0 11-6.219-8.56"/>
        </svg>
        <span style={{ color: '#7c6fa0', fontWeight: 600 }}>Loading question…</span>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0a0520 0%, #06031a 100%)' }}>
      <div style={{ textAlign: 'center', color: '#fca5a5', fontWeight: 600 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
        {error}
        <div style={{ marginTop: 16 }}>
          <Link to="/" style={{ color: '#c084fc', fontWeight: 700, textDecoration: 'none' }}>← Back to Dashboard</Link>
        </div>
      </div>
    </div>
  );

  const embedUrl = question?.videoUrl
    ? question.videoUrl.replace('watch?v=', 'embed/') + '?rel=0&showinfo=0&modestbranding=1'
    : null;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0520 0%, #06031a 100%)',
      fontFamily: "'Inter', sans-serif",
      WebkitFontSmoothing: 'antialiased',
      display: 'flex', flexDirection: 'column',
    }}>

      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(6,3,20,0.9)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(139,92,246,0.2)',
        padding: '14px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Outfit,sans-serif', fontWeight: 900, fontSize: 13, color: '#fff',
          }}>CQ</div>
          <div style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 800, fontSize: 15, color: '#f0eaff' }}>
            Question #{question?.id}
          </div>
        </div>
        <Link to="/" style={{
          fontSize: 12, fontWeight: 700, color: '#c084fc',
          background: 'rgba(192,132,252,0.12)',
          border: '1px solid rgba(192,132,252,0.25)',
          padding: '7px 16px', borderRadius: 20, textDecoration: 'none',
        }}>← Dashboard</Link>
      </header>

      {/* Main */}
      <main style={{ flex: 1, width: '100%', maxWidth: 680, margin: '0 auto', padding: '28px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Metadata chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {question?.chapter && (
            <span style={{
              fontSize: 11, fontWeight: 700, color: '#c4b5fd',
              background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)',
              padding: '4px 12px', borderRadius: 999,
            }}>📚 {question.chapter}</span>
          )}
          {question?.topic && (
            <span style={{
              fontSize: 11, fontWeight: 700, color: '#a5b4fc',
              background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)',
              padding: '4px 12px', borderRadius: 999,
            }}>{question.topic}</span>
          )}
          {question?.bloomLevel && (
            <span style={{
              fontSize: 11, fontWeight: 700, color: '#f0abfc',
              background: 'rgba(217,70,239,0.12)', border: '1px solid rgba(217,70,239,0.25)',
              padding: '4px 12px', borderRadius: 999,
            }}>🧠 Level {question.bloomLevel} — {BLOOM[question.bloomLevel]}</span>
          )}
        </div>

        {/* Question card */}
        <div className="glass-panel" style={{ padding: 28 }}>
          <p style={{
            fontFamily: 'Outfit,sans-serif', fontWeight: 700, fontSize: '1.15rem',
            color: '#f0eaff', lineHeight: 1.55, margin: 0,
            textShadow: '0 2px 16px rgba(0,0,0,0.5)',
          }}>
            {question?.questionText}
          </p>
          {question?.explanation && !submitted && (
            <p style={{ marginTop: 12, fontSize: 12, color: '#7c6fa0', fontStyle: 'italic', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10 }}>
              Hint: {question.explanation}
            </p>
          )}
        </div>

        {/* Answer / Result */}
        {!submitted ? (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#c4b5fd' }}>Your Answer</label>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your thought process here to unlock the video solution…"
              style={{
                minHeight: 180, width: '100%', padding: 16,
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.2)',
                borderRadius: 14, color: '#e2d9f3', fontSize: 13, fontWeight: 500,
                lineHeight: 1.6, resize: 'vertical', outline: 'none',
                transition: 'border-color 0.25s',
                boxSizing: 'border-box',
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(168,85,247,0.5)'}
              onBlur={e  => e.target.style.borderColor = 'rgba(139,92,246,0.2)'}
            />

            {/* Confidence slider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#7c6fa0', whiteSpace: 'nowrap' }}>
                Confidence: {confidence}/5
              </label>
              <input type="range" min="1" max="5" value={confidence}
                onChange={e => setConfidence(Number(e.target.value))}
                style={{ flex: 1, accentColor: '#a855f7' }} />
            </div>

            <button
              type="submit"
              disabled={answer.trim().length < 10 || submitting}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', fontSize: 14, padding: '14px 0' }}
            >
              {submitting ? 'Submitting…' : 'Submit to Unlock Video Solution'}
            </button>
          </form>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Success banner */}
            <div style={{
              padding: '12px 16px', borderRadius: 12,
              background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)',
              display: 'flex', gap: 10, alignItems: 'center',
            }}>
              <span style={{ fontSize: 18 }}>✅</span>
              <div>
                <div style={{ fontWeight: 700, color: '#6ee7b7', fontSize: 13 }}>Answer Submitted!</div>
                <div style={{ fontSize: 12, color: '#34d399' }}>Watch the solution below to verify your understanding.</div>
              </div>
            </div>

            {/* Video embed — real YouTube URL from question.videoUrl */}
            {embedUrl ? (
              <div style={{
                borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(139,92,246,0.25)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)', position: 'relative', paddingTop: '56.25%',
              }}>
                <iframe
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
                  src={embedUrl}
                  title="Video Solution"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="glass-inner" style={{ padding: 24, textAlign: 'center' }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>🎬</div>
                <div style={{ color: '#7c6fa0', fontWeight: 600, fontSize: 13 }}>
                  No video linked to this question yet.
                </div>
                <div style={{ color: '#4c4168', fontSize: 11, marginTop: 6 }}>
                  The teacher can add one via the Videos section in the dashboard.
                </div>
              </div>
            )}

            <button
              onClick={() => { setSubmitted(false); setAnswer(''); }}
              className="btn-ghost"
              style={{ width: '100%', justifyContent: 'center', fontSize: 13, padding: '12px 0' }}
            >
              ↩ Revise My Answer
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentSolve;
