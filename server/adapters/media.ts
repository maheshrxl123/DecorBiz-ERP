import ImageKit from 'imagekit';
import { MediaAdapter, MediaUploadAuthResponse } from '../interfaces';

export class ImageKitMediaAdapter implements MediaAdapter {
  private imagekit: ImageKit | null = null;

  constructor() {
    const publicKey = process.env.VITE_IMAGEKIT_PUBLIC_KEY || process.env.IMAGEKIT_PUBLIC_KEY;
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
    const urlEndpoint = process.env.VITE_IMAGEKIT_URL_ENDPOINT || process.env.IMAGEKIT_URL_ENDPOINT;

    if (publicKey && privateKey && urlEndpoint) {
      this.imagekit = new ImageKit({
        publicKey,
        privateKey,
        urlEndpoint,
      });
    }
  }

  async getUploadAuth(): Promise<MediaUploadAuthResponse> {
    if (!this.imagekit) {
      throw new Error('ImageKit credentials are not configured on the server adapter');
    }
    const authParams = this.imagekit.getAuthenticationParameters();
    const publicKey = process.env.VITE_IMAGEKIT_PUBLIC_KEY || process.env.IMAGEKIT_PUBLIC_KEY || '';
    const urlEndpoint = process.env.VITE_IMAGEKIT_URL_ENDPOINT || process.env.IMAGEKIT_URL_ENDPOINT || '';

    return {
      token: authParams.token,
      expire: authParams.expire,
      signature: authParams.signature,
      publicKey,
      urlEndpoint,
    };
  }

  async generateSignedUrl(filePath: string, expireSeconds: number = 900): Promise<string> {
    if (!this.imagekit) {
      throw new Error('ImageKit credentials are not configured on the server adapter');
    }
    const urlEndpoint = process.env.VITE_IMAGEKIT_URL_ENDPOINT || process.env.IMAGEKIT_URL_ENDPOINT || '';
    return this.imagekit.url({
      path: filePath,
      urlEndpoint,
      signed: true,
      expireSeconds, // Default 15 minutes per PRD 3.5
    });
  }
}
