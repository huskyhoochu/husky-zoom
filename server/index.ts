import http from 'http';
import path from 'path';
import express, { Request, Response } from 'express';
import compression from 'compression';
import admin from 'firebase-admin';
import schedule from 'node-schedule';
import { Server } from 'socket.io';
import { EventEmitter } from 'events';
import {
  checkRoomPassword,
  createJWTForRoom,
  createRoom,
  removeRoomSchedule,
  verifyJWTForRoom,
} from './handler';

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
schedule.scheduleJob('0 * * ? * *', removeRoomSchedule(fireDB, dbEmitter));

const clientPath = isProd
  ? path.resolve(__dirname, '..', 'client')
  : path.resolve(__dirname, '..', 'dist', 'client');

const snowpackPath = isProd
  ? path.resolve(__dirname, '..', '_snowpack')
  : path.resolve(__dirname, '..', 'dist', '_snowpack');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());
app.use(express.static(clientPath));
app.use('/_snowpack', express.static(snowpackPath));

app.get('*', (req: Request, res: Response) => {
  res.sendFile('index.html', { root: clientPath });
});

app.post('/room', createRoom(fireDB));
app.post('/room/check', checkRoomPassword(fireDB));
app.post('/room/jwt', createJWTForRoom);
app.post('/room/verify', verifyJWTForRoom);

io.on('connection', (socket) => {
  dbEmitter.on('admin-delete-room', (roomId) => {
    socket.emit('delete-room', roomId);
  });

  socket.on('join-room', (roomId: string) => {
    socket.join(roomId);
    socket.to(roomId).emit('user-connected');
  });

  socket.on('offer', (offer: RTCSessionDescriptionInit, roomId: string) => {
    socket.to(roomId).emit('offer', offer);
  });

  socket.on('answer', (answer: RTCSessionDescriptionInit, roomId: string) => {
    socket.to(roomId).emit('answer', answer);
  });

  socket.on('ice', (ice: RTCIceCandidate, roomId: string) => {
    socket.to(roomId).emit('ice', ice);
  });
});

const PORT = process.env.PORT;
server.listen(PORT, () =>
  console.log(`server is running http://localhost:${PORT} ..`),
);
