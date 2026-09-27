import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../src/db/prisma.js';
import { createEvent, transitionEventStatus } from '../../src/services/eventService.js';
import {
  createTeam,
  inviteMember,
  getInviteByToken,
  acceptInvite,
  removeMember,
} from '../../src/services/teamService.js';
import { EventStatus } from '../../src/models/enums.js';

describe('Teams Service - Integration Tests', () => {
  let organizerId: string;
  let leaderId: string;
  let inviteeId: string;
  let eventId: string;
  let eventSlug: string;
  let teamId: string;
  let inviteToken: string;

  beforeAll(async () => {
    // Users
    const organizer = await prisma.user.upsert({
      where: { email: 'organizer_teamtest@dogfood.local' },
      update: {},
      create: {
        email: 'organizer_teamtest@dogfood.local',
        passwordHash: 'dummy',
        firstName: 'Org',
        role: 'ORGANIZER',
      },
    });
    organizerId = organizer.id;

    const leader = await prisma.user.upsert({
      where: { email: 'leader_teamtest@dogfood.local' },
      update: {},
      create: {
        email: 'leader_teamtest@dogfood.local',
        passwordHash: 'dummy',
        firstName: 'Leader',
        role: 'PARTICIPANT',
      },
    });
    leaderId = leader.id;

    const invitee = await prisma.user.upsert({
      where: { email: 'invitee_teamtest@dogfood.local' },
      update: {},
      create: {
        email: 'invitee_teamtest@dogfood.local',
        passwordHash: 'dummy',
        firstName: 'Invitee',
        role: 'PARTICIPANT',
      },
    });
    inviteeId = invitee.id;

    // Event in REGISTRATION_OPEN
    const ev = await createEvent({
      name: `Team Test Event ${Date.now()}`,
      organizerId,
      maxTeamSize: 4,
    });
    eventId = ev.id;
    eventSlug = ev.slug;

    await transitionEventStatus(eventSlug, EventStatus.REGISTRATION_OPEN, organizerId);
  });

  afterAll(async () => {
    if (eventId) {
      await prisma.teamMember.deleteMany({ where: { team: { eventId } } });
      await prisma.team.deleteMany({ where: { eventId } });
      await prisma.event.delete({ where: { id: eventId } });
    }
  });

  it('allows a participant to create a team when registration is open', async () => {
    const team = await createTeam({
      eventId,
      name: 'CyberDogs',
      ownerId: leaderId,
      description: 'Building the next gen cat food detector',
    });

    expect(team).toBeDefined();
    expect(team.name).toBe('CyberDogs');
    expect(team.ownerId).toBe(leaderId);
    expect(team.members.length).toBe(1);
    expect(team.members[0].role).toBe('OWNER');
    expect(team.members[0].status).toBe('ACCEPTED');
    teamId = team.id;
  });

  it('prevents user from joining or creating multiple teams in the same event', async () => {
    await expect(
      createTeam({
        eventId,
        name: 'AnotherTeam',
        ownerId: leaderId,
      })
    ).rejects.toThrow();
  });

  it('allows owner to generate an invite for another participant', async () => {
    const member = await inviteMember(teamId, 'invitee_teamtest@dogfood.local', leaderId);
    expect(member).toBeDefined();
    expect(member.status).toBe('PENDING');
    expect(member.inviteToken).toBeDefined();
    inviteToken = member.inviteToken!;
  });

  it('retrieves invite info by token', async () => {
    const invite = await getInviteByToken(inviteToken);
    expect(invite).toBeDefined();
    expect(invite.teamId).toBe(teamId);
    expect(invite.status).toBe('PENDING');
  });

  it('allows invitee to accept the invitation', async () => {
    const accepted = await acceptInvite(inviteToken, inviteeId);
    expect(accepted.status).toBe('ACCEPTED');
    expect(accepted.userId).toBe(inviteeId);
  });

  it('allows owner to remove a member', async () => {
    const removed = await removeMember(teamId, inviteeId, leaderId);
    expect(removed.status).toBe('REMOVED');
  });
});
