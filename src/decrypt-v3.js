import scryptJs from 'scrypt-js';
import { keccak_256 } from '@noble/hashes/sha3';
import { ctr } from '@noble/ciphers/aes';

export const MAX_JSON_BYTES = 1024 * 1024;

const SUPPORTED_VERSION = 3;
const SUPPORTED_KDF = 'scrypt';
const SUPPORTED_CIPHER = 'aes-128-ctr';
const DERIVED_KEY_BYTES = 32;
const AES_KEY_BYTES = 16;
const IV_BYTES = 16;
const MAC_BYTES = 32;
const MAX_SCRYPT_MEMORY_BYTES = 512 * 1024 * 1024;
const MAX_SCRYPT_CPU_COST = 16_777_216;

const HEX_RE = /^[0-9a-f]+$/i;
const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: true });
const { scrypt } = scryptJs;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertObject(value, message) {
  assert(value && typeof value === 'object' && !Array.isArray(value), message);
}

function zeroBytes(...arrays) {
  for (const value of arrays) {
    if (value instanceof Uint8Array) {
      value.fill(0);
    }
  }
}

function isPositiveSafeInteger(value) {
  return Number.isSafeInteger(value) && value > 0;
}

function assertJsonSize(jsonText) {
  assert(typeof jsonText === 'string', 'JSON input must be a string');
  assert(encoder.encode(jsonText).length <= MAX_JSON_BYTES, 'JSON input is too large');
}

function hexToBytes(hex, { errorMessage, exactLength } = {}) {
  const message = errorMessage ?? 'Invalid hex';
  assert(typeof hex === 'string' && hex.length % 2 === 0, message);
  assert(hex.length === 0 || HEX_RE.test(hex), message);

  const bytes = new Uint8Array(hex.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  }

  if (exactLength !== undefined) {
    assert(bytes.length === exactLength, message);
  }

  return bytes;
}

function bytesToHex(bytes) {
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

function bytesToBase64(bytes) {
  if (typeof btoa === 'function') {
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary);
  }

  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64');
  }

  throw new Error('Base64 encoding is not available');
}

function bytesToUtf8(bytes) {
  try {
    return decoder.decode(bytes);
  } catch {
    return '(utf8 decode failed)';
  }
}

function equalBytes(a, b) {
  if (a.length !== b.length) return false;

  let diff = 0;
  for (let index = 0; index < a.length; index += 1) {
    diff |= a[index] ^ b[index];
  }
  return diff === 0;
}

function parseJson(jsonText) {
  try {
    return JSON.parse(jsonText);
  } catch {
    throw new Error('Invalid JSON');
  }
}

function toPositiveSafeInteger(value, errorMessage) {
  assert(isPositiveSafeInteger(value), errorMessage);
  return value;
}

function normalizeScryptParams(kdfparams) {
  assertObject(kdfparams, 'Missing kdfparams');

  const n = toPositiveSafeInteger(kdfparams.n, 'Invalid scrypt N');
  const r = toPositiveSafeInteger(kdfparams.r, 'Invalid scrypt r');
  const p = toPositiveSafeInteger(kdfparams.p, 'Invalid scrypt p');
  const dklen = toPositiveSafeInteger(kdfparams.dklen, 'Invalid scrypt dklen');
  assert((n & (n - 1)) === 0, 'Invalid scrypt N');
  assert(dklen >= DERIVED_KEY_BYTES, 'Invalid scrypt dklen');

  const memoryCost = 128 * n * r;
  const cpuCost = n * r * p;
  assert(Number.isSafeInteger(memoryCost), 'KDF parameters are too large');
  assert(Number.isSafeInteger(cpuCost), 'KDF parameters are too large');
  assert(memoryCost <= MAX_SCRYPT_MEMORY_BYTES, 'KDF parameters are too large for safe local execution');
  assert(cpuCost <= MAX_SCRYPT_CPU_COST, 'KDF parameters are too expensive for safe local execution');

  return { n, r, p, dklen };
}

function normalizeKeystoreV3(jsonText) {
  assertJsonSize(jsonText);

  const obj = parseJson(jsonText);
  assertObject(obj, 'Invalid JSON');
  assert(obj.version === SUPPORTED_VERSION, 'Unsupported version');
  assertObject(obj.crypto, 'Missing crypto section');

  const cryptoSection = obj.crypto;
  assert(cryptoSection.kdf === SUPPORTED_KDF, 'Unsupported KDF');
  assert(cryptoSection.cipher === SUPPORTED_CIPHER, 'Unsupported cipher');

  const scryptParams = normalizeScryptParams(cryptoSection.kdfparams);
  assertObject(cryptoSection.cipherparams, 'Missing cipherparams');

  const salt = hexToBytes(cryptoSection.kdfparams.salt, { errorMessage: 'Invalid scrypt salt' });

  const iv = hexToBytes(cryptoSection.cipherparams.iv, {
    errorMessage: 'Invalid cipher IV',
    exactLength: IV_BYTES
  });

  const ciphertext = hexToBytes(cryptoSection.ciphertext, { errorMessage: 'Invalid ciphertext' });
  assert(ciphertext.length > 0, 'Ciphertext is empty');

  const expectedMac = hexToBytes(cryptoSection.mac, {
    errorMessage: 'Invalid MAC',
    exactLength: MAC_BYTES
  });

  return {
    scryptParams,
    salt,
    iv,
    ciphertext,
    expectedMac
  };
}

async function deriveScryptKey(password, normalizedKeystore) {
  const passwordBytes = encoder.encode(password);
  const { n, r, p, dklen } = normalizedKeystore.scryptParams;
  const derivedKey = await scrypt(passwordBytes, normalizedKeystore.salt, n, r, p, dklen);

  return { passwordBytes, derivedKey };
}

function verifyMac(derivedKey, ciphertext, expectedMac) {
  const macInput = new Uint8Array(AES_KEY_BYTES + ciphertext.length);
  macInput.set(derivedKey.subarray(AES_KEY_BYTES, DERIVED_KEY_BYTES), 0);
  macInput.set(ciphertext, AES_KEY_BYTES);

  const actualMac = keccak_256(macInput);
  if (!equalBytes(actualMac, expectedMac)) {
    throw new Error('Wrong password or corrupted file');
  }

  return { macInput, actualMac };
}

function decryptCiphertext(derivedKey, iv, ciphertext) {
  return ctr(derivedKey.subarray(0, AES_KEY_BYTES), iv).decrypt(ciphertext);
}

function formatDecryptionResult(plaintext) {
  return {
    plaintext,
    hex: bytesToHex(plaintext),
    utf8: bytesToUtf8(plaintext),
    base64: bytesToBase64(plaintext),
    length: plaintext.length
  };
}

export async function decryptV3Raw(jsonText, password) {
  assert(typeof password === 'string', 'Password must be a string');
  const normalizedKeystore = normalizeKeystoreV3(jsonText);

  let passwordBytes;
  let derivedKey;
  let macInput;
  let actualMac;

  try {
    ({ passwordBytes, derivedKey } = await deriveScryptKey(password, normalizedKeystore));
    ({ macInput, actualMac } = verifyMac(
      derivedKey,
      normalizedKeystore.ciphertext,
      normalizedKeystore.expectedMac
    ));

    const plaintext = decryptCiphertext(
      derivedKey,
      normalizedKeystore.iv,
      normalizedKeystore.ciphertext
    );

    return formatDecryptionResult(plaintext);
  } finally {
    zeroBytes(
      normalizedKeystore.salt,
      normalizedKeystore.iv,
      normalizedKeystore.ciphertext,
      normalizedKeystore.expectedMac,
      passwordBytes,
      derivedKey,
      macInput,
      actualMac
    );
  }
}
