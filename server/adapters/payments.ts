import crypto from 'crypto';
import { PaymentsAdapter } from '../interfaces';

const ALLOWED_CURRENCIES = new Set(['INR']);

export class RazorpayPaymentsAdapter implements PaymentsAdapter {
  private keyId: string;
  private keySecret: string;

  constructor() {
    this.keyId = process.env.RAZORPAY_KEY_ID || '';
    this.keySecret = process.env.RAZORPAY_KEY_SECRET || '';
  }

  async createOrder(
    amount: number,
    currency: string = 'INR',
    receiptId: string
  ): Promise<{ orderId: string; amount: number }> {
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0 || numericAmount > 100_000_000) {
      throw new Error('Invalid payment amount: must be a positive number.');
    }
    const normalizedCurrency = String(currency || 'INR').toUpperCase();
    if (!ALLOWED_CURRENCIES.has(normalizedCurrency)) {
      throw new Error(`Unsupported currency: ${normalizedCurrency}`);
    }
    const safeReceipt = String(receiptId || `rcpt_${Date.now()}`).trim().slice(0, 40);

    if (!this.keyId || !this.keySecret) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Payment gateway credentials are not configured on the server.');
      }
      return {
        orderId: `order_dev_${Date.now()}`,
        amount: numericAmount,
      };
    }

    const auth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');
    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        amount: Math.round(numericAmount * 100), // In paise
        currency: normalizedCurrency,
        receipt: safeReceipt,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Razorpay order creation failed: ${err}`);
    }

    const data = await res.json();
    return {
      orderId: data.id,
      amount: data.amount / 100,
    };
  }

  async verifyWebhook(signature: string, payload: string | Buffer | Record<string, unknown>): Promise<boolean> {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || this.keySecret;
    if (!webhookSecret || !signature || typeof signature !== 'string') {
      return false;
    }

    const bodyBuffer = Buffer.isBuffer(payload)
      ? payload
      : Buffer.from(typeof payload === 'string' ? payload : JSON.stringify(payload), 'utf8');

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(bodyBuffer)
      .digest('hex');

    const sigBuf = Buffer.from(signature, 'utf8');
    const expectedBuf = Buffer.from(expectedSignature, 'utf8');
    if (sigBuf.length !== expectedBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(sigBuf, expectedBuf);
  }
}
