import React from 'react';

export const Spinner = ({ size = 20, color = 'var(--accent-color)' }) => {
  return (
    <div 
      className="spinner" 
      style={{
        width: `${size}px`,
        height: `${size}px`,
        border: `2.5px solid var(--border-color)`,
        borderTop: `2.5px solid ${color}`,
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
        display: 'inline-block'
      }}
    >
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export const SkeletonTable = ({ rows = 5 }) => {
  return (
    <div className="skeleton-table">
      <div className="skeleton-header-row" />
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="skeleton-body-row">
          <div className="skeleton-cell cell-long" />
          <div className="skeleton-cell cell-medium" />
          <div className="skeleton-cell cell-short" />
          <div className="skeleton-cell cell-icon" />
        </div>
      ))}
      <style>{`
        .skeleton-table {
          width: 100%;
          border: 1px solid var(--border-color);
          overflow: hidden;
          padding: 1rem;
          background: var(--bg-card);
          border-radius: var(--border-radius-xl);
          box-shadow: var(--shadow-sm);
        }
        
        .skeleton-header-row {
          height: 40px;
          background: var(--bg-strong);
          animation: loading-pulse 1.5s infinite;
          border-radius: var(--border-radius-sm);
          margin-bottom: 1rem;
        }
        
        .skeleton-body-row {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          padding: 0.875rem 0.5rem;
          border-bottom: 1px solid var(--border-color);
        }
        
        .skeleton-body-row:last-child {
          border-bottom: none;
        }
        
        .skeleton-cell {
          height: 16px;
          background: var(--bg-strong);
          animation: loading-pulse 1.5s infinite;
          border-radius: var(--border-radius-pill);
        }
        
        .cell-long { flex: 4; }
        .cell-medium { flex: 2; }
        .cell-short { flex: 1.5; }
        .cell-icon { width: 32px; border-radius: 50%; }
        
        @keyframes loading-pulse {
          0%, 100% { opacity: 0.55; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export const SkeletonChat = () => {
  return (
    <div className="skeleton-chat">
      <div className="skeleton-bubble left" />
      <div className="skeleton-bubble right" />
      <div className="skeleton-bubble left" />
      <style>{`
        .skeleton-chat {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding: 1rem;
          width: 100%;
        }
        
        .skeleton-bubble {
          max-width: 60%;
          height: 60px;
          border-radius: var(--border-radius-xl);
          background: var(--bg-strong);
          animation: loading-pulse 1.5s infinite;
        }
        
        .skeleton-bubble.left {
          align-self: flex-start;
          border-bottom-left-radius: var(--border-radius-sm);
          width: 50%;
        }
        
        .skeleton-bubble.right {
          align-self: flex-end;
          border-bottom-right-radius: var(--border-radius-sm);
          width: 40%;
        }
      `}</style>
    </div>
  );
};
