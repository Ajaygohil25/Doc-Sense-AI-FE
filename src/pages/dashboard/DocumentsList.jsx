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
          <Link to="/" className="btn btn-primary">
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
          <Link to="/" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
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
          justify-content: space-between;
          align-items: center;
        }

        .header-actions {
          display: flex;
          gap: 0.75rem;
        }

        .empty-state {
          padding: 4rem 2rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
        }

        .empty-icon-badge {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background-color: var(--bg-primary);
          color: var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: var(--shadow-sm);
        }

        .empty-state h3 {
          font-size: 1.5rem;
          font-weight: 600;
        }

        .empty-state p {
          font-size: 0.95rem;
          color: var(--text-secondary);
          max-width: 400px;
          line-height: 1.6;
        }

        .table-container {
          padding: 0;
          overflow: hidden;
        }

        .documents-table {
          width: 100%;
          border-collapse: collapse;
        }

        .documents-table th, .documents-table td {
          padding: 1rem 1.5rem;
          text-align: left;
          font-size: 0.9rem;
        }

        .documents-table th {
          font-weight: 600;
          color: var(--text-secondary);
          background-color: var(--bg-primary);
          border-bottom: 1px solid var(--border-color);
        }

        .documents-table td {
          border-bottom: 1px solid var(--border-color);
          color: var(--text-primary);
        }

        .documents-table tr:last-child td {
          border-bottom: none;
        }

        .doc-name-cell {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-weight: 500;
          max-width: 320px;
        }

        .doc-name-cell span {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .doc-icon {
          color: var(--accent-color);
          flex-shrink: 0;
        }

        /* Status Badges */
        .badge {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.25rem 0.625rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: capitalize;
        }

        .badge-success {
          background-color: var(--success-light);
          color: var(--success-color);
        }

        .badge-processing {
          background-color: var(--accent-light);
          color: var(--accent-color);
        }

        .badge-failed {
          background-color: var(--danger-light);
          color: var(--danger-color);
        }

        .badge-pending {
          background-color: var(--warning-light);
          color: var(--warning-color);
        }

        .actions-cell {
          display: flex;
          gap: 0.5rem;
        }

        .action-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.4rem 0.8rem;
          border-radius: var(--border-radius-md);
          border: 1px solid var(--border-color);
          font-size: 0.8rem;
          font-weight: 500;
          background-color: var(--bg-secondary);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .action-btn:hover {
          background-color: var(--bg-primary);
          border-color: var(--text-muted);
        }

        .btn-chat {
          border-color: var(--accent-color);
          color: var(--accent-color);
          background-color: var(--accent-light);
        }

        .btn-chat:hover {
          background-color: var(--accent-color);
          color: white;
        }

        .spin-slow {
          animation: spin 3s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Pagination Styling */
        .pagination-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          background-color: var(--bg-primary);
          border-top: 1px solid var(--border-color);
        }

        .pagination-info {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        .pagination-controls {
          display: flex;
          gap: 0.5rem;
        }

        .pagination-btn {
          width: 32px;
          height: 32px;
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius-md);
          background-color: var(--bg-secondary);
          color: var(--text-secondary);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-fast);
        }

        .pagination-btn:hover:not(:disabled) {
          border-color: var(--text-muted);
          background-color: var(--bg-primary);
        }

        .pagination-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .documents-list-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
          
          .header-actions {
            width: 100%;
          }
          
          .header-actions button, .header-actions a {
            flex: 1;
          }

          .documents-table th:nth-child(2),
          .documents-table td:nth-child(2) {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default DocumentsList;
