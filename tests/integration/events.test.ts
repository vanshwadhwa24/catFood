import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../src/db/prisma.js';
import {
  createEvent,
  getEventBySlug,
  transitionEventStatus,
  addTrack,
  addPrize,
} from '../../src/services/eventService.js';
import { EventStatus } from '../../src/models/enums.js';

describe('Events Service - Integration Tests', () => {
  let organizerId: string;
  let testEventSlug: string;

  beforeAll(async () => {
    // Create or find a test organizer
    const organizer = await prisma.user.upsert({
      where: { email: 'organizer_test@dogfood.local' },
      update: {},
      create: {
        email: 'organizer_test@dogfood.local',
        passwordHash: 'dummyhash',
        firstName: 'Test',
        lastName: 'Organizer',
        role: 'ORGANIZER',
      },
    });
    organizerId = organizer.id;
  });

  afterAll(async () => {
    // Cleanup created event
    if (testEventSlug) {
      const ev = await prisma.event.findUnique({ where: { slug: testEventSlug } });
      if (ev) {
        await prisma.prize.deleteMany({ where: { eventId: ev.id } });
        await prisma.track.deleteMany({ where: { eventId: ev.id } });
        await prisma.event.delete({ where: { id: ev.id } });
      }
    }
  });

  it('creates an event in DRAFT status with unique slug', async () => {
    const event = await createEvent({
      name: `Vitest Event ${Date.now()}`,
      description: 'A test event created via integration test',
      organizerId,
      maxTeamSize: 4,
    });

    expect(event).toBeDefined();
    expect(event.id).toBeDefined();
    expect(event.status).toBe(EventStatus.DRAFT);
    expect(event.slug).toBeDefined();
    testEventSlug = event.slug;
  });

  it('fetches an event by slug including tracks and prizes', async () => {
    const fetched = await getEventBySlug(testEventSlug);
    expect(fetched).toBeDefined();
    expect(fetched.slug).toBe(testEventSlug);
    expect(Array.isArray(fetched.tracks)).toBe(true);
  });

  it('transitions event status along valid lifecycle path', async () => {
    // DRAFT -> REGISTRATION_OPEN
    const updated = await transitionEventStatus(testEventSlug, EventStatus.REGISTRATION_OPEN, organizerId);
    expect(updated.status).toBe(EventStatus.REGISTRATION_OPEN);
  });

  it('rejects invalid lifecycle transition', async () => {
    // REGISTRATION_OPEN -> RESULTS is invalid
    await expect(
      transitionEventStatus(testEventSlug, EventStatus.RESULTS, organizerId)
    ).rejects.toThrow();
  });

  it('adds tracks and prizes to the event', async () => {
    const track = await addTrack(testEventSlug, {
      name: 'AI & Machine Learning',
      description: 'Build autonomous agents',
    });
    expect(track.name).toBe('AI & Machine Learning');

    const prize = await addPrize(testEventSlug, {
      rank: 1,
      title: 'Grand Champion',
      reward: '$10,000 USD',
    });
    expect(prize.title).toBe('Grand Champion');
    expect(prize.reward).toBe('$10,000 USD');
  });
});
