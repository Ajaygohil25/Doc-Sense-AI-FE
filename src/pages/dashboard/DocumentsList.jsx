import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { SkeletonTable } from '../../components/ui/Loader';
import { 
  FileText, 
  MessageSquare, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Upload, 
  RefreshCw,
  Clock,
  CheckCircle,
  AlertTriangle,
  PlayCircle
} from 'lucide-react';

const DocumentsList = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    page_size: 10,
    total_pages: 1
  });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  
  const { showToast } = useToast();
  const navigate = useNavigate();

  const fetchHistory = async (pageNumber) => {
    setLoading(true);
    try {
      // GET /api/v1/dashboard/get-file-upload-history?page=<pageNumber>&page_size=<pageSize>
      const res = await api.get('/dashboard/get-file-upload-history', {
        params: {
          page: pageNumber,
          page_size: pageSize
        }
      });

      if (res.data.success) {
        const payloadData = res.data.data;
        if (payloadData && payloadData.file_list) {
          setFiles(payloadData.file_list);
          setMeta(payloadData.meta);
        } else {
          // Empty state
          setFiles([]);
          setMeta({
            total: 0,
            page: 1,
            page_size: pageSize,
            total_pages: 1
          });
        }
      }
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.error || err.response?.data?.detail || 'Failed to retrieve documents.';
      showToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(currentPage);
  }, [currentPage]);

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < meta.total_pages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderStatusBadge = (status) => {
    const normStatus = status ? status.toLowerCase() : 'pending';
    switch (normStatus) {
      case 'success':
        return (
          <span className="badge badge-success">
            <CheckCircle size={12} />
            <span>Success</span>
          </span>
        );
      case 'processing':
        return (
          <span className="badge badge-processing">
            <RefreshCw size={12} className="spin-slow" />
            <span>Processing</span>
          </span>
        );
      case 'failed':
        return (
          <span className="badge badge-failed">
            <AlertTriangle size={12} />
            <span>Failed</span>
          </span>
        );
      default:
        return (
          <span className="badge badge-pending">
            <Clock size={12} />
            <span>Pending</span>
          </span>
        );
    }
  };

  return (
    <div className="documents-list-page">
      <div className="documents-list-header">
        <div>
          <h1>My Documents</h1>
          <p className="subtitle">Explore and chat with your processed PDF documents.</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={() => fetchHistory(currentPage)} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spin-slow' : ''} />
            <span>Refresh</span>
          </button>
          <Link to="/upload" className="btn btn-primary">
            <Upload size={16} />
            <span>Upload New</span>
          </Link>
        </div>
      </div>

      {loading ? (
        <SkeletonTable rows={5} />
      ) : files.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-icon-badge">
            <FileText size={40} />
          </div>
          <h3>No documents found</h3>
          <p>You haven't uploaded any documents yet. Upload a PDF file to begin analysis.</p>
          <Link to="/upload" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
            Upload First PDF
          </Link>
        </div>
      ) : (
        <div className="table-container card">
          <table className="documents-table">
            <thead>
              <tr>
                <th>Document Name</th>
                <th>Upload Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file) => (
                <tr key={file.id}>
                  <td className="doc-name-cell">
                    <FileText size={18} className="doc-icon" />
                    <span title={file.file_name}>{file.file_name}</span>
                  </td>
                  <td>{formatDate(file.created_at)}</td>
                  <td>{renderStatusBadge(file.status)}</td>
                  <td className="actions-cell">
                    <button 
                      className="action-btn btn-chat" 
                      title="Open Q&A Chat"
                      onClick={() => navigate(`/documents/${file.id}/chat`)}
                    >
                      <MessageSquare size={16} />
                      <span>Chat</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {meta.total_pages > 1 && (
            <div className="pagination-bar">
              <span className="pagination-info">
                Showing page <strong>{currentPage}</strong> of <strong>{meta.total_pages}</strong> ({meta.total} files total)
              </span>
              <div className="pagination-controls">
                <button 
                  className="pagination-btn" 
                  onClick={handlePrevPage} 
                  disabled={currentPage === 1}
                >
                  <ChevronLeft size={16} />
                </button>
                <button 
                  className="pagination-btn" 
                  onClick={handleNextPage} 
                  disabled={currentPage === meta.total_pages}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        .documents-list-page {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          text-align: left;
        }

        .documents-list-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 1rem;
        }

        .documents-list-header h1 {
          font-size: clamp(2rem, 4vw, 2.75rem);
          line-height: 1.2;
        }

        .header-actions { display: flex; gap: 0.75rem; }

        .empty-state {
          display: flex;
          min-height: 440px;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.85rem;
          padding: 4rem 2rem;
          text-align: center;
          background: var(--bg-card);
          border-radius: var(--border-radius-xl);
        }

        .empty-icon-badge {
          display: grid;
          width: 90px;
          height: 90px;
          margin-bottom: 0.5rem;
          place-items: center;
          color: var(--accent-color);
          background: var(--accent-light);
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius-lg);
          box-shadow: var(--shadow-sm);
        }

        .empty-state h3 { font-size: clamp(1.4rem, 3vw, 1.8rem); font-weight: 700; }
        .empty-state p { max-width: 430px; color: var(--text-secondary); font-size: 0.95rem; line-height: 1.65; }

        .table-container {
          padding: 0;
          overflow-x: auto;
          border-radius: var(--border-radius-xl);
        }

        .documents-table {
          width: 100%;
          min-width: 720px;
          border-collapse: collapse;
        }

        .documents-table th,
        .documents-table td {
          padding: 1.05rem 1.4rem;
          text-align: left;
          font-size: 0.88rem;
        }

        .documents-table th {
          color: var(--text-primary);
          background: var(--bg-strong);
          border-bottom: 1px solid var(--border-color);
          font-size: 0.73rem;
          font-weight: 700;
          letter-spacing: 0.07em;
        }

        .documents-table td { color: var(--text-primary); border-bottom: 1px solid var(--border-color); }
        .documents-table tbody tr { transition: background-color var(--transition-fast); }
        .documents-table tbody tr:hover { background: var(--accent-light); }
        .documents-table tr:last-child td { border-bottom: none; }

        .doc-name-cell { display: flex; align-items: center; gap: 0.75rem; max-width: 320px; font-weight: 700; }
        .doc-name-cell span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .doc-icon { flex: 0 0 auto; color: var(--accent-color); }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 0.38rem;
          min-height: 30px;
          padding: 0.3rem 0.65rem;
          border: 1px solid currentColor;
          border-radius: var(--border-radius-pill);
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: capitalize;
        }

        .badge-success { color: var(--success-color); background: var(--success-light); }
        .badge-processing { color: var(--accent-color); background: var(--accent-light); }
        .badge-failed { color: var(--danger-color); background: var(--danger-light); }
        .badge-pending { color: var(--warning-color); background: var(--warning-light); }
        .actions-cell { display: flex; gap: 0.5rem; }

        .action-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.38rem;
          min-height: 38px;
          padding: 0.45rem 0.75rem;
          color: var(--text-secondary);
          background: var(--bg-elevated);
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius-sm);
          font-size: 0.78rem;
          font-weight: 700;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .action-btn:hover { color: var(--text-primary); background: var(--accent-light); border-color: var(--accent-color); }
        .btn-chat { color: var(--on-accent); background: var(--accent-color); border-color: var(--accent-color); }
        .btn-chat:hover { color: var(--on-accent); background: var(--accent-hover); }
        .spin-slow { animation: spin 3s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .pagination-bar {
          position: sticky;
          left: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-width: 100%;
          padding: 1rem 1.4rem;
          background: var(--bg-elevated);
          border-top: 1px solid var(--border-color);
        }

        .pagination-info { color: var(--text-secondary); font-size: 0.8rem; }
        .pagination-controls { display: flex; gap: 0.5rem; }

        .pagination-btn {
          display: grid;
          width: 40px;
          height: 40px;
          place-items: center;
          color: var(--text-primary);
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 50%;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .pagination-btn:hover:not(:disabled) { color: #ffffff; background: var(--accent-color); border-color: var(--accent-color); }
        .pagination-btn:disabled { opacity: 0.38; cursor: not-allowed; }

        @media (max-width: 767px) {
          .documents-list-header { flex-direction: column; align-items: flex-start; }
          .header-actions { width: 100%; }
          .header-actions button,
          .header-actions a { flex: 1; }
          .empty-state { min-height: 360px; padding: 2.5rem 1.25rem; }
          .pagination-bar { gap: 1rem; }
        }
      `}</style>
    </div>
  );
};

export default DocumentsList;
