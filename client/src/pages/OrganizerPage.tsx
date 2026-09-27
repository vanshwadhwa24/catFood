import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { eventsApi, Event } from '../lib/api';

const EVENT_STATUSES = [
  'DRAFT',
  'REGISTRATION_OPEN',
  'REGISTRATION_CLOSED',
  'SUBMISSION_OPEN',
  'SUBMISSION_CLOSED',
  'ELIGIBILITY_REVIEW',
  'JUDGING',
  'JUDGING_COMPLETE',
  'VOTING',
  'VOTING_CLOSED',
  'RESULTS',
  'CERTIFICATES',
  'ARCHIVED',
];

export function OrganizerPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedSlug = searchParams.get('event');

  const [events, setEvents] = useState<Event[]>([]);
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // New Event Form State
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newMaxTeam, setNewMaxTeam] = useState(4);
  const [newVotingMode, setNewVotingMode] = useState('HYBRID');

  // Track Form State
  const [trackName, setTrackName] = useState('');
  const [trackDesc, setTrackDesc] = useState('');

  // Prize Form State
  const [prizeTitle, setPrizeTitle] = useState('');
  const [prizeReward, setPrizeReward] = useState('');
  const [prizeRank, setPrizeRank] = useState(1);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const res = await eventsApi.list();
      setEvents(res.events);

      if (selectedSlug) {
        const found = res.events.find((e) => e.slug === selectedSlug);
        if (found) {
          // get full details including tracks/prizes
          const full = await eventsApi.get(selectedSlug);
          setCurrentEvent(full.event);
        }
      } else if (res.events.length > 0 && !showCreateForm) {
        const full = await eventsApi.get(res.events[0].slug);
        setCurrentEvent(full.event);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load organizer data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [selectedSlug]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const res = await eventsApi.create({
        name: newName,
        slug: newSlug || newName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: newDesc,
        maxTeamSize: Number(newMaxTeam),
        votingMode: newVotingMode,
        allowIndividual: true,
        allowCommunityVote: true,
      });

      setSuccess(`Hackathon "${res.event.name}" created!`);
      setShowCreateForm(false);
      setSearchParams({ event: res.event.slug });
      await loadEvents();
    } catch (err: any) {
      setError(err.message || 'Failed to create hackathon');
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!currentEvent) return;
    setError(null);
    setSuccess(null);

    try {
      const res = await eventsApi.transition(currentEvent.slug, status);
      setCurrentEvent(res.event);
      setSuccess(`Event phase updated to ${status}`);
      await loadEvents();
    } catch (err: any) {
      setError(err.message || 'Failed to update phase');
    }
  };

  const handleAddTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEvent || !trackName.trim()) return;

    try {
      await eventsApi.addTrack(currentEvent.slug, {
        name: trackName,
        description: trackDesc,
      });
      setSuccess('Track added!');
      setTrackName('');
      setTrackDesc('');
      const full = await eventsApi.get(currentEvent.slug);
      setCurrentEvent(full.event);
    } catch (err: any) {
      setError(err.message || 'Failed to add track');
    }
  };

  const handleAddPrize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEvent || !prizeTitle.trim()) return;

    try {
      await eventsApi.addPrize(currentEvent.slug, {
        rank: Number(prizeRank),
        title: prizeTitle,
        reward: prizeReward,
      });
      setSuccess('Prize added!');
      setPrizeTitle('');
      setPrizeReward('');
      const full = await eventsApi.get(currentEvent.slug);
      setCurrentEvent(full.event);
    } catch (err: any) {
      setError(err.message || 'Failed to add prize');
    }
  };

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Organizer Console</h1>
          <p className="text-secondary">Configure hackathons, manage phase lifecycles, tracks, and prizes.</p>
        </div>

        <button
          onClick={() => {
            setShowCreateForm(!showCreateForm);
            if (!showCreateForm) setCurrentEvent(null);
          }}
          className="btn btn-primary"
        >
          {showCreateForm ? 'Cancel Creation' : '+ New Hackathon'}
        </button>
      </div>

      {error && <div className="alert alert-error mb-6">{error}</div>}
      {success && <div className="alert alert-success mb-6">{success}</div>}

      {showCreateForm ? (
        /* Event Creation Form */
        <div className="card max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">Create New Hackathon</h2>
          <form onSubmit={handleCreateEvent} className="space-y-4">
            <div className="form-group">
              <label className="form-label">Event Name *</label>
              <input
                type="text"
                className="input"
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value);
                  if (!newSlug) {
                    setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                  }
                }}
                placeholder="AI Global Hackathon 2026"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Slug (URL identifier) *</label>
              <input
                type="text"
                className="input"
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
                placeholder="ai-global-hackathon-2026"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="input min-h-[100px]"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Event mission, challenges, and goals..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Max Team Size</label>
                <input
                  type="number"
                  className="input"
                  value={newMaxTeam}
                  onChange={(e) => setNewMaxTeam(Number(e.target.value))}
                  min={1}
                  max={20}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Voting Mode</label>
                <select
                  className="input"
                  value={newVotingMode}
                  onChange={(e) => setNewVotingMode(e.target.value)}
                >
                  <option value="HYBRID">Hybrid (Judges + Community)</option>
                  <option value="JUDGE_ONLY">Judge Only</option>
                  <option value="COMMUNITY_ONLY">Community Only</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg w-full mt-4">
              Create Hackathon
            </button>
          </form>
        </div>
      ) : (
        /* Event Management Dashboard */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left: Event Switcher List */}
          <div className="lg:col-span-1">
            <div className="card">
              <h3 className="text-sm font-semibold uppercase text-secondary mb-3">Your Events</h3>
              <div className="space-y-2">
                {events.map((ev) => (
                  <button
                    key={ev.id}
                    onClick={() => {
                      setSearchParams({ event: ev.slug });
                    }}
                    className={`w-full text-left p-3 rounded-lg text-sm transition-all ${
                      currentEvent?.id === ev.id
                        ? 'bg-primary text-white font-semibold'
                        : 'bg-surface hover:bg-glass border border-glass'
                    }`}
                  >
                    <div className="truncate">{ev.name}</div>
                    <div className="text-xs opacity-75 mt-0.5">{ev.status}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Selected Event Management */}
          {currentEvent ? (
            <div className="lg:col-span-3 space-y-6">
              {/* Event Status & Lifecycle */}
              <div className="card">
                <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                  <div>
                    <h2 className="text-2xl font-bold">{currentEvent.name}</h2>
                    <Link to={`/events/${currentEvent.slug}`} className="text-xs link">
                      View Public Page →
                    </Link>
                  </div>
                  <span className="badge badge-primary text-sm px-3 py-1">
                    Current Phase: {currentEvent.status}
                  </span>
                </div>

                <div className="border-t border-glass pt-4 mt-2">
                  <span className="text-xs text-secondary font-semibold uppercase block mb-2">
                    Advance Lifecycle Phase
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {EVENT_STATUSES.map((status) => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(status)}
                        disabled={currentEvent.status === status}
                        className={`btn btn-xs ${
                          currentEvent.status === status ? 'btn-primary' : 'btn-outline'
                        }`}
                      >
                        {status.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tracks Configuration */}
              <div className="card">
                <h3 className="text-xl font-bold mb-4">Event Tracks</h3>
                {currentEvent.tracks && currentEvent.tracks.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                    {currentEvent.tracks.map((t) => (
                      <div key={t.id} className="p-3 rounded bg-surface border border-glass">
                        <div className="font-semibold text-primary">{t.name}</div>
                        <div className="text-xs text-secondary mt-1">{t.description || 'No description'}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-secondary text-sm mb-4">No tracks added yet.</p>
                )}

                <form onSubmit={handleAddTrack} className="border-t border-glass pt-4">
                  <h4 className="text-sm font-semibold mb-2">+ Add Track</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      className="input"
                      placeholder="Track Name (e.g. AI Agents, Web3, Climate)"
                      value={trackName}
                      onChange={(e) => setTrackName(e.target.value)}
                      required
                    />
                    <input
                      type="text"
                      className="input"
                      placeholder="Description (optional)"
                      value={trackDesc}
                      onChange={(e) => setTrackDesc(e.target.value)}
                    />
                  </div>
                  <button type="submit" className="btn btn-secondary btn-sm mt-3">
                    Add Track
                  </button>
                </form>
              </div>

              {/* Prizes Configuration */}
              <div className="card">
                <h3 className="text-xl font-bold mb-4">Prizes & Bounties</h3>
                {currentEvent.prizes && currentEvent.prizes.length > 0 ? (
                  <div className="space-y-2 mb-6">
                    {currentEvent.prizes.map((p) => (
                      <div
                        key={p.id}
                        className="flex justify-between items-center p-3 rounded bg-surface border border-glass"
                      >
                        <div>
                          <span className="font-semibold">Rank #{p.rank}: {p.title}</span>
                          {p.description && (
                            <p className="text-xs text-secondary">{p.description}</p>
                          )}
                        </div>
                        {p.reward && (
                          <span className="badge badge-accent font-bold">{p.reward}</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-secondary text-sm mb-4">No prizes defined yet.</p>
                )}

                <form onSubmit={handleAddPrize} className="border-t border-glass pt-4">
                  <h4 className="text-sm font-semibold mb-2">+ Add Prize</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="number"
                      className="input"
                      placeholder="Rank (1, 2, 3)"
                      value={prizeRank}
                      onChange={(e) => setPrizeRank(Number(e.target.value))}
                      min={1}
                      required
                    />
                    <input
                      type="text"
                      className="input"
                      placeholder="Title (e.g. 1st Place Overall)"
                      value={prizeTitle}
                      onChange={(e) => setPrizeTitle(e.target.value)}
                      required
                    />
                    <input
                      type="text"
                      className="input"
                      placeholder="Reward (e.g. $5,000 USD)"
                      value={prizeReward}
                      onChange={(e) => setPrizeReward(e.target.value)}
                    />
                  </div>
                  <button type="submit" className="btn btn-secondary btn-sm mt-3">
                    Add Prize
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="lg:col-span-3 card text-center py-12">
              <p className="text-secondary">Select an event or create a new one to manage.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
