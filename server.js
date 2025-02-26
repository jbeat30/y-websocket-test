import 'dotenv/config'
import http from 'http'
import { WebSocketServer } from 'ws'
import { setupWSConnection } from 'y-websocket/bin/utils'

const PORT = process.env.PORT || 8080

const server = http.createServer()
const wss = new WebSocketServer({ server, path: '/' })

wss.on('connection', (ws, req) => {
  console.log('✅ 클라이언트 연결됨:', req.socket.remoteAddress)

  // 접속 시 "반갑다" 메시지 전송
  ws.send('반갑다, 클라이언트!')

  // Yjs 문서를 WebSocket에 연결
  setupWSConnection(ws, req)

  // 메시지 수신 로그 출력
  ws.on('message', (message) => {
    console.log('📩 메시지 수신:', message.toString())
    ws.send('메시지 수신 확인')
  })
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Yjs WebSocket 서버 실행 중: ws://localhost:${PORT}`)
})
