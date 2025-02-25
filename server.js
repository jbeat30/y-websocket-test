import 'dotenv/config'
import http from 'http'
import { WebSocketServer } from 'ws'
import { WebsocketProvider } from 'y-websocket'

const PORT = process.env.PORT || 1234

const server = http.createServer()
const wss = new WebSocketServer({ server })

wss.on('connection', (ws, req) => {
  console.log('✅ 클라이언트 연결됨')

  // y-websocket을 WebSocketProvider로 설정
  new WebsocketProvider('ws://localhost:' + PORT, 'my-room', ws)
})

server.listen(PORT, () => {
  console.log(`🚀 Yjs WebSocket 서버 실행 중: ws://localhost:${PORT}`)
})
