import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Spinner } from '../../components/ui/Loader';
import { BrainCircuit, Mail, ArrowLeft } from 'lucide-react';
import './auth.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      showToast('Please enter your email.', 'error');
      return;
    }

    setLoading(true);
    try {
      // POST /api/v1/user/forgot-password
      const res = await api.post('/user/forgot-password', { email });
      if (res.data.success) {
        setSubmitted(true);
        showToast('Password reset link requested successfully!', 'success');
      }
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.error || err.response?.data?.detail || 'User not found.';
      showToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-brand-pane">
        <div className="pane-content">
          <div className="brand-logo">
            <BrainCircuit size={48} />
          </div>
          <h1>Doc-Sense AI</h1>
          <p className="tagline">Ask your PDFs anything.</p>
          <p className="description">
            Upload your documents, extract insights, and chat with your files in real time using advanced AI.
          </p>
        </div>
      </div>

      <div className="auth-form-pane">
        <div className="auth-form">
          <div className="back-to-login-row">
            <Link to="/login" className="back-link">
              <ArrowLeft size={16} />
              <span>Back to Sign In</span>
            </Link>
          </div>

          {!submitted ? (
            <form onSubmit={handleSubmit}>
              <div className="form-header">
                <h2>Forgot Password</h2>
                <p>Enter your email and we'll send you a password reset link.</p>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="email">Email Address</label>
                <div className="input-container">
                  <Mail className="input-icon" size={18} />
                  <input
                    id="email"
                    type="email"
                    className="form-input with-icon"
                    placeholder="manav@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                {loading ? <Spinner size={18} color="var(--on-accent)" /> : 'Send Reset Link'}
              </button>
            </form>
          ) : (
            <div className="success-state">
              <div className="success-icon-badge">
                <Mail size={32} />
              </div>
              <h3>Reset Link Sent</h3>
              <p>
                We've processed a reset request for <strong>{email}</strong>. 
                Please check your inbox (and spam folder) for further instructions.
              </p>
              <p className="note-text">
                Note: In development environments, check your backend console logs for the generated reset URL.
              </p>
              <Link to="/login" className="btn btn-primary btn-block" style={{ marginTop: '1.5rem' }}>
                Return to Login
              </Link>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .back-to-login-row {
          margin-bottom: 2rem;
          text-align: left;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-secondary);
          text-decoration: none;
          font-size: 0.875rem;
          font-weight: 500;
          transition: color var(--transition-fast);
        }

        .back-link:hover {
          color: var(--accent-color);
        }

        .success-state {
          text-align: center;
          padding: 1.5rem 0;
        }

        .success-icon-badge {
          width: 64px;
          height: 64px;
          border-radius: 20px;
          background: linear-gradient(135deg, var(--accent-color), var(--accent-magenta));
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem auto;
          box-shadow: 0 14px 32px var(--accent-glow);
        }

        .success-state h3 {
          font-size: 1.5rem;
          font-weight: 800;
          margin-bottom: 0.75rem;
        }

        .success-state p {
          font-size: 0.9rem;
          color: var(--text-secondary);
          line-height: 1.6;
        }

        .note-text {
          margin-top: 1rem;
          font-size: 0.8rem !important;
          color: var(--text-muted) !important;
          background-color: var(--bg-elevated);
          padding: 0.75rem;
          border-radius: var(--border-radius-lg);
          border: 1px dashed var(--border-color);
        }
      `}</style>
    </div>
  );
};

export default ForgotPassword;
