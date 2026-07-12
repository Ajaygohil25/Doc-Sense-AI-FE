/* eslint-disable react-hooks/exhaustive-deps, react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderKanban, MessageSquare, Plus, RefreshCw, X } from 'lucide-react';
import { Spinner } from '../../components/ui/Loader';
import { useToast } from '../../context/ToastContext';
import {
  createProject,
  listProjects,
} from '../../services/projects';

const getErrorMessage = (err, fallback) => (
  err.response?.data?.error || err.response?.data?.detail || err.message || fallback
);

const normalizeProjects = (data) => {
  if (Array.isArray(data)) return data;
  return data?.projects || [];
};

const formatDate = (value) => {
  if (!value) return 'N/A';

  return new Date(value).toLocaleDateString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const ProjectsList = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const loadProjects = async () => {
    setLoading(true);

    try {
      const res = await listProjects();
      if (res.data.success) {
        setProjects(normalizeProjects(res.data.data));
      }
    } catch (err) {
      console.error(err);
      showToast(getErrorMessage(err, 'Failed to load projects.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleCreateProject = async (event) => {
    event.preventDefault();

    const name = projectName.trim();
    const trimmedDescription = description.trim();

    if (!name) {
      showToast('Enter a project name.', 'error');
      return;
    }

    setCreating(true);

    try {
      const res = await createProject({
        name,
        description: trimmedDescription || null,
      });
      const createdProject = res.data.data?.project;

      if (!createdProject) {
        throw new Error('Invalid create project response.');
      }

      setProjects((prev) => [
        createdProject,
        ...prev.filter((project) => String(project.id) !== String(createdProject.id)),
      ]);
      setProjectName('');
      setDescription('');
      setCreateModalOpen(false);
      showToast('Project created successfully.', 'success');
    } catch (err) {
      console.error(err);
      showToast(getErrorMessage(err, 'Failed to create project.'), 'error');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="projects-page">
      <div className="projects-header">
        <div>
          <h1>Projects</h1>
          <p className="subtitle">Group related PDFs into a shared project knowledge base.</p>
        </div>
        <div className="projects-actions">
          <button className="btn btn-secondary" type="button" onClick={loadProjects} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spin-slow' : ''} />
            <span>Refresh</span>
          </button>
          <button className="btn btn-primary" type="button" onClick={() => setCreateModalOpen(true)}>
            <Plus size={16} />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="projects-loading card">
          <Spinner size={30} />
          <span>Loading projects...</span>
        </div>
      ) : projects.length === 0 ? (
        <div className="projects-empty card">
          <div className="empty-icon">
            <FolderKanban size={36} />
          </div>
          <h3>No projects yet</h3>
          <p>Create a project to upload multiple PDFs into one shared knowledge base.</p>
          <button className="btn btn-primary" type="button" onClick={() => setCreateModalOpen(true)}>
            <Plus size={16} />
            <span>New Project</span>
          </button>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map((project) => (
            <article className="project-card card" key={project.id}>
              <div className="project-card-icon">
                <FolderKanban size={22} />
              </div>
              <div className="project-card-copy">
                <h3 title={project.name}>{project.name}</h3>
                <p>{project.description || 'No description provided.'}</p>
              </div>
              <div className="project-card-meta">
                <span>Created {formatDate(project.created_at)}</span>
              </div>
              <div className="project-card-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <FolderKanban size={16} />
                  <span>Open Project</span>
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => navigate(`/projects/${project.id}/chat`)}
                >
                  <MessageSquare size={16} />
                  <span>Chat</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {createModalOpen && (
        <div className="modal-backdrop" role="presentation">
          <form className="project-modal" onSubmit={handleCreateProject}>
            <div className="modal-header">
              <h3>New Project</h3>
              <button
                type="button"
                className="icon-button"
                onClick={() => setCreateModalOpen(false)}
                title="Close"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <label className="form-label" htmlFor="project-name">Project name</label>
            <input
              id="project-name"
              className="form-input"
              value={projectName}
              onChange={(event) => setProjectName(event.target.value)}
              maxLength={120}
              autoFocus
              disabled={creating}
              placeholder="Policy KB"
            />
            <label className="form-label" htmlFor="project-description">Description</label>
            <textarea
              id="project-description"
              className="form-input textarea-input"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              disabled={creating}
              placeholder="Benefits, policies, and onboarding documents"
              rows={3}
            />
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setCreateModalOpen(false)}
                disabled={creating}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={creating || !projectName.trim()}
              >
                {creating ? <Spinner size={16} color="var(--on-accent)" /> : <Plus size={16} />}
                <span>Create</span>
              </button>
            </div>
          </form>
        </div>
      )}

      <style>{`
        .projects-page {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          text-align: left;
        }

        .projects-header h1 {
          font-size: clamp(2rem, 4vw, 2.75rem);
          line-height: 1.2;
        }

        .projects-header,
        .projects-actions,
        .project-card-actions,
        .modal-header,
        .modal-actions {
          display: flex;
          align-items: center;
        }

        .projects-header {
          align-items: flex-end;
          justify-content: space-between;
          gap: 1rem;
        }

        .projects-actions,
        .project-card-actions,
        .modal-actions {
          gap: 0.75rem;
        }

        .projects-loading,
        .projects-empty {
          min-height: 380px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          text-align: center;
          background: var(--bg-card);
          border-radius: var(--border-radius-xl);
        }

        .projects-empty h3 {
          font-size: clamp(1.4rem, 3vw, 1.8rem);
        }

        .projects-empty p {
          max-width: 440px;
          color: var(--text-secondary);
        }

        .empty-icon,
        .project-card-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: var(--accent-color);
          background: var(--accent-light);
          border: 1px solid var(--border-color);
          box-shadow: var(--shadow-sm);
        }

        .empty-icon {
          width: 82px;
          height: 82px;
          border-radius: var(--border-radius-lg);
        }

        .project-card-icon {
          width: 48px;
          height: 48px;
          border-radius: var(--border-radius-md);
        }

        .projects-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.15rem;
        }

        .project-card {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          min-height: 280px;
          padding: 1.6rem;
          background: var(--bg-card);
        }

        .project-card-copy {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          min-width: 0;
        }

        .project-card-copy h3 {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-size: 1.35rem;
        }

        .project-card-copy p,
        .project-card-meta {
          color: var(--text-secondary);
          font-size: 0.9rem;
        }

        .project-card-actions {
          margin-top: auto;
          flex-wrap: wrap;
        }

        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(7, 9, 42, 0.68);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          z-index: 1000;
        }

        .project-modal {
          width: min(480px, 100%);
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius-xl);
          padding: 1.5rem;
          box-shadow: var(--shadow-lg);
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }

        .modal-header {
          justify-content: space-between;
        }

        .modal-header h3 {
          font-size: 1.6rem;
        }

        .icon-button {
          width: 44px;
          height: 44px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius-sm);
          color: var(--text-secondary);
          background-color: var(--bg-elevated);
          cursor: pointer;
        }

        .textarea-input {
          resize: vertical;
          min-height: 86px;
        }

        .modal-actions {
          justify-content: flex-end;
          margin-top: 0.5rem;
        }

        @media (max-width: 720px) {
          .projects-header {
            align-items: stretch;
            flex-direction: column;
          }

          .projects-actions,
          .project-card-actions {
            width: 100%;
          }

          .projects-actions .btn,
          .project-card-actions .btn {
            flex: 1;
          }

          .projects-empty { min-height: 330px; }
        }
      `}</style>
    </div>
  );
};

export default ProjectsList;
