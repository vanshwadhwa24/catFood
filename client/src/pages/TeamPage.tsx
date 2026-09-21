import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { teamsApi, eventsApi, Event, Team } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

export function TeamPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [teamName, setTeamName] = useState('');
  const [teamDesc, setTeamDesc] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    if (!slug) return;
    try {
      setLoading(true);
      setError(null);
      const [evRes, teamRes] = await Promise.all([
        eventsApi.get(slug),
        teamsApi.mine(slug).catch(() => ({ team: null })),
      ]);
      setEvent(evRes.event);
      setTeam(teamRes.team);
    } catch (err: any) {
      setError(err.message || 'Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [slug]);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await teamsApi.create(slug, {
        name: teamName,
        description: teamDesc,
      });
      setTeam(res.team);
      setSuccess('Team formed successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to create team');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug || !team || !inviteEmail) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await teamsApi.invite(slug, team.id, inviteEmail);
      setSuccess(`Invite sent to ${inviteEmail}`);
      setInviteEmail('');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to send invite');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!slug || !team) return;
    if (!window.confirm('Are you sure you want to remove this member?')) return;

    try {
      await teamsApi.removeMember(slug, team.id, userId);
      setSuccess('Member removed.');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to remove member');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading team information...</p>
      </div>
    );
  }

  const isOwner = team && user && team.ownerId === user.id;

  return (
    <div className="container py-8 max-w-4xl">
      <div className="mb-4">
        <Link to={`/events/${slug}`} className="text-secondary text-sm link">
          ← Back to {event?.name || 'Hackathon'}
        </Link>
      </div>

      {error && <div className="alert alert-error mb-6">{error}</div>}
      {success && <div className="alert alert-success mb-6">{success}</div>}

      {!team ? (
        /* Team Formation Form */
        <div className="card">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Register a New Team</h1>
            <p className="text-secondary mt-1">
              Create your squad for <span className="text-white font-medium">{event?.name}</span>.
              Max team size: {event?.maxTeamSize || 4}.
            </p>
          </div>

          <form onSubmit={handleCreateTeam} className="space-y-4">
            <div className="form-group">
              <label className="form-label" htmlFor="team-name">
                Team Name
              </label>
              <input
                id="team-name"
                type="text"
                className="input"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g. CyberPunks, ByteBuilders"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="team-desc">
                What are you planning to build? (Optional)
              </label>
              <textarea
                id="team-desc"
                className="input min-h-[100px]"
                value={teamDesc}
                onChange={(e) => setTeamDesc(e.target.value)}
                placeholder="A high-level idea of your concept or what skills you're looking for..."
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg w-full"
              disabled={submitting}
            >
              {submitting ? 'Creating Team...' : 'Form Team'}
            </button>
          </form>
        </div>
      ) : (
        /* Team Hub View */
        <div className="space-y-8">
          {/* Header Card */}
          <div className="card">
            <div className="flex justify-between items-start flex-wrap gap-4">
              <div>
                <span className="badge badge-primary mb-2">Active Team</span>
                <h1 className="text-3xl font-bold">{team.name}</h1>
                {team.description && (
                  <p className="text-secondary mt-2">{team.description}</p>
                )}
              </div>

              <div className="flex gap-3">
                <Link to={`/events/${slug}/submit`} className="btn btn-primary">
                  🚀 Manage Submission
                </Link>
              </div>
            </div>
          </div>

          {/* Members List */}
          <div className="card">
            <h2 className="text-xl font-bold mb-4 flex items-center justify-between">
              <span>Team Members ({team.members?.length || 0} / {event?.maxTeamSize || 4})</span>
            </h2>

            <div className="space-y-3">
              {team.members?.map((member) => (
                <div
                  key={member.id}
                  className="flex justify-between items-center p-3 rounded-lg bg-surface border border-glass"
                >
                  <div className="flex items-center gap-3">
                    <div className="avatar-circle">
                      {(member.user?.firstName || member.user?.email || '?').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-sm">
                        {member.user?.firstName
                          ? `${member.user.firstName} ${member.user.lastName || ''}`
                          : member.user?.email}
                        {member.userId === team.ownerId && (
                          <span className="badge badge-accent ml-2 text-xs">Leader</span>
                        )}
                      </div>
                      <div className="text-xs text-secondary">{member.user?.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`badge badge-sm ${
                        member.status === 'ACCEPTED' ? 'badge-primary' : 'badge-secondary'
                      }`}
                    >
                      {member.status}
                    </span>

                    {isOwner && member.userId !== user?.id && (
                      <button
                        onClick={() => handleRemoveMember(member.userId)}
                        className="btn btn-xs btn-outline text-red-400 hover:text-red-300"
                        title="Remove member"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Invite Teammate */}
            {isOwner && (!event?.maxTeamSize || (team.members?.length || 0) < event.maxTeamSize) && (
              <form onSubmit={handleInvite} className="mt-6 pt-6 border-t border-glass">
                <h3 className="text-sm font-semibold mb-2">Invite a Teammate</h3>
                <div className="flex gap-2">
                  <input
                    type="email"
                    className="input flex-1"
                    placeholder="teammate@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                  />
                  <button type="submit" className="btn btn-secondary" disabled={submitting}>
                    {submitting ? 'Inviting...' : 'Send Invite'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
