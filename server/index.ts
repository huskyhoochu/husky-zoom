import http from 'http';
import path from 'path';
import express from 'express';
import compression from 'compression';
import admin from 'firebase-admin';
import dayjs from 'dayjs';
import schedule from 'node-schedule';
import { Server } from 'socket.io';
import { EventEmitter } from 'events';

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const isProd = process.env.NODE_ENV === 'production';

const fireApp = admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: process.env.SNOWPACK_PUBLIC_DATABASE_URL,
});

const fireDB = fireApp.database();
const dbEmitter = new EventEmitter();

// 1분에 한 번씩 유효기간 지난 방 삭제
schedule.scheduleJob('0 * * ? * *', () => {
  console.log('방 점검 중...');
  const roomsRef = fireDB.ref('rooms');
  roomsRef.get().then((result) => {
    const rooms = result.val() || {};
    const roomsArr: { id: string; created_at: string; expires_at: string }[] =
      Object.values(rooms);
    console.log('방 갯수', roomsArr.length);
    roomsArr.forEach((item) => {
      const createdAt = dayjs(item.created_at);
      const expiresAt = dayjs(item.expires_at);
      if (createdAt.add(3, 'minutes').isAfter(expiresAt.toDate())) {
        console.log(item.id, '삭제 시도...');
        fireDB
          .ref(`rooms/${item.id}`)
          .remove(() => {
            console.log(item.id, '삭제 성공');
            dbEmitter.emit('admin-delete-room', item.id);
          })
          .catch((error) => {
            console.log(item.id, '삭제 실패', error);
          });
      }
    });
  });
});

const clientPath = isProd
  ? path.resolve(__dirname, '..', 'client')
  : path.resolve(__dirname, '..', 'dist', 'client');

const snowpackPath = isProd
  ? path.resolve(__dirname, '..', '_snowpack')
  : path.resolve(__dirname, '..', 'dist', '_snowpack');

app.use(compression());
app.use(express.static(clientPath));
app.use('/_snowpack', express.static(snowpackPath));

app.get('*', (req, res) => {
  res.sendFile('index.html', { root: clientPath });
});

io.on('connection', (socket) => {
  dbEmitter.on('admin-delete-room', (roomId) => {
    socket.emit('delete-room', roomId);
  });
});

const PORT = process.env.PORT;
server.listen(PORT, () =>
  console.log(`server is running http://localhost:${PORT} ..`),
);
