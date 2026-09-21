import { Router } from 'express';
import { AuthRequest, requireAuth, requireRole } from '../middleware/auth.js';
import { getEventBySlug } from '../services/eventService.js';
import {
  createTeam,
  getTeam,
  listEventTeams,
  inviteMember,
  getInviteByToken,
  acceptInvite,
  declineInvite,
  removeMember,
  getUserTeamForEvent,
} from '../services/teamService.js';

const router = Router({ mergeParams: true });

// GET /api/events/:slug/teams/mine — get my team for this event
router.get('/mine', requireAuth, async (req: AuthRequest, res) => {
  try {
    const event = await getEventBySlug(req.params.slug);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const team = await getUserTeamForEvent(req.user!.id, event.id);
    res.json({ team });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// GET /api/events/:slug/teams — list all teams (organizer/admin)
router.get('/', requireAuth, requireRole(['ORGANIZER', 'ADMIN']), async (req: AuthRequest, res) => {
  try {
    const event = await getEventBySlug(req.params.slug);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const teams = await listEventTeams(event.id);
    res.json({ teams });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST /api/events/:slug/teams — create team
router.post('/', requireAuth, requireRole(['PARTICIPANT', 'ADMIN']), async (req: AuthRequest, res) => {
  try {
    const event = await getEventBySlug(req.params.slug);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Team name is required' });

    const team = await createTeam({
      eventId: event.id,
      name,
      description,
      ownerId: req.user!.id,
    });

    res.status(201).json({ team });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// GET /api/events/:slug/teams/:teamId — get team details
router.get('/:teamId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const team = await getTeam(req.params.teamId);
    if (!team) return res.status(404).json({ error: 'Team not found' });

    // Only members, organizer, or admin can view
    const isMember = team.members.some((m) => m.user.id === req.user!.id);
    const isPrivileged = ['ORGANIZER', 'ADMIN'].includes(req.user!.role);
    if (!isMember && !isPrivileged) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json({ team });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// POST /api/events/:slug/teams/:teamId/invite — invite member
router.post('/:teamId/invite', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const result = await inviteMember(req.params.teamId, req.user!.id, email);
    res.status(201).json({ invite: result });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// DELETE /api/events/:slug/teams/:teamId/members/:userId — remove member
router.delete('/:teamId/members/:userId', requireAuth, async (req: AuthRequest, res) => {
  try {
    await removeMember(req.params.teamId, req.user!.id, req.params.userId);
    res.json({ message: 'Member removed' });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

export default router;
