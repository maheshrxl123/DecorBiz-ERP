import crypto from 'crypto';
import { PaymentsAdapter } from '../interfaces';

export class RazorpayPaymentsAdapter implements PaymentsAdapter {
  private keyId: string;
  private keySecret: string;

  constructor() {
    this.keyId = process.env.RAZORPAY_KEY_ID || '';
    this.keySecret = process.env.RAZORPAY_KEY_SECRET || '';
  }

  async createOrder(amount: number, currency: string = 'INR', receiptId: string): Promise<{ orderId: string; amount: number }> {
    if (!this.keyId || !this.keySecret) {
      // Return simulated order id for development / unconfigured state
      return {
        orderId: `order_mock_${Date.now()}`,
        amount,
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
        amount: Math.round(amount * 100), // In paise
        currency,
        receipt: receiptId,
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

  async verifyWebhook(signature: string, payload: any): Promise<boolean> {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || this.keySecret;
    if (!webhookSecret) return false;

    const bodyString = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(bodyString)
      .digest('hex');

    return expectedSignature === signature;
  }
}
