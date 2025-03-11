import 'dotenv/config';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { setupWSConnection } from 'y-websocket/bin/utils';

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

const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
  const roomName = req.url;

  console.log('✅ 클라이언트 연결됨:', req.socket.remoteAddress);
  console.log('🔗 연결된 방 이름:', roomName);

  if (!rooms.has(roomName)) {
    rooms.set(roomName, new Set());
  }

  rooms.get(roomName)?.add(ws);

  // 기존 삭제 예약된 타이머가 있다면 제거
  if (roomTimeouts.has(roomName)) {
    clearTimeout(roomTimeouts.get(roomName));
    roomTimeouts.delete(roomName);
  }

  setupWSConnection(ws, req);

  ws.on('close', () => {
    console.log(`❌ 클라이언트가 방에서 나감: ${roomName}`);
    const room = rooms.get(roomName);
    room?.delete(ws);

    if (room && room.size === 0) {
      console.log(`⏳ 5초 후 방 삭제 확인: ${roomName}`);

      // 5초 후에도 비어 있으면 방 삭제
      const timeout = setTimeout(() => {
        if (rooms.get(roomName)?.size === 0) {
          console.log(`🗑️ 방 삭제됨: ${roomName}`);
          rooms.delete(roomName);
          roomTimeouts.delete(roomName);
        }
      }, 5000);

      roomTimeouts.set(roomName, timeout);
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Yjs WebSocket 서버 실행 중 PORT:${PORT}`);
});
