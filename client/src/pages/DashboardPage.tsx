import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { eventsApi, Event } from '../lib/api';

export function DashboardPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    eventsApi
      .list()
      .then((res) => setEvents(res.events))
      .catch((err) => console.error('Failed to load dashboard events', err))
      .finally(() => setLoading(false));
  }, []);

  const organizerEvents = events.filter(
    (ev) => ev.organizerId === user?.id || user?.role === 'ADMIN'
  );

  return (
    <div className="container py-8">
      {/* Welcome banner */}
      <div className="card mb-8">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <span className="text-secondary text-sm">Participant Dashboard</span>
            <h1 className="text-3xl font-bold mt-1">
              Welcome back, {user?.firstName || user?.email}!
            </h1>
            <p className="text-secondary text-sm mt-1">
              Account Role: <span className="badge badge-primary">{user?.role}</span>
            </p>
          </div>

          <div className="flex gap-3">
            <Link to="/events" className="btn btn-secondary">
              Browse Events
            </Link>
            {(user?.role === 'ORGANIZER' || user?.role === 'ADMIN') && (
              <Link to="/organizer" className="btn btn-primary">
                + Create Hackathon
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Organizer section if applicable */}
      {(user?.role === 'ORGANIZER' || user?.role === 'ADMIN') && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Your Managed Events</h2>
            <Link to="/organizer" className="text-sm link">
              Open Organizer Console →
            </Link>
          </div>

          {loading ? (
            <div className="spinner"></div>
          ) : organizerEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {organizerEvents.map((ev) => (
                <div key={ev.id} className="card">
                  <div className="flex justify-between items-start mb-2">
                    <span className="badge badge-primary">{ev.status}</span>
                    <span className="text-xs text-secondary">
                      {ev._count?.teams || 0} teams
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-2">
                    <Link to={`/events/${ev.slug}`}>{ev.name}</Link>
                  </h3>
                  <p className="text-sm text-secondary mb-4 line-clamp-2">
                    {ev.description || 'No description'}
                  </p>
                  <Link
                    to={`/organizer?event=${ev.slug}`}
                    className="btn btn-sm btn-outline w-full"
                  >
                    Manage Event & Phases →
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="card text-center py-8">
              <p className="text-secondary mb-4">You haven't created any hackathons yet.</p>
              <Link to="/organizer" className="btn btn-primary">
                Create Your First Hackathon
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Available Events to Join */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Active & Upcoming Competitions</h2>
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading events...</p>
          </div>
        ) : events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.slice(0, 6).map((ev) => (
              <div key={ev.id} className="card flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="badge badge-secondary">{ev.status.replace('_', ' ')}</span>
                  </div>
                  <h3 className="text-lg font-bold mb-1">
                    <Link to={`/events/${ev.slug}`}>{ev.name}</Link>
                  </h3>
                  <p className="text-xs text-secondary mb-4 line-clamp-2">{ev.description}</p>
                </div>
                <div className="flex gap-2">
                  <Link to={`/events/${ev.slug}`} className="btn btn-sm btn-outline flex-1">
                    Details
                  </Link>
                  <Link to={`/events/${ev.slug}/team`} className="btn btn-sm btn-primary flex-1">
                    Team Hub
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-secondary">No hackathons available at the moment.</p>
        )}
      </div>
    </div>
  );
}
