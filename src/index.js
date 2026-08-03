// Load environment variables FIRST — before anything else reads process.env
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const { sequelize, User, Institution, Inspection, Finding, ActionItem, AuditLog } = require('./db');
const { authenticateToken, requireRole } = require('./middleware/auth');
const seed = require('./seed');

// Controllers
const authController = require('./controllers/authController');
const institutionController = require('./controllers/institutionController');
const inspectionController = require('./controllers/inspectionController');
const aiController = require('./controllers/aiController');
const correctiveController = require('./controllers/correctiveController');

// ================= ENV VALIDATION =================
const isProduction = process.env.NODE_ENV === 'production';

if (!process.env.JWT_SECRET) {
  if (isProduction) {
    console.error('FATAL: JWT_SECRET environment variable is not set.');
    console.error('Generate one with: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
    process.exit(1);
  } else {
    console.warn('WARNING: JWT_SECRET is not set. Using a default dev-only secret. DO NOT use this in production!');
    process.env.JWT_SECRET = 'dev-only-insecure-secret-change-me';
  }
}

const app = express();
const PORT = process.env.PORT || 5000;

// ================= SECURITY MIDDLEWARE =================

// Security headers
app.use(helmet({
  contentSecurityPolicy: isProduction ? undefined : false // Disable CSP in dev for Vite HMR
}));

// CORS — restrict in production
const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(cors({
  origin: isProduction && corsOrigin !== '*' ? corsOrigin : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting — global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,                  // 200 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});
app.use(globalLimiter);

// Rate limiting — strict on auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,                   // 20 auth attempts per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts, please try again later.' }
});

// Body parsing
app.use(express.json({ limit: '1mb' }));

// ================= FILE UPLOADS =================

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// Multer Storage Configuration
const maxFileSize = parseInt(process.env.MAX_FILE_SIZE, 10) || 10 * 1024 * 1024; // 10MB default
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({
  storage,
  limits: {
    fileSize: maxFileSize
  },
  fileFilter: (req, file, cb) => {
    // Allow common document and image types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx/;
    const extOk = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeOk = allowedTypes.test(file.mimetype);
    if (extOk || mimeOk) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'), false);
    }
  }
});

// ================= DATABASE INIT =================
sequelize.sync().then(async () => {
  console.log('Database synced successfully.');
  // Seed database if no users exist (skip in production)
  if (!isProduction) {
    const count = await User.count();
    if (count === 0) {
      console.log('No users found. Seeding initial data...');
      await seed();
    }
  }
}).catch(err => {
  console.error('Database sync failed:', err);
});

// ================= HEALTH CHECK =================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ================= AUTH ROUTES =================
app.post('/api/auth/register', authLimiter, authController.registerValidation, authController.register);
app.post('/api/auth/login', authLimiter, authController.loginValidation, authController.login);
app.get('/api/auth/me', authenticateToken, authController.getMe);

// ================= INSTITUTION ROUTES =================
app.get('/api/institutions', authenticateToken, institutionController.getAllInstitutions);
app.get('/api/institutions/:id', authenticateToken, institutionController.getInstitutionById);
app.post('/api/institutions', authenticateToken, requireRole(['super_admin', 'inspection_authority']), institutionController.createInstitution);
app.put('/api/institutions/:id', authenticateToken, institutionController.updateInstitution);

// ================= INSPECTION ROUTES =================
app.get('/api/inspections', authenticateToken, inspectionController.getAllInspections);
app.get('/api/inspections/:id', authenticateToken, inspectionController.getInspectionById);
app.post('/api/inspections', authenticateToken, requireRole(['super_admin', 'inspection_authority']), inspectionController.createInspection);
app.post('/api/inspections/:id/assign', authenticateToken, requireRole(['super_admin', 'inspection_authority']), inspectionController.assignInspector);
app.put('/api/inspections/:id/progress', authenticateToken, inspectionController.updateChecklistProgress);
app.post('/api/inspections/:id/submit', authenticateToken, inspectionController.submitInspection);

// ================= AI FEATURES =================
app.post('/api/ai/analyze-image', authenticateToken, aiController.analyzeImageEvidence);
app.post('/api/ai/verify-doc', authenticateToken, aiController.verifyAccreditationDocument);
app.post('/api/ai/chat', authenticateToken, aiController.chatAssistant);

// ================= CORRECTIVE ACTIONS =================
app.get('/api/corrective-actions', authenticateToken, correctiveController.getActionItems);
app.put('/api/corrective-actions/:id/status', authenticateToken, correctiveController.updateActionStatus);
app.post('/api/corrective-actions/:id/evidence', authenticateToken, upload.single('evidence'), correctiveController.submitEvidence);

// ================= ANALYTICS & STATS =================
app.get('/api/analytics/dashboard', authenticateToken, async (req, res) => {
  try {
    const instCount = await Institution.count();
    const completedCount = await Inspection.count({ where: { status: 'completed' } });
    const pendingCount = await Inspection.count({ where: { status: 'scheduled' } });
    const inProgressCount = await Inspection.count({ where: { status: 'in_progress' } });
    
    // Risk Criteria: complianceScore < 80
    const riskCount = await Institution.count({
      where: {
        complianceScore: {
          [sequelize.Sequelize.Op.lt]: 80
        }
      }
    });

    const activeAudits = await AuditLog.findAll({
      limit: 10,
      order: [['timestamp', 'DESC']]
    });

    const institutions = await Institution.findAll({ attributes: ['id', 'name', 'complianceScore', 'region'] });

    res.json({
      summary: {
        totalInstitutions: instCount,
        completedInspections: completedCount,
        pendingInspections: pendingCount + inProgressCount,
        institutionsAtRisk: riskCount
      },
      auditLogs: activeAudits,
      institutions: institutions.map(i => ({
        id: i.id,
        name: i.name,
        complianceScore: i.complianceScore,
        region: i.region
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ================= SERVE FRONTEND =================
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// ================= GLOBAL ERROR HANDLER =================
app.use((err, req, res, next) => {
  // Handle multer file size errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: `File too large. Maximum size is ${maxFileSize / (1024 * 1024)}MB.` });
  }
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: isProduction ? 'Internal server error' : err.message });
});

// ================= START SERVER =================
const HOST = process.env.HOST || '0.0.0.0';
const server = app.listen(PORT, HOST, () => {
  console.log(`InspectAI Backend service operational on ${HOST}:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// ================= GRACEFUL SHUTDOWN =================
const shutdown = (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    try {
      await sequelize.close();
      console.log('Database connection closed.');
    } catch (err) {
      console.error('Error closing database:', err);
    }
    process.exit(0);
  });

  // Force exit after 10 seconds if connections won't close
  setTimeout(() => {
    console.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
