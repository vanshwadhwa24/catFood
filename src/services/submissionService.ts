import { prisma } from '../db/prisma.js';

export interface CreateSubmissionInput {
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
  tags?: string[];
  customFields?: { fieldName: string; fieldValue: string }[];
}

export interface UpdateSubmissionInput {
  name?: string;
  tagline?: string;
  description?: string;
  thumbnailUrl?: string;
  demoUrl?: string;
  repositoryUrl?: string;
  videoUrl?: string;
  trackId?: string;
  customFields?: { fieldName: string; fieldValue: string }[];
}

export const createSubmission = async (input: CreateSubmissionInput, submitterId: string) => {
  const event = await prisma.event.findUnique({ where: { id: input.eventId } });
  if (!event) throw new Error('Event not found');
  if (event.status !== 'SUBMISSION_OPEN') {
    throw new Error('Submissions are not open for this event');
  }

  // Verify the user is a team member
  const membership = await prisma.teamMember.findFirst({
    where: { teamId: input.teamId, userId: submitterId, status: 'ACCEPTED' },
  });
  if (!membership) throw new Error('You are not a member of this team');

  // Check if team already has a submission
  const existing = await prisma.submission.findFirst({
    where: { teamId: input.teamId, eventId: input.eventId },
  });
  if (existing) throw new Error('Team already has a submission for this event');

  // Verify track belongs to event
  const track = await prisma.track.findFirst({ where: { id: input.trackId, eventId: input.eventId } });
  if (!track) throw new Error('Invalid track for this event');

  const submission = await prisma.submission.create({
    data: {
      eventId: input.eventId,
      teamId: input.teamId,
      trackId: input.trackId,
      name: input.name,
      tagline: input.tagline,
      description: input.description,
      thumbnailUrl: input.thumbnailUrl,
      demoUrl: input.demoUrl,
      repositoryUrl: input.repositoryUrl,
      videoUrl: input.videoUrl,
      status: 'DRAFT',
      fields: input.customFields
        ? {
            create: input.customFields,
          }
        : undefined,
    },
    include: {
      fields: true,
      track: true,
      team: { select: { id: true, name: true } },
    },
  });

  return submission;
};

export const updateSubmission = async (
  submissionId: string,
  input: UpdateSubmissionInput,
  updaterId: string
) => {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { event: true, team: { include: { members: true } } },
  });
  if (!submission) throw new Error('Submission not found');

  // Enforce deadline
  if (submission.event.submissionEnd && new Date() > submission.event.submissionEnd) {
    throw new Error('Submission deadline has passed');
  }
  if (submission.status === 'SUBMITTED') {
    throw new Error('Cannot edit a submitted project after final submission');
  }

  // Verify updater is a team member
  const isMember = submission.team.members.some(
    (m) => m.userId === updaterId && m.status === 'ACCEPTED'
  );
  if (!isMember) throw new Error('You are not a member of this team');

  // Handle custom fields: delete and recreate
  if (input.customFields !== undefined) {
    await prisma.submissionField.deleteMany({ where: { submissionId } });
    if (input.customFields.length > 0) {
      await prisma.submissionField.createMany({
        data: input.customFields.map((f) => ({ submissionId, ...f })),
      });
    }
  }

  // Validate new track if provided
  if (input.trackId) {
    const track = await prisma.track.findFirst({
      where: { id: input.trackId, eventId: submission.eventId },
    });
    if (!track) throw new Error('Invalid track for this event');
  }

  return prisma.submission.update({
    where: { id: submissionId },
    data: {
      name: input.name,
      tagline: input.tagline,
      description: input.description,
      thumbnailUrl: input.thumbnailUrl,
      demoUrl: input.demoUrl,
      repositoryUrl: input.repositoryUrl,
      videoUrl: input.videoUrl,
      trackId: input.trackId,
    },
    include: {
      fields: true,
      track: true,
      team: { select: { id: true, name: true } },
    },
  });
};

export const finalizeSubmission = async (submissionId: string, submitterId: string) => {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { event: true, team: { include: { members: true } } },
  });
  if (!submission) throw new Error('Submission not found');

  if (submission.event.submissionEnd && new Date() > submission.event.submissionEnd) {
    throw new Error('Submission deadline has passed');
  }
  if (submission.event.status !== 'SUBMISSION_OPEN') {
    throw new Error('Submissions are not currently open');
  }
  if (submission.status === 'SUBMITTED') {
    throw new Error('Already submitted');
  }

  const isMember = submission.team.members.some(
    (m) => m.userId === submitterId && m.status === 'ACCEPTED'
  );
  if (!isMember) throw new Error('You are not a member of this team');

  return prisma.submission.update({
    where: { id: submissionId },
    data: { status: 'SUBMITTED', submittedAt: new Date() },
    include: {
      fields: true,
      track: true,
      team: { select: { id: true, name: true } },
    },
  });
};

export const getSubmission = async (submissionId: string) => {
  return prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      fields: true,
      track: true,
      team: {
        include: {
          members: {
            where: { status: 'ACCEPTED' },
            include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
          },
        },
      },
    },
  });
};

export const getTeamSubmission = async (teamId: string, eventId: string) => {
  return prisma.submission.findFirst({
    where: { teamId, eventId },
    include: {
      fields: true,
      track: true,
    },
  });
};
