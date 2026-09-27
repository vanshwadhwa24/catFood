import React from 'react';
import { Link } from 'react-router-dom';
import type { Submission } from '../lib/api';

interface ProjectCardProps {
  project: Submission;
  eventSlug: string;
}

export function ProjectCard({ project, eventSlug }: ProjectCardProps) {
  return (
    <div className="card project-card">
      {/* Thumbnail or Generative Abstract Cover */}
      <div className="project-card-cover">
        {project.thumbnailUrl ? (
          <img
            src={project.thumbnailUrl}
            alt={project.name}
            className="project-card-img"
            loading="lazy"
          />
        ) : (
          <div className="project-card-placeholder">
            <span className="project-placeholder-letter">
              {project.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        {project.track && (
          <span className="badge badge-primary project-card-track">
            {project.track.name}
          </span>
        )}
      </div>

      <div className="project-card-content">
        <h3 className="project-card-title">
          <Link to={`/events/${eventSlug}/gallery/${project.id}`}>
            {project.name}
          </Link>
        </h3>

        {project.tagline && (
          <p className="project-card-tagline">{project.tagline}</p>
        )}

        {project.team && (
          <div className="project-card-team">
            <span className="text-secondary text-xs">By </span>
            <span className="project-team-name">{project.team.name}</span>
          </div>
        )}

        <div className="project-card-footer">
          <div className="project-card-metrics">
            {project._count?.votes !== undefined && (
              <span className="metric-badge" title="Community Votes">
                ⭐ {project._count.votes}
              </span>
            )}
            {project._count?.comments !== undefined && (
              <span className="metric-badge" title="Comments">
                💬 {project._count.comments}
              </span>
            )}
          </div>

          <div className="project-card-actions">
            {project.demoUrl && (
              <a
                href={project.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="icon-link"
                title="Live Demo"
              >
                🔗
              </a>
            )}
            {project.repositoryUrl && (
              <a
                href={project.repositoryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="icon-link"
                title="Code Repository"
              >
                💻
              </a>
            )}
            <Link
              to={`/events/${eventSlug}/gallery/${project.id}`}
              className="btn btn-sm btn-ghost"
            >
              View →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
