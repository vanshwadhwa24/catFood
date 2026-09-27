import express from 'express';
import session from 'express-session';
import connectSqlite3 from 'connect-sqlite3';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { prisma } from './db/prisma.js';
import { AuthRequest } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import eventRoutes from './routes/events.js';
import teamRoutes from './routes/teams.js';
import submissionRoutes from './routes/submissions.js';
import galleryRoutes from './routes/gallery.js';
import inviteRoutes from './routes/invites.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.APP_PORT || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

const SQLiteStore = (connectSqlite3 as any)(session);

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: IS_PROD ? undefined : false, // relax for dev
  })
);

// CORS — allow dev client or serve from same origin in prod
if (!IS_PROD) {
  app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Sessions
app.use(
  session({
    store: new SQLiteStore({ db: 'sessions.db', dir: './data' }),
    secret: process.env.SESSION_SECRET || 'dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: IS_PROD,
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  })
);

// Session → user hydration middleware
app.use(async (req: AuthRequest, _res, next) => {
  if (req.session?.userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.session.userId },
      });
      if (user) {
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role,
        };
      }
    } catch (e) {
      console.error('Session user hydration error:', e);
    }
  }
  next();
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/events/:slug/teams', teamRoutes);
app.use('/api/events/:slug/submissions', submissionRoutes);
app.use('/api/events/:slug/gallery', galleryRoutes);
app.use('/api/invites', inviteRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Static Client (production) ───────────────────────────────────────────────
if (IS_PROD) {
  const clientBuildPath = path.resolve(process.cwd(), 'client/dist');
  app.use(express.static(clientBuildPath));
  // SPA fallback — serve index.html for any non-API route
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

// Global error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// Start server
const start = async () => {
  try {
    console.log('Starting Dogfood server...');
    app.listen(PORT, () => {
      console.log(`✓ Server ready at http://localhost:${PORT}`);
      if (!IS_PROD) {
        console.log(`  Frontend dev server expected at ${CLIENT_ORIGIN}`);
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

start();
export default app;
