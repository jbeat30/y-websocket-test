require('dotenv/config');
const http = require('http');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 8080;
const roomTimeouts = new Map();

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  res.writeHead(200);
  res.end();
});

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  const roomName = socket.handshake.query.room;
  if (!roomName) return;
  console.log('✅ 클라이언트 연결됨:', socket.id);

  socket.join(roomName);

  if (roomTimeouts.has(roomName)) {
    clearTimeout(roomTimeouts.get(roomName));
    roomTimeouts.delete(roomName);
  }

  socket.on('yjs-update', (update) => {
    socket.to(roomName).emit('yjs-update', update);
  });

  socket.on('request-initial-state', () => {
    const roomClients = io.of('/').adapter.rooms.get(roomName);
    if (roomClients && roomClients.size > 1) {
      socket.to(roomName).emit('send-initial-state', socket.id);
    }
  });

  socket.on('awareness-update', (update) => {
    console.log('서버: Awareness 업데이트 수신 및 전송:', update);
    socket.to(roomName).emit('awareness-update', {
      clientId: update.clientId,
      data: update.data
    });
  });

  socket.on('disconnect', () => {
    const roomClients = io.of('/').adapter.rooms.get(roomName);
    if (!roomClients || roomClients.size === 0) {
      const timeout = setTimeout(() => {
        const updatedRoomClients = io.of('/').adapter.rooms.get(roomName);
        if (!updatedRoomClients || updatedRoomClients.size === 0) {
          roomTimeouts.delete(roomName);
        }
      }, 3000);
      roomTimeouts.set(roomName, timeout);
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Yjs WebSocket 서버 실행 중 PORT:${PORT}`);
});