import * as crypto from 'crypto';

export const createSalt = (): Promise<string> =>
  new Promise((resolve, reject) => {
    crypto.randomBytes(64, (err, buf) => {
      if (err) {
        reject(err);
      }
      resolve(buf.toString('base64'));
    });
  });

export const createHashedPassword = (
  plainPassword: string,
  salt: string,
): Promise<string> =>
  new Promise((resolve, reject) => {
    crypto.pbkdf2(plainPassword, salt, 9999, 64, 'sha512', (err, key) => {
      if (err) {
        reject(err);
      }
      resolve(key.toString('base64'));
    });
  });

export const comparePassword = async (
  plainPassword: string,
  compare: { value: string; salt: string },
): Promise<boolean> => {
  const comparePassword = await createHashedPassword(
    plainPassword,
    compare.salt,
  );
  return comparePassword === compare.value;
};
