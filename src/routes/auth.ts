import { Router } from 'express';
import { registerUser, loginUser } from '../services/authService.js';
import { AuthRequest, requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await registerUser(email, password, firstName, lastName);

    req.session.userId = user.id;
    res.status(201).json({ user: { id: user.id, email: user.email, role: user.role } });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await loginUser(email, password);

    req.session.userId = user.id;
    res.json({ user: { id: user.id, email: user.email, role: user.role } });
  } catch (error) {
    res.status(401).json({ error: (error as Error).message });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: 'Logout failed' });
    res.json({ message: 'Logged out' });
  });
});

router.get('/me', requireAuth, (req: AuthRequest, res) => {
  res.json({ user: req.user });
});

export default router;
