import 'dotenv/config'
import http from 'http'
import { WebSocketServer } from 'ws'
import { setupWSConnection } from 'y-websocket/bin/utils.js'

const PORT = process.env.PORT || 1234

const server = http.createServer()
const wss = new WebSocketServer({ server })

wss.on('connection', (ws, req) => {
  console.log('✅ 클라이언트 연결됨')
  setupWSConnection(ws, req)
})

server.listen(PORT, () => {
  console.log(`🚀 Yjs WebSocket 서버 실행 중: ws://localhost:${PORT}`)
})
