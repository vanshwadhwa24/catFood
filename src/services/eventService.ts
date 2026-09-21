import { prisma } from '../db/prisma.js';
import { EventStatus } from '../models/enums.js';

// Valid state transitions for the event lifecycle
const VALID_TRANSITIONS: Record<string, string[]> = {
  [EventStatus.DRAFT]: [EventStatus.REGISTRATION_OPEN],
  [EventStatus.REGISTRATION_OPEN]: [EventStatus.REGISTRATION_CLOSED],
  [EventStatus.REGISTRATION_CLOSED]: [EventStatus.SUBMISSION_OPEN],
  [EventStatus.SUBMISSION_OPEN]: [EventStatus.SUBMISSION_CLOSED],
  [EventStatus.SUBMISSION_CLOSED]: [EventStatus.ELIGIBILITY_REVIEW],
  [EventStatus.ELIGIBILITY_REVIEW]: [EventStatus.JUDGING],
  [EventStatus.JUDGING]: [EventStatus.JUDGING_COMPLETE],
  [EventStatus.JUDGING_COMPLETE]: [EventStatus.VOTING, EventStatus.RESULTS],
  [EventStatus.VOTING]: [EventStatus.VOTING_CLOSED],
  [EventStatus.VOTING_CLOSED]: [EventStatus.RESULTS],
  [EventStatus.RESULTS]: [EventStatus.CERTIFICATES, EventStatus.ARCHIVED],
  [EventStatus.CERTIFICATES]: [EventStatus.ARCHIVED],
  [EventStatus.ARCHIVED]: [],
};

export interface CreateEventInput {
  name: string;
  description?: string;
  organizerId: string;
  registrationStart?: Date;
  registrationEnd?: Date;
  submissionStart?: Date;
  submissionEnd?: Date;
  judgingStart?: Date;
  judgingEnd?: Date;
  votingStart?: Date;
  votingEnd?: Date;
  maxTeamSize?: number;
  allowIndividual?: boolean;
  allowCommunityVote?: boolean;
  votingMode?: string;
}

export const createEvent = async (input: CreateEventInput) => {
  const slug = input.name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();

  // Ensure slug uniqueness
  let finalSlug = slug;
  let counter = 1;
  while (await prisma.event.findUnique({ where: { slug: finalSlug } })) {
    finalSlug = `${slug}-${counter++}`;
  }

  return prisma.event.create({
    data: {
      slug: finalSlug,
      name: input.name,
      description: input.description,
      organizerId: input.organizerId,
      registrationStart: input.registrationStart,
      registrationEnd: input.registrationEnd,
      submissionStart: input.submissionStart,
      submissionEnd: input.submissionEnd,
      judgingStart: input.judgingStart,
      judgingEnd: input.judgingEnd,
      votingStart: input.votingStart,
      votingEnd: input.votingEnd,
      maxTeamSize: input.maxTeamSize ?? 5,
      allowIndividual: input.allowIndividual ?? false,
      allowCommunityVote: input.allowCommunityVote ?? true,
      votingMode: input.votingMode ?? 'OPEN_LINK',
    },
    include: {
      tracks: true,
      prizes: true,
      organizer: { select: { id: true, email: true, firstName: true, lastName: true } },
    },
  });
};

export const listEvents = async (status?: string) => {
  return prisma.event.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: 'desc' },
    include: {
      tracks: { orderBy: { position: 'asc' } },
      prizes: { orderBy: { rank: 'asc' } },
      organizer: { select: { id: true, email: true, firstName: true, lastName: true } },
      _count: { select: { teams: true, submissions: true, judges: true } },
    },
  });
};

export const getEventBySlug = async (slug: string) => {
  return prisma.event.findUnique({
    where: { slug },
    include: {
      tracks: { orderBy: { position: 'asc' } },
      prizes: { orderBy: { rank: 'asc' } },
      organizer: { select: { id: true, email: true, firstName: true, lastName: true } },
      rubrics: { include: { criteria: { orderBy: { position: 'asc' } } } },
      _count: { select: { teams: true, submissions: true, judges: true } },
    },
  });
};

export const updateEvent = async (slug: string, data: Partial<CreateEventInput>) => {
  const event = await prisma.event.findUnique({ where: { slug } });
  if (!event) throw new Error('Event not found');

  return prisma.event.update({
    where: { slug },
    data: {
      name: data.name,
      description: data.description,
      registrationStart: data.registrationStart,
      registrationEnd: data.registrationEnd,
      submissionStart: data.submissionStart,
      submissionEnd: data.submissionEnd,
      judgingStart: data.judgingStart,
      judgingEnd: data.judgingEnd,
      votingStart: data.votingStart,
      votingEnd: data.votingEnd,
      maxTeamSize: data.maxTeamSize,
      allowIndividual: data.allowIndividual,
      allowCommunityVote: data.allowCommunityVote,
      votingMode: data.votingMode,
    },
    include: {
      tracks: { orderBy: { position: 'asc' } },
      prizes: { orderBy: { rank: 'asc' } },
      organizer: { select: { id: true, email: true, firstName: true, lastName: true } },
    },
  });
};

export const transitionEventStatus = async (slug: string, newStatus: string, actorId: string) => {
  const event = await prisma.event.findUnique({ where: { slug } });
  if (!event) throw new Error('Event not found');

  const allowed = VALID_TRANSITIONS[event.status] ?? [];
  if (!allowed.includes(newStatus)) {
    throw new Error(`Cannot transition from ${event.status} to ${newStatus}`);
  }

  return prisma.event.update({ where: { slug }, data: { status: newStatus } });
};

export const addTrack = async (eventId: string, name: string, description?: string, position?: number) => {
  return prisma.track.create({ data: { eventId, name, description, position } });
};

export const addPrize = async (
  eventId: string,
  rank: number,
  title: string,
  description?: string,
  reward?: string,
  trackId?: string
) => {
  return prisma.prize.create({ data: { eventId, rank, title, description, reward, trackId } });
};
