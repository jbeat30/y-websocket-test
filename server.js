import 'dotenv/config'
import http from 'http'
import { WebSocketServer } from 'ws'
import { setupWSConnection } from 'y-websocket/bin/utils'

const PORT = process.env.PORT || 8080
const server = http.createServer((req, res) => {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*') // 모든 출처 허용
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS') // 허용할 HTTP 메서드 설정
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization') // 허용할 헤더 설정

  if (req.method === 'OPTIONS') {
    res.writeHead(200)
    res.end()
    return
  }

  // 기본 HTTP 요청 처리
  res.writeHead(200)
  res.end()
})

const wss = new WebSocketServer({ server, path: '/' })

wss.on('connection', (ws, req) => {
  console.log('✅ 클라이언트 연결됨:', req.socket.remoteAddress)

  // Yjs 문서를 WebSocket에 연결
  setupWSConnection(ws, req)

  // 메시지 수신 로그 출력
  ws.on('message', (message) => {
    try {
      const parsedMessage = JSON.parse(message)

      switch (parsedMessage.type) {
        case 'connect':
          console.log('👋 클라이언트가 접속을 요청함:', parsedMessage.message.toString())
          ws.send(JSON.stringify({ type: 'connect', message: '접속 성공!' }))
          break

        case 'ping':
          console.log('🏓 핑 메시지 수신', parsedMessage.message.toString())
          ws.send(JSON.stringify({ type: 'pong', message: 'pong 유지 메시지!' }))
          break

        default:
          console.log('⚠️ 알 수 없는 메시지 타입:', parsedMessage.type)
      }
    } catch (error) {
      console.error('⚠️ 메시지 파싱 오류:', error)
    }
  })
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Yjs WebSocket 서버 실행 중 PORT:${PORT}`)
})
