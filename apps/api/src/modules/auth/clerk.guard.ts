import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";

/**
 * ClerkGuard — verifies Clerk JWT from the Authorization header.
 * Attaches userId and orgId to the request for downstream services.
 *
 * TODO: Integrate @clerk/backend verifyToken when Clerk is provisioned.
 * For now, this is a placeholder that validates the Bearer token format.
 */
@Injectable()
export class ClerkGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing or invalid Authorization header");
    }

    const token = authHeader.slice(7);

    // TODO: Replace with actual Clerk token verification:
    // const session = await clerkClient.verifyToken(token);
    // request.userId = session.sub;
    // request.orgId = session.org_id;

    if (!token) {
      throw new UnauthorizedException("Invalid token");
    }

    // Placeholder — will be replaced with real Clerk verification
    request.userId = "placeholder";
    request.orgId = "placeholder";

    return true;
  }
}
