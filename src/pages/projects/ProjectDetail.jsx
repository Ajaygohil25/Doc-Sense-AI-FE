/* eslint-disable react-hooks/exhaustive-deps, react-hooks/set-state-in-effect */
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Clock,
  FileText,
  FolderKanban,
  MessageSquare,
  RefreshCw,
  Upload,
} from 'lucide-react';
import { Spinner } from '../../components/ui/Loader';
import { useToast } from '../../context/ToastContext';
import {
  getProject,
  uploadProjectFile,
} from '../../services/projects';

const getErrorMessage = (err, fallback) => (
  err.response?.data?.error || err.response?.data?.detail || err.message || fallback
);

const formatDate = (value) => {
  if (!value) return 'N/A';

  return new Date(value).toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const isSuccessStatus = (status) => String(status || '').toLowerCase() === 'success';

const renderStatusBadge = (status) => {
  const normStatus = String(status || 'pending').toLowerCase();

  if (normStatus === 'success') {
    return (
      <span className="badge badge-success">
        <CheckCircle size={12} />
        <span>Success</span>
      </span>
    );
  }

  if (normStatus === 'failed') {
    return (
      <span className="badge badge-failed">
        <AlertTriangle size={12} />
        <span>Failed</span>
      </span>
    );
  }

  if (normStatus === 'processing') {
    return (
      <span className="badge badge-processing">
        <RefreshCw size={12} className="spin-slow" />
        <span>Processing</span>
      </span>
    );
  }

  return (
    <span className="badge badge-pending">
      <Clock size={12} />
      <span>{status || 'Pending'}</span>
    </span>
  );
};

const ProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const fileInputRef = useRef(null);

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const files = project?.files || [];
  const rooms = project?.chat_rooms || [];
  const canOpenChat = files.some((file) => isSuccessStatus(file.status));

  const loadProject = async () => {
    setLoading(true);

    try {
      const res = await getProject(projectId);
      if (res.data.success) {
        setProject(res.data.data?.project || null);
      }
    } catch (err) {
      console.error(err);
      showToast(getErrorMessage(err, 'Failed to load project.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const validateAndSetFile = (file) => {
    if (!file) return;

    if (file.type !== 'application/pdf') {
      showToast('Invalid file type. Please upload a PDF file.', 'error');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      showToast('File size is too large. Maximum size is 20MB.', 'error');
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);
    setUploading(true);

    try {
      const res = await uploadProjectFile(projectId, formData);

      if (res.data.success) {
        showToast('Project file uploaded successfully.', 'success');
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        await loadProject();
      }
    } catch (err) {
      console.error(err);
      showToast(getErrorMessage(err, 'Failed to upload project file.'), 'error');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="project-loading card">
        <Spinner size={34} />
        <span>Loading project...</span>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="project-loading card">
        <AlertCircle size={42} className="danger-icon" />
        <h2>Project Not Found</h2>
        <p>We could not retrieve this project or you do not have permission to view it.</p>
        <button type="button" className="btn btn-primary" onClick={() => navigate('/projects')}>
          Back to Projects
        </button>
      </div>
    );
  }

  return (
    <div className="project-detail-page">
      <div className="project-detail-header">
        <button type="button" className="icon-button" onClick={() => navigate('/projects')} aria-label="Back to projects">
          <ArrowLeft size={18} />
        </button>
        <div className="project-title">
          <span className="section-icon">
            <FolderKanban size={22} />
          </span>
          <div>
            <h1>{project.name}</h1>
            <p className="subtitle">{project.description || 'No description provided.'}</p>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => navigate(`/projects/${projectId}/chat`)}
          disabled={!canOpenChat}
        >
          <MessageSquare size={16} />
          <span>Open Project Chat</span>
        </button>
      </div>

      {!canOpenChat && (
        <div className="notice notice-processing">
          <Clock size={16} />
          <span>Chat is available after at least one project file finishes processing successfully.</span>
        </div>
      )}

      <section className="project-section card">
        <div className="section-header">
          <div>
            <h2>Project Files</h2>
            <p>{files.length} uploaded file{files.length === 1 ? '' : 's'}</p>
          </div>
          <button className="btn btn-secondary" type="button" onClick={loadProject} disabled={loading || uploading}>
            <RefreshCw size={16} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="upload-panel">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            aria-label="Project PDF upload"
            onChange={(event) => validateAndSetFile(event.target.files?.[0])}
            disabled={uploading}
          />
          <div className="selected-file">
            {selectedFile ? (
              <>
                <FileText size={16} />
                <span title={selectedFile.name}>{selectedFile.name}</span>
              </>
            ) : (
              <span>Choose one PDF file to add to this project.</span>
            )}
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
          >
            {uploading ? <Spinner size={16} color="#fff" /> : <Upload size={16} />}
            <span>Upload PDF</span>
          </button>
        </div>

        {files.length === 0 ? (
          <div className="files-empty">
            <FileText size={30} />
            <h3>No files uploaded</h3>
            <p>Upload a PDF to start building this project knowledge base.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="project-files-table">
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Uploaded</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {files.map((file) => (
                  <tr key={file.id}>
                    <td className="file-name-cell">
                      <FileText size={17} />
                      <span title={file.file_name}>{file.file_name}</span>
                    </td>
                    <td>{formatDate(file.created_at)}</td>
                    <td>{renderStatusBadge(file.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="project-section card">
        <div className="section-header">
          <div>
            <h2>Chat Rooms</h2>
            <p>{rooms.length} room{rooms.length === 1 ? '' : 's'} in this project</p>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate(`/projects/${projectId}/chat`)}
            disabled={!canOpenChat}
          >
            <MessageSquare size={16} />
            <span>Open Chat</span>
          </button>
        </div>

        {rooms.length === 0 ? (
          <div className="files-empty">
            <MessageSquare size={30} />
            <h3>No chat rooms yet</h3>
            <p>Create or refresh the project to load available rooms.</p>
          </div>
        ) : (
          <div className="rooms-grid">
            {rooms.map((room) => (
              <div className="room-row" key={room.id}>
                <MessageSquare size={17} />
                <div>
                  <strong>{room.name}</strong>
                  <span>{formatDate(room.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <style>{`
        .project-detail-page {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          text-align: left;
        }

        .project-detail-header,
        .project-title,
        .section-header,
        .upload-panel,
        .file-name-cell,
        .badge,
        .notice,
        .room-row {
          display: flex;
          align-items: center;
        }

        .project-detail-header,
        .section-header {
          justify-content: space-between;
          gap: 1rem;
        }

        .project-title {
          flex: 1;
          gap: 0.875rem;
          min-width: 0;
        }

        .section-icon,
        .icon-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--border-color);
          border-radius: 8px;
        }

        .section-icon {
          width: 46px;
          height: 46px;
          color: var(--accent-color);
          background-color: var(--accent-light);
        }

        .icon-button {
          width: 38px;
          height: 38px;
          color: var(--text-secondary);
          background-color: var(--bg-card);
          cursor: pointer;
        }

        .project-section {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .section-header p {
          color: var(--text-secondary);
          font-size: 0.9rem;
        }

        .upload-panel {
          gap: 0.75rem;
          padding: 1rem;
          background-color: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          flex-wrap: wrap;
        }

        .upload-panel input[type="file"] {
          max-width: 260px;
        }

        .selected-file {
          flex: 1;
          min-width: 180px;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-secondary);
          overflow: hidden;
        }

        .selected-file span,
        .file-name-cell span {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .table-container {
          overflow-x: auto;
          border: 1px solid var(--border-color);
          border-radius: 8px;
        }

        .project-files-table {
          width: 100%;
          border-collapse: collapse;
        }

        .project-files-table th,
        .project-files-table td {
          text-align: left;
          padding: 0.9rem 1rem;
          border-bottom: 1px solid var(--border-color);
          font-size: 0.9rem;
        }

        .project-files-table th {
          background-color: var(--bg-primary);
          color: var(--text-secondary);
          font-weight: 600;
        }

        .project-files-table tr:last-child td {
          border-bottom: 0;
        }

        .file-name-cell {
          gap: 0.6rem;
          max-width: 360px;
          font-weight: 500;
        }

        .badge {
          width: max-content;
          gap: 0.35rem;
          padding: 0.25rem 0.6rem;
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .badge-success {
          color: var(--success-color);
          background-color: var(--success-light);
        }

        .badge-failed {
          color: var(--danger-color);
          background-color: var(--danger-light);
        }

        .badge-processing {
          color: var(--accent-color);
          background-color: var(--accent-light);
        }

        .badge-pending {
          color: var(--warning-color);
          background-color: var(--warning-light);
        }

        .notice {
          gap: 0.5rem;
          padding: 0.85rem 1rem;
          border-radius: 8px;
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          background-color: var(--warning-light);
        }

        .files-empty,
        .project-loading {
          min-height: 240px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          text-align: center;
          color: var(--text-secondary);
        }

        .danger-icon {
          color: var(--danger-color);
        }

        .rooms-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 0.75rem;
        }

        .room-row {
          gap: 0.7rem;
          padding: 0.85rem;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          background-color: var(--bg-primary);
        }

        .room-row div {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .room-row span {
          color: var(--text-secondary);
          font-size: 0.8rem;
        }

        @media (max-width: 760px) {
          .project-detail-header,
          .section-header {
            align-items: stretch;
            flex-direction: column;
          }

          .upload-panel {
            align-items: stretch;
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default ProjectDetail;
