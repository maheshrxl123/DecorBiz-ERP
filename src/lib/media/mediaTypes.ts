import { MediaAsset, MediaCategory, MediaUploadResult } from '../../types/foundation';
import { mediaService } from '../../services/mediaService';

export interface MediaUploadOptions {
  organizationId: string;
  storeId?: string | null;
  category: MediaCategory;
  file: File;
  uploadedByUid: string;
  userToken?: string;
}

export interface MediaService {
  uploadMedia(options: MediaUploadOptions): Promise<MediaUploadResult>;
  deleteMedia(assetId: string, organizationId: string, userToken?: string): Promise<boolean>;
  getMediaUrl(asset: MediaAsset | string, preset?: string): string;
}

/**
 * Phase 1 — Step 6 Production Media Provider wrapping mediaService
 */
export const defaultMediaService: MediaService = {
  async uploadMedia(options: MediaUploadOptions): Promise<MediaUploadResult> {
    if (!options.userToken) {
      throw new Error('Authentication token is required to upload media to ImageKit.');
    }

    return mediaService.uploadAsset({
      organizationId: options.organizationId,
      storeId: options.storeId || null,
      category: options.category,
      file: options.file,
      uploadedByUid: options.uploadedByUid,
      userToken: options.userToken,
    });
  },

  async deleteMedia(assetId: string, organizationId: string, userToken?: string): Promise<boolean> {
    if (!userToken) {
      throw new Error('Authentication token is required to delete media from ImageKit.');
    }
    return mediaService.deleteMediaAsset(organizationId, assetId, userToken);
  },

  getMediaUrl(asset: MediaAsset | string, preset?: string): string {
    return mediaService.getMediaUrl(asset, preset);
  },
};

export const abstractMediaService = defaultMediaService;
