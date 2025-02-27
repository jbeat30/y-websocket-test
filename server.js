import 'dotenv/config';
import http from 'http';
import { WebSocketServer } from 'ws';
import { setupWSConnection } from 'y-websocket/bin/utils';

const PORT = process.env.PORT || 8080;
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

// `path` 옵션을 제거해 모든 경로를 수락하도록 설정
const wss = new WebSocketServer({ server }); // path: '/' 제거

wss.on('connection', (ws, req) => {
  console.log('✅ 클라이언트 연결됨:', req.socket.remoteAddress);
  console.log('🔗 연결된 방 이름:', req.url);

  // Yjs 문서를 WebSocket에 연결
  setupWSConnection(ws, req);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Yjs WebSocket 서버 실행 중 PORT:${PORT}`);
});