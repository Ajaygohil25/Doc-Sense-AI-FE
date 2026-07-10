import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { UploadCloud, File, AlertCircle, CheckCircle } from 'lucide-react';
import { Spinner } from '../../components/ui/Loader';

const UploadPage = () => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedFileId, setUploadedFileId] = useState(null);
  
  const fileInputRef = useRef(null);
  const { showToast } = useToast();
  const navigate = useNavigate();

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
    if (selectedFile.type !== 'application/pdf') {
      showToast('Invalid file type. Please upload a PDF file.', 'error');
      return;
    }
    // Limit to 20MB for safety
    if (selectedFile.size > 20 * 1024 * 1024) {
      showToast('File size is too large. Maximum size is 20MB.', 'error');
      return;
    }
    setFile(selectedFile);
    setUploadedFileId(null);
    setProgress(0);
  };

  const onButtonClick = () => {
    fileInputRef.current.click();
  };

  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setProgress(10); // Start progress bar visual

    const formData = new FormData();
    formData.append('file', file);

    // Simulate progress animation for smoother UX
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      // POST /api/v1/dashboard/file-upload
      const res = await api.post('/dashboard/file-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (res.data.success && res.data.data) {
        showToast('File uploaded successfully!', 'success');
        setUploadedFileId(res.data.data.id);
      }
    } catch (err) {
      clearInterval(progressInterval);
      setProgress(0);
      console.error(err);
      const errMsg = err.response?.data?.error || err.response?.data?.detail || 'Failed to upload file.';
      showToast(errMsg, 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="dashboard-home upload-page">
      <div className="dashboard-header">
        <h1>Upload PDF</h1>
        <p className="subtitle">Ingest a PDF document to begin chatting with its contents.</p>
      </div>

      <div className="upload-container card">
        <form 
          className={`dropzone ${dragActive ? 'drag-active' : ''} ${file ? 'has-file' : ''}`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onSubmit={(e) => e.preventDefault()}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="file-input-hidden"
            accept=".pdf"
            onChange={handleChange}
            disabled={uploading}
          />

          {!file ? (
            <div className="dropzone-content" onClick={onButtonClick}>
              <div className="upload-icon-wrapper">
                <UploadCloud size={40} />
              </div>
              <h3>Drag & drop your PDF file here</h3>
              <p className="browse-text">or <span className="browse-link">browse your files</span></p>
              <span className="file-constraints">PDF only (Max 20MB)</span>
            </div>
          ) : (
            <div className="file-preview-content">
              <div className="file-info-box">
                <File size={36} className="file-icon" />
                <div className="file-details">
                  <div className="file-name" title={file.name}>{file.name}</div>
                  <div className="file-size">{formatBytes(file.size)}</div>
                </div>
              </div>

              {progress > 0 && (
                <div className="upload-progress-wrapper">
                  <div className="progress-bar-bg">
                    <div className={`progress-bar-fill ${progress === 100 ? 'complete' : ''}`} style={{ width: `${progress}%` }} />
                  </div>
                  <div className="progress-text-row">
                    <span>{progress === 100 ? 'Processing...' : 'Uploading...'}</span>
                    <span>{progress}%</span>
                  </div>
                </div>
              )}

              {uploadedFileId ? (
                <div className="upload-success-state">
                  <CheckCircle size={20} className="success-icon" />
                  <span>Your document is ready for analysis.</span>
                </div>
              ) : null}

              <div className="preview-actions">
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setFile(null)} 
                  disabled={uploading}
                >
                  Remove File
                </button>
                
                {uploadedFileId ? (
                  <button 
                    className="btn btn-primary"
                    onClick={() => navigate(`/documents/${uploadedFileId}/chat`)}
                  >
                    Start Chatting
                  </button>
                ) : (
                  <button 
                    className="btn btn-primary"
                    onClick={handleUpload} 
                    disabled={uploading}
                  >
                    {uploading ? <Spinner size={16} color="var(--on-accent)" /> : 'Upload & Process'}
                  </button>
                )}
              </div>
            </div>
          )}
        </form>
      </div>

      <div className="info-cards-row">
        <div className="info-card card">
          <div className="info-icon-badge">
            <UploadCloud size={20} />
          </div>
          <h3>1. Ingest PDF</h3>
          <p>Drag and drop any standard PDF document. The RAG pipeline processes it automatically in the background.</p>
        </div>

        <div className="info-card card">
          <div className="info-icon-badge">
            <File size={20} />
          </div>
          <h3>2. Track Status</h3>
          <p>View document statuses like "pending" or processing phases in real-time in the documents explorer.</p>
        </div>

        <div className="info-card card">
          <div className="info-icon-badge">
            <AlertCircle size={20} />
          </div>
          <h3>3. Ask & Converse</h3>
          <p>Launch the chat room and ask natural language questions. Get answers backed by your file's metadata.</p>
        </div>
      </div>

      <style>{`
        .upload-page {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          text-align: left;
        }

        .dashboard-header h1 {
          max-width: 12ch;
          font-size: clamp(2rem, 4vw, 2.75rem);
          font-weight: 800;
          line-height: 1.2;
        }

        .upload-container {
          padding: clamp(1rem, 4vw, 2.5rem);
          background: var(--bg-card);
          border-radius: var(--border-radius-xl);
        }

        .dropzone {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 330px;
          padding: clamp(2rem, 6vw, 4.5rem) 1.5rem;
          background: var(--bg-elevated);
          border: 2px dashed var(--border-strong);
          border-radius: var(--border-radius-xl);
          cursor: pointer;
          transition: all var(--transition-normal);
        }

        .dropzone:hover,
        .dropzone.drag-active {
          background: var(--accent-light);
          border-color: var(--accent-color);
          box-shadow: inset 0 0 0 1px var(--accent-light);
        }

        .dropzone.has-file {
          background: var(--bg-elevated);
          border-style: solid;
          cursor: default;
          transform: none;
        }

        .file-input-hidden { display: none; }

        .dropzone-content {
          display: flex;
          width: 100%;
          flex-direction: column;
          align-items: center;
          gap: 0.55rem;
          text-align: center;
        }

        .upload-icon-wrapper {
          display: grid;
          width: 82px;
          height: 82px;
          margin-bottom: 0.85rem;
          place-items: center;
          color: var(--accent-color);
          background: var(--accent-light);
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius-lg);
          box-shadow: var(--shadow-sm);
          transition: all var(--transition-normal);
        }

        .dropzone:hover .upload-icon-wrapper { border-color: var(--accent-color); }
        .dropzone-content h3 { font-size: clamp(1.35rem, 3vw, 2rem); }
        .browse-text { color: var(--text-secondary); font-size: 0.92rem; }
        .browse-link { color: var(--accent-link); font-weight: 700; text-decoration: underline; }
        .file-constraints { margin-top: 0.35rem; color: var(--text-muted); font-size: 0.76rem; }

        .file-preview-content {
          display: flex;
          width: 100%;
          max-width: 540px;
          flex-direction: column;
          gap: 1.4rem;
        }

        .file-info-box {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius-lg);
          box-shadow: var(--shadow-sm);
        }

        .file-icon { flex: 0 0 auto; color: var(--accent-color); }
        .file-details { display: flex; min-width: 0; flex-direction: column; text-align: left; }
        .file-name { overflow: hidden; color: var(--text-primary); font-size: 0.94rem; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }
        .file-size { margin-top: 0.15rem; color: var(--text-secondary); font-size: 0.8rem; }
        .upload-progress-wrapper { display: flex; flex-direction: column; gap: 0.55rem; text-align: left; }
        .progress-bar-bg { height: 9px; overflow: hidden; background: var(--bg-strong); border-radius: var(--border-radius-pill); }
        .progress-bar-fill { height: 100%; background: var(--accent-color); border-radius: inherit; transition: width 0.2s ease; }
        .progress-bar-fill.complete { background: var(--success-color); }
        .progress-text-row { display: flex; justify-content: space-between; color: var(--text-secondary); font-size: 0.76rem; }
        .upload-success-state { display: flex; align-items: center; gap: 0.5rem; color: var(--success-color); font-size: 0.88rem; font-weight: 700; }
        .preview-actions { display: flex; justify-content: flex-end; gap: 0.8rem; }

        .info-cards-row {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 1rem;
        }

        .info-card {
          display: flex;
          min-height: 190px;
          flex-direction: column;
          gap: 0.75rem;
          padding: 1.5rem;
        }

        .info-card:nth-child(2) { background: var(--bg-elevated); }

        .info-icon-badge {
          display: grid;
          width: 46px;
          height: 46px;
          place-items: center;
          color: var(--accent-color);
          background: var(--accent-light);
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius-md);
        }

        .info-card h3 { margin-top: auto; font-size: 1.12rem; }
        .info-card p { color: var(--text-secondary); font-size: 0.875rem; line-height: 1.55; }

        @media (max-width: 900px) {
          .info-cards-row { grid-template-columns: 1fr; }
          .info-card { min-height: 150px; }
        }

        @media (max-width: 639px) {
          .upload-page { gap: 1.25rem; }
          .dropzone { min-height: 290px; border-radius: var(--border-radius-xl); }
          .preview-actions { flex-direction: column-reverse; }
          .preview-actions .btn { width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default UploadPage;
