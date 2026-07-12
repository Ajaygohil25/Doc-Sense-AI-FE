import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Spinner } from '../../components/ui/Loader';
import { BrainCircuit, User, Mail, Lock, Check, X } from 'lucide-react';
import './auth.css';

const Register = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Password rules validation
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
    if (passed <= 2) return { label: 'Weak', color: 'var(--danger-color)', percent: 33 };
    if (passed <= 4) return { label: 'Fair', color: 'var(--warning-color)', percent: 66 };
    return { label: 'Strong', color: 'var(--success-color)', percent: 100 };
  };

  const isPasswordValid = Object.values(checks).every(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !password) {
      showToast('Please fill in all fields.', 'error');
      return;
    }

    if (!isPasswordValid) {
      showToast('Please satisfy all password strength requirements.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await register(firstName, lastName, email, password);
      showToast(res.message || 'Account created successfully!', 'success');
      navigate('/login');
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.error || err.response?.data?.detail || 'Registration failed. Try again.';
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
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-header">
            <h2>Create Account</h2>
            <p>Sign up to start analyzing your PDF files</p>
          </div>

          <div className="form-name-row">
            <div className="form-group">
              <label className="form-label" htmlFor="firstName">First Name</label>
              <div className="input-container">
                <User className="input-icon" size={18} />
                <input
                  id="firstName"
                  type="text"
                  className="form-input with-icon"
                  placeholder="Manav"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="lastName">Last Name</label>
              <div className="input-container">
                <User className="input-icon" size={18} />
                <input
                  id="lastName"
                  type="text"
                  className="form-input with-icon"
                  placeholder="Patel"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>
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

          <div className="form-group" style={{ marginBottom: '0.75rem' }}>
            <label className="form-label" htmlFor="password">Password</label>
            <div className="input-container">
              <Lock className="input-icon" size={18} />
              <input
                id="password"
                type="password"
                className="form-input with-icon"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          {/* Password Strength Indicator */}
          {password && (
            <div className="password-strength-container">
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
                  <span>1+ special char (@$!%*?&)</span>
                </div>
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-block" disabled={loading || (password && !isPasswordValid)}>
            {loading ? <Spinner size={18} color="var(--on-accent)" /> : 'Sign Up'}
          </button>

          <p className="auth-footer-text">
            Already have an account? <Link to="/login" className="auth-link">Sign In</Link>
          </p>
        </form>
      </div>

      <style>{`
        .form-name-row {
          display: flex;
          gap: 1rem;
        }

        .password-strength-container {
          background-color: var(--bg-elevated);
          padding: 1rem;
          border-radius: var(--border-radius-lg);
          margin-bottom: 1.25rem;
          border: 1px solid var(--border-color);
          text-align: left;
        }

        .strength-bar-meta {
          font-size: 0.75rem;
          color: var(--text-secondary);
          margin-bottom: 0.375rem;
        }

        .strength-bar-bg {
          height: 8px;
          background-color: var(--bg-strong);
          border-radius: var(--border-radius-pill);
          overflow: hidden;
          margin-bottom: 0.75rem;
        }

        .strength-bar-fill {
          height: 100%;
          border-radius: inherit;
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

        .rule-item svg {
          flex-shrink: 0;
        }

        @media (max-width: 900px) {
          .form-name-row {
            flex-direction: column;
            gap: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default Register;
