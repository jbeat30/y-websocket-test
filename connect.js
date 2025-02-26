import WebSocket from 'ws'
import { Buffer } from 'buffer'

const connect = () => {
  const reconnectInterval = 5000  // 재연결 간격 (5초)
  const wsURL = 'ws://localhost:8080'  // wss://y-websocket-test-6g6q.onrender.com
  const ws = new WebSocket(wsURL)

  ws.on('open', () => {
    console.log('🔗 서버에 연결됨!')
    ws.send(JSON.stringify({ type: 'connect', message: '접속할래요' }))

    // 계속 유지하기 위한 주기적인 핑 메시지
    setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping', message: '유지할래요' }))
      }
    }, 5000)
  })

  ws.on('message', (message) => {
    if (message instanceof Buffer || message instanceof ArrayBuffer) {
      const decoder = new TextDecoder();
      const str = decoder.decode(message).trim();

      // JSON 형식인지 확인
      if (str.startsWith('{') && str.endsWith('}')) {
        try {
          const json = JSON.parse(str);
          if (json.message) {
            console.log(json.message); // "message" 필드만 출력
          } else {
            console.log('JSON에 "message" 필드가 없습니다.');
          }
        } catch (e) {
          console.log('JSON 파싱 오류:', e);
        }
      } else {
        console.log('JSON이 아닌 데이터:', str);
      }
    }
  });

  ws.on('close', () => {
    console.warn('⚠️ 서버와의 연결이 끊어졌습니다. 재연결 시도 중...')
    setTimeout(connect, reconnectInterval)  // 재연결 시도
  })

  ws.on('error', (error) => {
    console.error('❌ WebSocket 오류 발생:', error)
  })
}

connect()