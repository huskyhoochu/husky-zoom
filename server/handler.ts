import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import admin from 'firebase-admin';
import jwt from 'jsonwebtoken';
import * as EventEmitter from 'events';
import { comparePassword, createHashedPassword, createSalt } from './encrypt';

const isProd = process.env.NODE_ENV === 'production';

export const removeRoomSchedule =
  (fireDB: admin.database.Database, dbEmitter: EventEmitter) => (): void => {
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
  };

// 방 생성 핸들러
export const createRoom =
  (fireDB: admin.database.Database) =>
    async (req: Request, res: Response): Promise<void> => {
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
    };

// 방 비밀번호 체크 핸들러
export const checkRoomPassword =
  (fireDB: admin.database.Database) =>
    async (req: Request, res: Response): Promise<void> => {
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
    };

// 방 입장을 위한 jwt 토큰 생성 핸들러
export const createJWTForRoom = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const secretKey = process.env.JWT_KEY;
  const token = jwt.sign({ okay: true }, secretKey, {
    expiresIn: 30,
  });
  res.send({
    okay: true,
    token,
  });
};
