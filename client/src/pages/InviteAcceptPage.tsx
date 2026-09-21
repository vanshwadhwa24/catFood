import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { invitesApi, InviteInfo } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

export function InviteAcceptPage() {
  const { token } = useParams<{ token: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    invitesApi
      .get(token)
      .then((res) => setInvite(res.invite))
      .catch((err) => setError(err.message || 'Invalid or expired invite'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleAccept = async () => {
    if (!token || !invite) return;
    setActing(true);
    setError(null);
    try {
      await invitesApi.accept(token);
      navigate(`/events/${invite.eventSlug}/team`);
    } catch (err: any) {
      setError(err.message || 'Failed to accept invite');
    } finally {
      setActing(false);
    }
  };

  const handleDecline = async () => {
    if (!token || !invite) return;
    setActing(true);
    setError(null);
    try {
      await invitesApi.decline(token);
      navigate('/events');
    } catch (err: any) {
      setError(err.message || 'Failed to decline invite');
    } finally {
      setActing(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Checking invite details...</p>
      </div>
    );
  }

  if (error || !invite) {
    return (
      <div className="container py-12 max-w-md text-center">
        <div className="card">
          <div className="alert alert-error mb-4">{error || 'Invite not found'}</div>
          <Link to="/events" className="btn btn-secondary">
            Explore Events
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-12 max-w-md">
      <div className="card text-center">
        <div className="text-4xl mb-3">✉️</div>
        <h1 className="text-2xl font-bold mb-2">Team Invitation</h1>
        <p className="text-secondary mb-6">
          You've been invited to join team{' '}
          <span className="text-white font-semibold">{invite.teamName}</span> for{' '}
          <span className="text-white font-semibold">{invite.eventName}</span>.
        </p>

        {!user ? (
          <div>
            <p className="text-sm text-secondary mb-4">
              Please sign in or create an account with <strong>{invite.inviteeEmail}</strong> to accept this invite.
            </p>
            <div className="flex gap-3">
              <Link to="/login" className="btn btn-primary flex-1">
                Sign In
              </Link>
              <Link to="/register" className="btn btn-outline flex-1">
                Register
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex gap-4">
            <button
              onClick={handleDecline}
              className="btn btn-secondary flex-1"
              disabled={acting}
            >
              Decline
            </button>
            <button
              onClick={handleAccept}
              className="btn btn-primary flex-1"
              disabled={acting}
            >
              {acting ? 'Joining...' : 'Accept & Join'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
