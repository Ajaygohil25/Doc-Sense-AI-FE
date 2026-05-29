import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Spinner } from '../../components/ui/Loader';
import { BrainCircuit, Lock, Check, X, ArrowLeft } from 'lucide-react';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [checks, setChecks] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    digit: false,
    special: false,
  });

  useEffect(() => {
    setChecks({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      digit: /[0-9]/.test(password),
      special: /[@$!%*?&]/.test(password),
    });
  }, [password]);

  const getPasswordStrength = () => {
    const passed = Object.values(checks).filter(Boolean).length;
    if (passed === 0) return { label: 'Empty', color: 'var(--border-color)', percent: 0 };
    if (passed <= 2) return { label: 'Weak', color: '#ef4444', percent: 33 };
    if (passed <= 4) return { label: 'Fair', color: '#fbbf24', percent: 66 };
    return { label: 'Strong', color: '#10b981', percent: 100 };
  };

  const isPasswordValid = Object.values(checks).every(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      showToast('Reset token is missing from the URL.', 'error');
      return;
    }

    if (!password || !confirmPassword) {
      showToast('Please fill in all fields.', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    if (!isPasswordValid) {
      showToast('Password does not satisfy the security rules.', 'error');
      return;
    }

    setLoading(true);
    try {
      // POST /api/v1/user/reset-password?token=<token>
      const res = await api.post(`/user/reset-password?token=${token}`, {
        new_password: password,
        confirm_password: confirmPassword
      });

      if (res.data.success) {
        showToast('Password reset successfully! Please sign in with your new password.', 'success');
        navigate('/login');
      }
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.error || err.response?.data?.detail || 'Token has expired or is invalid.';
      showToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const strength = getPasswordStrength();

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

          <form onSubmit={handleSubmit}>
            <div className="form-header">
              <h2>Reset Password</h2>
              <p>Enter and confirm your new secure password.</p>
            </div>

            {!token && (
              <div className="token-alert-warning">
                <X size={16} />
                <span>Error: Invalid reset link (token missing)</span>
              </div>
            )}

            <div className="form-group" style={{ marginBottom: '0.75rem' }}>
              <label className="form-label" htmlFor="password">New Password</label>
              <div className="input-container">
                <Lock className="input-icon" size={18} />
                <input
                  id="password"
                  type="password"
                  className="form-input with-icon"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading || !token}
                  required
                />
              </div>
            </div>

            {/* Password Strength Indicator */}
            {password && (
              <div className="password-strength-container" style={{ marginBottom: '1rem' }}>
                <div className="strength-bar-meta">
                  <span className="strength-label">Password Strength: <strong>{strength.label}</strong></span>
                </div>
                <div className="strength-bar-bg">
                  <div 
                    className="strength-bar-fill" 
                    style={{ 
                      width: `${strength.percent}%`, 
                      backgroundColor: strength.color 
                    }} 
                  />
                </div>
                <div className="strength-rules">
                  <div className={`rule-item ${checks.length ? 'passed' : ''}`}>
                    {checks.length ? <Check size={12} /> : <X size={12} />}
                    <span>8+ characters</span>
                  </div>
                  <div className={`rule-item ${checks.uppercase ? 'passed' : ''}`}>
                    {checks.uppercase ? <Check size={12} /> : <X size={12} />}
                    <span>1+ uppercase letter</span>
                  </div>
                  <div className={`rule-item ${checks.lowercase ? 'passed' : ''}`}>
                    {checks.lowercase ? <Check size={12} /> : <X size={12} />}
                    <span>1+ lowercase letter</span>
                  </div>
                  <div className={`rule-item ${checks.digit ? 'passed' : ''}`}>
                    {checks.digit ? <Check size={12} /> : <X size={12} />}
                    <span>1+ digit</span>
                  </div>
                  <div className={`rule-item ${checks.special ? 'passed' : ''}`}>
                    {checks.special ? <Check size={12} /> : <X size={12} />}
                    <span>1+ special (@$!%*?&)</span>
                  </div>
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
              <div className="input-container">
                <Lock className="input-icon" size={18} />
                <input
                  id="confirmPassword"
                  type="password"
                  className="form-input with-icon"
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading || !token}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={loading || !token || (password && !isPasswordValid)}>
              {loading ? <Spinner size={18} color="#fff" /> : 'Update Password'}
            </button>
          </form>
        </div>
      </div>

      <style>{`
        .token-alert-warning {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background-color: var(--danger-light);
          color: var(--danger-color);
          padding: 0.75rem 1rem;
          border-radius: var(--border-radius-md);
          border: 1px solid rgba(239, 68, 68, 0.15);
          font-size: 0.8125rem;
          font-weight: 500;
          margin-bottom: 1.25rem;
          text-align: left;
        }

        .password-strength-container {
          background-color: var(--bg-primary);
          padding: 0.75rem 1rem;
          border-radius: var(--border-radius-md);
          border: 1px solid var(--border-color);
          text-align: left;
        }

        .strength-bar-meta {
          font-size: 0.75rem;
          color: var(--text-secondary);
          margin-bottom: 0.375rem;
        }

        .strength-bar-bg {
          height: 4px;
          background-color: var(--border-color);
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 0.75rem;
        }

        .strength-bar-fill {
          height: 100%;
          transition: width var(--transition-fast) ease, background-color var(--transition-fast) ease;
        }

        .strength-rules {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.375rem 0.75rem;
        }

        .rule-item {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.725rem;
          color: var(--text-muted);
        }

        .rule-item.passed {
          color: var(--success-color);
        }
      `}</style>
    </div>
  );
};

export default ResetPassword;
