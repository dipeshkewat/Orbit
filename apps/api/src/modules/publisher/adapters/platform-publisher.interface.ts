import { Post, PostJob, SocialAccount } from "@prisma/client";

export interface PublishResult {
  success: boolean;
  platformPostId?: string;
  platformUrl?: string;
  errorMessage?: string;
}

export interface PlatformPublisher {
  publish(
    job: PostJob,
    account: SocialAccount,
    post: Post,
    decryptedAccessToken: string
  ): Promise<PublishResult>;
}
