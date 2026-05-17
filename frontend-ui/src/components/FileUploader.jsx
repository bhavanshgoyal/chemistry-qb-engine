import { useState, useRef } from 'react';
import api from '../services/api';

const FileUploader = ({ onUploadSuccess }) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(''); // 'idle', 'uploading', 'processing', 'success', 'error'
  const [errorMsg, setErrorMsg] = useState('');
  const inputRef = useRef(null);

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
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    const validTypes = ['application/pdf', 'text/plain'];
    const fileExtension = selectedFile.name.split('.').pop().toLowerCase();
    
    if (validTypes.includes(selectedFile.type) || ['pdf', 'txt'].includes(fileExtension)) {
      setFile(selectedFile);
      setErrorMsg('');
    } else {
      setErrorMsg('Please upload a valid .pdf or .txt file.');
      setFile(null);
    }
  };

  const onButtonClick = () => {
    inputRef.current.click();
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setStatus('uploading');
    setErrorMsg('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/api/questions/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 202) {
        setStatus('processing');
        const jobId = response.data.jobId;
        pollStatus(jobId);
      } else {
        setStatus('success');
        setFile(null);
        if (onUploadSuccess) onUploadSuccess();
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMsg(err.response?.data?.message || 'Failed to upload file. Render might be cold-starting.');
    } finally {
      if (status !== 'processing') {
        setLoading(false);
      }
    }
  };

  const pollStatus = async (jobId) => {
    try {
      const res = await api.get(`/api/questions/upload/status/${jobId}`);
      if (res.data.status === 'completed') {
        setStatus('success');
        setLoading(false);
        setFile(null);
        if (onUploadSuccess) onUploadSuccess();
      } else if (res.data.status === 'failed') {
        setStatus('error');
        setErrorMsg(res.data.error || 'Processing failed.');
        setLoading(false);
      } else {
        setTimeout(() => pollStatus(jobId), 5000);
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMsg('Error checking processing status.');
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl p-8 bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 transition-all">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Upload Learning Material</h2>
        <p className="text-slate-500 mt-1 font-medium">Add your syllabus or notes to instantly generate questions.</p>
      </div>
      
      <div 
        className={`relative flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-3xl transition-all duration-300 ease-out cursor-pointer group ${
          dragActive 
            ? 'border-indigo-500 bg-indigo-50/70 scale-[1.01]' 
            : 'border-slate-300 bg-slate-50/50 hover:bg-slate-100/60 hover:border-indigo-300'
        } ${loading ? 'opacity-60 pointer-events-none grayscale-[30%]' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={(!file && !loading) ? onButtonClick : undefined}
      >
        <input 
          ref={inputRef}
          type="file" 
          accept=".pdf,.txt" 
          onChange={handleChange} 
          className="hidden" 
        />
        
        <div className="text-center z-10">
          <div className={`mx-auto flex items-center justify-center w-16 h-16 rounded-2xl mb-5 transition-colors duration-300 ${dragActive ? 'bg-indigo-100 text-indigo-600' : 'bg-white shadow-sm text-slate-400 group-hover:text-indigo-500 group-hover:shadow'}`}>
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
            </svg>
          </div>
          
          {file ? (
            <div className="mb-2 animate-fade-in-up">
              <p className="text-lg font-bold text-slate-700">{file.name}</p>
              <p className="text-sm font-medium text-slate-400 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              <button 
                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                className="mt-4 text-sm text-rose-500 hover:text-rose-600 font-semibold"
              >
                Remove File
              </button>
            </div>
          ) : (
            <>
              <p className="text-xl font-semibold text-slate-700 mb-2">
                <span className="text-indigo-600">Click to browse</span> or drag and drop
              </p>
              <p className="text-sm font-medium text-slate-400 mb-6">Supported formats: .pdf, .txt (Max: 50MB)</p>
            </>
          )}
          
          {!file && (
            <button 
              type="button" 
              onClick={(e) => { e.stopPropagation(); onButtonClick(); }}
              className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm"
            >
              Browse Files
            </button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="mt-5 p-4 bg-rose-50/80 backdrop-blur-sm text-rose-700 rounded-2xl border border-rose-200/60 text-sm font-medium flex items-center gap-3 animate-fade-in-up">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          {errorMsg}
        </div>
      )}

      {status === 'success' && (
        <div className="mt-5 p-4 bg-emerald-50/80 backdrop-blur-sm text-emerald-700 rounded-2xl border border-emerald-200/60 text-sm font-medium flex items-center gap-3 animate-fade-in-up">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          File uploaded and processed successfully!
        </div>
      )}

      <div className="mt-8 flex justify-end">
        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className={`flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-white transition-all duration-300 ${
            !file || loading 
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
              : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/30 hover:shadow-xl hover:-translate-y-0.5 hover:shadow-indigo-600/40'
          }`}
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white/80" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {status === 'processing' ? 'AI Synthesizing...' : 'Uploading...'}
            </>
          ) : (
            <>
              Process Document
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default FileUploader;
