import WebSocket from 'ws'

const ws = new WebSocket('ws://localhost:8080')

ws.on('open', () => {
  console.log('🔗 서버에 연결됨!')
  ws.send('접속할래요')  // 서버에 접속 메시지 전송

  // 계속 유지하기 위한 주기적인 핑 메시지
  setInterval(() => {
    ws.send('ping 유지 메시지!')
  }, 5000)
})

ws.on('message', (message) => {
  console.log('📩 서버로부터 응답:', message.toString())  // 서버 응답 출력
})
