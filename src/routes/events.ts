import { Router } from 'express';
import { AuthRequest, requireAuth, requireRole } from '../middleware/auth.js';
import {
  createEvent,
  listEvents,
  getEventBySlug,
  updateEvent,
  transitionEventStatus,
  addTrack,
  addPrize,
} from '../services/eventService.js';

const router = Router();

// GET /api/events — list all events (public)
router.get('/', async (_req, res) => {
  try {
    const events = await listEvents();
    res.json({ events });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// GET /api/events/:slug — get event detail (public)
router.get('/:slug', async (req, res) => {
  try {
    const event = await getEventBySlug(req.params.slug);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json({ event });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST /api/events — create event (organizer/admin)
router.post(
  '/',
  requireAuth,
  requireRole(['ORGANIZER', 'ADMIN']),
  async (req: AuthRequest, res) => {
    try {
      const {
        name,
        description,
        registrationStart,
        registrationEnd,
        submissionStart,
        submissionEnd,
        judgingStart,
        judgingEnd,
        votingStart,
        votingEnd,
        maxTeamSize,
        allowIndividual,
        allowCommunityVote,
        votingMode,
      } = req.body;

      if (!name) return res.status(400).json({ error: 'Event name is required' });

      const event = await createEvent({
        name,
        description,
        organizerId: req.user!.id,
        registrationStart: registrationStart ? new Date(registrationStart) : undefined,
        registrationEnd: registrationEnd ? new Date(registrationEnd) : undefined,
        submissionStart: submissionStart ? new Date(submissionStart) : undefined,
        submissionEnd: submissionEnd ? new Date(submissionEnd) : undefined,
        judgingStart: judgingStart ? new Date(judgingStart) : undefined,
        judgingEnd: judgingEnd ? new Date(judgingEnd) : undefined,
        votingStart: votingStart ? new Date(votingStart) : undefined,
        votingEnd: votingEnd ? new Date(votingEnd) : undefined,
        maxTeamSize,
        allowIndividual,
        allowCommunityVote,
        votingMode,
      });

      res.status(201).json({ event });
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  }
);

// PATCH /api/events/:slug — update event details (organizer/admin)
router.patch(
  '/:slug',
  requireAuth,
  requireRole(['ORGANIZER', 'ADMIN']),
  async (req: AuthRequest, res) => {
    try {
      const event = await getEventBySlug(req.params.slug);
      if (!event) return res.status(404).json({ error: 'Event not found' });

      // Only the organizer or admin can update
      if (req.user!.role !== 'ADMIN' && event.organizerId !== req.user!.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const updated = await updateEvent(req.params.slug, req.body);
      res.json({ event: updated });
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  }
);

// PATCH /api/events/:slug/status — transition event status
router.patch(
  '/:slug/status',
  requireAuth,
  requireRole(['ORGANIZER', 'ADMIN']),
  async (req: AuthRequest, res) => {
    try {
      const { status } = req.body;
      if (!status) return res.status(400).json({ error: 'Status is required' });

      const event = await getEventBySlug(req.params.slug);
      if (!event) return res.status(404).json({ error: 'Event not found' });

      if (req.user!.role !== 'ADMIN' && event.organizerId !== req.user!.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const updated = await transitionEventStatus(req.params.slug, status, req.user!.id);
      res.json({ event: updated });
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  }
);

// POST /api/events/:slug/tracks — add track
router.post(
  '/:slug/tracks',
  requireAuth,
  requireRole(['ORGANIZER', 'ADMIN']),
  async (req: AuthRequest, res) => {
    try {
      const event = await getEventBySlug(req.params.slug);
      if (!event) return res.status(404).json({ error: 'Event not found' });

      if (req.user!.role !== 'ADMIN' && event.organizerId !== req.user!.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const { name, description, position } = req.body;
      if (!name) return res.status(400).json({ error: 'Track name is required' });

      const track = await addTrack(event.id, name, description, position);
      res.status(201).json({ track });
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  }
);

// POST /api/events/:slug/prizes — add prize
router.post(
  '/:slug/prizes',
  requireAuth,
  requireRole(['ORGANIZER', 'ADMIN']),
  async (req: AuthRequest, res) => {
    try {
      const event = await getEventBySlug(req.params.slug);
      if (!event) return res.status(404).json({ error: 'Event not found' });

      if (req.user!.role !== 'ADMIN' && event.organizerId !== req.user!.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const { rank, title, description, reward, trackId } = req.body;
      if (!rank || !title) return res.status(400).json({ error: 'Rank and title are required' });

      const prize = await addPrize(event.id, rank, title, description, reward, trackId);
      res.status(201).json({ prize });
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  }
);

export default router;
