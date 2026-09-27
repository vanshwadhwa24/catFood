import { Router } from 'express';
import { getInviteByToken, acceptInvite, declineInvite } from '../services/teamService.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/invites/:token — get invite info (can be used without auth to show preview)
router.get('/:token', async (req, res) => {
  try {
    const invite = await getInviteByToken(req.params.token);
    res.json({
      invite: {
        teamId: invite.teamId,
        teamName: invite.team.name,
        eventName: invite.team.event.name,
        eventSlug: invite.team.event.slug,
        inviterName: invite.team.owner.firstName,
        inviteeEmail: invite.user.email,
        status: invite.status,
      },
    });
  } catch (err) {
    res.status(404).json({ error: (err as Error).message });
  }
});

// POST /api/invites/:token/accept — accept invite
router.post('/:token/accept', requireAuth, async (req: AuthRequest, res) => {
  try {
    const result = await acceptInvite(req.params.token, req.user!.id);
    res.json({ message: 'Invite accepted', member: result });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// POST /api/invites/:token/decline — decline invite
router.post('/:token/decline', requireAuth, async (req: AuthRequest, res) => {
  try {
    const result = await declineInvite(req.params.token, req.user!.id);
    res.json({ message: 'Invite declined', member: result });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

export default router;
