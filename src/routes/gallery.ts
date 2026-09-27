import { Router } from 'express';
import { getEventBySlug } from '../services/eventService.js';
import { listGalleryProjects, getGalleryProject } from '../services/galleryService.js';

const router = Router({ mergeParams: true });

// GET /api/events/:slug/gallery — list public gallery (no auth required)
router.get('/', async (req, res) => {
  try {
    const event = await getEventBySlug(req.params.slug);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const { search, trackId, page, limit } = req.query;

    const result = await listGalleryProjects({
      eventId: event.id,
      search: search as string | undefined,
      trackId: trackId as string | undefined,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? Math.min(parseInt(limit as string), 50) : 20,
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// GET /api/events/:slug/gallery/:submissionId — get single project (no auth required)
router.get('/:submissionId', async (req, res) => {
  try {
    const project = await getGalleryProject(req.params.submissionId);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json({ project });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
