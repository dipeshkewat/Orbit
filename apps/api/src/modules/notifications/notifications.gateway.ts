import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Logger } from "@nestjs/common";

@WebSocketGateway({
  cors: {
    origin: "*",
  },
  namespace: "notifications",
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(NotificationsGateway.name);

  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Let clients subscribe to real-time events for a specific workspace.
   * Joins the client socket to a room named after the workspace ID.
   */
  @SubscribeMessage("joinWorkspace")
  handleJoinWorkspace(
    @MessageBody() data: { workspaceId: string },
    @ConnectedSocket() client: Socket
  ) {
    if (data.workspaceId) {
      client.join(data.workspaceId);
      this.logger.log(`Client ${client.id} joined workspace room: ${data.workspaceId}`);
      return { status: "joined", room: data.workspaceId };
    }
    return { status: "error", message: "Invalid workspaceId" };
  }

  /**
   * Leave a workspace room
   */
  @SubscribeMessage("leaveWorkspace")
  handleLeaveWorkspace(
    @MessageBody() data: { workspaceId: string },
    @ConnectedSocket() client: Socket
  ) {
    if (data.workspaceId) {
      client.leave(data.workspaceId);
      this.logger.log(`Client ${client.id} left workspace room: ${data.workspaceId}`);
      return { status: "left", room: data.workspaceId };
    }
    return { status: "error", message: "Invalid workspaceId" };
  }

  /**
   * Broadcast post status changes to all connected clients in a workspace
   */
  sendPostStatusUpdate(workspaceId: string, payload: { postId: string; status: string; platform: string }) {
    this.server.to(workspaceId).emit("postStatusUpdate", payload);
  }

  /**
   * Send real-time notifications to a workspace
   */
  sendNotification(workspaceId: string, payload: { id: string; title: string; body: string }) {
    this.server.to(workspaceId).emit("notificationReceived", payload);
  }
}
