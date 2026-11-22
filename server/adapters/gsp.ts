/**
 * Server-Side GSP / IRP & E-Way Bill Gateway Adapter (PRD Version 5)
 * Keeps all GSP/IRP API credentials exclusively on the server via process.env.
 * Never fabricates fake 64-char IRN hashes or simulated handshakes.
 */

export interface GspStatusResponse {
  configured: boolean;
  provider: string;
  environment: 'SANDBOX' | 'PRODUCTION';
  missingFields: string[];
}

export interface GspTestResponse {
  success: boolean;
  configured: boolean;
  provider: string;
  environment: 'SANDBOX' | 'PRODUCTION';
  latencyMs: number;
  message: string;
}

export interface GspIrnRequest {
  invoiceNumber: string;
  invoiceDate: string;
  supplierGstin: string;
  customerGstin: string;
  customerName: string;
  taxableAmount: number;
  totalTax: number;
  grandTotal: number;
}

export interface GspIrnResponse {
  irn: string;
  acknowledgementNumber: string;
  acknowledgementDate: string;
  signedQRCode: string;
  provider: string;
}

export interface GspCancelIrnRequest {
  irn: string;
  cancelReason: '1' | '2' | '3' | '4';
  cancelRemarks: string;
}

export interface GspEWayBillRequest {
  irn?: string;
  invoiceNumber: string;
  invoiceDate: string;
  vehicleNumber: string;
  vehicleType: 'REGULAR' | 'ODC';
  transporterId?: string;
  transporterName?: string;
  distanceKm: number;
  supplyType: string;
  fromPincode: string;
  toPincode: string;
}

export interface GspEWayBillResponse {
  ewayBillNumber: string;
  ewayBillDate: string;
  validUpto: string;
  provider: string;
}

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const PINCODE_REGEX = /^[1-9][0-9]{5}$/;

function isPrivateOrLocalHostname(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (
    lower === 'localhost' ||
    lower === '::1' ||
    lower.endsWith('.local') ||
    lower.endsWith('.internal') ||
    lower === '169.254.169.254' ||
    lower === 'metadata.google.internal'
  ) {
    return true;
  }
  if (/^127\./.test(lower) || /^10\./.test(lower) || /^192\.168\./.test(lower)) {
    return true;
  }
  const match172 = lower.match(/^172\.(\d+)\./);
  if (match172) {
    const secondOctet = Number(match172[1]);
    if (secondOctet >= 16 && secondOctet <= 31) return true;
  }
  return false;
}

function validateBaseUrl(rawUrl: string): string {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error('Server GSP_API_BASE_URL is not a valid URL.');
  }
  if (parsed.protocol !== 'https:') {
    throw new Error('Server GSP_API_BASE_URL must use HTTPS.');
  }
  if (isPrivateOrLocalHostname(parsed.hostname)) {
    throw new Error('Server GSP_API_BASE_URL cannot point to loopback or private network addresses.');
  }
  return parsed.origin + parsed.pathname.replace(/\/+$/, '');
}

export class ServerGspAdapter {
  private get provider(): string {
    return (process.env.GSP_PROVIDER || 'NIC').trim();
  }

  private get environment(): 'SANDBOX' | 'PRODUCTION' {
    return process.env.GSP_ENVIRONMENT === 'PRODUCTION' ? 'PRODUCTION' : 'SANDBOX';
  }

  private get baseUrl(): string {
    return (process.env.GSP_API_BASE_URL || '').trim();
  }

  private get apiKey(): string {
    return (process.env.GSP_API_KEY || '').trim();
  }

  private get clientId(): string {
    return (process.env.GSP_CLIENT_ID || '').trim();
  }

  private get clientSecret(): string {
    return (process.env.GSP_CLIENT_SECRET || '').trim();
  }

  getStatus(): GspStatusResponse {
    const missingFields: string[] = [];
    if (!this.baseUrl) missingFields.push('GSP_API_BASE_URL');
    if (!this.apiKey && (!this.clientId || !this.clientSecret)) {
      missingFields.push('GSP_API_KEY (or GSP_CLIENT_ID + GSP_CLIENT_SECRET)');
    }
    return {
      configured: missingFields.length === 0,
      provider: this.provider,
      environment: this.environment,
      missingFields,
    };
  }

  isConfigured(): boolean {
    return this.getStatus().configured;
  }

  private buildHeaders(supplierGstin?: string): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
      headers['x-api-key'] = this.apiKey;
    }
    if (this.clientId) headers['client_id'] = this.clientId;
    if (this.clientSecret) headers['client_secret'] = this.clientSecret;
    if (supplierGstin) headers['gstin'] = supplierGstin;
    return headers;
  }

  private requireConfiguredBaseUrl(): string {
    const status = this.getStatus();
    if (!status.configured) {
      throw new Error(
        `GSP gateway is not configured on the server. Missing environment variables: ${status.missingFields.join(', ')}.`
      );
    }
    return validateBaseUrl(this.baseUrl);
  }

  async testConnection(gstin?: string): Promise<GspTestResponse> {
    const start = Date.now();
    const status = this.getStatus();
    if (!status.configured) {
      return {
        success: false,
        configured: false,
        provider: status.provider,
        environment: status.environment,
        latencyMs: Date.now() - start,
        message: `GSP server gateway not configured. Set ${status.missingFields.join(', ')} in server environment variables.`,
      };
    }

    if (gstin && !GSTIN_REGEX.test(gstin.trim().toUpperCase())) {
      return {
        success: false,
        configured: true,
        provider: status.provider,
        environment: status.environment,
        latencyMs: Date.now() - start,
        message: 'Invalid GSTIN format. Must be a valid 15-character Indian GSTIN.',
      };
    }

    const base = this.requireConfiguredBaseUrl();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(`${base}/health`, {
        method: 'GET',
        headers: this.buildHeaders(gstin),
        signal: controller.signal,
      });
      const latencyMs = Date.now() - start;
      if (!response.ok) {
        return {
          success: false,
          configured: true,
          provider: status.provider,
          environment: status.environment,
          latencyMs,
          message: `${status.provider} (${status.environment}) returned HTTP ${response.status}. Verify GSP credentials and endpoint.`,
        };
      }
      return {
        success: true,
        configured: true,
        provider: status.provider,
        environment: status.environment,
        latencyMs,
        message: `Connected to ${status.provider} (${status.environment}) GSP gateway.`,
      };
    } catch (err: any) {
      return {
        success: false,
        configured: true,
        provider: status.provider,
        environment: status.environment,
        latencyMs: Date.now() - start,
        message: err?.name === 'AbortError'
          ? `Connection to ${status.provider} GSP timed out.`
          : err?.message || `Failed to reach ${status.provider} GSP gateway.`,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  async generateIrn(payload: GspIrnRequest): Promise<GspIrnResponse> {
    const supplierGstin = (payload.supplierGstin || '').trim().toUpperCase();
    const customerGstin = (payload.customerGstin || '').trim().toUpperCase();

    if (!GSTIN_REGEX.test(supplierGstin)) {
      throw new Error('Invalid 15-character Supplier GSTIN.');
    }
    if (customerGstin && !GSTIN_REGEX.test(customerGstin)) {
      throw new Error('Invalid 15-character Buyer GSTIN.');
    }
    if (!payload.invoiceNumber?.trim()) {
      throw new Error('Invoice number is required for IRN generation.');
    }
    if (!Number.isFinite(payload.grandTotal) || payload.grandTotal <= 0) {
      throw new Error('Invoice grand total must be a positive number.');
    }

    const base = this.requireConfiguredBaseUrl();
    const response = await fetch(`${base}/einvoice/irn`, {
      method: 'POST',
      headers: this.buildHeaders(supplierGstin),
      body: JSON.stringify({
        ...payload,
        supplierGstin,
        customerGstin,
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data?.error || data?.message || `GSP IRN generation failed (HTTP ${response.status}).`);
    }
    if (!data?.irn || !data?.acknowledgementNumber) {
      throw new Error('GSP gateway returned an incomplete IRN response.');
    }

    return {
      irn: String(data.irn),
      acknowledgementNumber: String(data.acknowledgementNumber),
      acknowledgementDate: String(data.acknowledgementDate || new Date().toISOString()),
      signedQRCode: String(data.signedQRCode || ''),
      provider: this.provider,
    };
  }

  async cancelIrn(payload: GspCancelIrnRequest, supplierGstin?: string): Promise<void> {
    if (!payload.irn?.trim()) {
      throw new Error('IRN hash is required for cancellation.');
    }
    if (!['1', '2', '3', '4'].includes(payload.cancelReason)) {
      throw new Error('Invalid statutory cancellation reason code.');
    }
    if (!payload.cancelRemarks?.trim()) {
      throw new Error('Cancellation remarks are required.');
    }

    const base = this.requireConfiguredBaseUrl();
    const response = await fetch(`${base}/einvoice/cancel`, {
      method: 'POST',
      headers: this.buildHeaders(supplierGstin),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data?.error || data?.message || `GSP IRN cancellation failed (HTTP ${response.status}).`);
    }
  }

  async generateEWayBill(payload: GspEWayBillRequest, supplierGstin?: string): Promise<GspEWayBillResponse> {
    if (!payload.invoiceNumber?.trim()) {
      throw new Error('Invoice number is required for E-Way Bill generation.');
    }
    if (!payload.vehicleNumber?.trim()) {
      throw new Error('Vehicle registration number is required.');
    }
    if (!PINCODE_REGEX.test((payload.fromPincode || '').trim()) || !PINCODE_REGEX.test((payload.toPincode || '').trim())) {
      throw new Error('Valid 6-digit Indian origin and destination pincodes are required.');
    }
    if (!Number.isFinite(payload.distanceKm) || payload.distanceKm <= 0 || payload.distanceKm > 4000) {
      throw new Error('Transit distance must be between 1 and 4000 km.');
    }

    const base = this.requireConfiguredBaseUrl();
    const response = await fetch(`${base}/ewaybill/generate`, {
      method: 'POST',
      headers: this.buildHeaders(supplierGstin),
      body: JSON.stringify({
        ...payload,
        vehicleNumber: payload.vehicleNumber.toUpperCase().replace(/\s+/g, ''),
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data?.error || data?.message || `GSP E-Way Bill generation failed (HTTP ${response.status}).`);
    }
    if (!data?.ewayBillNumber) {
      throw new Error('GSP gateway returned an incomplete E-Way Bill response.');
    }

    return {
      ewayBillNumber: String(data.ewayBillNumber),
      ewayBillDate: String(data.ewayBillDate || new Date().toISOString()),
      validUpto: String(data.validUpto || ''),
      provider: this.provider,
    };
  }
}
