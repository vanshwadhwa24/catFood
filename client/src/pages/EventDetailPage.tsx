import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { eventsApi, teamsApi, submissionsApi, Event, Team, Submission } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

export function EventDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [event, setEvent] = useState<Event | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    setLoading(true);
    eventsApi
      .get(slug)
      .then(async (res) => {
        setEvent(res.event);

        if (user) {
          try {
            const teamRes = await teamsApi.mine(slug);
            setTeam(teamRes.team);
          } catch {}

          try {
            const subRes = await submissionsApi.mine(slug);
            setSubmission(subRes.submission);
          } catch {}
        }
      })
      .catch((err) => {
        setError(err.message || 'Failed to load event');
      })
      .finally(() => setLoading(false));
  }, [slug, user]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading hackathon details...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="container py-12 text-center">
        <div className="alert alert-error max-w-lg mx-auto">{error || 'Event not found'}</div>
        <Link to="/events" className="btn btn-secondary mt-4 inline-block">
          ← Back to Events
        </Link>
      </div>
    );
  }

  const isOrganizer = user && (user.role === 'ADMIN' || user.id === event.organizerId);

  return (
    <div className="container py-8">
      {/* Event Header Banner */}
      <div className="card event-banner mb-8">
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="badge badge-primary">{event.status.replace('_', ' ')}</span>
              {event.votingMode && (
                <span className="badge badge-secondary">{event.votingMode} Voting</span>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold mb-2">{event.name}</h1>
            <p className="text-secondary max-w-2xl text-base">{event.description}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link to={`/events/${event.slug}/gallery`} className="btn btn-secondary">
              🎨 Project Gallery
            </Link>

            {user ? (
              team ? (
                <Link to={`/events/${event.slug}/team`} className="btn btn-primary">
                  👥 My Team ({team.name})
                </Link>
              ) : (
                <Link to={`/events/${event.slug}/team`} className="btn btn-primary">
                  👥 Form / Join Team
                </Link>
              )
            ) : (
              <Link to="/login" className="btn btn-primary">
                Sign In to Participate
              </Link>
            )}

            {isOrganizer && (
              <Link to={`/organizer?event=${event.slug}`} className="btn btn-outline">
                ⚙️ Manage Event
              </Link>
            )}
          </div>
        </div>

        {/* Quick User Status Strip */}
        {user && (
          <div className="user-event-status-strip mt-6 pt-6 border-t border-glass">
            <div className="flex items-center gap-6 flex-wrap">
              <div>
                <span className="text-xs text-secondary block">Your Team</span>
                <span className="font-semibold text-sm">
                  {team ? team.name : 'No team registered yet'}
                </span>
              </div>
              <div>
                <span className="text-xs text-secondary block">Your Submission</span>
                <span className="font-semibold text-sm">
                  {submission ? (
                    <span className="text-emerald-400">
                      {submission.name} ({submission.status})
                    </span>
                  ) : team ? (
                    <Link to={`/events/${event.slug}/submit`} className="link text-sm">
                      + Start Project Submission
                    </Link>
                  ) : (
                    'Create team first'
                  )}
                </span>
              </div>
              {team && submission && (
                <Link to={`/events/${event.slug}/submit`} className="btn btn-xs btn-outline ml-auto">
                  Edit Submission
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Tracks, Prizes, Rules */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* Tracks Section */}
          <div className="card">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span>🎯</span> Tracks & Themes
            </h2>
            {event.tracks && event.tracks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {event.tracks.map((track) => (
                  <div key={track.id} className="p-4 rounded-lg bg-surface border border-glass">
                    <h3 className="text-lg font-bold text-primary mb-1">{track.name}</h3>
                    <p className="text-sm text-secondary">
                      {track.description || 'Open track for innovative solutions.'}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-secondary">No tracks designated. General open theme.</p>
            )}
          </div>

          {/* Prizes Section */}
          <div className="card">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span>🏆</span> Prizes & Awards
            </h2>
            {event.prizes && event.prizes.length > 0 ? (
              <div className="space-y-4">
                {event.prizes.map((prize) => (
                  <div
                    key={prize.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-surface border border-glass"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg">Rank #{prize.rank}:</span>
                        <span className="text-lg font-semibold">{prize.title}</span>
                      </div>
                      {prize.description && (
                        <p className="text-sm text-secondary mt-1">{prize.description}</p>
                      )}
                    </div>
                    {prize.reward && (
                      <div className="badge badge-accent text-base px-3 py-1 font-bold">
                        {prize.reward}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-secondary">Prizes to be announced soon!</p>
            )}
          </div>

          {/* Rubrics & Criteria */}
          {event.rubrics && event.rubrics.length > 0 && (
            <div className="card">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span>📋</span> Judging Criteria
              </h2>
              {event.rubrics.map((rubric) => (
                <div key={rubric.id} className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">
                    {rubric.name} (Scale: {rubric.scaleMin} - {rubric.scaleMax})
                  </h3>
                  <div className="space-y-2">
                    {rubric.criteria.map((crit) => (
                      <div
                        key={crit.id}
                        className="flex justify-between items-center p-2 rounded bg-surface border border-glass text-sm"
                      >
                        <div>
                          <span className="font-medium">{crit.name}</span>
                          {crit.description && (
                            <span className="text-secondary text-xs block">{crit.description}</span>
                          )}
                        </div>
                        <span className="badge badge-sm badge-secondary">Weight: {crit.weight}x</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Col: Timeline & Event Meta */}
        <div className="flex flex-col gap-6">
          <div className="card">
            <h3 className="text-xl font-bold mb-4">Event Schedule</h3>
            <div className="timeline-list space-y-4">
              <div className="timeline-item">
                <span className="text-xs text-secondary block font-semibold uppercase">
                  Registration
                </span>
                <span className="text-sm">
                  {event.registrationStart ? new Date(event.registrationStart).toLocaleDateString() : 'TBD'}{' '}
                  -{' '}
                  {event.registrationEnd ? new Date(event.registrationEnd).toLocaleDateString() : 'TBD'}
                </span>
              </div>

              <div className="timeline-item">
                <span className="text-xs text-secondary block font-semibold uppercase">
                  Submission Window
                </span>
                <span className="text-sm">
                  {event.submissionStart ? new Date(event.submissionStart).toLocaleDateString() : 'TBD'}{' '}
                  -{' '}
                  {event.submissionEnd ? new Date(event.submissionEnd).toLocaleDateString() : 'TBD'}
                </span>
              </div>

              <div className="timeline-item">
                <span className="text-xs text-secondary block font-semibold uppercase">
                  Judging & Voting
                </span>
                <span className="text-sm">
                  {event.judgingStart ? new Date(event.judgingStart).toLocaleDateString() : 'TBD'}{' '}
                  -{' '}
                  {event.judgingEnd ? new Date(event.judgingEnd).toLocaleDateString() : 'TBD'}
                </span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-xl font-bold mb-4">Participation Rules</h3>
            <ul className="space-y-2 text-sm text-secondary">
              <li>
                👥 <strong>Team Size:</strong> Up to {event.maxTeamSize} members
              </li>
              <li>
                👤 <strong>Solo Allowed:</strong> {event.allowIndividual ? 'Yes' : 'No (Teams only)'}
              </li>
              <li>
                🗳️ <strong>Community Voting:</strong> {event.allowCommunityVote ? 'Enabled' : 'Judges only'}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
