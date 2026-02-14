import {
  createCipheriv,
  createDecipheriv,
  hkdfSync,
  randomBytes,
} from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const HKDF_INFO_PREFIX = 'org:';
const MASTER_KEY_INFO = Buffer.from('gaqno-master-v1', 'utf8');

interface EncryptedPayload {
  encryptedData: string;
  iv: string;
  authTag: string;
}

export class EncryptionService {
  private readonly internalKey: Buffer;

  constructor(masterKey: string | Buffer) {
    const raw = typeof masterKey === 'string' ? Buffer.from(masterKey, 'utf8') : masterKey;
    this.internalKey = Buffer.from(
      hkdfSync('sha256', raw, Buffer.alloc(0), MASTER_KEY_INFO, KEY_LENGTH) as ArrayBuffer,
    );
  }

  private deriveKey(orgId: string): Buffer {
    const info = Buffer.from(HKDF_INFO_PREFIX + orgId, 'utf8');
    return Buffer.from(
      hkdfSync('sha256', this.internalKey, Buffer.alloc(0), info, KEY_LENGTH) as ArrayBuffer,
    );
  }

  encrypt(data: unknown, orgId: string): string {
    const plaintext = Buffer.from(JSON.stringify(data), 'utf8');
    const dek = this.deriveKey(orgId);
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, dek, iv, { authTagLength: AUTH_TAG_LENGTH });
    const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const authTag = cipher.getAuthTag();
    const payload: EncryptedPayload = {
      encryptedData: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
    };
    return JSON.stringify(payload);
  }

  decrypt(cipher: string, orgId: string): unknown {
    const payload = JSON.parse(cipher) as EncryptedPayload;
    const dek = this.deriveKey(orgId);
    const iv = Buffer.from(payload.iv, 'base64');
    const authTag = Buffer.from(payload.authTag, 'base64');
    const encryptedData = Buffer.from(payload.encryptedData, 'base64');
    if (iv.length !== IV_LENGTH || authTag.length !== AUTH_TAG_LENGTH) {
      throw new Error('Invalid encrypted payload');
    }
    const decipher = createDecipheriv(ALGORITHM, dek, iv, { authTagLength: AUTH_TAG_LENGTH });
    decipher.setAuthTag(authTag);
    const plaintext = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
    return JSON.parse(plaintext.toString('utf8')) as unknown;
  }
}
