import express, { type Request, type Response, type NextFunction } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { ImageKitMediaAdapter } from './server/adapters/media';
import { RazorpayPaymentsAdapter } from './server/adapters/payments';
import { FirebaseClaimsAdapter, ALLOWED_STAFF_ROLES } from './server/adapters/claims';
import { ServerGspAdapter } from './server/adapters/gsp';

dotenv.config();

interface AuthenticatedRequest extends Request {
  authUser?: { uid: string; email?: string; role?: string };
  rawBody?: Buffer;
}

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(
  express.json({
    limit: '12mb',
    verify: (req, _res, buf) => {
      (req as AuthenticatedRequest).rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: '12mb' }));

// Origin-aware CORS (no wildcard origin on authenticated API endpoints)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  if (origin && host) {
    try {
      const originHost = new URL(origin).host;
      if (originHost === host || originHost.startsWith('localhost:')) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Vary', 'Origin');
      }
    } catch {
      // Ignore malformed Origin header
    }
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// SEO Isolation: Emit X-Robots-Tag: noindex, nofollow on all ERP & workspace setup routes (PRD Section 2.2)
app.use((req, res, next) => {
  if (req.path.startsWith('/erp') || req.path.startsWith('/create-workspace')) {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
  }
  next();
});

// Adapter instances
const mediaAdapter = new ImageKitMediaAdapter();
const paymentsAdapter = new RazorpayPaymentsAdapter();
const claimsAdapter = new FirebaseClaimsAdapter();
const gspAdapter = new ServerGspAdapter();

async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Bearer token required' });
  }
  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Empty authentication token' });
  }

  if (!claimsAdapter.isReady()) {
    return res.status(503).json({
      error: 'Authentication verification service is not configured on the server.',
      code: 'FIREBASE_ADMIN_NOT_CONFIGURED',
    });
  }

  const caller = await claimsAdapter.verifyIdToken(token);
  if (!caller) {
    return res.status(401).json({ error: 'Invalid or expired authentication token' });
  }

  req.authUser = caller;
  next();
}

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', product: 'DecorBiz', version: '2.0.0' });
});

// Media Service Status (non-sensitive configuration check)
app.get('/api/media/status', (_req, res) => {
  res.json(mediaAdapter.getStatus());
});

// Media Upload Signature (used by src/services/mediaService.ts)
app.post('/api/media/upload-signature', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!mediaAdapter.isConfigured()) {
      return res.status(503).json({
        code: 'IMAGEKIT_NOT_CONFIGURED',
        error: 'ImageKit server credentials are not configured.',
      });
    }
    const { organizationId, category, originalFilename, fileSize } = req.body || {};
    if (!organizationId || typeof organizationId !== 'string') {
      return res.status(400).json({ error: 'organizationId is required' });
    }
    if (fileSize !== undefined && (typeof fileSize !== 'number' || fileSize <= 0 || fileSize > 15 * 1024 * 1024)) {
      return res.status(400).json({ error: 'File size exceeds maximum allowed limit (15MB).' });
    }

    const authData = await mediaAdapter.getScopedUploadSignature({
      organizationId,
      category: typeof category === 'string' ? category : 'general-document',
      originalFilename: typeof originalFilename === 'string' ? originalFilename : `upload_${Date.now()}`,
    });
    res.json(authData);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'ImageKit signature generation failed' });
  }
});

// Media Server-Side Proxy Upload Backup (used by src/services/mediaService.ts)
app.post('/api/media/upload-proxy', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!mediaAdapter.isConfigured()) {
      return res.status(503).json({
        code: 'IMAGEKIT_NOT_CONFIGURED',
        error: 'ImageKit server credentials are not configured.',
      });
    }
    const { organizationId, category, fileBase64, originalFilename } = req.body || {};
    if (!organizationId || typeof organizationId !== 'string') {
      return res.status(400).json({ error: 'organizationId is required' });
    }
    if (!fileBase64 || typeof fileBase64 !== 'string') {
      return res.status(400).json({ error: 'fileBase64 is required' });
    }

    const uploaded = await mediaAdapter.uploadBase64File({
      organizationId,
      category: typeof category === 'string' ? category : 'general-document',
      fileBase64,
      originalFilename: typeof originalFilename === 'string' ? originalFilename : `upload_${Date.now()}`,
    });
    res.json(uploaded);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server proxy upload failed' });
  }
});

// Media Delete (used by src/services/mediaService.ts)
app.post('/api/media/delete', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    if (!mediaAdapter.isConfigured()) {
      return res.status(503).json({
        code: 'IMAGEKIT_NOT_CONFIGURED',
        error: 'ImageKit server credentials are not configured.',
      });
    }
    const { fileId, publicId } = req.body || {};
    const targetId = typeof fileId === 'string' ? fileId : typeof publicId === 'string' ? publicId : '';
    if (!targetId) {
      return res.status(400).json({ error: 'fileId is required' });
    }
    await mediaAdapter.deleteFile(targetId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Media deletion failed' });
  }
});

// ImageKit Authentication Parameters (authenticated)
app.get('/api/imagekit/auth', requireAuth, async (_req, res) => {
  try {
    if (!mediaAdapter.isConfigured()) {
      return res.status(503).json({
        code: 'IMAGEKIT_NOT_CONFIGURED',
        error: 'ImageKit server credentials are not configured.',
      });
    }
    const authData = await mediaAdapter.getUploadAuth();
    res.json(authData);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'ImageKit auth failed' });
  }
});

// ImageKit Signed Private URL (authenticated)
app.post('/api/imagekit/sign-url', requireAuth, async (req, res) => {
  try {
    const { filePath, expireSeconds } = req.body || {};
    if (!filePath || typeof filePath !== 'string') {
      return res.status(400).json({ error: 'filePath is required' });
    }
    const signedUrl = await mediaAdapter.generateSignedUrl(filePath, expireSeconds || 900);
    res.json({ signedUrl });
  } catch (err: any) {
    const statusCode = err?.message?.startsWith('Invalid filePath') ? 400 : 500;
    res.status(statusCode).json({ error: err.message || 'URL signing failed' });
  }
});

// Set Staff Custom Claim (strictly restricted to verified Owner/Admin)
app.post('/api/staff/set-claim', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const caller = req.authUser!;
    const { targetUid, role, organizationId } = req.body || {};

    if (!targetUid || typeof targetUid !== 'string' || !role || typeof role !== 'string') {
      return res.status(400).json({ error: 'targetUid and role are required' });
    }
    if (!ALLOWED_STAFF_ROLES.has(role)) {
      return res.status(400).json({ error: 'Invalid staff role specified' });
    }

    const isAuthorized = await claimsAdapter.isCallerOrgAdminOrOwner(caller, organizationId);
    if (!isAuthorized) {
      return res.status(403).json({ error: 'Forbidden: Only verified Owners or Admins can assign staff roles.' });
    }
    if (caller.role === 'admin' && (role === 'owner' || role === 'admin')) {
      return res.status(403).json({ error: 'Forbidden: Admins cannot grant Owner or Admin privileges.' });
    }

    await claimsAdapter.setStaffRole(targetUid, role);
    res.json({ success: true, message: `Role ${role} assigned to user ${targetUid}` });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to set user claim' });
  }
});

// Razorpay Order Creation (authenticated + validated)
app.post('/api/payments/create-order', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { amount, currency, receiptId } = req.body || {};
    const order = await paymentsAdapter.createOrder(amount, currency || 'INR', receiptId);
    res.json(order);
  } catch (err: any) {
    const statusCode = err?.message?.startsWith('Invalid') || err?.message?.startsWith('Unsupported') ? 400 : 500;
    res.status(statusCode).json({ error: err.message || 'Payment order creation failed' });
  }
});

// Razorpay Webhook Verification (uses exact raw request body & timing-safe HMAC)
app.post('/api/payments/webhook', async (req: AuthenticatedRequest, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    if (!signature || typeof signature !== 'string') {
      return res.status(400).json({ error: 'Missing webhook signature header' });
    }
    const payloadToVerify = req.rawBody ?? req.body;
    const isValid = await paymentsAdapter.verifyWebhook(signature, payloadToVerify);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }
    res.json({ status: 'ok' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Webhook processing failed' });
  }
});

// =========================================================================
// Server-Side GSP / IRP & E-Way Bill Endpoints (PRD Version 5)
// =========================================================================
app.get('/api/gsp/status', requireAuth, (_req, res) => {
  res.json(gspAdapter.getStatus());
});

app.post('/api/gsp/test', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { gstin } = req.body || {};
    const result = await gspAdapter.testConnection(typeof gstin === 'string' ? gstin : undefined);
    res.status(result.configured ? 200 : 503).json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'GSP gateway connectivity test failed' });
  }
});

app.post('/api/gsp/irn', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const caller = req.authUser!;
    const { organizationId, ...payload } = req.body || {};
    const isAuthorized = await claimsAdapter.isCallerOrgAdminOrOwner(caller, organizationId);
    if (!isAuthorized && caller.role !== 'accountant' && caller.role !== 'manager') {
      return res.status(403).json({ error: 'Forbidden: Only Owners, Admins, Managers, or Accountants can generate IRNs.' });
    }
    if (!gspAdapter.isConfigured()) {
      return res.status(503).json({
        code: 'GSP_NOT_CONFIGURED',
        error: `GSP server gateway is not configured. Missing: ${gspAdapter.getStatus().missingFields.join(', ')}.`,
      });
    }
    const result = await gspAdapter.generateIrn(payload);
    res.json(result);
  } catch (err: any) {
    const isValidation = err?.message?.startsWith('Invalid') || err?.message?.includes('required');
    res.status(isValidation ? 400 : 502).json({ error: err.message || 'IRN generation failed' });
  }
});

app.post('/api/gsp/irn/cancel', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const caller = req.authUser!;
    const { organizationId, supplierGstin, ...payload } = req.body || {};
    const isAuthorized = await claimsAdapter.isCallerOrgAdminOrOwner(caller, organizationId);
    if (!isAuthorized && caller.role !== 'accountant' && caller.role !== 'manager') {
      return res.status(403).json({ error: 'Forbidden: Only Owners, Admins, Managers, or Accountants can cancel IRNs.' });
    }
    if (!gspAdapter.isConfigured()) {
      return res.status(503).json({
        code: 'GSP_NOT_CONFIGURED',
        error: `GSP server gateway is not configured. Missing: ${gspAdapter.getStatus().missingFields.join(', ')}.`,
      });
    }
    await gspAdapter.cancelIrn(payload, typeof supplierGstin === 'string' ? supplierGstin : undefined);
    res.json({ success: true });
  } catch (err: any) {
    const isValidation = err?.message?.startsWith('Invalid') || err?.message?.includes('required');
    res.status(isValidation ? 400 : 502).json({ error: err.message || 'IRN cancellation failed' });
  }
});

app.post('/api/gsp/ewaybill', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const caller = req.authUser!;
    const { organizationId, supplierGstin, ...payload } = req.body || {};
    const isAuthorized = await claimsAdapter.isCallerOrgAdminOrOwner(caller, organizationId);
    const allowedEwayRoles = new Set(['owner', 'admin', 'manager', 'accountant', 'billing_staff', 'sales_staff', 'warehouse_staff']);
    if (!isAuthorized && !allowedEwayRoles.has(caller.role || '')) {
      return res.status(403).json({ error: 'Forbidden: Authorized showroom staff required to generate E-Way Bills.' });
    }
    if (!gspAdapter.isConfigured()) {
      return res.status(503).json({
        code: 'GSP_NOT_CONFIGURED',
        error: `GSP server gateway is not configured. Missing: ${gspAdapter.getStatus().missingFields.join(', ')}.`,
      });
    }
    const result = await gspAdapter.generateEWayBill(payload, typeof supplierGstin === 'string' ? supplierGstin : undefined);
    res.json(result);
  } catch (err: any) {
    const isValidation = err?.message?.startsWith('Invalid') || err?.message?.includes('required') || err?.message?.includes('distance');
    res.status(isValidation ? 400 : 502).json({ error: err.message || 'E-Way Bill generation failed' });
  }
});

// Unmatched /api/* routes return JSON 404 instead of SPA HTML
app.all('/api/*', (_req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// In development, hook Vite middleware; in production, serve built dist files
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[DecorBiz] Server running on http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
