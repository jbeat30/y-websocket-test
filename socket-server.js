require('dotenv/config');
const http = require('http');
const { Server } = require('socket.io');
const { setupWSConnection } = require('y-websocket/bin/utils');

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

// 소켓과 y-websocket을 연결하는 함수
const connectYWebsocket = (socket, roomName) => {
  // y-websocket이 기대하는 웹소켓 인터페이스 구현
  const ws = {
    send: (message) => {
      socket.emit('yjs-update', message);
    },
    on: (event, callback) => {
      if (event === 'message') {
        socket.on('yjs-update', callback);
      }
    },
    readyState: 1 // WebSocket.OPEN
  };

  // y-websocket이 기대하는 request 객체 생성
  const req = {
    url: roomName,
    socket: {
      remoteAddress: socket.handshake.address
    }
  };

  // y-websocket 연결 설정
  setupWSConnection(ws, req);
};

io.on('connection', (socket) => {
  console.log('✅ 클라이언트 연결됨:', socket.id);
  let currentRooms = new Set();

  socket.on('joinRoom', (roomName) => {
    console.log(`🔗 ${socket.id} 방 참가: ${roomName}`);
    socket.join(roomName);
    currentRooms.add(roomName);

    if (!rooms.has(roomName)) {
      rooms.set(roomName, new Set());
    }

    const room = rooms.get(roomName);
    room.add(socket.id);

    // y-websocket 연결 설정
    connectYWebsocket(socket, roomName);

    // 기존 삭제 예약된 타이머가 있으면 제거
    if (roomTimeouts.has(roomName)) {
      console.log(`⏳ 삭제 예약 취소됨: ${roomName}`);
      clearTimeout(roomTimeouts.get(roomName));
      roomTimeouts.delete(roomName);
    }
  });

  socket.on('leaveRoom', (roomName) => {
    if (currentRooms.has(roomName)) {
      socket.leave(roomName);
      currentRooms.delete(roomName);

      const room = rooms.get(roomName);
      if (room) {
        room.delete(socket.id);
        console.log(`❌ ${socket.id} 방에서 나감: ${roomName}`);

        checkAndScheduleRoomDeletion(roomName, room);
      }
    }
  });

  socket.on('disconnect', () => {
    console.log(`❌ 클라이언트 연결 종료: ${socket.id}`);

    // 참가한 모든 방에서 제거
    currentRooms.forEach(roomName => {
      const room = rooms.get(roomName);
      if (room) {
        room.delete(socket.id);
        console.log(`❌ ${socket.id} 방에서 나감: ${roomName}`);

        checkAndScheduleRoomDeletion(roomName, room);
      }
    });
  });

  // y-websocket 메시지 처리
  socket.on('yjs-update', (message) => {
    // 해당 메시지는 y-websocket에서 자동으로 처리됨
  });
});

// 방 삭제 스케줄링 함수
function checkAndScheduleRoomDeletion(roomName, room) {
  if (room.size === 0) {
    console.log(`⏳ 3초 후 방 삭제 확인: ${roomName}`);
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

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Yjs Socket.io 서버 실행 중 PORT:${PORT}`);
});