import scryptJs from 'scrypt-js';
import { keccak_256 } from '@noble/hashes/sha3';
import { ctr } from '@noble/ciphers/aes';

export const MAX_JSON_BYTES = 1024 * 1024;

const SUPPORTED_VERSION = 3;
const SUPPORTED_KDF = 'scrypt';
const SUPPORTED_CIPHER = 'aes-128-ctr';
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

function hexToBytes(hex, expectedLength) {
  assert(typeof hex === 'string' && hex.length % 2 === 0, 'Invalid hex');
  assert(HEX_RE.test(hex), 'Invalid hex');

  const bytes = new Uint8Array(hex.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  }

  if (expectedLength !== undefined) {
    assert(bytes.length === expectedLength, 'Invalid hex length');
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

function validateScryptParams(kdfparams) {
  assert(kdfparams && typeof kdfparams === 'object', 'Missing kdfparams');

  const { n, r, p, dklen } = kdfparams;
  assert(isPositiveSafeInteger(n), 'Invalid scrypt N');
  assert((n & (n - 1)) === 0, 'Invalid scrypt N');
  assert(isPositiveSafeInteger(r), 'Invalid scrypt r');
  assert(isPositiveSafeInteger(p), 'Invalid scrypt p');
  assert(isPositiveSafeInteger(dklen) && dklen >= 32, 'Invalid scrypt dklen');

  const memoryCost = 128 * n * r;
  const cpuCost = n * r * p;
  assert(Number.isSafeInteger(memoryCost), 'KDF parameters are too large');
  assert(Number.isSafeInteger(cpuCost), 'KDF parameters are too large');
  assert(memoryCost <= MAX_SCRYPT_MEMORY_BYTES, 'KDF parameters are too large for safe local execution');
  assert(cpuCost <= MAX_SCRYPT_CPU_COST, 'KDF parameters are too expensive for safe local execution');
}

function validateKeystoreObject(obj) {
  assert(obj && typeof obj === 'object', 'Invalid JSON');
  assert(obj.version === SUPPORTED_VERSION, 'Unsupported version');
  assert(obj.crypto && typeof obj.crypto === 'object', 'Missing crypto section');

  const cryptoSection = obj.crypto;
  assert(cryptoSection.kdf === SUPPORTED_KDF, 'Unsupported KDF');
  assert(cryptoSection.cipher === SUPPORTED_CIPHER, 'Unsupported cipher');
  validateScryptParams(cryptoSection.kdfparams);
  assert(cryptoSection.cipherparams && typeof cryptoSection.cipherparams === 'object', 'Missing cipherparams');

  return cryptoSection;
}

export async function decryptV3Raw(jsonText, password) {
  assertJsonSize(jsonText);
  assert(typeof password === 'string', 'Password must be a string');

  const obj = parseJson(jsonText);
  const cryptoSection = validateKeystoreObject(obj);

  let salt;
  let iv;
  let ciphertext;
  let expectedMac;
  let passwordBytes;
  let derivedKey;
  let macInput;
  let actualMac;
  let aesKey;

  try {
    salt = hexToBytes(cryptoSection.kdfparams.salt);
    iv = hexToBytes(cryptoSection.cipherparams.iv, 16);
    ciphertext = hexToBytes(cryptoSection.ciphertext);
    expectedMac = hexToBytes(cryptoSection.mac, 32);
    assert(ciphertext.length > 0, 'Ciphertext is empty');

    passwordBytes = encoder.encode(password);
    derivedKey = await scrypt(
      passwordBytes,
      salt,
      cryptoSection.kdfparams.n,
      cryptoSection.kdfparams.r,
      cryptoSection.kdfparams.p,
      cryptoSection.kdfparams.dklen
    );

    macInput = new Uint8Array(16 + ciphertext.length);
    macInput.set(derivedKey.slice(16, 32), 0);
    macInput.set(ciphertext, 16);

    actualMac = keccak_256(macInput);
    if (!equalBytes(actualMac, expectedMac)) {
      throw new Error('Wrong password or corrupted file');
    }

    aesKey = derivedKey.slice(0, 16);
    const plaintext = ctr(aesKey, iv).decrypt(ciphertext);

    return {
      plaintext,
      hex: bytesToHex(plaintext),
      utf8: bytesToUtf8(plaintext),
      base64: bytesToBase64(plaintext),
      length: plaintext.length
    };
  } finally {
    zeroBytes(salt, iv, ciphertext, expectedMac, passwordBytes, derivedKey, macInput, actualMac, aesKey);
  }
}
