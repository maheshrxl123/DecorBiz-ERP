import ImageKit from 'imagekit';
import { MediaAdapter, MediaUploadAuthResponse } from '../interfaces';

function sanitizePathSegment(value: string, fallback: string): string {
  const cleaned = String(value || '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.{2,}/g, '_')
    .replace(/^[_.-]+/, '')
    .slice(0, 80);
  return cleaned || fallback;
}

export class ImageKitMediaAdapter implements MediaAdapter {
  private imagekit: ImageKit | null = null;
  private publicKey = '';
  private urlEndpoint = '';

  constructor() {
    const publicKey = process.env.VITE_IMAGEKIT_PUBLIC_KEY || process.env.IMAGEKIT_PUBLIC_KEY || '';
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY || '';
    const urlEndpoint = process.env.VITE_IMAGEKIT_URL_ENDPOINT || process.env.IMAGEKIT_URL_ENDPOINT || '';

    this.publicKey = publicKey;
    this.urlEndpoint = urlEndpoint;

    if (publicKey && privateKey && urlEndpoint) {
      this.imagekit = new ImageKit({
        publicKey,
        privateKey,
        urlEndpoint,
      });
    }
  }

  isConfigured(): boolean {
    return this.imagekit !== null;
  }

  getStatus(): { connected: boolean; provider: string; urlEndpoint: string } {
    return {
      connected: this.isConfigured(),
      provider: 'ImageKit CDN',
      urlEndpoint: this.isConfigured() ? this.urlEndpoint : '',
    };
  }

  async getUploadAuth(): Promise<MediaUploadAuthResponse> {
    if (!this.imagekit) {
      throw new Error('ImageKit credentials are not configured on the server adapter');
    }
    const authParams = this.imagekit.getAuthenticationParameters();
    return {
      token: authParams.token,
      expire: authParams.expire,
      signature: authParams.signature,
      publicKey: this.publicKey,
      urlEndpoint: this.urlEndpoint,
    };
  }

  async getScopedUploadSignature(params: {
    organizationId: string;
    category: string;
    originalFilename: string;
  }): Promise<MediaUploadAuthResponse & { folder: string; fileName: string; uploadUrl: string }> {
    const base = await this.getUploadAuth();
    const safeOrg = sanitizePathSegment(params.organizationId, 'org');
    const safeCategory = sanitizePathSegment(params.category, 'general');
    const safeFileName = sanitizePathSegment(params.originalFilename, `upload_${Date.now()}`);

    return {
      ...base,
      folder: `/decorbiz/${safeOrg}/${safeCategory}`,
      fileName: safeFileName,
      uploadUrl: 'https://upload.imagekit.io/api/v1/files/upload',
    };
  }

  async uploadBase64File(params: {
    organizationId: string;
    category: string;
    fileBase64: string;
    originalFilename: string;
  }) {
    if (!this.imagekit) {
      throw new Error('ImageKit credentials are not configured on the server adapter');
    }
    const safeOrg = sanitizePathSegment(params.organizationId, 'org');
    const safeCategory = sanitizePathSegment(params.category, 'general');
    const safeFileName = sanitizePathSegment(params.originalFilename, `upload_${Date.now()}`);

    return this.imagekit.upload({
      file: params.fileBase64,
      fileName: safeFileName,
      folder: `/decorbiz/${safeOrg}/${safeCategory}`,
      useUniqueFileName: true,
    });
  }

  async deleteFile(fileId: string): Promise<void> {
    if (!this.imagekit) {
      throw new Error('ImageKit credentials are not configured on the server adapter');
    }
    if (!fileId || typeof fileId !== 'string' || fileId.includes('..') || fileId.includes('/')) {
      throw new Error('Invalid ImageKit fileId');
    }
    await this.imagekit.deleteFile(fileId);
  }

  async generateSignedUrl(filePath: string, expireSeconds: number = 900): Promise<string> {
    if (!this.imagekit) {
      throw new Error('ImageKit credentials are not configured on the server adapter');
    }
    if (
      !filePath ||
      typeof filePath !== 'string' ||
      filePath.includes('..') ||
      filePath.includes('://') ||
      !filePath.startsWith('/')
    ) {
      throw new Error('Invalid filePath: must be a normalized relative path starting with /');
    }
    const safeExpire = Math.min(3600, Math.max(60, Math.floor(Number(expireSeconds) || 900)));
    return this.imagekit.url({
      path: filePath,
      urlEndpoint: this.urlEndpoint,
      signed: true,
      expireSeconds: safeExpire,
    });
  }
}
