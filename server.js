import { createServer } from 'http';
import express from 'express';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import wowwowNamespace from './namespaces/wowwow/index.js';

// 현재 파일의 디렉토리 경로 설정
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 환경 변수 로드 - 단일 .env 파일 사용
const envFile = join(__dirname, '.env'); // .env 파일 경로
const configResult = dotenv.config({ path: envFile });

// 환경 변수 로드 결과 확인
if (configResult.error) {
  console.error('Error loading .env file:', configResult.error);
} else {
  console.log('Environment variables loaded successfully:', configResult.parsed);
}

// Express 서버 생성
const app = express();
const server = createServer(app);

// Socket.IO 서버 생성
const io = new Server(server, {
  path: '/ws', // 기본 WebSocket 요청 경로
  transports: ['websocket', 'polling'], // WebSocket 및 폴링 전송 방식 허용
  cors: {
    origin: '*', // 모든 도메인 허용
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'OPTIONS'], // 요청 메서드 허용
    allowedHeaders: ['Content-Type', 'X-Requested-With', 'Authorization'], // 요청 헤더 허용
    credentials: true, // 쿠키 전달을 허용
  },
  allowEIO3: true, // Socket.IO 3버전 호환성
});

// 네임스페이스 설정
const wowwow = io.of(process.env.WOWWOW_NAMESPACE_PATH || '/default-namespace');
wowwowNamespace(wowwow);

// 서버 상태 확인 라우트
app.get('/healthCheck/_check', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// 서버 실행
const PORT = process.env.PORT || 8081;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});