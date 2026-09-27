import { prisma } from '../db/prisma.js';

export interface GalleryQuery {
  eventId: string;
  search?: string;
  trackId?: string;
  page?: number;
  limit?: number;
}

export const listGalleryProjects = async (query: GalleryQuery) => {
  const { eventId, search, trackId, page = 1, limit = 20 } = query;
  const skip = (page - 1) * limit;

  const where = {
    eventId,
    status: { in: ['SUBMITTED', 'ELIGIBLE'] },
    ...(trackId ? { trackId } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search } },
            { tagline: { contains: search } },
            { description: { contains: search } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.submission.findMany({
      where,
      skip,
      take: limit,
      orderBy: { submittedAt: 'desc' },
      include: {
        track: { select: { id: true, name: true } },
        team: {
          select: {
            id: true,
            name: true,
            members: {
              where: { status: 'ACCEPTED' },
              select: { user: { select: { id: true, firstName: true, lastName: true } } },
            },
          },
        },
        _count: { select: { votes: true, comments: true } },
      },
    }),
    prisma.submission.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  };
};

export const getGalleryProject = async (submissionId: string) => {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      track: true,
      team: {
        include: {
          members: {
            where: { status: 'ACCEPTED' },
            include: {
              user: { select: { id: true, email: true, firstName: true, lastName: true } },
            },
          },
        },
      },
      fields: true,
      comments: {
        where: { status: 'PUBLISHED', parentCommentId: null },
        orderBy: { createdAt: 'asc' },
        include: {
          user: { select: { id: true, firstName: true, lastName: true } },
          replies: {
            where: { status: 'PUBLISHED' },
            include: { user: { select: { id: true, firstName: true, lastName: true } } },
          },
        },
      },
      _count: { select: { votes: true, comments: true } },
    },
  });

  if (!submission || !['SUBMITTED', 'ELIGIBLE', 'RESULTS'].includes(submission.status as string)) {
    return null;
  }

  return submission;
};
