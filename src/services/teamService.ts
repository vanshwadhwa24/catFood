import { prisma } from '../db/prisma.js';
import crypto from 'crypto';

export const generateInviteToken = (): string => {
  return crypto.randomBytes(24).toString('hex');
};

export interface CreateTeamInput {
  eventId: string;
  name: string;
  ownerId: string;
  description?: string;
}

export const createTeam = async (input: CreateTeamInput) => {
  // Verify the event exists and is in REGISTRATION_OPEN state
  const event = await prisma.event.findUnique({ where: { id: input.eventId } });
  if (!event) throw new Error('Event not found');
  if (event.status !== 'REGISTRATION_OPEN') {
    throw new Error('Registration is not open for this event');
  }

  // Check participant isn't already on a team for this event
  const existingMembership = await prisma.teamMember.findFirst({
    where: {
      userId: input.ownerId,
      team: { eventId: input.eventId },
      status: 'ACCEPTED',
    },
  });
  if (existingMembership) throw new Error('You are already on a team for this event');

  return prisma.team.create({
    data: {
      eventId: input.eventId,
      name: input.name,
      description: input.description,
      ownerId: input.ownerId,
      status: 'FORMING',
      members: {
        create: {
          userId: input.ownerId,
          role: 'OWNER',
          status: 'ACCEPTED',
          acceptedAt: new Date(),
        },
      },
    },
    include: {
      members: {
        include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
      },
    },
  });
};

export const getTeam = async (teamId: string) => {
  return prisma.team.findUnique({
    where: { id: teamId },
    include: {
      members: {
        where: { status: { not: 'REMOVED' } },
        include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
        orderBy: { createdAt: 'asc' },
      },
      submissions: { select: { id: true, name: true, status: true } },
    },
  });
};

export const listEventTeams = async (eventId: string) => {
  return prisma.team.findMany({
    where: { eventId },
    include: {
      _count: { select: { members: true } },
      owner: { select: { id: true, email: true, firstName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const inviteMember = async (teamId: string, inviterUserId: string, inviteeEmail: string) => {
  // Check inviter is owner
  const membership = await prisma.teamMember.findFirst({
    where: { teamId, userId: inviterUserId, role: 'OWNER', status: 'ACCEPTED' },
  });
  if (!membership) throw new Error('Only the team owner can invite members');

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { event: true, members: { where: { status: { not: 'REMOVED' } } } },
  });
  if (!team) throw new Error('Team not found');

  // Check team size limit
  const activeMembers = team.members.filter((m) => m.status === 'ACCEPTED').length;
  if (activeMembers >= team.event.maxTeamSize) {
    throw new Error('Team is already at maximum size');
  }

  // Find or create invitee user
  let invitee = await prisma.user.findUnique({ where: { email: inviteeEmail } });
  if (!invitee) {
    // Create a placeholder user so they can complete registration later
    invitee = await prisma.user.create({
      data: {
        email: inviteeEmail,
        passwordHash: '',
        role: 'PARTICIPANT',
      },
    });
  }

  // Check if already a member
  const existing = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: invitee.id } },
  });
  if (existing && existing.status !== 'DECLINED' && existing.status !== 'REMOVED') {
    throw new Error('User is already invited or a member');
  }

  const token = generateInviteToken();

  if (existing) {
    // Re-invite declined member
    return prisma.teamMember.update({
      where: { id: existing.id },
      data: { status: 'PENDING', inviteToken: token, invitedAt: new Date(), acceptedAt: null },
    });
  }

  return prisma.teamMember.create({
    data: {
      teamId,
      userId: invitee.id,
      role: 'MEMBER',
      status: 'PENDING',
      inviteToken: token,
    },
  });
};

export const getInviteByToken = async (token: string) => {
  const member = await prisma.teamMember.findUnique({
    where: { inviteToken: token },
    include: {
      team: {
        include: {
          event: { select: { id: true, name: true, slug: true } },
          owner: { select: { id: true, firstName: true, email: true } },
        },
      },
      user: { select: { id: true, email: true, firstName: true } },
    },
  });
  if (!member) throw new Error('Invite not found or expired');
  if (member.status !== 'PENDING') throw new Error('Invite already used');
  return member;
};

export const acceptInvite = async (token: string, userId: string) => {
  const member = await getInviteByToken(token);

  // The accepting user must match the invited email
  if (member.userId !== userId) throw new Error('This invite is not for you');

  return prisma.teamMember.update({
    where: { id: member.id },
    data: { status: 'ACCEPTED', acceptedAt: new Date(), inviteToken: null },
  });
};

export const declineInvite = async (token: string, userId: string) => {
  const member = await getInviteByToken(token);
  if (member.userId !== userId) throw new Error('This invite is not for you');

  return prisma.teamMember.update({
    where: { id: member.id },
    data: { status: 'DECLINED', inviteToken: null },
  });
};

export const removeMember = async (teamId: string, ownerId: string, targetUserId: string) => {
  const ownerMembership = await prisma.teamMember.findFirst({
    where: { teamId, userId: ownerId, role: 'OWNER', status: 'ACCEPTED' },
  });
  if (!ownerMembership) throw new Error('Only the team owner can remove members');
  if (ownerId === targetUserId) throw new Error('Owner cannot remove themselves');

  return prisma.teamMember.updateMany({
    where: { teamId, userId: targetUserId },
    data: { status: 'REMOVED' },
  });
};

export const getUserTeamForEvent = async (userId: string, eventId: string) => {
  const membership = await prisma.teamMember.findFirst({
    where: { userId, team: { eventId }, status: 'ACCEPTED' },
    include: {
      team: {
        include: {
          members: {
            where: { status: { not: 'REMOVED' } },
            include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
          },
          submissions: { select: { id: true, name: true, status: true, submittedAt: true } },
        },
      },
    },
  });
  return membership?.team ?? null;
};
