import React from 'react';
import { Link } from 'react-router-dom';
import type { Event } from '../lib/api';

const STATUS_LABELS: Record<string, { label: string; badge: string }> = {
  DRAFT: { label: 'Draft', badge: 'gray' },
  REGISTRATION_OPEN: { label: 'Registration Open', badge: 'green' },
  REGISTRATION_CLOSED: { label: 'Registration Closed', badge: 'orange' },
  SUBMISSION_OPEN: { label: 'Submissions Open', badge: 'green' },
  SUBMISSION_CLOSED: { label: 'Submissions Closed', badge: 'orange' },
  ELIGIBILITY_REVIEW: { label: 'Under Review', badge: 'orange' },
  JUDGING: { label: 'Judging', badge: 'purple' },
  JUDGING_COMPLETE: { label: 'Judging Complete', badge: 'blue' },
  VOTING: { label: 'Voting Open', badge: 'green' },
  VOTING_CLOSED: { label: 'Voting Closed', badge: 'orange' },
  RESULTS: { label: 'Results', badge: 'blue' },
  CERTIFICATES: { label: 'Certificates', badge: 'blue' },
  ARCHIVED: { label: 'Archived', badge: 'gray' },
};

interface EventCardProps {
  event: Event;
}

export function EventCard({ event }: EventCardProps) {
  const status = STATUS_LABELS[event.status] ?? { label: event.status, badge: 'gray' };

  return (
    <Link to={`/events/${event.slug}`} className="event-card card" style={{ textDecoration: 'none' }}>
      <div className="event-card-header">
        <span className={`badge badge-${status.badge}`}>{status.label}</span>
        {event._count && (
          <span className="event-card-count">
            {event._count.submissions} projects
          </span>
        )}
      </div>

      <h3 className="event-card-title">{event.name}</h3>

      {event.description && (
        <p className="event-card-desc">{event.description.slice(0, 120)}{event.description.length > 120 ? '…' : ''}</p>
      )}

      {event.tracks && event.tracks.length > 0 && (
        <div className="event-card-tracks">
          {event.tracks.slice(0, 4).map((track) => (
            <span key={track.id} className="tag">{track.name}</span>
          ))}
          {event.tracks.length > 4 && (
            <span className="tag">+{event.tracks.length - 4} more</span>
          )}
        </div>
      )}

      <div className="event-card-footer">
        {event.registrationStart && (
          <span className="event-card-date">
            📅 {formatDate(event.registrationStart)}
          </span>
        )}
        {event.organizer && (
          <span className="event-card-organizer">
            by {event.organizer.firstName ?? event.organizer.email}
          </span>
        )}
      </div>

      <style>{`
        .event-card {
          display: flex;
          flex-direction: column;
          gap: 12px;
          color: inherit;
        }
        .event-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .event-card-count {
          font-size: 0.8rem;
          color: var(--text-muted);
        }
        .event-card-title {
          font-size: 1.1rem;
          font-family: var(--font-display);
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }
        .event-card-desc {
          font-size: 0.875rem;
          color: var(--text-secondary);
          line-height: 1.6;
          margin: 0;
        }
        .event-card-tracks {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .event-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: auto;
          padding-top: 8px;
          border-top: 1px solid var(--border);
        }
        .event-card-date, .event-card-organizer {
          font-size: 0.8rem;
          color: var(--text-muted);
        }
      `}</style>
    </Link>
  );
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}
