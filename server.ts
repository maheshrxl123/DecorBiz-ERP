import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { ImageKitMediaAdapter } from './server/adapters/media';
import { RazorpayPaymentsAdapter } from './server/adapters/payments';
import { FirebaseClaimsAdapter } from './server/adapters/claims';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Adapter instances
const mediaAdapter = new ImageKitMediaAdapter();
const paymentsAdapter = new RazorpayPaymentsAdapter();
const claimsAdapter = new FirebaseClaimsAdapter();

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', product: 'DecorBiz', version: '2.0.0' });
});

// ImageKit Authentication Parameters
app.get('/api/imagekit/auth', async (req, res) => {
  try {
    const authData = await mediaAdapter.getUploadAuth();
    res.json(authData);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'ImageKit auth failed' });
  }
});

// ImageKit Signed Private URL
app.post('/api/imagekit/sign-url', async (req, res) => {
  try {
    const { filePath, expireSeconds } = req.body;
    if (!filePath) {
      return res.status(400).json({ error: 'filePath is required' });
    }
    const signedUrl = await mediaAdapter.generateSignedUrl(filePath, expireSeconds || 900);
    res.json({ signedUrl });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'URL signing failed' });
  }
});

// Set Staff Custom Claim (Admin / Owner privilege)
app.post('/api/staff/set-claim', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Bearer token required' });
    }
    const token = authHeader.split('Bearer ')[1];
    const caller = await claimsAdapter.verifyIdToken(token);

    if (!caller) {
      return res.status(401).json({ error: 'Invalid authentication token' });
    }

    const { targetUid, role } = req.body;
    if (!targetUid || !role) {
      return res.status(400).json({ error: 'targetUid and role are required' });
    }

    await claimsAdapter.setStaffRole(targetUid, role);
    res.json({ success: true, message: `Role ${role} assigned to user ${targetUid}` });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to set user claim' });
  }
});

// Razorpay Order Creation
app.post('/api/payments/create-order', async (req, res) => {
  try {
    const { amount, currency, receiptId } = req.body;
    const order = await paymentsAdapter.createOrder(amount, currency || 'INR', receiptId);
    res.json(order);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Payment order creation failed' });
  }
});

// Razorpay Webhook Verification
app.post('/api/payments/webhook', async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    const isValid = await paymentsAdapter.verifyWebhook(signature, req.body);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }
    // Webhook event received securely
    res.json({ status: 'ok' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Webhook processing failed' });
  }
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
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`[DecorBiz] Server running on http://localhost:${PORT}`);
  });
}

startServer();

export default app;
