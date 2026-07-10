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
    <section className="dashboard-hero discord-feature-panel card" aria-labelledby="home-hero-title">
      <div className="hero-copy">
        <span className="section-kicker">Dashboard</span>
        <h1 id="home-hero-title">Welcome to Doc-Sense AI</h1>
        <p>
          Upload PDFs, build project knowledge bases, and ask document-grounded questions from one
          workspace. Choose the workflow you need and continue from your document history anytime.
        </p>
        <div className="hero-actions" aria-label="Primary actions">
          <Link className="btn btn-intent" to="/upload">
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
        min-height: 470px;
        padding: clamp(1.75rem, 5vw, 3.5rem);
        overflow: hidden;
        background:
          radial-gradient(circle at 86% 10%, rgba(236, 72, 189, 0.9), transparent 30%),
          radial-gradient(circle at 92% 92%, rgba(53, 237, 126, 0.24), transparent 30%),
          linear-gradient(140deg, #10154b 0%, var(--accent-color) 58%, #8538b6 100%);
        border: 1px solid rgba(255, 255, 255, 0.18);
        border-radius: var(--border-radius-xxl);
        box-shadow: var(--shadow-lg);
      }

      .dashboard-hero::after {
        content: '';
        position: absolute;
        right: -8rem;
        bottom: -11rem;
        width: 30rem;
        height: 30rem;
        border: 2px solid rgba(255, 255, 255, 0.15);
        border-radius: 44% 56% 65% 35% / 46% 41% 59% 54%;
        transform: rotate(-18deg);
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
        color: var(--accent-magenta);
        background: var(--accent-light);
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius-pill);
        font-size: 0.72rem;
        font-weight: 800;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }

      .dashboard-hero .section-kicker {
        color: #ffffff;
        background: rgba(255, 255, 255, 0.13);
        border-color: rgba(255, 255, 255, 0.22);
      }

      .dashboard-hero h1 {
        max-width: 10ch;
        color: #ffffff;
        font-size: clamp(3rem, 7vw, 6.5rem);
        line-height: 0.88;
        letter-spacing: -0.065em;
        text-transform: uppercase;
      }

      .dashboard-hero p {
        max-width: 640px;
        color: rgba(255, 255, 255, 0.82);
        font-size: 1.05rem;
        line-height: 1.65;
      }

      .hero-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.875rem;
        margin-top: 0.75rem;
      }

      .dashboard-hero .btn-secondary {
        color: #ffffff;
        background: rgba(10, 13, 58, 0.34);
        border-color: rgba(255, 255, 255, 0.24);
        backdrop-filter: blur(10px);
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
        color: #ffffff;
        background: rgba(10, 13, 58, 0.35);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: var(--border-radius-lg);
        backdrop-filter: blur(14px);
      }

      .summary-card span {
        grid-row: 1 / span 2;
        font-family: var(--font-display);
        font-size: 2.1rem;
        font-weight: 800;
        color: var(--intent-color);
      }

      .summary-card strong { color: #ffffff; font-size: 1rem; }
      .summary-card p { margin: 0; color: rgba(255, 255, 255, 0.7); font-size: 0.82rem; }

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
        color: #ffffff;
        background: linear-gradient(135deg, var(--accent-color), var(--accent-magenta));
        border-radius: var(--border-radius-md);
        box-shadow: 0 10px 24px var(--accent-glow);
      }

      .action-card > svg { box-sizing: content-box; padding: 0.72rem; }
      .action-card h2 { margin-bottom: 0.3rem; font-size: 1.1rem; }

      .action-card p,
      .feature-card p,
      .step-row span { color: var(--text-secondary); font-size: 0.9rem; }

      .home-section { display: flex; flex-direction: column; gap: 1.25rem; }
      .section-header { display: flex; flex-direction: column; gap: 0.6rem; }
      .section-header h2,
      .workflow-panel h2 { max-width: 16ch; font-size: clamp(2rem, 4vw, 3.6rem); text-transform: uppercase; }

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
        background:
          radial-gradient(circle at 100% 0%, var(--mesh-magenta), transparent 34%),
          var(--bg-card);
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

      .step-row svg { flex: 0 0 auto; color: var(--accent-magenta); }

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
        .dashboard-hero { padding: 1.5rem; border-radius: 28px; }
        .dashboard-hero h1 { font-size: clamp(2.8rem, 15vw, 4.5rem); }
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
