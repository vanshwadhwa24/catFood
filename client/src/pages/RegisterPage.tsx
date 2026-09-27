import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await register(email, password, firstName, lastName);
      navigate('/events', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="card auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Create an Account</h1>
          <p className="auth-subtitle">Join DogFood to compete, collaborate, and win prizes</p>
        </div>

        {error && <div className="alert alert-error mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label" htmlFor="first-name">
                First Name
              </label>
              <input
                id="first-name"
                type="text"
                className="input"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Ada"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="last-name">
                Last Name
              </label>
              <input
                id="last-name"
                type="text"
                className="input"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Lovelace"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">
              Email Address
            </label>
            <input
              id="reg-email"
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ada@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-password">
              Password (min 6 characters)
            </label>
            <input
              id="reg-password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              minLength={6}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg mt-4"
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          <p className="text-secondary text-sm">
            Already have an account?{' '}
            <Link to="/login" className="link font-semibold">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
