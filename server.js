const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

const rooms = {};

io.on('connection', (socket) => {
  socket.on('join_room', ({ roomId, playerName }) => {
    socket.join(roomId);
    if (!rooms[roomId]) {
      rooms[roomId] = { players: [] };
    }

    const room = rooms[roomId];
    if (room.players.length < 4) {
      const seat = room.players.length;
      const player = { id: socket.id, seat, name: playerName };
      room.players.push(player);

      socket.emit('joined_success', { seat, roomId });
      io.to(roomId).emit('room_update', room);
    } else {
      socket.emit('room_full');
    }
  });

  socket.on('player_action', ({ roomId, action, seat }) => {
    io.to(roomId).emit('action_received', { seat, action });
  });

  socket.on('sync_deck', ({ roomId, state }) => {
    socket.to(roomId).emit('sync_state', state);
  });

  socket.on('disconnect', () => {
    for (const rId in rooms) {
      rooms[rId].players = rooms[rId].players.filter(p => p.id !== socket.id);
      io.to(rId).emit('room_update', rooms[rId]);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));