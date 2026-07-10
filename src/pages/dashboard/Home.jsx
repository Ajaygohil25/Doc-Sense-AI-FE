import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Blocks,
  CheckCircle2,
  FileSearch,
  FolderKanban,
  MessageSquareText,
  ShieldCheck,
  UploadCloud,
  Workflow
} from 'lucide-react';

const features = [
  {
    icon: MessageSquareText,
    title: 'Single-document chat',
    body: 'Upload one PDF and ask focused questions in a dedicated document chat room.'
  },
  {
    icon: FolderKanban,
    title: 'Project knowledge bases',
    body: 'Create project workspaces for related PDFs that need to answer together.'
  },
  {
    icon: FileSearch,
    title: 'Source-grounded answers',
    body: 'Ask questions against indexed document context instead of loose summaries.'
  },
  {
    icon: Workflow,
    title: 'Processing visibility',
    body: 'Track uploaded files through the document library and resume from the right place.'
  },
  {
    icon: Blocks,
    title: 'Reusable chat rooms',
    body: 'Continue file and project conversations without rebuilding the same context.'
  },
  {
    icon: ShieldCheck,
    title: 'Profile and security',
    body: 'Manage account details and password controls inside the authenticated app.'
  }
];

const steps = [
  'Upload a single PDF or create a project.',
  'Let Doc-Sense AI process the file content.',
  'Ask questions from the document or project chat.'
];

const Home = () => (
  <div className="dashboard-home">
    <section className="dashboard-hero card" aria-labelledby="home-hero-title">
      <div className="hero-copy">
        <span className="section-kicker">Dashboard</span>
        <h1 id="home-hero-title">Welcome to Doc-Sense AI</h1>
        <p>
          Upload PDFs, build project knowledge bases, and ask document-grounded questions from one
          workspace. Choose the workflow you need and continue from your document history anytime.
        </p>
        <div className="hero-actions" aria-label="Primary actions">
          <Link className="btn btn-primary" to="/upload">
            <UploadCloud size={16} aria-hidden="true" />
            Upload a PDF
          </Link>
          <Link className="btn btn-secondary" to="/projects">
            Open projects
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>

      <div className="hero-summary" aria-label="Workspace summary">
        <div className="summary-card">
          <span>01</span>
          <strong>Single file</strong>
          <p>Focused PDF analysis</p>
        </div>
        <div className="summary-card">
          <span>02</span>
          <strong>Project KB</strong>
          <p>Multi-file context</p>
        </div>
        <div className="summary-card">
          <span>03</span>
          <strong>Chat rooms</strong>
          <p>Reusable conversations</p>
        </div>
      </div>
    </section>

    <section className="quick-actions" aria-label="Workspace shortcuts">
      <Link className="action-card card" to="/upload">
        <UploadCloud size={22} aria-hidden="true" />
        <div>
          <h2>Upload PDF</h2>
          <p>Start a single-document chat workflow.</p>
        </div>
      </Link>
      <Link className="action-card card" to="/documents">
        <FileSearch size={22} aria-hidden="true" />
        <div>
          <h2>My Documents</h2>
          <p>Review uploads and continue file chats.</p>
        </div>
      </Link>
      <Link className="action-card card" to="/projects">
        <FolderKanban size={22} aria-hidden="true" />
        <div>
          <h2>Projects</h2>
          <p>Manage shared project knowledge bases.</p>
        </div>
      </Link>
    </section>

    <section className="home-section" aria-labelledby="feature-section-title">
      <div className="section-header">
        <span className="section-kicker">Features</span>
        <h2 id="feature-section-title">Everything available from the home page</h2>
      </div>
      <div className="feature-grid">
        {features.map(({ icon: Icon, title, body }) => (
          <article className="feature-card card" key={title}>
            <div className="feature-icon">
              <Icon size={20} aria-hidden="true" />
            </div>
            <h3>{title}</h3>
            <p>{body}</p>
          </article>
        ))}
      </div>
    </section>

    <section className="workflow-panel card" aria-labelledby="workflow-title">
      <div className="section-header">
        <span className="section-kicker">Workflow</span>
        <h2 id="workflow-title">Move from file to answer in three steps</h2>
      </div>
      <div className="step-list">
        {steps.map((step) => (
          <div className="step-row" key={step}>
            <CheckCircle2 size={18} aria-hidden="true" />
            <span>{step}</span>
          </div>
        ))}
      </div>
    </section>

    <style>{`
      .dashboard-home {
        display: flex;
        flex-direction: column;
        gap: 2rem;
        text-align: left;
      }

      .dashboard-hero {
        position: relative;
        display: grid;
        grid-template-columns: minmax(0, 1.25fr) minmax(280px, 0.75fr);
        gap: clamp(1.5rem, 4vw, 3rem);
        align-items: stretch;
        padding: clamp(1.5rem, 4vw, 2.25rem);
        overflow: hidden;
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius-xl);
        box-shadow: var(--shadow-sm);
      }

      .hero-copy,
      .hero-summary {
        position: relative;
        z-index: 1;
      }

      .hero-copy {
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 1rem;
      }

      .section-kicker {
        width: fit-content;
        padding: 0.38rem 0.72rem;
        color: var(--accent-color);
        background: var(--accent-light);
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius-pill);
        font-size: 0.72rem;
        font-weight: 600;
        letter-spacing: 0.03em;
      }

      .dashboard-hero .section-kicker {
        color: var(--accent-color);
        background: var(--accent-light);
        border-color: var(--border-color);
      }

      .dashboard-hero h1 {
        max-width: 18ch;
        color: var(--text-primary);
        font-size: clamp(2.1rem, 5vw, 3rem);
        line-height: 1.15;
        letter-spacing: -0.03em;
      }

      .dashboard-hero p {
        max-width: 640px;
        color: var(--text-secondary);
        font-size: 1rem;
        line-height: 1.6;
      }

      .hero-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.875rem;
        margin-top: 0.75rem;
      }

      .dashboard-hero .btn-secondary {
        color: var(--text-primary);
        background: var(--bg-card);
        border-color: var(--border-strong);
      }

      .hero-summary {
        display: grid;
        align-content: center;
        gap: 0.9rem;
      }

      .summary-card {
        display: grid;
        grid-template-columns: auto 1fr;
        column-gap: 1rem;
        align-items: center;
        padding: 1rem 1.1rem;
        color: var(--text-primary);
        background: var(--bg-elevated);
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius-lg);
      }

      .summary-card span {
        grid-row: 1 / span 2;
        font-family: var(--font-display);
        font-size: 1.35rem;
        font-weight: 700;
        color: var(--accent-color);
      }

      .summary-card strong { color: var(--text-primary); font-size: 0.95rem; }
      .summary-card p { margin: 0; color: var(--text-secondary); font-size: 0.8rem; }

      .quick-actions,
      .feature-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 1.15rem;
      }

      .action-card {
        position: relative;
        display: flex;
        align-items: flex-start;
        gap: 1rem;
        min-height: 132px;
        color: inherit;
        text-decoration: none;
      }

      .action-card::after {
        content: '→';
        position: absolute;
        right: 1.25rem;
        bottom: 1rem;
        color: var(--accent-color);
        font-size: 1.2rem;
        font-weight: 800;
      }

      .action-card > svg,
      .feature-icon {
        display: grid;
        flex: 0 0 auto;
        place-items: center;
        color: var(--accent-color);
        background: var(--accent-light);
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius-md);
      }

      .action-card > svg { box-sizing: content-box; padding: 0.72rem; }
      .action-card h2 { margin-bottom: 0.3rem; font-size: 1.1rem; }

      .action-card p,
      .feature-card p,
      .step-row span { color: var(--text-secondary); font-size: 0.9rem; }

      .home-section { display: flex; flex-direction: column; gap: 1.25rem; }
      .section-header { display: flex; flex-direction: column; gap: 0.6rem; }
      .section-header h2,
      .workflow-panel h2 { max-width: 20ch; font-size: clamp(1.5rem, 3vw, 2rem); }

      .feature-card {
        position: relative;
        display: flex;
        min-height: 210px;
        flex-direction: column;
        gap: 0.8rem;
        padding-top: 1.75rem;
      }

      .feature-card:nth-child(2),
      .feature-card:nth-child(5) { background: var(--bg-elevated); }

      .feature-icon { width: 46px; height: 46px; }
      .feature-card h3 { margin-top: auto; font-size: 1.14rem; }

      .workflow-panel {
        display: grid;
        grid-template-columns: minmax(0, 0.8fr) minmax(280px, 1.2fr);
        gap: 2rem;
        padding: clamp(1.5rem, 4vw, 2.5rem);
        background: var(--bg-card);
      }

      .step-list { display: flex; flex-direction: column; gap: 0.8rem; }

      .step-row {
        display: flex;
        align-items: center;
        gap: 0.8rem;
        min-height: 56px;
        padding: 0.85rem 1rem;
        background: var(--bg-elevated);
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius-md);
      }

      .step-row svg { flex: 0 0 auto; color: var(--accent-color); }

      @media (max-width: 1023px) {
        .dashboard-hero,
        .workflow-panel { grid-template-columns: 1fr; }
        .dashboard-hero { min-height: 0; }
        .hero-summary { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        .summary-card { grid-template-columns: 1fr; }
        .summary-card span { grid-row: auto; }
        .quick-actions,
        .feature-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      }

      @media (max-width: 639px) {
        .dashboard-home { gap: 1.25rem; }
        .dashboard-hero { padding: 1.5rem; border-radius: var(--border-radius-xl); }
        .dashboard-hero h1 { font-size: clamp(1.9rem, 10vw, 2.5rem); }
        .hero-actions { align-items: stretch; flex-direction: column; }
        .hero-actions .btn { width: 100%; }
        .hero-summary,
        .quick-actions,
        .feature-grid { grid-template-columns: 1fr; }
        .summary-card { grid-template-columns: auto 1fr; }
        .summary-card span { grid-row: 1 / span 2; }
        .feature-card { min-height: 180px; }
      }
    `}</style>
  </div>
);

export default Home;
