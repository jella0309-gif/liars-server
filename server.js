const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.get('/', (req, res) => {
  res.send('Server Liars Bar is Running OK!');
});

const rooms = {};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // XỬ LÝ TẠO PHÒNG (BẮT BUỘC PHẢI CÓ ĐOẠN NÀY)
  socket.on('create_room', ({ roomId, playerName, avatar, maxPlayers }) => {
    socket.join(roomId);
    rooms[roomId] = {
      maxPlayers: parseInt(maxPlayers) || 2,
      players: [{ id: socket.id, seat: 0, name: playerName, avatar: avatar || '🤠' }]
    };
    
    // Gửi phản hồi thành công ngay lập tức để đóng màn hình chờ trên web
    socket.emit('joined_success', { seat: 0, roomId, maxPlayers: rooms[roomId].maxPlayers });
    io.to(roomId).emit('room_update', rooms[roomId]);
    console.log(`Room created: ${roomId} with max ${maxPlayers} players`);
  });

  // XỬ LÝ VÀO PHÒNG
  socket.on('join_room', ({ roomId, playerName, avatar }) => {
    const room = rooms[roomId];
    if (!room) {
      socket.emit('room_not_found');
      return;
    }

    if (room.players.length < room.maxPlayers) {
      const seat = room.players.length;
      socket.join(roomId);
      room.players.push({ id: socket.id, seat, name: playerName, avatar: avatar || '🦊' });

      socket.emit('joined_success', { seat, roomId, maxPlayers: room.maxPlayers });
      io.to(roomId).emit('room_update', room);

      if (room.players.length === room.maxPlayers) {
        io.to(roomId).emit('start_game_countdown');
      }
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
      const room = rooms[rId];
      room.players = room.players.filter(p => p.id !== socket.id);
      io.to(rId).emit('room_update', room);
      if (room.players.length === 0) {
        delete rooms[rId];
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
