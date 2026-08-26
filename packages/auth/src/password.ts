import crypto from 'node:crypto';

export class PasswordService {
  /**
   * Hashes password using Node.js built-in secure scrypt KDF with random salt
   */
  public static async hash(password: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const salt = crypto.randomBytes(16).toString('hex');
      crypto.scrypt(password, salt, 64, (err, derivedKey) => {
        if (err) return reject(err);
        resolve(`${salt}:${derivedKey.toString('hex')}`);
      });
    });
  }

  /**
   * Compares password with stored hash
   */
  public static async compare(password: string, storedHash: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const [salt, key] = storedHash.split(':');
      if (!salt || !key) return resolve(false);

      crypto.scrypt(password, salt, 64, (err, derivedKey) => {
        if (err) return reject(err);
        const keyBuffer = Buffer.from(key, 'hex');
        const match = crypto.timingSafeEqual(derivedKey, keyBuffer);
        resolve(match);
      });
    });
  }
}
