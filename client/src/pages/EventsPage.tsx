import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { eventsApi, Event } from '../lib/api';
import { EventCard } from '../components/EventCard';
import { useAuth } from '../hooks/useAuth';

export function EventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    eventsApi
      .list()
      .then((res) => setEvents(res.events))
      .catch((err) => console.error('Failed to load events:', err))
      .finally(() => setLoading(false));
  }, []);

  const filteredEvents = events.filter((ev) => {
    const matchesStatus =
      filterStatus === 'ALL' ||
      (filterStatus === 'ACTIVE' &&
        ['REGISTRATION_OPEN', 'SUBMISSION_OPEN', 'JUDGING', 'VOTING'].includes(ev.status)) ||
      ev.status === filterStatus;

    const matchesSearch =
      ev.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ev.description && ev.description.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Explore Hackathons</h1>
          <p className="text-secondary mt-1">Discover challenges, form teams, and submit your innovations.</p>
        </div>

        {user && (user.role === 'ORGANIZER' || user.role === 'ADMIN') && (
          <Link to="/organizer" className="btn btn-primary">
            + Create Event
          </Link>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="card mb-8 p-4 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-1 min-w-[240px]">
          <input
            type="text"
            className="input w-full"
            placeholder="Search by event title or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {['ALL', 'ACTIVE', 'REGISTRATION_OPEN', 'SUBMISSION_OPEN', 'RESULTS'].map((status) => (
            <button
              key={status}
              className={`btn btn-sm ${filterStatus === status ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setFilterStatus(status)}
            >
              {status === 'ALL'
                ? 'All'
                : status === 'ACTIVE'
                ? 'Active Now'
                : status.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Event Grid */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading hackathons...</p>
        </div>
      ) : filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <p className="text-xl font-medium mb-2">No hackathons found</p>
          <p className="text-secondary">Try adjusting your filters or search keywords.</p>
        </div>
      )}
    </div>
  );
}
