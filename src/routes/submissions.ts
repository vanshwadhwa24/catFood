import { Router } from 'express';
import { AuthRequest, requireAuth } from '../middleware/auth.js';
import { getEventBySlug } from '../services/eventService.js';
import {
  createSubmission,
  updateSubmission,
  finalizeSubmission,
  getTeamSubmission,
} from '../services/submissionService.js';
import { getUserTeamForEvent } from '../services/teamService.js';

const router = Router({ mergeParams: true });

// GET /api/events/:slug/submissions/mine — get my team's submission
router.get('/mine', requireAuth, async (req: AuthRequest, res) => {
  try {
    const event = await getEventBySlug(req.params.slug);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const team = await getUserTeamForEvent(req.user!.id, event.id);
    if (!team) return res.json({ submission: null });

    const submission = await getTeamSubmission(team.id, event.id);
    res.json({ submission });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST /api/events/:slug/submissions — create draft submission
router.post('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const event = await getEventBySlug(req.params.slug);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const { teamId, trackId, name, tagline, description, thumbnailUrl, demoUrl, repositoryUrl, videoUrl, customFields } =
      req.body;

    if (!teamId || !trackId || !name) {
      return res.status(400).json({ error: 'teamId, trackId and name are required' });
    }

    const submission = await createSubmission(
      {
        eventId: event.id,
        teamId,
        trackId,
        name,
        tagline,
        description,
        thumbnailUrl,
        demoUrl,
        repositoryUrl,
        videoUrl,
        customFields,
      },
      req.user!.id
    );

    res.status(201).json({ submission });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// PATCH /api/events/:slug/submissions/:submissionId — update draft
router.patch('/:submissionId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const submission = await updateSubmission(req.params.submissionId, req.body, req.user!.id);
    res.json({ submission });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// POST /api/events/:slug/submissions/:submissionId/submit — finalize submission
router.post('/:submissionId/submit', requireAuth, async (req: AuthRequest, res) => {
  try {
    const submission = await finalizeSubmission(req.params.submissionId, req.user!.id);
    res.json({ submission });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

export default router;
