import { Controller, Post, Req, Res, Headers, HttpCode } from "@nestjs/common";
import { Request, Response } from "express";
import { BillingService } from "./billing.service";

@Controller("webhooks/stripe")
export class StripeWebhookController {
  constructor(private readonly billingService: BillingService) {}

  /**
   * Stripe sends webhook events to this endpoint.
   * Raw body is needed for signature verification.
   */
  @Post()
  @HttpCode(200)
  async handleStripeWebhook(
    @Req() req: Request,
    @Res() res: Response,
    @Headers("stripe-signature") signature: string
  ) {
    try {
      // Express raw body middleware must be enabled for this route
      const rawBody = (req as any).rawBody || req.body;
      await this.billingService.handleWebhookEvent(
        Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(JSON.stringify(rawBody)),
        signature
      );
      return res.json({ received: true });
    } catch (err) {
      return res.status(400).json({ error: (err as Error).message });
    }
  }
}
