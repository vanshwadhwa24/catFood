import express from 'express';
import session from 'express-session';
import connectSqlite3 from 'connect-sqlite3';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { prisma } from './db/prisma.js';
import { AuthRequest } from './middleware/auth.js';
import authRoutes from './routes/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.APP_PORT || 3000;

const SQLiteStore = (connectSqlite3 as any)(session);

// Middleware
app.use(helmet());
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Sessions
app.use(
  session({
    store: new SQLiteStore({ db: 'sessions.db', dir: './data' }),
    secret: process.env.SESSION_SECRET || 'dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  })
);

// Session to user middleware
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

// Routes
app.use('/api/auth', authRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Error handling
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const start = async () => {
  try {
    console.log('Starting server...');
    app.listen(PORT, () => {
      console.log(`Server ready at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

start();
export default app;
