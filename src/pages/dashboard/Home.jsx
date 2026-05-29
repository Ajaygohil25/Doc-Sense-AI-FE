import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { UploadCloud, File, AlertCircle, CheckCircle } from 'lucide-react';
import { Spinner } from '../../components/ui/Loader';

const Home = () => {
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
    <div className="dashboard-home">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
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
                    <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
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
                    {uploading ? <Spinner size={16} color="#fff" /> : 'Upload & Process'}
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
        .dashboard-home {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          text-align: left;
        }

        .dashboard-header h1 {
          font-size: 2rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .subtitle {
          font-size: 1rem;
          color: var(--text-muted);
          margin-top: 0.25rem;
        }

        .upload-container {
          padding: 2.5rem;
        }

        .dropzone {
          border: 2px dashed var(--border-color);
          border-radius: var(--border-radius-lg);
          padding: 3rem 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: var(--bg-primary);
          transition: all var(--transition-normal);
          cursor: pointer;
          min-height: 250px;
        }

        .dropzone:hover, .dropzone.drag-active {
          border-color: var(--accent-color);
          background-color: var(--accent-light);
        }

        .dropzone.has-file {
          border-style: solid;
          cursor: default;
          background-color: var(--bg-secondary);
        }

        .file-input-hidden {
          display: none;
        }

        .dropzone-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 0.5rem;
          width: 100%;
        }

        .upload-icon-wrapper {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background-color: var(--bg-secondary);
          color: var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 0.5rem;
          box-shadow: var(--shadow-sm);
          transition: all var(--transition-normal);
        }

        .dropzone:hover .upload-icon-wrapper {
          color: var(--accent-color);
          background-color: var(--bg-secondary);
          transform: scale(1.05);
        }

        .dropzone-content h3 {
          font-size: 1.125rem;
          font-weight: 600;
        }

        .browse-text {
          font-size: 0.9rem;
          color: var(--text-secondary);
        }

        .browse-link {
          color: var(--accent-color);
          font-weight: 600;
          text-decoration: underline;
        }

        .file-constraints {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-top: 0.25rem;
        }

        .file-preview-content {
          width: 100%;
          max-width: 450px;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .file-info-box {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          border-radius: var(--border-radius-md);
          background-color: var(--bg-primary);
          border: 1px solid var(--border-color);
        }

        .file-icon {
          color: var(--accent-color);
        }

        .file-details {
          display: flex;
          flex-direction: column;
          min-width: 0;
          text-align: left;
        }

        .file-name {
          font-size: 0.925rem;
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .file-size {
          font-size: 0.8rem;
          color: var(--text-secondary);
          margin-top: 0.125rem;
        }

        .upload-progress-wrapper {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          text-align: left;
        }

        .progress-bar-bg {
          height: 6px;
          background-color: var(--border-color);
          border-radius: 3px;
          overflow: hidden;
        }

        .progress-bar-fill {
          height: 100%;
          background-color: var(--accent-color);
          transition: width 0.2s ease;
        }

        .progress-text-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .upload-success-state {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--success-color);
          font-size: 0.875rem;
          font-weight: 500;
        }

        .preview-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
        }

        .info-cards-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
        }

        .info-card {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .info-icon-badge {
          width: 40px;
          height: 40px;
          border-radius: var(--border-radius-md);
          background-color: var(--accent-light);
          color: var(--accent-color);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .info-card h3 {
          font-size: 1.1rem;
          font-weight: 600;
        }

        .info-card p {
          font-size: 0.875rem;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        @media (max-width: 900px) {
          .info-cards-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default Home;
