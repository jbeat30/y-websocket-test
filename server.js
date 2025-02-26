import 'dotenv/config'
import http from 'http'
import { WebSocketServer } from 'ws'
import setupWSConnection from 'y-websocket/bin/utils'

const PORT = process.env.PORT || 1234

const server = http.createServer()
const wss = new WebSocketServer({ server, path: '/' })

wss.on('connection', (ws, req) => {
  console.log('✅ 클라이언트 연결됨:', req.socket.remoteAddress)

  // Yjs 문서를 WebSocket에 연결
  setupWSConnection(ws, req)

  // 메시지 수신 로그 출력
  ws.on('message', (message) => {
    console.log('📩 메시지 수신:', message.toString())
  })
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Yjs WebSocket 서버 실행 중: ws://localhost:${PORT}`)
})