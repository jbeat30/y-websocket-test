import { createServer } from 'http';
import express from 'express';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import wowwowNamespace from './namespaces/wowwow/index.js';

// 현재 파일의 디렉토리 경로 구하기
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 환경 변수 로드 (.env 파일 사용)
const envPath = join(__dirname, '.env');
const configResult = dotenv.config({ path: envPath });

if (configResult.error) {
  console.error('❌ .env 파일 로드 실패:', configResult.error);
} else {
  console.log('✅ 환경 변수 로드 성공:', configResult.parsed);
}

// Express 앱 및 HTTP 서버 생성
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

// 네임스페이스 등록
const namespacePath = process.env.WOWWOW_NAMESPACE_PATH || '/default-namespace';
const wowwow = io.of(namespacePath);
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