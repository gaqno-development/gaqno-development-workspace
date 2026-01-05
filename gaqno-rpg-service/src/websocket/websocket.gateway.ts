import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { ActionsService } from '../actions/actions.service';
import { SubmitActionDto } from '../actions/dto/submit-action.dto';
import { SessionsService } from '../sessions/sessions.service';

interface SocketSession {
  userId: string;
  sessionId: string;
  mode: 'presentation' | 'master' | 'player';
}

interface ConnectedUser {
  userId: string;
  playerName?: string;
  mode: 'presentation' | 'master' | 'player';
  socketId: string;
  connectedAt: string;
}

@WebSocketGateway({
  cors: {
    origin: (origin, callback) => {
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3007',
        'http://localhost:3001',
        'http://localhost:3002',
        'http://localhost:3003',
        'http://localhost:3004',
        'http://localhost:3005',
        'http://localhost:3006'
      ];
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  namespace: '/rpg',
  transports: ['websocket', 'polling']
})
@Injectable()
export class RpgWebSocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RpgWebSocketGateway.name);
  private sessions = new Map<string, Map<string, ConnectedUser>>();

  constructor(
    private readonly actionsService: ActionsService,
    @Inject(forwardRef(() => SessionsService))
    private readonly sessionsService: SessionsService
  ) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    const sessionData = (client as any).sessionData as SocketSession | undefined;
    
    if (sessionData) {
      const { sessionId, userId } = sessionData;
      const sessionUsers = this.sessions.get(sessionId);
      
      if (sessionUsers && sessionUsers.has(client.id)) {
        sessionUsers.delete(client.id);
        
        if (sessionUsers.size === 0) {
          this.sessions.delete(sessionId);
        } else {
          this.server.to(sessionId).emit('user_left', { userId });
        }
      }
    } else {
      this.sessions.forEach((users, sessionId) => {
        if (users.has(client.id)) {
          const user = users.get(client.id);
          if (user) {
            this.server.to(sessionId).emit('user_left', { userId: user.userId });
          }
          users.delete(client.id);
          if (users.size === 0) {
            this.sessions.delete(sessionId);
          }
        }
      });
    }
  }

  @SubscribeMessage('join_session')
  async handleJoinSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string; userId?: string; playerName?: string; mode: 'presentation' | 'master' | 'player' }
  ) {
    const { sessionId, userId, playerName, mode } = data;
    const effectiveUserId = (mode === 'presentation' || mode === 'player') && !userId 
      ? (userId || 'anonymous') 
      : userId;
    
    if (mode === 'master' && !userId) {
      client.emit('error', { message: 'User ID required for master mode' });
      return;
    }

    let effectiveMode = mode;
    if ((mode === 'master' || mode === 'player') && userId) {
      try {
        const isMaster = await this.sessionsService.isSessionMaster(sessionId, userId);
        if (isMaster) {
          effectiveMode = 'master';
        } else if (mode === 'player') {
          effectiveMode = 'player';
        }
      } catch (error) {
        this.logger.warn(`Error checking master status: ${error}`);
        if (mode === 'player') {
          effectiveMode = 'player';
        }
      }
    } else if (mode === 'player' && !userId) {
      effectiveMode = 'player';
    }

    client.join(sessionId);
    
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, new Map());
    }

    const sessionUsers = this.sessions.get(sessionId)!;
    
    if ((mode === 'master' || (mode === 'player' && userId)) && userId) {
      for (const [existingSocketId, existingUser] of sessionUsers.entries()) {
        if (existingUser.userId === userId && existingUser.mode !== 'presentation' && existingUser.mode !== 'player') {
          this.logger.log(`Removing duplicate connection for user ${userId}: ${existingSocketId}`);
          const existingSocket = this.server.sockets.sockets.get(existingSocketId);
          if (existingSocket) {
            existingSocket.leave(sessionId);
            existingSocket.disconnect();
          }
          sessionUsers.delete(existingSocketId);
        }
      }
    }

    const connectedUser: ConnectedUser = {
      userId: effectiveUserId!,
      playerName: playerName || undefined,
      mode: effectiveMode,
      socketId: client.id,
      connectedAt: new Date().toISOString()
    };

    sessionUsers.set(client.id, connectedUser);

    const sessionData: SocketSession = { userId: effectiveUserId!, sessionId, mode: effectiveMode };
    (client as any).sessionData = sessionData;

    const connectedUsers = this.getConnectedUsers(sessionId);
    
    this.server.to(sessionId).emit('user_joined', {
      userId: effectiveUserId!,
      playerName: playerName || undefined,
      mode: effectiveMode,
      connectedAt: connectedUser.connectedAt
    });

    client.emit('joined_session', { sessionId, mode: effectiveMode });
    client.emit('connected_users_list', { users: connectedUsers });
    
    this.server.to(sessionId).emit('connected_users_list', { users: connectedUsers });

    this.logger.log(`Client ${client.id} joined session ${sessionId} as ${effectiveMode} (userId: ${effectiveUserId})`);
  }

  @SubscribeMessage('update_player_name')
  handleUpdatePlayerName(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string; playerName: string }
  ) {
    const { sessionId, playerName } = data;
    const sessionUsers = this.sessions.get(sessionId);
    
    if (!sessionUsers) {
      client.emit('error', { message: 'Not in a session' });
      return;
    }

    const user = sessionUsers.get(client.id);
    if (!user) {
      client.emit('error', { message: 'User not found in session' });
      return;
    }

    user.playerName = playerName;
    sessionUsers.set(client.id, user);

    const connectedUsers = this.getConnectedUsers(sessionId);
    
    this.server.to(sessionId).emit('user_joined', {
      userId: user.userId,
      playerName: playerName,
      mode: user.mode,
      connectedAt: user.connectedAt
    });

    this.server.to(sessionId).emit('connected_users_list', { users: connectedUsers });

    this.logger.log(`Player name updated for ${user.userId} in session ${sessionId}: ${playerName}`);
  }

  @SubscribeMessage('leave_session')
  handleLeaveSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string }
  ) {
    const { sessionId } = data;
    const sessionData = (client as any).sessionData as SocketSession | undefined;
    client.leave(sessionId);
    
    if (this.sessions.has(sessionId)) {
      const user = this.sessions.get(sessionId)!.get(client.id);
      this.sessions.get(sessionId)!.delete(client.id);
      
      if (this.sessions.get(sessionId)!.size === 0) {
        this.sessions.delete(sessionId);
      } else if (user) {
        this.server.to(sessionId).emit('user_left', { userId: user.userId });
      }
    }

    this.logger.log(`Client ${client.id} left session ${sessionId}`);
  }

  getConnectedUsers(sessionId: string): Array<{ userId: string; playerName?: string; mode: 'presentation' | 'master' | 'player'; connectedAt: string }> {
    const sessionUsers = this.sessions.get(sessionId);
    if (!sessionUsers) {
      return [];
    }

    return Array.from(sessionUsers.values()).map(user => ({
      userId: user.userId,
      playerName: user.playerName,
      mode: user.mode,
      connectedAt: user.connectedAt
    }));
  }

  @SubscribeMessage('submit_action')
  async handleSubmitAction(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SubmitActionDto & { userId: string }
  ) {
    try {
      const sessionData = (client as any).sessionData as SocketSession;
      if (!sessionData) {
        client.emit('error', { message: 'Not joined to a session' });
        return;
      }

      if (sessionData.mode === 'presentation') {
        client.emit('error', { message: 'Presentation mode cannot submit actions' });
        return;
      }

      const result = await this.actionsService.submitAction(
        null,
        data.userId,
        data
      );

      this.server.to(data.sessionId).emit('action_result', {
        action: result.action,
        narratorResponse: result.narratorResponse,
        submittedBy: data.userId
      });

      client.emit('action_submitted', { success: true });
    } catch (error: any) {
      this.logger.error('Error submitting action:', error);
      client.emit('error', { message: error.message || 'Failed to submit action' });
    }
  }

  @SubscribeMessage('request_update')
  handleRequestUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string; type: string }
  ) {
    const sessionData = (client as any).sessionData as SocketSession;
    if (!sessionData || sessionData.sessionId !== data.sessionId) {
      client.emit('error', { message: 'Invalid session' });
      return;
    }

    this.server.to(data.sessionId).emit('update_requested', {
      type: data.type,
      requestedBy: sessionData.userId
    });
  }

  @SubscribeMessage('request_users_list')
  handleRequestUsersList(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string }
  ) {
    const connectedUsers = this.getConnectedUsers(data.sessionId);
    client.emit('connected_users_list', { users: connectedUsers });
    this.logger.log(`Sent users list to client ${client.id} for session ${data.sessionId}`);
  }

  @SubscribeMessage('request_dice_roll')
  handleRequestDiceRoll(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { 
      sessionId: string; 
      requestedFor: string; 
      formula: string; 
      target?: number; 
      context?: string;
    }
  ) {
    const sessionData = (client as any).sessionData as SocketSession | undefined;
    if (!sessionData) {
      client.emit('error', { message: 'Not joined to a session' });
      return;
    }

    if (!data.requestedFor) {
      this.logger.error(`Dice roll request missing requestedFor: ${JSON.stringify(data)}`);
      client.emit('error', { message: 'requestedFor is required' });
      return;
    }

    const diceRequest = {
      id: `dice-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sessionId: data.sessionId,
      requestedBy: sessionData.userId,
      requestedFor: data.requestedFor,
      formula: data.formula,
      target: data.target,
      context: data.context,
      status: 'pending' as const,
      createdAt: new Date().toISOString()
    };

    this.logger.log(`Dice roll requested by ${sessionData.userId} for ${data.requestedFor} in session ${data.sessionId}`, {
      requestId: diceRequest.id,
      formula: diceRequest.formula,
      target: diceRequest.target,
      context: diceRequest.context,
    });

    this.server.to(data.sessionId).emit('dice_roll_requested', diceRequest);
  }

  @SubscribeMessage('dice_roll_completed')
  handleDiceRollCompleted(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: {
      requestId: string;
      sessionId: string;
      result: {
        roll: number;
        formula: string;
        natural: number;
        target?: number;
      };
    }
  ) {
    const sessionData = (client as any).sessionData as SocketSession | undefined;
    if (!sessionData) {
      client.emit('error', { message: 'Not joined to a session' });
      return;
    }

    const completedRequest = {
      id: data.requestId,
      sessionId: data.sessionId,
      requestedBy: '', // Will be filled from original request
      requestedFor: sessionData.userId,
      formula: data.result.formula,
      target: data.result.target,
      status: 'submitted' as const,
      result: data.result,
      createdAt: new Date().toISOString()
    };

    this.server.to(data.sessionId).emit('dice_roll_completed', completedRequest);
    this.logger.log(`Dice roll completed by ${sessionData.userId} in session ${data.sessionId}`);
  }

  async updateUserMode(sessionId: string, userId: string, newMode: 'master' | 'player') {
    const sessionUsers = this.sessions.get(sessionId);
    if (!sessionUsers) {
      return;
    }

    for (const [socketId, user] of sessionUsers.entries()) {
      if (user.userId === userId) {
        const updatedUser: ConnectedUser = {
          ...user,
          mode: newMode
        };
        sessionUsers.set(socketId, updatedUser);

        const socket = this.server.sockets.sockets.get(socketId);
        if (socket) {
          (socket as any).sessionData = {
            ...(socket as any).sessionData,
            mode: newMode
          };
        }

        this.server.to(sessionId).emit('user_mode_updated', {
          userId,
          mode: newMode
        });

        this.server.to(socketId).emit('mode_changed', {
          mode: newMode
        });

        const connectedUsers = this.getConnectedUsers(sessionId);
        this.server.to(sessionId).emit('connected_users_list', { users: connectedUsers });
      }
    }
  }
}

