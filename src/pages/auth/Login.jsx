import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Spinner } from '../../components/ui/Loader';
import { BrainCircuit, Mail, Lock } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please fill in all fields.', 'error');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      showToast('Welcome back!', 'success');
      navigate('/');
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.error || err.response?.data?.detail || 'Incorrect email or password, try again.';
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
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-header">
            <h2>Welcome Back</h2>
            <p>Enter your credentials to access your dashboard</p>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <div className="input-container">
              <Mail className="input-icon" size={18} />
              <input
                id="email"
                type="email"
                className="form-input with-icon"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <div className="password-label-row">
              <label className="form-label" htmlFor="password">Password</label>
              <Link to="/forgot-password" className="forgot-link">Forgot password?</Link>
            </div>
            <div className="input-container">
              <Lock className="input-icon" size={18} />
              <input
                id="password"
                type="password"
                className="form-input with-icon"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? <Spinner size={18} color="#fff" /> : 'Sign In'}
          </button>

          <p className="auth-footer-text">
            Don't have an account? <Link to="/register" className="auth-link">Create Account</Link>
          </p>
        </form>
      </div>

      <style>{`
        .auth-page {
          display: flex;
          min-height: 100vh;
          width: 100%;
        }

        .auth-brand-pane {
          flex: 1.2;
          background-color: var(--bg-sidebar);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          position: relative;
          overflow: hidden;
        }

        .auth-brand-pane::before {
          content: '';
          position: absolute;
          width: 300px;
          height: 300px;
          background-color: var(--accent-color);
          filter: blur(150px);
          opacity: 0.15;
          top: -50px;
          left: -50px;
          border-radius: 50%;
        }

        .auth-brand-pane::after {
          content: '';
          position: absolute;
          width: 400px;
          height: 400px;
          background-color: var(--accent-color);
          filter: blur(200px);
          opacity: 0.1;
          bottom: -100px;
          right: -100px;
          border-radius: 50%;
        }

        .pane-content {
          max-width: 460px;
          position: relative;
          z-index: 10;
          text-align: left;
        }

        .brand-logo {
          color: var(--accent-color);
          margin-bottom: 1.5rem;
          display: inline-block;
          animation: float 4s ease-in-out infinite;
        }

        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }

        .auth-brand-pane h1 {
          font-size: 2.75rem;
          color: #ffffff;
          margin-bottom: 0.5rem;
          font-family: var(--font-display);
          font-weight: 700;
        }

        .tagline {
          font-size: 1.5rem;
          color: var(--accent-color);
          margin-bottom: 1.5rem;
          font-weight: 500;
        }

        .description {
          font-size: 1rem;
          line-height: 1.6;
          color: var(--sidebar-text-muted);
        }

        .auth-form-pane {
          flex: 1;
          background-color: var(--bg-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2.5rem;
          transition: background-color var(--transition-normal);
        }

        .auth-form {
          width: 100%;
          max-width: 400px;
          display: flex;
          flex-direction: column;
        }

        .form-header {
          margin-bottom: 2rem;
          text-align: left;
        }

        .form-header h2 {
          font-size: 1.875rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 0.375rem;
        }

        .form-header p {
          font-size: 0.875rem;
          color: var(--text-muted);
        }

        .input-container {
          position: relative;
          width: 100%;
        }

        .input-icon {
          position: absolute;
          left: 0.875rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          transition: color var(--transition-fast);
        }

        .form-input.with-icon {
          padding-left: 2.625rem;
        }

        .form-input.with-icon:focus + .input-icon {
          color: var(--accent-color);
        }

        .password-label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .password-label-row .form-label {
          margin-bottom: 0;
        }

        .forgot-link {
          font-size: 0.8125rem;
          color: var(--accent-color);
          text-decoration: none;
          font-weight: 500;
          transition: color var(--transition-fast);
        }

        .forgot-link:hover {
          color: var(--accent-hover);
        }

        .btn-block {
          width: 100%;
          margin-top: 0.5rem;
          height: 42px;
        }

        .auth-footer-text {
          margin-top: 1.5rem;
          font-size: 0.875rem;
          color: var(--text-secondary);
          text-align: center;
        }

        .auth-link {
          color: var(--accent-color);
          text-decoration: none;
          font-weight: 600;
          transition: color var(--transition-fast);
        }

        .auth-link:hover {
          color: var(--accent-hover);
        }

        @media (max-width: 900px) {
          .auth-page {
            flex-direction: column;
          }
          .auth-brand-pane {
            flex: none;
            padding: 3rem 1.5rem;
          }
          .auth-form-pane {
            padding: 3rem 1.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Login;
