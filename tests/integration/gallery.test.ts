import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../src/db/prisma.js';
import { createEvent, transitionEventStatus, addTrack } from '../../src/services/eventService.js';
import { createTeam } from '../../src/services/teamService.js';
import { createSubmission, finalizeSubmission } from '../../src/services/submissionService.js';
import { listGalleryProjects, getGalleryProject } from '../../src/services/galleryService.js';
import { EventStatus } from '../../src/models/enums.js';

describe('Gallery Service - Integration Tests', () => {
  let organizerId: string;
  let participantId: string;
  let eventId: string;
  let eventSlug: string;
  let trackId: string;
  let teamId: string;
  let submissionId: string;

  beforeAll(async () => {
    // Users
    const organizer = await prisma.user.upsert({
      where: { email: 'organizer_galtest@dogfood.local' },
      update: {},
      create: {
        email: 'organizer_galtest@dogfood.local',
        passwordHash: 'dummy',
        firstName: 'Org',
        role: 'ORGANIZER',
      },
    });
    organizerId = organizer.id;

    const participant = await prisma.user.upsert({
      where: { email: 'hacker_galtest@dogfood.local' },
      update: {},
      create: {
        email: 'hacker_galtest@dogfood.local',
        passwordHash: 'dummy',
        firstName: 'Hacker',
        role: 'PARTICIPANT',
      },
    });
    participantId = participant.id;

    // Create Event
    const ev = await createEvent({
      name: `Gallery Test Event ${Date.now()}`,
      organizerId,
    });
    eventId = ev.id;
    eventSlug = ev.slug;

    // Add track
    const track = await addTrack(eventSlug, { name: 'Blockchain & AI' });
    trackId = track.id;

    // Team setup
    await transitionEventStatus(eventSlug, EventStatus.REGISTRATION_OPEN, organizerId);
    const team = await createTeam({
      eventId,
      name: 'GalacticHacks',
      ownerId: participantId,
    });
    teamId = team.id;

    // Open submissions and submit project
    await transitionEventStatus(eventSlug, EventStatus.REGISTRATION_CLOSED, organizerId);
    await transitionEventStatus(eventSlug, EventStatus.SUBMISSION_OPEN, organizerId);

    const sub = await createSubmission(
      {
        eventId,
        teamId,
        trackId,
        name: 'OmniChain Bot',
        tagline: 'Autonomous cross-chain liquidity arbitrator',
        description: 'High throughput Rust implementation.',
      },
      participantId
    );
    submissionId = sub.id;

    await finalizeSubmission(submissionId, participantId);
  });

  afterAll(async () => {
    if (eventId) {
      await prisma.submissionField.deleteMany({ where: { submission: { eventId } } });
      await prisma.submission.deleteMany({ where: { eventId } });
      await prisma.teamMember.deleteMany({ where: { team: { eventId } } });
      await prisma.team.deleteMany({ where: { eventId } });
      await prisma.track.deleteMany({ where: { eventId } });
      await prisma.event.delete({ where: { id: eventId } });
    }
  });

  it('lists finalized projects in the public gallery', async () => {
    const gallery = await listGalleryProjects({
      eventId,
      page: 1,
      limit: 10,
    });

    expect(gallery.total).toBeGreaterThanOrEqual(1);
    expect(gallery.items.some((i) => i.id === submissionId)).toBe(true);
    const item = gallery.items.find((i) => i.id === submissionId);
    expect(item?.name).toBe('OmniChain Bot');
    expect(item?.track?.name).toBe('Blockchain & AI');
  });

  it('filters gallery projects by track and search keyword', async () => {
    const searchResult = await listGalleryProjects({
      eventId,
      search: 'OmniChain',
    });
    expect(searchResult.total).toBe(1);

    const noResult = await listGalleryProjects({
      eventId,
      search: 'NonExistentXYZProject',
    });
    expect(noResult.total).toBe(0);
  });

  it('retrieves detailed project by ID for showcase page', async () => {
    const project = await getGalleryProject(submissionId);
    expect(project).toBeDefined();
    expect(project?.id).toBe(submissionId);
    expect(project?.team.name).toBe('GalacticHacks');
  });
});
