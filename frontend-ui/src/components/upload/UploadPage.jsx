import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Upload,
  X,
  FileText,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { uploadDocuments, pollUploadStatus, getApiErrorMessage } from '../../services/api';
import UploadProgressStages from './UploadProgressStages';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB safe limit for Render 512 MB tier
const POLL_INTERVAL_MS = 3000;

const UploadPage = () => {
  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(-1); // -1 idle | 0 Uploading | 1 Extracting | 2 Tagging | 3 Saved
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [savedCount, setSavedCount] = useState(0);
  const [chunkProgress, setChunkProgress] = useState(null);
  const [success, setSuccess] = useState(false);

  const inputRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const addFiles = (incoming) => {
    const valid = [];
    const errors = [];

    for (const f of incoming) {
      const ext = f.name.split('.').pop()?.toLowerCase() || '';
      if (!['pdf', 'txt'].includes(ext)) {
        errors.push(`"${f.name}" skipped — only .pdf and .txt files are supported.`);
      } else if (f.size > MAX_FILE_SIZE_BYTES) {
        const sizeMb = (f.size / (1024 * 1024)).toFixed(1);
        errors.push(`"${f.name}" (${sizeMb} MB) exceeds the 10 MB per-file limit.`);
      } else {
        valid.push(f);
      }
    }

    setErrorMsg(errors.join(' '));
    setSuccess(false);

    if (valid.length > 0) {
      setFiles((prev) => {
        const seen = new Set(prev.map((f) => `${f.name}-${f.size}`));
        return [...prev, ...valid.filter((f) => !seen.has(`${f.name}-${f.size}`))];
      });
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.length) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files?.length) {
      addFiles(Array.from(e.target.files));
    }
    e.target.value = '';
  };

  const resetUploadState = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    setLoading(false);
    setStage(-1);
    setStatusMsg('');
    setErrorMsg('');
    setChunkProgress(null);
    setSuccess(false);
  };

  const finishSuccess = (msg, count) => {
    if (pollRef.current) clearInterval(pollRef.current);
    setStage(3);
    setStatusMsg(msg || 'Processing complete.');
    setSavedCount(count);
    setSuccess(true);
    setLoading(false);
    setFiles([]);
  };

  const pollStatus = (jobId) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await pollUploadStatus(jobId);
        const {
          status,
          message,
          totalSaved,
          totalChunks,
          completedChunks,
          failedChunks,
        } = res.data || {};

        if (message) setStatusMsg(message);
        if (typeof totalSaved === 'number') setSavedCount(totalSaved);

        if (totalChunks > 0) {
          setChunkProgress({
            total: totalChunks,
            completed: completedChunks || 0,
            failed: failedChunks || 0,
          });
          setStage(2); // Tagging / generating chunks
        } else if (message?.toLowerCase().includes('tag') || message?.toLowerCase().includes('chunk')) {
          setStage(2);
        } else {
          setStage(1);
        }

        if (status === 'completed' || status === 'completed_with_errors') {
          finishSuccess(message, totalSaved || 0);
        } else if (status === 'failed') {
          clearInterval(pollRef.current);
          setErrorMsg(message || 'Document processing failed.');
          setLoading(false);
          setStage(-1);
        }
      } catch {
        // Keep polling across transient Render slow responses
      }
    }, POLL_INTERVAL_MS);
  };

  const handleUpload = async () => {
    if (!files.length || loading) return;

    setLoading(true);
    setStage(0);
    setErrorMsg('');
    setSuccess(false);
    setSavedCount(0);
    setChunkProgress(null);
    setStatusMsg(`Uploading ${files.length} document${files.length > 1 ? 's' : ''}…`);

    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));

    try {
      const res = await uploadDocuments(formData, (progressEvent) => {
        if (progressEvent.total) {
          const pct = Math.round((progressEvent.loaded / progressEvent.total) * 100);
          if (pct < 100) {
            setStatusMsg(`Uploading files (${pct}%)…`);
          } else {
            setStage(1);
            setStatusMsg('Extracting readable text from uploaded files…');
          }
        }
      });

      if (res.status === 202 && res.data?.jobId) {
        setStage(1);
        setStatusMsg('Extracting text and preparing Bloom-tagged generation…');
        pollStatus(res.data.jobId);
      } else {
        finishSuccess('Upload completed.', 0);
      }
    } catch (err) {
      setErrorMsg(
        getApiErrorMessage(err, 'Upload failed. The server may be cold-starting — please retry.')
      );
      setLoading(false);
      setStage(-1);
    }
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <header className="pb-4 border-b border-border">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">
          Ingestion Pipeline
        </p>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Upload Study Material</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload CBSE Class 12 Chemistry PDFs or plain-text notes to extract and tag questions into your repository.
        </p>
      </header>

      <div className="bg-card rounded-xl border border-border shadow-xs overflow-hidden">
        <UploadProgressStages
          currentStage={stage}
          chunkProgress={chunkProgress}
          savedCount={savedCount}
        />

        <div className="p-6 flex flex-col gap-5">
          {/* Dropzone */}
          <div
            role="button"
            tabIndex={loading ? -1 : 0}
            aria-label="Select or drop PDF and TXT files"
            onKeyDown={(e) => {
              if (!loading && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                inputRef.current?.click();
              }
            }}
            className={`border-2 border-dashed rounded-xl p-8 transition-colors flex flex-col items-center justify-center ${
              dragActive
                ? 'border-primary bg-primary/5'
                : 'border-input hover:border-primary/50 bg-background/50'
            } ${loading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => !loading && inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.txt"
              multiple
              onChange={handleFileInput}
              className="hidden"
            />

            <div className="w-12 h-12 rounded-xl bg-muted border border-border flex items-center justify-center mb-3">
              <Upload size={20} className="text-foreground" />
            </div>

            {files.length === 0 ? (
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">
                  <span className="text-primary">Click to browse</span> or drag &amp; drop files here
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Supported formats: <span className="font-mono">.pdf</span>, <span className="font-mono">.txt</span> · Max 10 MB per file
                </p>
              </div>
            ) : (
              <div className="w-full space-y-3" onClick={(e) => e.stopPropagation()}>
                <p className="text-sm font-semibold text-center text-foreground">
                  {files.length} file{files.length > 1 ? 's' : ''} queued
                </p>
                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                  {files.map((f, i) => (
                    <div
                      key={`${f.name}-${f.size}`}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-card border border-border"
                    >
                      <FileText size={15} className="text-primary shrink-0" />
                      <span className="flex-1 text-sm font-medium text-foreground truncate">
                        {f.name}
                      </span>
                      <span className="text-xs font-mono text-muted-foreground tabular-nums shrink-0">
                        {(f.size / (1024 * 1024)).toFixed(2)} MB
                      </span>
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                        aria-label={`Remove ${f.name}`}
                        className="p-1 rounded hover:bg-destructive/10 text-destructive disabled:opacity-40"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="text-center">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => inputRef.current?.click()}
                    className="text-xs font-semibold text-primary hover:underline disabled:opacity-40"
                  >
                    + Add more files
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Recoverable Inline Error Banner */}
          {errorMsg && (
            <div
              role="alert"
              className="flex items-start gap-3 p-3.5 rounded-lg bg-destructive/10 border border-destructive/25 text-destructive"
            >
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <div className="flex-1 text-sm">
                <p className="font-medium">{errorMsg}</p>
              </div>
              <button
                type="button"
                onClick={resetUploadState}
                className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md border border-destructive/30 bg-background hover:bg-destructive/10 transition-colors"
              >
                <RotateCcw size={12} /> Reset
              </button>
            </div>
          )}

          {/* Active Processing Banner */}
          {loading && statusMsg && (
            <div
              role="status"
              className="flex items-center gap-2.5 p-3.5 rounded-lg bg-primary/5 border border-primary/20 text-foreground"
            >
              <Loader2 size={16} className="text-primary animate-spin shrink-0" />
              <span className="text-sm font-medium">{statusMsg}</span>
            </div>
          )}

          {/* Completion Banner */}
          {success && (
            <div
              role="status"
              className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800/60 dark:text-emerald-200"
            >
              <div className="flex items-start gap-2.5">
                <CheckCircle2 size={17} className="shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold">{statusMsg || 'Upload successful!'}</p>
                  <p className="text-xs opacity-90 mt-0.5">
                    {savedCount > 0
                      ? `${savedCount} question${savedCount !== 1 ? 's' : ''} added to your Question Bank.`
                      : 'Processing finished.'}
                  </p>
                </div>
              </div>
              <Link
                to="/questions"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold bg-emerald-700 text-white hover:bg-emerald-800 transition-colors"
              >
                Open Question Bank <ArrowRight size={12} />
              </Link>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border">
            <span className="text-xs text-muted-foreground">
              Files are parsed server-side and tagged to CBSE 2026 chapters.
            </span>
            <button
              type="button"
              onClick={handleUpload}
              disabled={!files.length || loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Processing…
                </>
              ) : (
                <>
                  <Upload size={15} />
                  Process {files.length > 0 ? `${files.length} Document${files.length > 1 ? 's' : ''}` : 'Documents'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;
