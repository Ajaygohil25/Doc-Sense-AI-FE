import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Spinner } from '../../components/ui/Loader';
import { User, Lock, Check, X, Shield, Eye, EyeOff } from 'lucide-react';

const Profile = () => {
  const [activeTab, setActiveTab] = useState('profile');
  
  // Profile Form States
  const { user, updateProfile, changePassword } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  // Security Form States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityLoading, setSecurityLoading] = useState(false);
  
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Populate profile info from AuthContext
  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || '');
      setLastName(user.last_name || '');
      setEmail(user.email || '');
    }
  }, [user]);

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
      length: newPassword.length >= 8,
      uppercase: /[A-Z]/.test(newPassword),
      lowercase: /[a-z]/.test(newPassword),
      digit: /[0-9]/.test(newPassword),
      special: /[@$!%*?&]/.test(newPassword),
    });
  }, [newPassword]);

  const getPasswordStrength = () => {
    const passed = Object.values(checks).filter(Boolean).length;
    if (passed === 0) return { label: 'Empty', color: 'var(--border-color)', percent: 0 };
    if (passed <= 2) return { label: 'Weak', color: 'var(--danger-color)', percent: 33 };
    if (passed <= 4) return { label: 'Fair', color: 'var(--warning-color)', percent: 66 };
    return { label: 'Strong', color: 'var(--success-color)', percent: 100 };
  };

  const isPasswordValid = Object.values(checks).every(Boolean);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      showToast('First Name and Last Name cannot be empty.', 'error');
      return;
    }

    setProfileLoading(true);
    try {
      const res = await updateProfile(firstName, lastName);
      if (res.success) {
        showToast(res.message || 'Profile updated successfully!', 'success');
      }
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.error || err.response?.data?.detail || 'Failed to update profile.';
      showToast(errMsg, 'error');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast('Please fill in all password fields.', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match.', 'error');
      return;
    }

    if (!isPasswordValid) {
      showToast('New password does not satisfy the security requirements.', 'error');
      return;
    }

    setSecurityLoading(true);
    try {
      const res = await changePassword(currentPassword, newPassword, confirmPassword);
      if (res.success) {
        showToast('Password changed successfully! Please log in again.', 'success');
        navigate('/login');
      }
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.error || err.response?.data?.detail || 'Failed to change password.';
      showToast(errMsg, 'error');
    } finally {
      setSecurityLoading(false);
    }
  };

  const strength = getPasswordStrength();

  return (
    <div className="profile-page">
      <div className="profile-header">
        <h1>Profile & Settings</h1>
        <p className="subtitle">Manage your account information and security preferences.</p>
      </div>

      <div className="profile-layout-grid">
        {/* Navigation Tabs (Left side on wide screens) */}
        <div className="tabs-navigation card">
          <button 
            className={`tab-nav-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={18} />
            <span>Profile Details</span>
          </button>
          
          <button 
            className={`tab-nav-btn ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <Shield size={18} />
            <span>Security & Password</span>
          </button>
        </div>

        {/* Form Container (Right side) */}
        <div className="tab-content-container">
          {activeTab === 'profile' ? (
            <div className="tab-pane card">
              <h2>Profile Information</h2>
              <p className="pane-desc">Update your personal account details.</p>
              
              <form onSubmit={handleUpdateProfile}>
                <div className="form-name-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="firstName">First Name</label>
                    <input
                      id="firstName"
                      type="text"
                      className="form-input"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      disabled={profileLoading}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="lastName">Last Name</label>
                    <input
                      id="lastName"
                      type="text"
                      className="form-input"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      disabled={profileLoading}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="email">Email Address (Read-only)</label>
                  <input
                    id="email"
                    type="email"
                    className="form-input read-only-input"
                    value={email}
                    readOnly
                    disabled
                  />
                  <span className="input-help-text">Email address cannot be changed. Contact administration if updates are required.</span>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn btn-primary" disabled={profileLoading}>
                    {profileLoading ? <Spinner size={16} color="var(--on-accent)" /> : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="tab-pane card">
              <h2>Change Password</h2>
              <p className="pane-desc">Protect your account with a secure password. You will be logged out upon completion.</p>

              <form onSubmit={handleChangePassword}>
                <div className="form-group">
                  <label className="form-label" htmlFor="currentPassword">Current Password</label>
                  <input
                    id="currentPassword"
                    type="password"
                    className="form-input"
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    disabled={securityLoading}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                  <label className="form-label" htmlFor="newPassword">New Password</label>
                  <input
                    id="newPassword"
                    type="password"
                    className="form-input"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={securityLoading}
                    required
                  />
                </div>

                {newPassword && (
                  <div className="password-strength-container" style={{ marginBottom: '1.25rem' }}>
                    <div className="strength-bar-meta">
                      <span className="strength-label">Strength: <strong>{strength.label}</strong></span>
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
                  <label className="form-label" htmlFor="confirmPassword">Confirm New Password</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    className="form-input"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={securityLoading}
                    required
                  />
                </div>

                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    disabled={securityLoading || (newPassword && !isPasswordValid)}
                  >
                    {securityLoading ? <Spinner size={16} color="var(--on-accent)" /> : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .profile-page {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          text-align: left;
        }

        .profile-header h1 {
          font-size: clamp(2rem, 4vw, 2.75rem);
          font-weight: 800;
          line-height: 1.2;
          color: var(--text-primary);
        }

        .profile-layout-grid {
          display: grid;
          grid-template-columns: 240px 1fr;
          gap: 1.25rem;
          align-items: flex-start;
        }

        .tabs-navigation {
          position: sticky;
          top: 1.5rem;
          padding: 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .tab-nav-btn {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          min-height: 48px;
          border: 1px solid transparent;
          background: transparent;
          color: var(--text-secondary);
          border-radius: var(--border-radius-md);
          font-size: 0.9rem;
          font-weight: 700;
          cursor: pointer;
          transition: all var(--transition-fast);
          text-align: left;
        }

        .tab-nav-btn:hover {
          color: var(--text-primary);
          background-color: var(--accent-light);
          border-color: var(--border-color);
        }

        .tab-nav-btn.active {
          color: var(--accent-color);
          background: var(--accent-light);
          border-color: var(--border-color);
          font-weight: 700;
        }

        .tab-content-container { min-width: 0; }

        .tab-pane {
          padding: clamp(1.4rem, 4vw, 2.4rem);
          background: var(--bg-card);
          border-radius: var(--border-radius-xl);
        }

        .tab-pane h2 {
          font-size: clamp(1.4rem, 3vw, 1.8rem);
          font-weight: 800;
          color: var(--text-primary);
          margin-bottom: 0.25rem;
        }

        .pane-desc {
          font-size: 0.85rem;
          color: var(--text-muted);
          margin-bottom: 1.75rem;
        }

        .read-only-input {
          background-color: var(--bg-strong);
          border-color: var(--border-color);
          color: var(--text-muted);
          cursor: not-allowed;
        }

        .input-help-text {
          display: block;
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-top: 0.375rem;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 1.5rem;
        }

        .password-strength-container {
          background-color: var(--bg-elevated);
          padding: 1rem;
          border-radius: var(--border-radius-lg);
          border: 1px solid var(--border-color);
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

        @media (max-width: 768px) {
          .profile-layout-grid {
            grid-template-columns: 1fr;
          }
          
          .tabs-navigation {
            position: static;
            flex-direction: row;
          }
          
          .tab-nav-btn {
            flex: 1;
            justify-content: center;
          }

          .form-actions .btn { width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default Profile;
