import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { eventsApi, teamsApi, submissionsApi, Event, Team, Submission } from '../lib/api';

export function SubmitPage() {
  const { slug } = useParams<{ slug: string }>();

  const [event, setEvent] = useState<Event | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [trackId, setTrackId] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [repositoryUrl, setRepositoryUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');

  const loadData = async () => {
    if (!slug) return;
    try {
      setLoading(true);
      const [evRes, teamRes, subRes] = await Promise.all([
        eventsApi.get(slug),
        teamsApi.mine(slug).catch(() => ({ team: null })),
        submissionsApi.mine(slug).catch(() => ({ submission: null })),
      ]);

      setEvent(evRes.event);
      setTeam(teamRes.team);

      if (subRes.submission) {
        setSubmission(subRes.submission);
        setName(subRes.submission.name || '');
        setTrackId(subRes.submission.trackId || '');
        setTagline(subRes.submission.tagline || '');
        setDescription(subRes.submission.description || '');
        setThumbnailUrl(subRes.submission.thumbnailUrl || '');
        setDemoUrl(subRes.submission.demoUrl || '');
        setRepositoryUrl(subRes.submission.repositoryUrl || '');
        setVideoUrl(subRes.submission.videoUrl || '');
      } else if (evRes.event?.tracks && evRes.event.tracks.length > 0) {
        setTrackId(evRes.event.tracks[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load submission info');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [slug]);

  const handleSave = async (submitFinal = false) => {
    if (!slug || !team) return;
    if (!name.trim()) {
      setError('Project name is required.');
      return;
    }
    if (!trackId) {
      setError('Please select a track.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    const payload = {
      name,
      trackId,
      tagline,
      description,
      thumbnailUrl,
      demoUrl,
      repositoryUrl,
      videoUrl,
    };

    try {
      let savedSub: Submission;
      if (submission?.id) {
        const res = await submissionsApi.update(slug, submission.id, payload);
        savedSub = res.submission;
      } else {
        const res = await submissionsApi.create(slug, payload);
        savedSub = res.submission;
      }

      if (submitFinal) {
        const res = await submissionsApi.submit(slug, savedSub.id);
        savedSub = res.submission;
        setSuccess('🎉 Project submitted successfully for judging!');
      } else {
        setSuccess('Draft saved successfully.');
      }

      setSubmission(savedSub);
    } catch (err: any) {
      setError(err.message || 'Failed to save submission');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading submission form...</p>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="container py-12 max-w-xl text-center">
        <div className="card">
          <h2 className="text-2xl font-bold mb-2">Team Required</h2>
          <p className="text-secondary mb-6">
            You must form or join a team before submitting a project to {event?.name}.
          </p>
          <Link to={`/events/${slug}/team`} className="btn btn-primary">
            👥 Go to Team Setup
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-3xl">
      <div className="mb-4">
        <Link to={`/events/${slug}`} className="text-secondary text-sm link">
          ← Back to {event?.name}
        </Link>
      </div>

      <div className="card">
        <div className="flex justify-between items-start mb-6 flex-wrap gap-4 border-b border-glass pb-4">
          <div>
            <span className="text-xs font-semibold uppercase text-secondary">
              Submitting for {team.name}
            </span>
            <h1 className="text-2xl font-bold mt-1">Project Submission</h1>
          </div>

          <div>
            <span
              className={`badge ${
                submission?.status === 'SUBMITTED' ? 'badge-primary' : 'badge-secondary'
              }`}
            >
              Status: {submission?.status || 'NOT STARTED'}
            </span>
          </div>
        </div>

        {error && <div className="alert alert-error mb-6">{error}</div>}
        {success && <div className="alert alert-success mb-6">{success}</div>}

        <form onSubmit={(e) => { e.preventDefault(); handleSave(false); }} className="space-y-6">
          <div className="form-group">
            <label className="form-label" htmlFor="project-name">
              Project Title *
            </label>
            <input
              id="project-name"
              type="text"
              className="input text-lg font-medium"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. VisionFlow AI"
              required
            />
          </div>

          {event?.tracks && event.tracks.length > 0 && (
            <div className="form-group">
              <label className="form-label" htmlFor="track-select">
                Track / Category *
              </label>
              <select
                id="track-select"
                className="input"
                value={trackId}
                onChange={(e) => setTrackId(e.target.value)}
                required
              >
                <option value="">Select a track...</option>
                {event.tracks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="project-tagline">
              One-Line Tagline
            </label>
            <input
              id="project-tagline"
              type="text"
              className="input"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="A concise summary of what makes your project unique..."
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="project-description">
              Detailed Description & Story
            </label>
            <textarea
              id="project-description"
              className="input min-h-[160px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Inspiration, how it was built, challenges faced, and what's next..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label" htmlFor="demo-url">
                Live Demo / Deployment URL
              </label>
              <input
                id="demo-url"
                type="url"
                className="input"
                value={demoUrl}
                onChange={(e) => setDemoUrl(e.target.value)}
                placeholder="https://myproject.app"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="repo-url">
                GitHub / Code Repository URL
              </label>
              <input
                id="repo-url"
                type="url"
                className="input"
                value={repositoryUrl}
                onChange={(e) => setRepositoryUrl(e.target.value)}
                placeholder="https://github.com/org/repo"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label" htmlFor="thumb-url">
                Cover / Thumbnail Image URL
              </label>
              <input
                id="thumb-url"
                type="url"
                className="input"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                placeholder="https://example.com/cover.png"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="video-url">
                Video Pitch / Walkthrough URL
              </label>
              <input
                id="video-url"
                type="url"
                className="input"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-glass">
            <button
              type="button"
              className="btn btn-secondary flex-1"
              disabled={saving}
              onClick={() => handleSave(false)}
            >
              {saving ? 'Saving...' : '💾 Save Draft'}
            </button>

            <button
              type="button"
              className="btn btn-primary flex-1"
              disabled={saving}
              onClick={() => handleSave(true)}
            >
              {saving ? 'Submitting...' : '🚀 Final Submit for Judging'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
