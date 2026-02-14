import { EncryptionService } from '../src/encryption/encryption.service';

describe('EncryptionService', () => {
  const masterKey = 'test-master-key-min-32-chars-long!!';
  let service: EncryptionService;

  beforeEach(() => {
    service = new EncryptionService(masterKey);
  });

  it('encrypts and decrypts round-trip for same org', () => {
    const data = { prompt: 'sensitive', count: 1 };
    const cipher = service.encrypt(data, 'org-A');
    expect(cipher).not.toContain('sensitive');
    const decrypted = service.decrypt(cipher, 'org-A');
    expect(decrypted).toEqual(data);
  });

  it('decrypting with wrong orgId throws', () => {
    const data = { secret: true };
    const cipher = service.encrypt(data, 'org-A');
    expect(() => service.decrypt(cipher, 'org-B')).toThrow();
  });

  it('ciphertext differs per org for same payload', () => {
    const data = { x: 1 };
    const c1 = service.encrypt(data, 'org-1');
    const c2 = service.encrypt(data, 'org-2');
    expect(c1).not.toBe(c2);
  });

  it('compromised DEK of one org does not decrypt other org ciphertext', () => {
    const plain = { value: 'for-org-A' };
    const cipherA = service.encrypt(plain, 'org-A');
    expect(() => service.decrypt(cipherA, 'org-B')).toThrow();
  });

  it('raw cipher string does not contain plaintext', () => {
    const plain = { password: 'secret123', token: 'abc' };
    const cipher = service.encrypt(plain, 'org-X');
    expect(cipher).not.toMatch(/secret123|abc|password|token/);
  });
});
