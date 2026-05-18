import { useState, useRef } from 'react';
import api from '../services/api';

const UploadIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
    <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/>
  </svg>
);
const XIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const FileIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
  </svg>
);

const POLL_INTERVAL = 3000; // ms

const FileUploader = ({ onUploadSuccess }) => {
  const [dragActive, setDragActive]     = useState(false);
  const [files, setFiles]               = useState([]);        // MultiFile list
  const [loading, setLoading]           = useState(false);
  const [status, setStatus]             = useState('');        // 'uploading'|'processing'|'success'|'error'
  const [statusMsg, setStatusMsg]       = useState('');
  const [errorMsg, setErrorMsg]         = useState('');
  const [savedCount, setSavedCount]     = useState(0);
  const inputRef = useRef(null);
  const pollRef  = useRef(null);

  // ── Drag/Drop ──────────────────────────────────────────────────────────────
  const handleDrag = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };
  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.length) addFiles(Array.from(e.dataTransfer.files));
  };
  const handleChange = (e) => {
    if (e.target.files?.length) addFiles(Array.from(e.target.files));
  };

  const addFiles = (incoming) => {
    const valid = incoming.filter(f => {
      const ext = f.name.split('.').pop().toLowerCase();
      return ['pdf', 'txt'].includes(ext);
    });
    const invalid = incoming.length - valid.length;
    if (invalid > 0) setErrorMsg(`${invalid} file(s) skipped — only .pdf and .txt allowed.`);
    else setErrorMsg('');
    setFiles(prev => {
      const existing = new Set(prev.map(f => f.name + f.size));
      return [...prev, ...valid.filter(f => !existing.has(f.name + f.size))];
    });
  };

  const removeFile = (idx) => setFiles(prev => prev.filter((_, i) => i !== idx));

  // ── Upload ─────────────────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!files.length) return;
    setLoading(true); setStatus('uploading'); setErrorMsg('');
    setStatusMsg(`Uploading ${files.length} document(s)…`); setSavedCount(0);

    const fd = new FormData();
    files.forEach(f => fd.append('files', f));   // 'files' matches @RequestParam("files") MultipartFile[]

    try {
      const res = await api.post('/api/questions/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.status === 202 && res.data.jobId) {
        setStatus('processing');
        setStatusMsg('AI is analysing your documents…');
        pollStatus(res.data.jobId);
      } else {
        finishSuccess('Done!', 0);
      }
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.response?.data?.message || 'Upload failed. Server may be cold-starting.');
      setLoading(false);
    }
  };

  const pollStatus = (jobId) => {
    clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await api.get(`/api/questions/upload/status/${jobId}`);
        const { status: s, message, totalSaved } = res.data;
        setStatusMsg(message || 'Processing…');
        if (totalSaved) setSavedCount(totalSaved);

        if (s === 'completed' || s === 'completed_with_errors') {
          clearInterval(pollRef.current);
          finishSuccess(message, totalSaved || 0);
        } else if (s === 'failed') {
          clearInterval(pollRef.current);
          setStatus('error');
          setErrorMsg(message || 'Processing failed.');
          setLoading(false);
        }
      } catch { /* keep polling */ }
    }, POLL_INTERVAL);
  };

  const finishSuccess = (msg, count) => {
    setStatus('success');
    setStatusMsg(msg);
    setSavedCount(count);
    setLoading(false);
    setFiles([]);
    onUploadSuccess?.();
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ width: '100%' }}>

      {/* Drop zone */}
      <div
        className={`drop-zone${dragActive ? ' active' : ''}`}
        style={loading ? { opacity: 0.55, pointerEvents: 'none' } : {}}
        onDragEnter={handleDrag} onDragLeave={handleDrag}
        onDragOver={handleDrag} onDrop={handleDrop}
        onClick={!loading ? () => inputRef.current.click() : undefined}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.txt"
          multiple
          onChange={handleChange}
          style={{ display: 'none' }}
        />

        <div style={{
          width: 56, height: 56, borderRadius: 14, marginBottom: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: dragActive ? 'rgba(168,85,247,0.2)' : 'rgba(255,255,255,0.05)',
          color: dragActive ? '#c084fc' : '#7c6fa0', transition: 'all 0.3s',
        }}>
          <UploadIcon />
        </div>

        {files.length === 0 ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#e2d9f3', marginBottom: 6 }}>
              <span style={{ color: '#c084fc' }}>Click to browse</span> or drag &amp; drop
            </div>
            <div className="text-sub" style={{ marginBottom: 18 }}>
              .pdf and .txt · multiple files at once · Max 50 MB each
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); inputRef.current.click(); }}
              style={{
                padding: '8px 20px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                color: '#c4b5fd', background: 'rgba(139,92,246,0.12)',
                border: '1px solid rgba(139,92,246,0.28)', cursor: 'pointer',
              }}
            >
              Browse Files
            </button>
          </div>
        ) : (
          <div style={{ textAlign: 'center', width: '100%' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#c4b5fd', marginBottom: 10 }}>
              {files.length} file{files.length > 1 ? 's' : ''} selected
            </div>
            {/* File list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto', padding: '0 4px' }}>
              {files.map((f, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: 'rgba(255,255,255,0.05)', borderRadius: 10,
                  padding: '7px 12px', border: '1px solid rgba(255,255,255,0.08)',
                }}>
                  <span style={{ color: '#a855f7', display: 'flex', flexShrink: 0 }}><FileIcon /></span>
                  <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: '#e2d9f3', textAlign: 'left',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {f.name}
                  </span>
                  <span style={{ fontSize: 10, color: '#7c6fa0', flexShrink: 0 }}>
                    {(f.size / 1024 / 1024).toFixed(1)}MB
                  </span>
                  <button
                    onClick={() => removeFile(i)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer',
                      color: '#f87171', display: 'flex', padding: 2, borderRadius: 4,
                      flexShrink: 0 }}
                  >
                    <XIcon size={12} />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => inputRef.current.click()}
              style={{
                marginTop: 12, padding: '6px 16px', borderRadius: 8, fontSize: 11,
                fontWeight: 700, color: '#c4b5fd', background: 'rgba(139,92,246,0.1)',
                border: '1px solid rgba(139,92,246,0.25)', cursor: 'pointer',
              }}
            >
              + Add More Files
            </button>
          </div>
        )}
      </div>

      {/* Error */}
      {errorMsg && (
        <div style={{
          marginTop: 12, padding: '10px 14px', borderRadius: 10,
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
          display: 'flex', gap: 8, alignItems: 'flex-start',
        }}>
          <svg width="13" height="13" style={{ color: '#f87171', flexShrink: 0, marginTop: 1 }}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#fca5a5' }}>{errorMsg}</span>
        </div>
      )}

      {/* Processing status */}
      {(status === 'processing' || status === 'uploading') && (
        <div style={{
          marginTop: 12, padding: '10px 14px', borderRadius: 10,
          background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)',
          display: 'flex', gap: 8, alignItems: 'center',
        }}>
          <svg className="spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2.5">
            <path d="M21 12a9 9 0 11-6.219-8.56"/>
          </svg>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#c4b5fd' }}>{statusMsg}</span>
          {savedCount > 0 && (
            <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: '#a855f7' }}>
              {savedCount} saved
            </span>
          )}
        </div>
      )}

      {/* Success */}
      {status === 'success' && (
        <div style={{
          marginTop: 12, padding: '12px 16px', borderRadius: 12,
          background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)',
        }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: savedCount > 0 ? 6 : 0 }}>
            <svg width="14" height="14" style={{ color: '#6ee7b7', flexShrink: 0 }}
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#6ee7b7' }}>
              {statusMsg || 'Upload successful!'}
            </span>
          </div>
          {savedCount > 0 && (
            <div style={{ fontSize: 12, color: '#34d399', fontWeight: 600, paddingLeft: 22 }}>
              🎓 {savedCount} question{savedCount !== 1 ? 's' : ''} added to your question bank
            </div>
          )}
        </div>
      )}

      {/* Submit */}
      <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
        <button
          className="btn-primary"
          onClick={handleUpload}
          disabled={!files.length || loading}
        >
          {loading ? (
            <>
              <svg className="spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 12a9 9 0 11-6.219-8.56"/>
              </svg>
              {status === 'processing' ? 'AI Analysing…' : 'Uploading…'}
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
              Process {files.length > 0 ? `${files.length} Document${files.length > 1 ? 's' : ''}` : 'Documents'}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default FileUploader;
