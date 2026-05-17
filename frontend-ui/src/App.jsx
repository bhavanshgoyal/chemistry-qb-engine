import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import FileUploader from './components/FileUploader';
import QuestionTable from './components/QuestionTable';
import StudentSolve from './components/StudentSolve';
import VideoManager from './components/VideoManager';

/* ─── Icons (inline SVG so size is always explicit) ─────── */
const Icon = {
  video:     (s=18) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>,
  dashboard: (s=18) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  upload:    (s=18) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/></svg>,
  book:      (s=18) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>,
  flask:     (s=18) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3h6m-6 0v6L5 21h14L15 9V3"/></svg>,
  atom:      (s=18) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><path d="M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9-4.54-4.52-9.87-6.54-11.9-4.5-2.04 2.03-.02 7.36 4.5 11.9 4.54 4.52 9.87 6.54 11.9 4.5z"/><path d="M15.7 15.7c4.52-4.54 6.54-9.87 4.5-11.9-2.03-2.04-7.36-.02-11.9 4.5-4.52 4.54-6.54 9.87-4.5 11.9 2.03 2.04 7.36.02 11.9-4.5z"/></svg>,
  hat:       (s=18) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>,
  beaker:    (s=18) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 3h15"/><path d="M6 3v16a2 2 0 002 2h8a2 2 0 002-2V3"/><path d="M6 14h12"/></svg>,
  refresh:   (s=16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>,
  search:    (s=14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  trend:     (s=10) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  zap:       (s=12) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  star:      (s=14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  clock:     (s=14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  layers:    (s=16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
  chevron:   (s=13) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  sparkle:   (s=10) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3c-1 4-4 6-9 7 5 1 8 3 9 7 1-4 4-6 9-7-5-1-8-3-9-7z"/></svg>,
  error:     (s=15) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  check:     (s=15) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  lightning: (s=14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
};

/* ─── Sidebar Nav Link ──────────────────────────────────── */
function SideLink({ to, iconFn, label, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
    >
      {({ isActive }) => (
        <>
          <span style={{ color: isActive ? '#c084fc' : 'inherit', display:'flex', alignItems:'center' }}>
            {iconFn(17)}
          </span>
          <span style={{ flex: 1 }}>{label}</span>
          <span style={{ opacity: 0.4, display:'flex', alignItems:'center', transition:'opacity 0.2s' }}>
            {Icon.chevron(12)}
          </span>
        </>
      )}
    </NavLink>
  );
}

/* ─── Stat Card ─────────────────────────────────────────── */
function StatCard({ iconFn, label, value, sub, grad, ring, barGrad, badgeColor, delay }) {
  return (
    <div className={`stat-card anim-up d-${delay}`}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:18 }}>
        <div className="icon-box" style={{ background: grad }}>
          <span style={{ color:'#fff', display:'flex' }}>{iconFn(22)}</span>
        </div>
        <span style={{
          display:'inline-flex', alignItems:'center', gap:4,
          fontSize:10, fontWeight:700, padding:'4px 10px',
          borderRadius:999, background: badgeColor.bg, color: badgeColor.text,
          border: `1px solid ${badgeColor.border}`
        }}>
          {Icon.trend(9)} Live
        </span>
      </div>

      <div className="text-value">{value}</div>
      <div className="text-label" style={{ marginTop:6 }}>{label}</div>
      {sub && <div className="text-sub" style={{ marginTop:3 }}>{sub}</div>}

      <div className="prog-track">
        <div className="prog-fill" style={{ background: barGrad }} />
      </div>
    </div>
  );
}

/* ─── Dashboard Page ────────────────────────────────────── */
function DashboardPage({ refreshTrigger, triggerRefresh }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24 }}>

      {/* Hero */}
      <div className="glass-panel anim-up" style={{ padding:'36px 36px', position:'relative', overflow:'hidden' }}>
        {/* Decorative blobs */}
        <div style={{ position:'absolute', top:-60, right:-60, width:280, height:280, borderRadius:'50%', background:'rgba(124,58,237,0.12)', filter:'blur(50px)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:-40, left:-40, width:200, height:200, borderRadius:'50%', background:'rgba(79,70,229,0.12)', filter:'blur(40px)', pointerEvents:'none' }} />

        <div style={{ position:'relative', zIndex:1, display:'flex', flexWrap:'wrap', gap:24, alignItems:'center', justifyContent:'space-between' }}>
          <div>
            {/* Badge pill */}
            <span style={{
              display:'inline-flex', alignItems:'center', gap:6,
              fontSize:10, fontWeight:800, letterSpacing:'0.14em', textTransform:'uppercase',
              color:'#c084fc', background:'rgba(192,132,252,0.12)',
              padding:'6px 14px', borderRadius:999, border:'1px solid rgba(192,132,252,0.25)',
              marginBottom:16
            }}>
              {Icon.sparkle(10)} AI-Powered · Gemini 1.5 Flash
            </span>

            <div className="heading-xl">
              Chemistry{' '}
              <span style={{ background:'linear-gradient(135deg,#c084fc,#818cf8)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
                QB Engine
              </span>
            </div>
            <p className="text-body" style={{ marginTop:12, maxWidth:480 }}>
              Upload your CBSE Class 12 syllabus or notes. Gemini 1.5 Flash intelligently extracts
              topics and synthesises a fully tagged question bank.
            </p>
          </div>

          <button className="btn-ghost" onClick={triggerRefresh} style={{ flexShrink:0 }}>
            {Icon.refresh(15)}
            Refresh Data
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px,1fr))', gap:18 }}>
        <StatCard
          iconFn={Icon.book} label="Total Questions" value="—" sub="Synced from DB" delay={150}
          grad="linear-gradient(135deg,#7c3aed,#4f46e5)"
          barGrad="linear-gradient(90deg,#a855f7,#6366f1)"
          badgeColor={{ bg:'rgba(139,92,246,0.18)', text:'#c4b5fd', border:'rgba(139,92,246,0.3)' }}
        />
        <StatCard
          iconFn={Icon.atom} label="Topics Covered" value="12" sub="CBSE Chapters" delay={250}
          grad="linear-gradient(135deg,#7e22ce,#6d28d9)"
          barGrad="linear-gradient(90deg,#8b5cf6,#7c3aed)"
          badgeColor={{ bg:'rgba(124,58,237,0.18)', text:'#ddd6fe', border:'rgba(124,58,237,0.3)' }}
        />
        <StatCard
          iconFn={Icon.hat} label="Bloom's Levels" value="6" sub="Taxonomy Layers" delay={350}
          grad="linear-gradient(135deg,#4338ca,#1d4ed8)"
          barGrad="linear-gradient(90deg,#6366f1,#3b82f6)"
          badgeColor={{ bg:'rgba(99,102,241,0.18)', text:'#a5b4fc', border:'rgba(99,102,241,0.3)' }}
        />
      </div>

      {/* Upload */}
      <div className="glass-panel anim-up d-450">
        <div style={{ padding:'22px 28px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', gap:12 }}>
          <div className="icon-box" style={{ background:'linear-gradient(135deg,#7c3aed,#4f46e5)', width:38, height:38, borderRadius:10 }}>
            <span style={{ color:'#fff', display:'flex' }}>{Icon.upload(16)}</span>
          </div>
          <div>
            <div className="heading-sm" style={{ fontSize:'0.95rem' }}>Upload Learning Material</div>
            <div className="text-sub">PDF or TXT · Max 50 MB</div>
          </div>
        </div>
        <div style={{ padding:'24px 28px' }}>
          <FileUploader onUploadSuccess={triggerRefresh} />
        </div>
      </div>

      {/* Question Bank */}
      <div className="glass-panel" style={{ overflow:'hidden' }}>
        <div style={{ padding:'22px 28px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', gap:12 }}>
          <div className="icon-box" style={{ background:'linear-gradient(135deg,#6d28d9,#7c3aed)', width:38, height:38, borderRadius:10 }}>
            <span style={{ color:'#fff', display:'flex' }}>{Icon.layers(16)}</span>
          </div>
          <div>
            <div className="heading-sm" style={{ fontSize:'0.95rem' }}>Question Bank</div>
            <div className="text-sub">AI-generated · CBSE tagged</div>
          </div>
        </div>
        <QuestionTable refreshTrigger={refreshTrigger} />
      </div>
    </div>
  );
}

/* ─── Upload Page ───────────────────────────────────────── */
function UploadPage({ triggerRefresh }) {
  return (
    <div className="anim-up" style={{ maxWidth:640, margin:'0 auto' }}>
      <div className="glass-panel" style={{ padding:'36px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:28, paddingBottom:22, borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
          <div className="icon-box glow-pulse" style={{ background:'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>
            <span style={{ color:'#fff', display:'flex' }}>{Icon.upload(20)}</span>
          </div>
          <div>
            <div className="heading-sm">Upload PDFs</div>
            <div className="text-sub">AI-powered · multiple files at once</div>
          </div>
        </div>
        <FileUploader onUploadSuccess={triggerRefresh} />
      </div>
    </div>
  );
}

/* ─── Question Bank Page ────────────────────────────────── */
function QuestionBankPage({ refreshTrigger, triggerRefresh }) {
  return (
    <div className="anim-up">
      <div className="glass-panel" style={{ overflow:'hidden' }}>
        <div style={{ padding:'22px 28px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div className="icon-box" style={{ background:'linear-gradient(135deg,#6d28d9,#7c3aed)' }}>
              <span style={{ color:'#fff', display:'flex' }}>{Icon.book(20)}</span>
            </div>
            <div>
              <div className="heading-sm">Question Bank</div>
              <div className="text-sub">Browse, filter &amp; manage all questions</div>
            </div>
          </div>
          <button className="btn-ghost" onClick={triggerRefresh}>
            {Icon.refresh(14)} Refresh
          </button>
        </div>
        <QuestionTable refreshTrigger={refreshTrigger} />
      </div>
    </div>
  );
}

/* ─── Teacher Dashboard Shell ───────────────────────────── */
function TeacherDashboard() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const triggerRefresh = () => setRefreshTrigger(p => p + 1);

  const today = new Date().toLocaleDateString('en-IN', {
    weekday:'long', year:'numeric', month:'long', day:'numeric'
  });

  return (
    <div className="app-shell">
      <div className="app-overlay" />

      {/* ═══ SIDEBAR ═══ */}
      <aside className="sidebar anim-left">
        {/* Logo */}
        <div style={{ padding:'24px 20px 20px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', gap:12, flexShrink:0 }}>
          <div className="icon-box glow-pulse" style={{ background:'linear-gradient(135deg,#7c3aed,#4f46e5)', width:42, height:42, borderRadius:12 }}>
            <span style={{ color:'#fff', display:'flex' }}>{Icon.flask(18)}</span>
          </div>
          <div>
            <div style={{ fontFamily:'Outfit,sans-serif', fontWeight:800, fontSize:14, color:'#f5f0ff', textShadow:'0 1px 10px rgba(0,0,0,0.5)' }}>Chemistry QB</div>
            <div style={{ fontSize:9, fontWeight:800, letterSpacing:'0.2em', textTransform:'uppercase', color:'#a855f7' }}>Engine v1</div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex:1, padding:'20px 10px', overflowY:'auto' }}>
          <div className="nav-label-group">Main</div>
          <SideLink to="/"          iconFn={Icon.dashboard} label="Dashboard"    end />
          <SideLink to="/upload"    iconFn={Icon.upload}    label="Upload PDFs"      />
          <SideLink to="/questions" iconFn={Icon.book}      label="Question Bank"    />
          <SideLink to="/videos"    iconFn={Icon.video}     label="Video Library"    />
          <div className="nav-label-group" style={{ marginTop:20 }}>Student</div>
          <SideLink to="/solve/demo" iconFn={Icon.beaker} label="Student Solve" />
        </nav>

        {/* Bottom card */}
        <div style={{ padding:'12px 12px 16px', borderTop:'1px solid rgba(255,255,255,0.05)', flexShrink:0 }}>
          <div className="glass-inner" style={{ padding:'12px 14px', display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:32, height:32, borderRadius:8, background:'linear-gradient(135deg,rgba(124,58,237,0.6),rgba(79,70,229,0.6))', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <span style={{ color:'#d8b4fe' }}>{Icon.star(13)}</span>
            </div>
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:'#e2d9f3' }}>CBSE Class 12</div>
              <div style={{ fontSize:10, color:'#7c6fa0' }}>Gemini 1.5 Flash</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ═══ MAIN COLUMN ═══ */}
      <div className="main-col">

        {/* Top bar */}
        <header className="topbar">
          {/* Date */}
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ color:'#4c4168', display:'flex' }}>{Icon.clock(14)}</span>
            <span style={{ fontSize:12, color:'#7c6fa0', fontWeight:600 }}>{today}</span>
          </div>

          {/* Right: search + avatar */}
          <div style={{ display:'flex', alignItems:'center', gap:12, marginLeft:'auto' }}>
            <div style={{ position:'relative' }}>
              <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#4c4168', display:'flex' }}>
                {Icon.search(14)}
              </span>
              <input className="glass-input" type="text" placeholder="Quick search…" />
            </div>
            <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#7c3aed,#4f46e5)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 0 2px rgba(139,92,246,0.3)', flexShrink:0 }}>
              <span style={{ color:'#fff', display:'flex' }}>{Icon.hat(15)}</span>
            </div>
          </div>
        </header>

        {/* Page */}
        <main className="page-content">
          <Routes>
            <Route path="/"          element={<DashboardPage refreshTrigger={refreshTrigger} triggerRefresh={triggerRefresh} />} />
            <Route path="/upload"    element={<UploadPage    triggerRefresh={triggerRefresh} />} />
            <Route path="/questions" element={<QuestionBankPage refreshTrigger={refreshTrigger} triggerRefresh={triggerRefresh} />} />
            <Route path="/videos"    element={<VideoManager />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="page-footer">
          <span className="text-dim">Chemistry QB Engine © {new Date().getFullYear()} — CBSE Class 12 EdTech</span>
          <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, fontWeight:700, color:'rgba(139,92,246,0.7)' }}>
            {Icon.zap(10)} Powered by Gemini 1.5 Flash
          </span>
        </footer>
      </div>
    </div>
  );
}

/* ─── App Root ──────────────────────────────────────────── */
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/*"                 element={<TeacherDashboard />} />
        <Route path="/solve/:questionId" element={<StudentSolve />} />
      </Routes>
    </Router>
  );
}

export default App;
