/**
 * DecorBiz Server Adapter Interfaces
 * PRD Section 3.1 & Implementation Plan Phase 0
 */

export interface MediaUploadAuthResponse {
  token: string;
  expire: number;
  signature: string;
  publicKey: string;
  urlEndpoint: string;
}

export interface MediaAdapter {
  getUploadAuth(): Promise<MediaUploadAuthResponse>;
  generateSignedUrl(filePath: string, expireSeconds?: number): Promise<string>;
}

export interface PaymentsAdapter {
  createOrder(amount: number, currency: string, receiptId: string): Promise<{ orderId: string; amount: number }>;
  verifyWebhook(signature: string, payload: any): Promise<boolean>;
}

export interface MessagingAdapter {
  sendEmail(to: string, subject: string, htmlContent: string): Promise<boolean>;
  sendSMS(to: string, text: string): Promise<boolean>;
}

export interface ClaimsAdapter {
  setStaffRole(uid: string, role: string): Promise<void>;
  verifyIdToken(idToken: string): Promise<{ uid: string; email?: string; role?: string } | null>;
}

export interface AIAdapter {
  processPrompt(prompt: string, contextData: any): Promise<{ proposal: any; explanation: string }>;
}
