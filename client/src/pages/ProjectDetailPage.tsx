import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { galleryApi, Submission } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

export function ProjectDetailPage() {
  const { slug, submissionId } = useParams<{ slug: string; submissionId: string }>();
  const { user } = useAuth();

  const [project, setProject] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug || !submissionId) return;

    setLoading(true);
    galleryApi
      .get(slug, submissionId)
      .then((res) => setProject(res.project))
      .catch((err) => setError(err.message || 'Project not found'))
      .finally(() => setLoading(false));
  }, [slug, submissionId]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading project details...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="container py-12 text-center">
        <div className="alert alert-error max-w-lg mx-auto">{error || 'Project not found'}</div>
        <Link to={`/events/${slug}/gallery`} className="btn btn-secondary mt-4 inline-block">
          ← Back to Gallery
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* Breadcrumb */}
      <div className="mb-4">
        <Link to={`/events/${slug}/gallery`} className="text-secondary text-sm link">
          ← Back to Project Gallery
        </Link>
      </div>

      {/* Hero / Cover */}
      <div className="card project-detail-header mb-8">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {project.thumbnailUrl ? (
            <img
              src={project.thumbnailUrl}
              alt={project.name}
              className="w-full md:w-80 h-48 object-cover rounded-lg border border-glass"
            />
          ) : (
            <div className="w-full md:w-80 h-48 rounded-lg bg-surface flex items-center justify-center border border-glass">
              <span className="text-5xl font-extrabold text-primary">
                {project.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              {project.track && (
                <span className="badge badge-primary">{project.track.name}</span>
              )}
              <span className="badge badge-secondary">{project.status}</span>
              {project.submittedAt && (
                <span className="text-xs text-secondary">
                  Submitted on {new Date(project.submittedAt).toLocaleDateString()}
                </span>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold mb-2">{project.name}</h1>
            {project.tagline && (
              <p className="text-lg text-secondary mb-4">{project.tagline}</p>
            )}

            {project.team && (
              <div className="mb-4 text-sm">
                <span className="text-secondary">Created by team </span>
                <span className="font-semibold text-white">{project.team.name}</span>
              </div>
            )}

            {/* CTAs: Demo, Repo, Video */}
            <div className="flex flex-wrap gap-3 mt-4">
              {project.demoUrl && (
                <a
                  href={project.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                >
                  🚀 Live Demo
                </a>
              )}
              {project.repositoryUrl && (
                <a
                  href={project.repositoryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                >
                  💻 Source Code
                </a>
              )}
              {project.videoUrl && (
                <a
                  href={project.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline"
                >
                  🎥 Video Walkthrough
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Description & Custom Fields */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="card">
            <h2 className="text-xl font-bold mb-4">About the Project</h2>
            <div className="prose text-secondary whitespace-pre-wrap leading-relaxed">
              {project.description || 'No detailed description provided for this project.'}
            </div>
          </div>

          {/* Dynamic Submission Fields */}
          {project.fields && project.fields.length > 0 && (
            <div className="card">
              <h2 className="text-xl font-bold mb-4">Project Specifications</h2>
              <div className="space-y-4">
                {project.fields.map((field) => (
                  <div key={field.id} className="border-b border-glass pb-3 last:border-b-0">
                    <span className="text-xs text-secondary block font-semibold uppercase">
                      {field.fieldName}
                    </span>
                    <p className="text-sm mt-1">{field.fieldValue || 'N/A'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Team & Community */}
        <div className="flex flex-col gap-6">
          <div className="card">
            <h3 className="text-lg font-bold mb-3">Community Interaction</h3>
            <div className="flex items-center justify-around py-4 bg-surface rounded-lg mb-4">
              <div className="text-center">
                <span className="text-2xl font-bold block text-primary">
                  {project._count?.votes || 0}
                </span>
                <span className="text-xs text-secondary">Votes</span>
              </div>
              <div className="text-center">
                <span className="text-2xl font-bold block text-primary">
                  {project._count?.comments || 0}
                </span>
                <span className="text-xs text-secondary">Comments</span>
              </div>
            </div>
            <p className="text-xs text-secondary text-center">
              Community voting and judging rounds are synchronized with event schedules.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
