import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../src/db/prisma.js';
import { createEvent, transitionEventStatus, addTrack } from '../../src/services/eventService.js';
import { createTeam } from '../../src/services/teamService.js';
import {
  createSubmission,
  updateSubmission,
  finalizeSubmission,
  getSubmissionForTeam,
} from '../../src/services/submissionService.js';
import { EventStatus } from '../../src/models/enums.js';

describe('Submissions Service - Integration Tests', () => {
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
      where: { email: 'organizer_subtest@dogfood.local' },
      update: {},
      create: {
        email: 'organizer_subtest@dogfood.local',
        passwordHash: 'dummy',
        firstName: 'Org',
        role: 'ORGANIZER',
      },
    });
    organizerId = organizer.id;

    const participant = await prisma.user.upsert({
      where: { email: 'hacker_subtest@dogfood.local' },
      update: {},
      create: {
        email: 'hacker_subtest@dogfood.local',
        passwordHash: 'dummy',
        firstName: 'Hacker',
        role: 'PARTICIPANT',
      },
    });
    participantId = participant.id;

    // Create Event
    const ev = await createEvent({
      name: `Sub Test Event ${Date.now()}`,
      organizerId,
    });
    eventId = ev.id;
    eventSlug = ev.slug;

    // Add track
    const track = await addTrack(eventSlug, { name: 'Full-Stack Web' });
    trackId = track.id;

    // Transition to REGISTRATION_OPEN to form team
    await transitionEventStatus(eventSlug, EventStatus.REGISTRATION_OPEN, organizerId);
    const team = await createTeam({
      eventId,
      name: 'AlphaDevs',
      ownerId: participantId,
    });
    teamId = team.id;

    // Transition to SUBMISSION_OPEN
    await transitionEventStatus(eventSlug, EventStatus.REGISTRATION_CLOSED, organizerId);
    await transitionEventStatus(eventSlug, EventStatus.SUBMISSION_OPEN, organizerId);
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

  it('creates a project submission in DRAFT status', async () => {
    const sub = await createSubmission(
      {
        eventId,
        teamId,
        trackId,
        name: 'DogDetect AI',
        tagline: 'Computer vision to verify canine friendly recipes',
        description: 'Deep neural networks running on edge devices.',
        demoUrl: 'https://demo.dogdetect.ai',
        repositoryUrl: 'https://github.com/alphadevs/dogdetect',
      },
      participantId
    );

    expect(sub).toBeDefined();
    expect(sub.name).toBe('DogDetect AI');
    expect(sub.status).toBe('DRAFT');
    expect(sub.trackId).toBe(trackId);
    submissionId = sub.id;
  });

  it('allows updating the draft submission', async () => {
    const updated = await updateSubmission(
      submissionId,
      {
        tagline: 'Updated tagline for dog nutrition AI',
        videoUrl: 'https://youtube.com/watch?v=12345',
      },
      participantId
    );

    expect(updated.tagline).toBe('Updated tagline for dog nutrition AI');
    expect(updated.videoUrl).toBe('https://youtube.com/watch?v=12345');
  });

  it('fetches team submission', async () => {
    const fetched = await getSubmissionForTeam(teamId, eventId);
    expect(fetched).toBeDefined();
    expect(fetched?.id).toBe(submissionId);
  });

  it('finalizes and locks submission for judging', async () => {
    const finalized = await finalizeSubmission(submissionId, participantId);
    expect(finalized.status).toBe('SUBMITTED');
    expect(finalized.submittedAt).toBeDefined();
  });
});
