import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { galleryApi, eventsApi, Event, Submission } from '../lib/api';
import { ProjectCard } from '../components/ProjectCard';

export function GalleryPage() {
  const { slug } = useParams<{ slug: string }>();

  const [event, setEvent] = useState<Event | null>(null);
  const [projects, setProjects] = useState<Submission[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedTrack, setSelectedTrack] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Load Event info
  useEffect(() => {
    if (!slug) return;
    eventsApi
      .get(slug)
      .then((res) => setEvent(res.event))
      .catch((err) => console.error('Failed to load event metadata', err));
  }, [slug]);

  // Load Gallery Submissions
  const fetchGallery = () => {
    if (!slug) return;
    setLoading(true);
    galleryApi
      .list(slug, {
        search: search.trim() || undefined,
        trackId: selectedTrack || undefined,
        page,
        limit: 9,
      })
      .then((res) => {
        setProjects(res.items);
        setTotal(res.total);
        setPages(res.pages);
      })
      .catch((err) => console.error('Failed to load gallery', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchGallery();
  }, [slug, page, selectedTrack]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchGallery();
  };

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {slug && (
              <Link to={`/events/${slug}`} className="text-secondary text-sm link">
                ← Back to {event?.name || 'Hackathon'}
              </Link>
            )}
          </div>
          <h1 className="text-3xl font-extrabold">Project Showcase Gallery</h1>
          <p className="text-secondary">
            Explore {total} innovative solution{total === 1 ? '' : 's'} built during{' '}
            <span className="text-white font-medium">{event?.name || 'this hackathon'}</span>.
          </p>
        </div>

        {slug && (
          <Link to={`/events/${slug}/submit`} className="btn btn-primary">
            + Submit Your Project
          </Link>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="card mb-8 p-4 flex flex-wrap gap-4 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex flex-1 min-w-[240px] gap-2">
          <input
            type="text"
            className="input w-full"
            placeholder="Search projects by title, tagline..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn btn-secondary">
            Search
          </button>
        </form>

        {event?.tracks && event.tracks.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-secondary font-semibold uppercase">Track:</span>
            <select
              className="input text-sm py-1.5"
              value={selectedTrack}
              onChange={(e) => {
                setSelectedTrack(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Tracks</option>
              {event.tracks.map((track) => (
                <option key={track.id} value={track.id}>
                  {track.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading projects...</p>
        </div>
      ) : projects.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} eventSlug={slug || ''} />
            ))}
          </div>

          {/* Pagination Controls */}
          {pages > 1 && (
            <div className="flex justify-center items-center gap-4 py-4">
              <button
                className="btn btn-sm btn-outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                ← Previous
              </button>
              <span className="text-sm text-secondary">
                Page {page} of {pages}
              </span>
              <button
                className="btn btn-sm btn-outline"
                disabled={page >= pages}
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
              >
                Next →
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="card text-center py-16">
          <div className="text-4xl mb-3">📦</div>
          <h3 className="text-xl font-bold mb-2">No projects found</h3>
          <p className="text-secondary max-w-md mx-auto">
            No projects have been published yet matching your criteria. Be the first to build and showcase!
          </p>
        </div>
      )}
    </div>
  );
}
