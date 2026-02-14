import {
  createCipheriv,
  createDecipheriv,
  hkdfSync,
  randomBytes,
  type BinaryLike,
} from 'crypto';
import type { EncryptedPayload } from '@gaqno-ai-platform/shared-kernel';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const HKDF_INFO_PREFIX = 'org:';

const MASTER_KEY_INFO = Buffer.from('gaqno-master-v1', 'utf8');

export class EncryptionService {
  private readonly internalKey: Buffer;

  constructor(masterKey: BinaryLike) {
    const raw =
      typeof masterKey === 'string'
        ? Buffer.from(masterKey, 'utf8')
        : Buffer.isBuffer(masterKey)
          ? masterKey
          : Buffer.from(masterKey as Buffer);
    this.internalKey = Buffer.from(
      hkdfSync(
        'sha256',
        raw,
        Buffer.alloc(0),
        MASTER_KEY_INFO,
        KEY_LENGTH,
      ) as ArrayBuffer,
    );
  }

  private deriveKey(orgId: string): Buffer {
    const info = Buffer.from(HKDF_INFO_PREFIX + orgId, 'utf8');
    return Buffer.from(
      hkdfSync(
        'sha256',
        this.internalKey,
        Buffer.alloc(0),
        info,
        KEY_LENGTH,
      ) as ArrayBuffer,
    );
  }

  encrypt(plaintext: Buffer, orgId: string): EncryptedPayload {
    const dek = this.deriveKey(orgId);
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, dek, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });
    const encrypted = Buffer.concat([
      cipher.update(plaintext),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();
    return {
      encryptedData: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
    };
  }

  decrypt(encrypted: EncryptedPayload, orgId: string): Buffer {
    const dek = this.deriveKey(orgId);
    const iv = Buffer.from(encrypted.iv, 'base64');
    const authTag = Buffer.from(encrypted.authTag, 'base64');
    const encryptedData = Buffer.from(encrypted.encryptedData, 'base64');
    if (iv.length !== IV_LENGTH || authTag.length !== AUTH_TAG_LENGTH) {
      throw new Error('Invalid encrypted payload: iv or authTag length');
    }
    const decipher = createDecipheriv(ALGORITHM, dek, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });
    decipher.setAuthTag(authTag);
    return Buffer.concat([
      decipher.update(encryptedData),
      decipher.final(),
    ]);
  }
}
