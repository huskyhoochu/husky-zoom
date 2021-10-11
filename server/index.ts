import http from 'http';
import path from 'path';
import express from 'express';
import compression from 'compression';
import admin from 'firebase-admin';
import dayjs from 'dayjs';
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
setInterval(() => {
  const roomsRef = fireDB.ref('rooms');
  roomsRef.get().then((result) => {
    const rooms = result.val() || {};
    const roomsArr: { id: string; expires_at: string }[] = Object.values(rooms);
    roomsArr.forEach((item) => {
      const expiresAt = dayjs(item.expires_at);
      if (expiresAt.isBefore(new Date())) {
        fireDB
          .ref(`rooms/${item.id}`)
          .remove(() => {
            dbEmitter.emit('admin-delete-room', item.id);
          })
          .catch((error) => {
            console.log(item.id, '삭제 실패', error);
          });
      }
    });
  });
}, 1000 * 60);

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
