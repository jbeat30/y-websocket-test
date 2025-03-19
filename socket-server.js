require('dotenv/config');
const http = require('http');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 8080;
const rooms = new Map(); // Map 사용
const roomTimeouts = new Map(); // 방 삭제 타이머 저장

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
  console.log('✅ 클라이언트 연결됨:', socket.id);

  socket.on('joinRoom', (roomName) => {
    console.log(`🔗 ${socket.id} 방 참가: ${roomName}`);
    socket.join(roomName);

    if (!rooms.has(roomName)) {
      rooms.set(roomName, new Set());
    }

    const room = rooms.get(roomName);
    room.add(socket.id);

    // 기존 삭제 예약된 타이머가 있으면 제거
    if (roomTimeouts.has(roomName)) {
      console.log(`⏳ 삭제 예약 취소됨: ${roomName}`);
      clearTimeout(roomTimeouts.get(roomName));
      roomTimeouts.delete(roomName);
    }
  });

  socket.on('disconnect', () => {
    console.log(`❌ 클라이언트 연결 종료: ${socket.id}`);

    rooms.forEach((sockets, roomName) => {
      if (sockets.has(socket.id)) {
        sockets.delete(socket.id);
        console.log(`❌ ${socket.id} 방에서 나감: ${roomName}`);

        if (sockets.size === 0) {
          console.log(`⏳ 5초 후 방 삭제 확인: ${roomName}`);
          const timeout = setTimeout(() => {
            if (rooms.get(roomName)?.size === 0) {
              console.log(`🗑️ 방 삭제됨: ${roomName}`);
              rooms.delete(roomName);
              roomTimeouts.delete(roomName);
            } else {
              console.log(`⚠️ 방 삭제 취소됨 (새로운 접속자 감지됨): ${roomName}`);
            }
          }, 3000);
          roomTimeouts.set(roomName, timeout);
        }
      }
    });
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Socket.io 서버 실행 중 PORT:${PORT}`);
});