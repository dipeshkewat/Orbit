import { Injectable, Logger } from "@nestjs/common";
import { NotificationsGateway } from "./notifications.gateway";
import { Resend } from "resend";

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private resend: Resend | null = null;

  constructor(private readonly gateway: NotificationsGateway) {
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      this.resend = new Resend(resendKey);
    } else {
      this.logger.warn("RESEND_API_KEY is not defined. Email notifications will be mocked.");
    }
  }

  /**
   * Send an email notification using Resend
   */
  async sendEmail(to: string, subject: string, htmlContent: string) {
    if (this.resend) {
      try {
        const response = await this.resend.emails.send({
          from: "Orbit <notifications@mail.orbit.com>",
          to,
          subject,
          html: htmlContent,
        });
        this.logger.log(`Email sent successfully: ${response.data?.id}`);
        return response;
      } catch (err) {
        this.logger.error(`Failed to send email to ${to}: ${(err as Error).message}`);
        throw err;
      }
    } else {
      this.logger.log(`[MOCK EMAIL] To: ${to} | Subject: ${subject}`);
      return { data: { id: "mock_email_id" }, error: null };
    }
  }

  /**
   * Publish a real-time post state change to connected clients
   */
  notifyPostStatus(workspaceId: string, payload: { postId: string; status: string; platform: string }) {
    this.logger.log(`Broadcasting post status update for post ${payload.postId} to workspace ${workspaceId}`);
    this.gateway.sendPostStatusUpdate(workspaceId, payload);
  }

  /**
   * Publish a generic notification to a workspace
   */
  notifyWorkspace(workspaceId: string, payload: { id: string; title: string; body: string }) {
    this.logger.log(`Broadcasting generic notification '${payload.title}' to workspace ${workspaceId}`);
    this.gateway.sendNotification(workspaceId, payload);
  }
}
