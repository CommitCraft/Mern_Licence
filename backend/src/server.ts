import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { sequelize } from './config/database';
import { ensureKeysExist } from './utils/crypto';
import authRoutes from './routes/authRoutes';
import adminRoutes from './routes/adminRoutes';
import clientRoutes from './routes/clientRoutes';
import { runMigrations } from './database/migrate';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT || 8000;

// Security & Dynamic CORS Middleware for Local Dev & Production
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman) or any localhost port
      if (!origin || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET || 'cookie_secret'));

// Ensure Ed25519 Keys are initialized
ensureKeysExist();

// Health Check API
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'UP', timestamp: new Date().toISOString(), env: process.env.NODE_ENV });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/v1', clientRoutes);

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Express Error Handler:', err);
  const status = err.status || 500;
  const message = process.env.NODE_ENV === 'production' && status === 500 ? 'Internal server error' : err.message;
  res.status(status).json({ success: false, message });
});

async function startServer() {
  try {
    const startTime = Date.now();

    // ── Step 1: Run Migrations ──────────────────────────────────────────
    console.log('\n┌─────────────────────────────────────────────────────┐');
    console.log('│           SaralLicence  —  Backend API Server       │');
    console.log('└─────────────────────────────────────────────────────┘\n');

    process.stdout.write('  🔄  Running database migrations...       ');
    await runMigrations(false);
    console.log('✅ Done');

    // ── Step 2: Verify DB Connection ────────────────────────────────────
    process.stdout.write('  🔌  Connecting to MySQL database...       ');
    await sequelize.authenticate();
    console.log('✅ Connected');

    const bootTime = Date.now() - startTime;

    // ── Step 3: Start HTTP Server ────────────────────────────────────────
    app.listen(PORT, () => {
      const now = new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'medium',
        timeStyle: 'medium',
      });

      console.log('\n╔═════════════════════════════════════════════════════╗');
      console.log('║          ✅  SERVER STARTED SUCCESSFULLY            ║');
      console.log('╠═════════════════════════════════════════════════════╣');
      console.log(`║  📡  API URL      : http://localhost:${PORT}           ║`);
      console.log(`║  🌱  Environment  : ${(process.env.NODE_ENV || 'development').padEnd(31)}║`);
      console.log(`║  🗄️  Database     : ${(process.env.DB_NAME || 'licence_system').padEnd(31)}║`);
      console.log(`║  🏠  DB Host      : ${(process.env.DB_HOST || 'localhost').padEnd(31)}║`);
      console.log(`║  🕐  Started At   : ${now.padEnd(31)}║`);
      console.log(`║  ⚡  Boot Time    : ${(bootTime + 'ms').padEnd(31)}║`);
      console.log('╠═════════════════════════════════════════════════════╣');
      console.log('║  📋  API Routes Available:                          ║');
      console.log(`║     GET   /health                   → Health Check  ║`);
      console.log(`║     POST  /api/auth/login           → User Login     ║`);
      console.log(`║     POST  /api/auth/refresh         → Refresh Token  ║`);
      console.log(`║     GET   /api/admin/users          → User Mgmt      ║`);
      console.log(`║     GET   /api/admin/licences       → Licences       ║`);
      console.log(`║     GET   /api/admin/customers      → Customers      ║`);
      console.log(`║     GET   /api/admin/products       → Products       ║`);
      console.log(`║     POST  /api/v1/licences/activate → Activate Key   ║`);
      console.log(`║     POST  /api/v1/licences/validate → Validate Key   ║`);
      console.log('╚═════════════════════════════════════════════════════╝\n');
    });
  } catch (error) {
    console.error('\n╔═════════════════════════════════════════════════════╗');
    console.error('║          ❌  SERVER STARTUP FAILED                  ║');
    console.error('╚═════════════════════════════════════════════════════╝');
    console.error('\n  Error:', error);
    process.exit(1);
  }
}


if (require.main === module) {
  startServer();
}

export default app;
