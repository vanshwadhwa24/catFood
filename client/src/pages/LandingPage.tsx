import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { eventsApi, Event } from '../lib/api';
import { EventCard } from '../components/EventCard';

export function LandingPage() {
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    eventsApi
      .list()
      .then((res) => {
        setFeaturedEvents(res.events.slice(0, 3));
      })
      .catch((err) => console.error('Failed to load events:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-badge animate-fade-in">
          <span>🚀 The Ultimate Hackathon Platform</span>
        </div>
        <h1 className="hero-title animate-slide-up">
          Build, Ship & Compete in <span className="gradient-text">World-Class Hackathons</span>
        </h1>
        <p className="hero-subtitle animate-slide-up">
          DogFood empowers creators, developers, and organizers to host seamless hackathons,
          collaborate in teams, showcase revolutionary projects, and discover emerging tech talent.
        </p>
        <div className="hero-actions animate-slide-up">
          <Link to="/events" className="btn btn-primary btn-lg">
            Explore Hackathons
          </Link>
          <Link to="/register" className="btn btn-outline btn-lg">
            Get Started Free
          </Link>
        </div>

        {/* Highlight Stats */}
        <div className="hero-stats">
          <div className="stat-card">
            <div className="stat-value">100%</div>
            <div className="stat-label">Transparent Judging</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">Instant</div>
            <div className="stat-label">Team Formation</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">Real-Time</div>
            <div className="stat-label">Project Gallery</div>
          </div>
        </div>
      </section>

      {/* Featured Events Section */}
      <section className="featured-section container">
        <div className="section-header">
          <div>
            <h2 className="section-title">Active & Upcoming Hackathons</h2>
            <p className="section-desc">Join thrilling challenges, build groundbreaking solutions, and win prizes.</p>
          </div>
          <Link to="/events" className="btn btn-secondary">
            View All ({featuredEvents.length})
          </Link>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading events...</p>
          </div>
        ) : featuredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="card empty-state-card">
            <p className="text-secondary">No hackathons currently open. Check back soon!</p>
          </div>
        )}
      </section>

      {/* Platform Features Grid */}
      <section className="features-section container">
        <h2 className="section-title text-center mb-4">Everything You Need to Win</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="card feature-card">
            <div className="feature-icon">🤝</div>
            <h3>Seamless Team Sync</h3>
            <p className="text-secondary">
              Invite teammates securely via one-click links. Track invites, roles, and collaborate seamlessly before the deadline.
            </p>
          </div>
          <div className="card feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Dynamic Project Submissions</h3>
            <p className="text-secondary">
              Submit demos, code repos, custom metadata fields, and preview live project cards before the judging phase begins.
            </p>
          </div>
          <div className="card feature-card">
            <div className="feature-icon">🏆</div>
            <h3>Public Project Gallery</h3>
            <p className="text-secondary">
              Browse projects by tracks, search key technologies, engage in community discussions, and vote for your favorites.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
