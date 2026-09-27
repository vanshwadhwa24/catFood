const BASE = '/api';

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Request failed: ${res.status}`);
  }

  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

// ── Auth ──────────────────────────────────────────────
export const authApi = {
  register: (email: string, password: string, firstName?: string, lastName?: string) =>
    api.post<{ user: User }>('/auth/register', { email, password, firstName, lastName }),
  login: (email: string, password: string) =>
    api.post<{ user: User }>('/auth/login', { email, password }),
  logout: () => api.post<{ message: string }>('/auth/logout'),
  me: () => api.get<{ user: User }>('/auth/me'),
};

// ── Events ────────────────────────────────────────────
export const eventsApi = {
  list: () => api.get<{ events: Event[] }>('/events'),
  get: (slug: string) => api.get<{ event: Event }>(`/events/${slug}`),
  create: (data: Partial<Event>) => api.post<{ event: Event }>('/events', data),
  update: (slug: string, data: Partial<Event>) => api.patch<{ event: Event }>(`/events/${slug}`, data),
  transition: (slug: string, status: string) =>
    api.patch<{ event: Event }>(`/events/${slug}/status`, { status }),
  addTrack: (slug: string, data: { name: string; description?: string; position?: number }) =>
    api.post<{ track: Track }>(`/events/${slug}/tracks`, data),
  addPrize: (slug: string, data: Partial<Prize>) => api.post<{ prize: Prize }>(`/events/${slug}/prizes`, data),
};

// ── Teams ─────────────────────────────────────────────
export const teamsApi = {
  create: (eventSlug: string, data: { name: string; description?: string }) =>
    api.post<{ team: Team }>(`/events/${eventSlug}/teams`, data),
  mine: (eventSlug: string) =>
    api.get<{ team: Team | null }>(`/events/${eventSlug}/teams/mine`),
  get: (eventSlug: string, teamId: string) =>
    api.get<{ team: Team }>(`/events/${eventSlug}/teams/${teamId}`),
  invite: (eventSlug: string, teamId: string, email: string) =>
    api.post(`/events/${eventSlug}/teams/${teamId}/invite`, { email }),
  removeMember: (eventSlug: string, teamId: string, userId: string) =>
    api.delete(`/events/${eventSlug}/teams/${teamId}/members/${userId}`),
};

// ── Invites ───────────────────────────────────────────
export const invitesApi = {
  get: (token: string) => api.get<{ invite: InviteInfo }>(`/invites/${token}`),
  accept: (token: string) => api.post(`/invites/${token}/accept`),
  decline: (token: string) => api.post(`/invites/${token}/decline`),
};

// ── Submissions ───────────────────────────────────────
export const submissionsApi = {
  mine: (eventSlug: string) =>
    api.get<{ submission: Submission | null }>(`/events/${eventSlug}/submissions/mine`),
  create: (eventSlug: string, data: Partial<Submission>) =>
    api.post<{ submission: Submission }>(`/events/${eventSlug}/submissions`, data),
  update: (eventSlug: string, submissionId: string, data: Partial<Submission>) =>
    api.patch<{ submission: Submission }>(`/events/${eventSlug}/submissions/${submissionId}`, data),
  submit: (eventSlug: string, submissionId: string) =>
    api.post<{ submission: Submission }>(`/events/${eventSlug}/submissions/${submissionId}/submit`),
};

// ── Gallery ───────────────────────────────────────────
export const galleryApi = {
  list: (eventSlug: string, params?: { search?: string; trackId?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.search) q.set('search', params.search);
    if (params?.trackId) q.set('trackId', params.trackId);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    const qs = q.toString();
    return api.get<GalleryResult>(`/events/${eventSlug}/gallery${qs ? `?${qs}` : ''}`);
  },
  get: (eventSlug: string, submissionId: string) =>
    api.get<{ project: Submission }>(`/events/${eventSlug}/gallery/${submissionId}`),
};

// ── Types ─────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  createdAt?: string;
}

export interface Event {
  id: string;
  slug: string;
  name: string;
  description?: string;
  status: string;
  organizerId: string;
  organizer?: Pick<User, 'id' | 'email' | 'firstName' | 'lastName'>;
  registrationStart?: string;
  registrationEnd?: string;
  submissionStart?: string;
  submissionEnd?: string;
  judgingStart?: string;
  judgingEnd?: string;
  votingStart?: string;
  votingEnd?: string;
  maxTeamSize: number;
  allowIndividual: boolean;
  allowCommunityVote: boolean;
  votingMode: string;
  tracks?: Track[];
  prizes?: Prize[];
  rubrics?: Rubric[];
  _count?: { teams: number; submissions: number; judges: number };
}

export interface Track {
  id: string;
  eventId: string;
  name: string;
  description?: string;
  position?: number;
}

export interface Prize {
  id: string;
  eventId: string;
  rank: number;
  title: string;
  description?: string;
  reward?: string;
  trackId?: string;
}

export interface Rubric {
  id: string;
  name: string;
  scaleMin: number;
  scaleMax: number;
  criteria: Criterion[];
}

export interface Criterion {
  id: string;
  name: string;
  description?: string;
  weight: number;
  position?: number;
}

export interface Team {
  id: string;
  eventId: string;
  name: string;
  description?: string;
  ownerId: string;
  status: string;
  members: TeamMember[];
  submissions?: { id: string; name: string; status: string; submittedAt?: string }[];
  _count?: { members: number };
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  user: Pick<User, 'id' | 'email' | 'firstName' | 'lastName'>;
  role: string;
  status: string;
  inviteToken?: string;
}

export interface Submission {
  id: string;
  eventId: string;
  teamId: string;
  trackId: string;
  name: string;
  tagline?: string;
  description?: string;
  thumbnailUrl?: string;
  demoUrl?: string;
  repositoryUrl?: string;
  videoUrl?: string;
  status: string;
  submittedAt?: string;
  track?: Track;
  team?: Pick<Team, 'id' | 'name'>;
  fields?: { id: string; fieldName: string; fieldValue?: string }[];
  comments?: Comment[];
  _count?: { votes: number; comments: number };
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: Pick<User, 'id' | 'firstName' | 'lastName'>;
  replies?: Comment[];
}

export interface InviteInfo {
  teamId: string;
  teamName: string;
  eventName: string;
  eventSlug: string;
  inviterName?: string;
  inviteeEmail: string;
  status: string;
}

export interface GalleryResult {
  items: Submission[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}
