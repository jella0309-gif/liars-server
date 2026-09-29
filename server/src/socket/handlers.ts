import { Server, Socket } from 'socket.io';
import { z } from 'zod';
import { SOCKET_EVENTS, ROOM } from '@liars-bar/shared';
import { GameRoom } from '../game/GameRoom.js';
import { logger } from '../utils/logger.js';

const rooms = new Map<string, GameRoom>();

function generateRoomId(): string {
  let id = '';
  do {
    const r = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    id = `${ROOM.CODE_PREFIX}${r}`;
  } while (rooms.has(id));
  return id;
}

const CreateRoomSchema = z.object({
  playerName: z.string().min(1).max(20),
  avatar: z.string(),
  maxPlayers: z.number().min(ROOM.MIN_PLAYERS).max(ROOM.MAX_PLAYERS),
  addBots: z.boolean().optional(),
});

const JoinRoomSchema = z.object({
  roomId: z.string(),
  playerName: z.string().min(1).max(20),
  avatar: z.string(),
});

const PlayerActionSchema = z.object({
  roomId: z.string(),
  action: z.enum(['fold', 'call', 'allin']),
});

const SwapConfirmSchema = z.object({
  roomId: z.string(),
  handCardIndex: z.number().int().min(0).max(1),
  drawnCardIndex: z.number().int().min(0),
});

const ReconnectSchema = z.object({
  token: z.string(),
  roomId: z.string(),
});

export function registerSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    logger.info(`New connection: ${socket.id}`);

    socket.on(SOCKET_EVENTS.CREATE_ROOM, (payload) => {
      try {
        const data = CreateRoomSchema.parse(payload);
        const roomId = generateRoomId();
        const room = new GameRoom(roomId, data.maxPlayers, io);
        rooms.set(roomId, room);

        const joinResult = room.addPlayer(
          socket.id,
          data.playerName,
          data.avatar,
          false
        );
        if (joinResult) {
          socket.join(roomId);
          socket.emit(SOCKET_EVENTS.JOINED_SUCCESS, {
            seatIndex: joinResult.seatIndex,
            roomId,
            maxPlayers: data.maxPlayers,
            token: joinResult.token,
          });

          if (data.addBots) {
            for (let i = 1; i < data.maxPlayers; i++) {
              room.addBot();
            }
          }
          room.broadcastRoomUpdate();
        }
      } catch (err) {
        socket.emit(SOCKET_EVENTS.ERROR, { message: 'Invalid payload' });
      }
    });

    socket.on(SOCKET_EVENTS.JOIN_ROOM, (payload) => {
      try {
        const data = JoinRoomSchema.parse(payload);
        const room = rooms.get(data.roomId);
        if (!room) {
          socket.emit(SOCKET_EVENTS.ROOM_NOT_FOUND);
          return;
        }

        const joinResult = room.addPlayer(
          socket.id,
          data.playerName,
          data.avatar,
          false
        );
        if (!joinResult) {
          socket.emit(SOCKET_EVENTS.ROOM_FULL);
          return;
        }

        socket.join(data.roomId);
        socket.emit(SOCKET_EVENTS.JOINED_SUCCESS, {
          seatIndex: joinResult.seatIndex,
          roomId: data.roomId,
          maxPlayers: room.maxPlayers,
          token: joinResult.token,
        });
        room.broadcastRoomUpdate();
      } catch (err) {
        socket.emit(SOCKET_EVENTS.ERROR, { message: 'Invalid payload' });
      }
    });

    socket.on(SOCKET_EVENTS.PLAYER_ACTION, (payload) => {
      try {
        const data = PlayerActionSchema.parse(payload);
        const room = rooms.get(data.roomId);
        if (!room) return;

        const player = room.players.find((p) => p.id === socket.id);
        if (player) {
          room.handleAction(player.seatIndex, data.action);
        }
      } catch (err) {
        socket.emit(SOCKET_EVENTS.ERROR, { message: 'Invalid payload' });
      }
    });

    socket.on('swap_request', (payload: { roomId: string }) => {
      const room = rooms.get(payload.roomId);
      if (!room) return;
      const player = room.players.find((p) => p.id === socket.id);
      if (player) {
        room.handleSwapRequest(player.seatIndex);
      }
    });

    socket.on('swap_confirm', (payload) => {
      try {
        const data = SwapConfirmSchema.parse(payload);
        const room = rooms.get(data.roomId);
        if (!room) return;
        const player = room.players.find((p) => p.id === socket.id);
        if (player) {
          room.handleSwapConfirm(
            player.seatIndex,
            data.handCardIndex,
            data.drawnCardIndex
          );
        }
      } catch (err) {
        socket.emit(SOCKET_EVENTS.ERROR, { message: 'Invalid payload' });
      }
    });

    socket.on(SOCKET_EVENTS.PLAY_AGAIN, (payload: { roomId: string }) => {
      const room = rooms.get(payload?.roomId);
      if (room) {
        room.restartMatch();
      }
    });

    socket.on(SOCKET_EVENTS.NEXT_ROUND, (payload: { roomId: string }) => {
      const room = rooms.get(payload?.roomId);
      if (room) {
        room.handleNextRound();
      }
    });

    socket.on(SOCKET_EVENTS.RECONNECT_ATTEMPT, (payload) => {
      try {
        const data = ReconnectSchema.parse(payload);
        const room = rooms.get(data.roomId);
        if (room) {
          if (room.reconnect(data.token, socket.id)) {
            socket.join(data.roomId);
          } else {
            socket.emit(SOCKET_EVENTS.ERROR, { message: 'Reconnect failed' });
          }
        }
      } catch (err) {
        socket.emit(SOCKET_EVENTS.ERROR, { message: 'Invalid payload' });
      }
    });

    socket.on('disconnect', () => {
      logger.info(`Disconnected: ${socket.id}`);
      rooms.forEach((room) => {
        room.disconnect(socket.id);
      });
    });
  });
}
