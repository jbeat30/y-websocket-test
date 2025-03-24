export default (namespace) => {
  const roomTimeouts = new Map(); // 방 삭제 타이머 저장

  namespace.on('connection', (socket) => {
    const roomName = socket.handshake.query.room; // URL 쿼리로 방 이름 받기
    if (!roomName) return;
    console.log('matchnow 클라이언트 연결됨:', socket.id);
    console.log('연결된 방 이름:', roomName);

    socket.join(roomName);

    if (roomTimeouts.has(roomName)) {
      console.log(`삭제 예약 취소됨: ${roomName}`);
      clearTimeout(roomTimeouts.get(roomName));
      roomTimeouts.delete(roomName);
    }

    // Yjs 업데이트 수신 및 브로드캐스트
    socket.on('yjs-update', (update) => {
      try {
        socket.to(roomName).emit('yjs-update', update);
      } catch (error) {
        console.error(`Yjs 업데이트 처리 오류: ${roomName}`, error);
      }
    });

    // 초기 상태 요청 및 전송
    socket.on('request-initial-state', () => {
      const roomClients = namespace.adapter.rooms.get(roomName);
      if (roomClients && roomClients.size > 1) {
        socket.to(roomName).emit('send-initial-state', socket.id);
      }
    });

    // awareness 상태 수신 및 브로드캐스트
    socket.on('awareness-update', (update) => {
      try {
        socket.to(roomName).emit('awareness-update', {
          clientId: update.clientId,
          data: update.data
        });
      } catch (error) {
        console.error(`Awareness 업데이트 처리 오류: ${roomName}`, error);
      }
    });

    socket.on('disconnect', () => {
      console.log(`클라이언트가 방에서 나감: ${roomName}`);
      const roomClients = namespace.adapter.rooms.get(roomName);

      if (!roomClients || roomClients.size === 0) {
        console.log(`5초 후 방 삭제 확인: ${roomName}`);

        const timeout = setTimeout(() => {
          const roomClients = namespace.adapter.rooms.get(roomName);
          if (!roomClients || roomClients.size === 0) {
            console.log(`방 삭제됨: ${roomName}`);
            roomTimeouts.delete(roomName);
          } else {
            console.log(`방 삭제 취소됨 (새로운 접속자 감지됨): ${roomName}`);
          }
        }, 3000);

        roomTimeouts.set(roomName, timeout);
      }
    });

    console.log(`클라이언트 ${socket.id}가 ${roomName} 방에 참가했습니다.`);
  });
};