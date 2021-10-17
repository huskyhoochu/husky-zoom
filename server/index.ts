import http from 'http';
import path from 'path';
import express, { Request, Response } from 'express';
import compression from 'compression';
import admin from 'firebase-admin';
import dayjs from 'dayjs';
import schedule from 'node-schedule';
import { v4 as uuidv4 } from 'uuid';
import { Server } from 'socket.io';
import { EventEmitter } from 'events';
import { comparePassword, createHashedPassword, createSalt } from './encrypt';

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
  const now = isProd ? dayjs(new Date()).add(9, 'hours') : dayjs(new Date());
  console.log('방 점검 중...');
  const roomsRef = fireDB.ref('rooms');
  roomsRef.get().then((result) => {
    const rooms = result.val() || {};
    const roomsArr: { id: string; created_at: string; expires_at: string }[] =
      Object.values(rooms);
    console.log('방 갯수', roomsArr.length);
    roomsArr.forEach((item) => {
      const expiresAt = dayjs(item.expires_at);
      if (expiresAt.isBefore(now)) {
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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());
app.use(express.static(clientPath));
app.use('/_snowpack', express.static(snowpackPath));

app.get('*', (req: Request, res: Response) => {
  res.sendFile('index.html', { root: clientPath });
});

app.post('/room', async (req: Request, res: Response) => {
  console.log('방 제작 시작...');
  const { password, uid, email, display_name, photo_url } = req.body;

  try {
    const salt = await createSalt();
    const hashedPassword = await createHashedPassword(password, salt);

    const roomId = uuidv4();
    const roomsRef = fireDB.ref('rooms');
    await roomsRef.child(roomId).set({
      id: roomId,
      created_at: dayjs(new Date())
        .add(9, 'hours')
        .format('YYYY-MM-DDTHH:mm:ss'),
      expires_at: dayjs(new Date())
        .add(9, 'hours')
        .add(3, 'minutes')
        .format('YYYY-MM-DDTHH:mm:ss'),
      members: {
        host: {
          password: {
            value: hashedPassword,
            salt,
          },
          uid,
          email,
          display_name,
          photo_url,
          connection: {
            status: 'disconnected',
            connected_at: '',
            disconnected_at: '',
          },
        },
        guest: {
          password: {
            value: '',
            salt: '',
          },
          uid: '',
          email: '',
          display_name: '',
          photo_url: '',
          connection: {
            status: 'disconnected',
            connected_at: '',
            disconnected_at: '',
          },
        },
      },
    });

    res.send({ okay: true, room_id: roomId });
  } catch (e) {
    console.log(e);
    res.status(500).send(e);
  }
});

app.post('/room/check', async (req: Request, res: Response) => {
  const { password, room_id } = req.body;
  const roomRef = fireDB.ref(`rooms/${room_id}`);
  try {
    const roomSnapshot = await roomRef.get();
    const room = roomSnapshot.val();
    const isCorrect = await comparePassword(
      password,
      room.members.host.password,
    );
    if (isCorrect) {
      res.send({
        okay: true,
      });
    } else {
      res.status(401).send({
        okay: false,
        message: '비밀번호가 맞지 않습니다. 다시 시도해주세요',
      });
    }
  } catch (e) {
    console.log(e.message);
    res.status(500).send(e);
  }
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
