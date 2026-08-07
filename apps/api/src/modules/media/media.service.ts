import { Injectable, BadRequestException, Logger } from "@nestjs/common";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { prisma } from "@orbit/db";

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private s3Client: S3Client;
  private bucketName: string;

  constructor() {
    this.bucketName = process.env.R2_BUCKET_NAME || "orbit-media";
    this.s3Client = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.R2_ACCOUNT_ID || "mock-account-id"}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || "mock-access-key-id",
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "mock-secret-access-key",
      },
    });
  }

  /**
   * Request a presigned URL to upload directly to R2 from the client browser
   */
  async getUploadUrl(
    workspaceId: string,
    filename: string,
    contentType: string,
    sizeBytes: number
  ) {
    if (sizeBytes > 524288000) {
      throw new BadRequestException("File size exceeds the 500MB maximum limit");
    }

    const uniqueId = Math.random().toString(36).substring(2, 15);
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
    const key = `media/${workspaceId}/${uniqueId}-${sanitizedFilename}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
    });

    // 1-hour expiration for upload link
    const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
    
    // Save placeholder record in postgres
    const mediaFile = await prisma.mediaFile.create({
      data: {
        workspaceId,
        filename,
        contentType,
        sizeBytes,
        r2Key: key,
        cdnUrl: `${process.env.R2_PUBLIC_URL || "https://media.orbit.com"}/${key}`,
        status: "processing",
      },
    });

    return {
      uploadId: mediaFile.id,
      uploadUrl,
      expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
    };
  }

  /**
   * Confirm that client successfully completed upload to R2
   */
  async confirmUpload(workspaceId: string, uploadId: string) {
    const media = await prisma.mediaFile.findUnique({
      where: { id: uploadId },
    });

    if (!media || media.workspaceId !== workspaceId) {
      throw new BadRequestException("Media upload not found or invalid workspace");
    }

    // Trigger Cloudinary transform mock or actual trigger.
    // In production, we'd notify an image resizing queue.
    const updatedMedia = await prisma.mediaFile.update({
      where: { id: uploadId },
      data: {
        status: "ready",
        variants: {
          instagram_square: `${media.cdnUrl}?w=1080&h=1080&fit=crop`,
          twitter_landscape: `${media.cdnUrl}?w=1200&h=675&fit=crop`,
          linkedin_landscape: `${media.cdnUrl}?w=1200&h=627&fit=crop`,
          tiktok_vertical: `${media.cdnUrl}?w=1080&h=1920&fit=crop`,
        },
      },
    });

    return updatedMedia;
  }

  /**
   * Delete media from library and R2
   */
  async deleteMedia(workspaceId: string, id: string) {
    const media = await prisma.mediaFile.findUnique({
      where: { id },
    });

    if (!media || media.workspaceId !== workspaceId) {
      throw new BadRequestException("Media not found");
    }

    // Delete from Cloudflare R2
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: media.r2Key,
    });

    try {
      await this.s3Client.send(command);
    } catch (err) {
      // Log error but proceed to clean up Postgres record
      this.logger.error(`Failed to delete object from R2: ${(err as Error).message}`);
    }

    await prisma.mediaFile.delete({
      where: { id },
    });

    return { success: true };
  }

  /**
   * List media library items
   */
  async listMediaLibrary(workspaceId: string) {
    return prisma.mediaFile.findMany({
      where: {
        workspaceId,
        status: "ready",
      },
      orderBy: { createdAt: "desc" },
    });
  }
}
