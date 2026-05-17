import { useState, useRef } from 'react';
import api from '../services/api';

const UploadIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 16 12 12 8 16"/>
    <line x1="12" y1="12" x2="12" y2="21"/>
    <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/>
  </svg>
);
const SpinIcon = () => (
  <svg className="spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M21 12a9 9 0 11-6.219-8.56"/>
  </svg>
);
const LightningIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);

const FileUploader = ({ onUploadSuccess }) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile]             = useState(null);
  const [loading, setLoading]       = useState(false);
  const [status, setStatus]         = useState('');
  const [errorMsg, setErrorMsg]     = useState('');
  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };
  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) validateAndSetFile(e.dataTransfer.files[0]);
  };
  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files?.[0]) validateAndSetFile(e.target.files[0]);
  };
  const validateAndSetFile = (f) => {
    const ext = f.name.split('.').pop().toLowerCase();
    if (['application/pdf','text/plain'].includes(f.type) || ['pdf','txt'].includes(ext)) {
      setFile(f); setErrorMsg('');
    } else {
      setErrorMsg('Please upload a valid .pdf or .txt file.'); setFile(null);
    }
  };
  const handleUpload = async () => {
    if (!file) return;
    setLoading(true); setStatus('uploading'); setErrorMsg('');
    const fd = new FormData(); fd.append('file', file);
    try {
      const res = await api.post('/api/questions/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.status === 202) { setStatus('processing'); pollStatus(res.data.jobId); }
      else { setStatus('success'); setFile(null); onUploadSuccess?.(); }
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.response?.data?.message || 'Upload failed. Server may be cold-starting.');
    } finally { if (status !== 'processing') setLoading(false); }
  };
  const pollStatus = async (jobId) => {
    try {
      const res = await api.get(`/api/questions/upload/status/${jobId}`);
      if (res.data.status === 'completed')    { setStatus('success'); setLoading(false); setFile(null); onUploadSuccess?.(); }
      else if (res.data.status === 'failed')  { setStatus('error'); setErrorMsg(res.data.error || 'Processing failed.'); setLoading(false); }
      else setTimeout(() => pollStatus(jobId), 5000);
    } catch { setStatus('error'); setErrorMsg('Error checking status.'); setLoading(false); }
  };

  return (
    <div style={{ width:'100%' }}>
      {/* Drop zone */}
      <div
        className={`drop-zone${dragActive ? ' active' : ''}`}
        style={loading ? { opacity:0.55, pointerEvents:'none' } : {}}
        onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
        onClick={(!file && !loading) ? () => inputRef.current.click() : undefined}
      >
        <input ref={inputRef} type="file" accept=".pdf,.txt" onChange={handleChange} style={{ display:'none' }} />

        {/* Icon */}
        <div style={{
          width:56, height:56, borderRadius:14, marginBottom:16,
          display:'flex', alignItems:'center', justifyContent:'center',
          background: dragActive ? 'rgba(168,85,247,0.2)' : 'rgba(255,255,255,0.05)',
          color: dragActive ? '#c084fc' : '#7c6fa0',
          transition:'all 0.3s',
        }}>
          <UploadIcon />
        </div>

        {file ? (
          <div style={{ textAlign:'center' }}>
            <div style={{ fontWeight:700, fontSize:14, color:'#f0eaff', marginBottom:4 }}>{file.name}</div>
            <div className="text-sub">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
            <button
              onClick={(e) => { e.stopPropagation(); setFile(null); }}
              style={{ marginTop:10, fontSize:12, fontWeight:700, color:'#f87171', background:'none', border:'none', cursor:'pointer' }}
            >
              ✕ Remove
            </button>
          </div>
        ) : (
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:14, fontWeight:700, color:'#e2d9f3', marginBottom:6 }}>
              <span style={{ color:'#c084fc' }}>Click to browse</span> or drag &amp; drop
            </div>
            <div className="text-sub" style={{ marginBottom:18 }}>Supports .pdf and .txt · Max 50 MB</div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); inputRef.current.click(); }}
              style={{
                padding:'8px 20px', borderRadius:10, fontSize:12, fontWeight:700,
                color:'#c4b5fd', background:'rgba(139,92,246,0.12)',
                border:'1px solid rgba(139,92,246,0.28)', cursor:'pointer', transition:'all 0.25s',
              }}
            >
              Browse Files
            </button>
          </div>
        )}
      </div>

      {/* Error */}
      {errorMsg && (
        <div style={{
          marginTop:14, padding:'12px 16px', borderRadius:12,
          background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)',
          display:'flex', gap:10, alignItems:'flex-start',
        }}>
          <svg width="14" height="14" style={{ color:'#f87171', flexShrink:0, marginTop:1 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span style={{ fontSize:12, fontWeight:600, color:'#fca5a5' }}>{errorMsg}</span>
        </div>
      )}

      {/* Success */}
      {status === 'success' && (
        <div style={{
          marginTop:14, padding:'12px 16px', borderRadius:12,
          background:'rgba(52,211,153,0.1)', border:'1px solid rgba(52,211,153,0.25)',
          display:'flex', gap:10, alignItems:'flex-start',
        }}>
          <svg width="14" height="14" style={{ color:'#6ee7b7', flexShrink:0, marginTop:1 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <span style={{ fontSize:12, fontWeight:600, color:'#6ee7b7' }}>File uploaded and processed successfully!</span>
        </div>
      )}

      {/* Submit */}
      <div style={{ marginTop:20, display:'flex', justifyContent:'flex-end' }}>
        <button
          className="btn-primary"
          onClick={handleUpload}
          disabled={!file || loading}
        >
          {loading ? (
            <><SpinIcon />{status === 'processing' ? 'AI Synthesising…' : 'Uploading…'}</>
          ) : (
            <><LightningIcon />Process Document</>
          )}
        </button>
      </div>
    </div>
  );
};

export default FileUploader;
