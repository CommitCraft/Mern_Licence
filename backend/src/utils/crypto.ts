import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';

const STORAGE_DIR = path.resolve(__dirname, '../../../storage/licence');

export function ensureKeysExist(): { publicKeyPem: string; privateKeyPem: string } {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }

  const privPath = path.join(STORAGE_DIR, 'licence-private.key');
  const pubPath = path.join(STORAGE_DIR, 'licence-public.key');

  if (fs.existsSync(privPath) && fs.existsSync(pubPath)) {
    const privateKeyPem = fs.readFileSync(privPath, 'utf8');
    const publicKeyPem = fs.readFileSync(pubPath, 'utf8');
    return { publicKeyPem, privateKeyPem };
  }

  // Generate Ed25519 keypair
  const keyPair = nacl.sign.keyPair();
  const privateKeyHex = Buffer.from(keyPair.secretKey).toString('hex');
  const publicKeyHex = Buffer.from(keyPair.publicKey).toString('hex');

  fs.writeFileSync(privPath, privateKeyHex, { encoding: 'utf8', mode: 0o600 });
  fs.writeFileSync(pubPath, publicKeyHex, { encoding: 'utf8', mode: 0o644 });

  return { publicKeyPem: publicKeyHex, privateKeyPem: privateKeyHex };
}

export function hashSha256(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

export function generateRandomLicenceKey(): string {
  // Format: EMS-PRO-XXXX-XXXX-XXXX-XXXX
  const segment = () => crypto.randomBytes(2).toString('hex').toUpperCase();
  return `EMS-PRO-${segment()}-${segment()}-${segment()}-${segment()}`;
}

export function generateCustomerCode(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `CUST-${num}`;
}

export function generateLicenceReference(): string {
  return `LIC-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
}

export function signCertificateData(payload: object): { certificate: object; signature: string } {
  const { privateKeyPem } = ensureKeysExist();
  const secretKeyUint8 = Uint8Array.from(Buffer.from(privateKeyPem, 'hex'));

  const jsonString = JSON.stringify(payload);
  const dataUint8 = naclUtil.decodeUTF8(jsonString);

  const signatureUint8 = nacl.sign.detached(dataUint8, secretKeyUint8);
  const signatureHex = Buffer.from(signatureUint8).toString('hex');

  return {
    certificate: payload,
    signature: signatureHex,
  };
}

export function verifyCertificateSignature(payload: object, signatureHex: string): boolean {
  try {
    const { publicKeyPem } = ensureKeysExist();
    const publicKeyUint8 = Uint8Array.from(Buffer.from(publicKeyPem, 'hex'));

    const jsonString = JSON.stringify(payload);
    const dataUint8 = naclUtil.decodeUTF8(jsonString);
    const signatureUint8 = Uint8Array.from(Buffer.from(signatureHex, 'hex'));

    return nacl.sign.detached.verify(dataUint8, signatureUint8, publicKeyUint8);
  } catch (error) {
    return false;
  }
}
