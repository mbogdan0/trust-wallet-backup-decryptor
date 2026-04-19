import test from 'node:test';
import assert from 'node:assert/strict';

import { decryptV3Raw, MAX_JSON_BYTES } from '../src/decrypt-v3.js';
import {
  DEMO_EXPECTED,
  DEMO_KEYSTORE_JSON,
  DEMO_KEYSTORE_OBJECT,
  DEMO_PASSWORD
} from '../src/demo-vector.js';

function cloneDemoKeystore() {
  return JSON.parse(JSON.stringify(DEMO_KEYSTORE_OBJECT));
}

function assertWrongPasswordError(error) {
  assert(error instanceof Error);
  assert.match(error.message, /Wrong password or corrupted file/);
  assert.doesNotMatch(error.message, /Invalid scrypt salt/);
  return true;
}

const EMPTY_SALT_VECTOR_PASSWORD = 'empty-salt-pass';
const EMPTY_SALT_VECTOR_EXPECTED = Object.freeze({
  utf8: 'legacy-empty-salt-vector',
  hex: '6c65676163792d656d7074792d73616c742d766563746f72',
  base64: 'bGVnYWN5LWVtcHR5LXNhbHQtdmVjdG9y',
  length: 24
});
const EMPTY_SALT_VECTOR_JSON = JSON.stringify({
  version: 3,
  crypto: {
    ciphertext: 'b06a1eb0bc9d088d362e2bde0cb8e5fd198d18525b82ee77',
    cipherparams: {
      iv: '11111111111111111111111111111111'
    },
    kdf: 'scrypt',
    kdfparams: {
      n: 16384,
      r: 8,
      p: 1,
      dklen: 32,
      salt: ''
    },
    mac: '773b6bfb3396272659169df220f9d6848bfd08d80a70a0aa9aa968f047d7b576',
    cipher: 'aes-128-ctr'
  },
  id: '11111111-2222-4333-8444-555555555555'
});

const PROVIDED_EMPTY_SALT_SAMPLES = Object.freeze([
  Object.freeze({
    version: 3,
    crypto: {
      ciphertext: 'f22c9497776bc6775e36b3991b0a6445d45110ed6ef3bc579b949d90d26a7348',
      cipherparams: {
        iv: '2a6fd9ebfab039777aef848ca13fa9c8'
      },
      kdf: 'scrypt',
      kdfparams: {
        r: 8,
        p: 4,
        n: 16384,
        dklen: 32,
        salt: ''
      },
      mac: '857eec7ae2864dd5c3df4612634f1cc6cebc8f99a68e25d0cc4f1fb3ef5925ce',
      cipher: 'aes-128-ctr'
    },
    id: '51069238-559b-4470-a35f-bd73478a2f31'
  }),
  Object.freeze({
    version: 3,
    crypto: {
      ciphertext:
        'eb2fb174485460934e4025ab29e2dce91a6de8a4189e833d22e74bac9bc455f3d88c2674595d8d2b02eb4665230c9c577f3ed6a97ed4de98b6afcd8fdb31144dd7226ae376d69673d3a2ab97f379c3b1ca99d36f15fd16e061d1e6a8d2',
      cipherparams: {
        iv: 'b199343780daf81bf1e95c7bed930c24'
      },
      kdf: 'scrypt',
      kdfparams: {
        r: 8,
        p: 4,
        n: 16384,
        dklen: 32,
        salt: ''
      },
      mac: '75b22e527ff7a3e15a52dddb65fd28dc8a8c2769caaeae9b213b072122a00376',
      cipher: 'aes-128-ctr'
    },
    id: 'b11e00ad-f682-4710-afe5-1b4110ea2027',
    name: 'test-mother-no-salt',
    type: 'mnemonic'
  })
]);

test('decryptV3Raw decrypts the known demo vector', async () => {
  const result = await decryptV3Raw(DEMO_KEYSTORE_JSON, DEMO_PASSWORD);

  assert.equal(result.length, DEMO_EXPECTED.length);
  assert.equal(result.hex, DEMO_EXPECTED.hex);
  assert.equal(result.utf8, DEMO_EXPECTED.utf8);
  assert.equal(result.base64, DEMO_EXPECTED.base64);
  assert.equal(Buffer.from(result.plaintext).toString('hex'), DEMO_EXPECTED.hex);
});

test('decryptV3Raw accepts Trust Wallet style metadata outside the crypto section', async () => {
  const keystore = cloneDemoKeystore();
  keystore.name = 'Recovered wallet';
  keystore.type = 'private-key';
  keystore.activeAccounts = [
    {
      address: '0x0000000000000000000000000000000000000001',
      coin: 60,
      derivationPath: "m/44'/60'/0'/0/1"
    }
  ];
  keystore.extraMetadata = {
    source: 'trust-wallet-demo',
    notes: 'metadata outside crypto must not affect decryption'
  };

  const result = await decryptV3Raw(JSON.stringify(keystore), DEMO_PASSWORD);

  assert.equal(result.utf8, DEMO_EXPECTED.utf8);
  assert.equal(result.hex, DEMO_EXPECTED.hex);
});

test('decryptV3Raw decrypts deterministic empty-salt vector', async () => {
  const result = await decryptV3Raw(EMPTY_SALT_VECTOR_JSON, EMPTY_SALT_VECTOR_PASSWORD);

  assert.equal(result.length, EMPTY_SALT_VECTOR_EXPECTED.length);
  assert.equal(result.hex, EMPTY_SALT_VECTOR_EXPECTED.hex);
  assert.equal(result.utf8, EMPTY_SALT_VECTOR_EXPECTED.utf8);
  assert.equal(result.base64, EMPTY_SALT_VECTOR_EXPECTED.base64);
});

test('decryptV3Raw rejects a wrong password', async () => {
  await assert.rejects(
    decryptV3Raw(DEMO_KEYSTORE_JSON, 'wrong-password'),
    /Wrong password or corrupted file/
  );
});

test('decryptV3Raw rejects invalid JSON', async () => {
  await assert.rejects(decryptV3Raw('{', DEMO_PASSWORD), /Invalid JSON/);
});

test('decryptV3Raw rejects unsupported version', async () => {
  const keystore = cloneDemoKeystore();
  keystore.version = 4;

  await assert.rejects(
    decryptV3Raw(JSON.stringify(keystore), DEMO_PASSWORD),
    /Unsupported version/
  );
});

test('decryptV3Raw rejects missing crypto section', async () => {
  const keystore = cloneDemoKeystore();
  delete keystore.crypto;

  await assert.rejects(
    decryptV3Raw(JSON.stringify(keystore), DEMO_PASSWORD),
    /Missing crypto section/
  );
});

test('decryptV3Raw rejects unsupported kdf', async () => {
  const keystore = cloneDemoKeystore();
  keystore.crypto.kdf = 'pbkdf2';

  await assert.rejects(
    decryptV3Raw(JSON.stringify(keystore), DEMO_PASSWORD),
    /Unsupported KDF/
  );
});

test('decryptV3Raw rejects unsupported cipher', async () => {
  const keystore = cloneDemoKeystore();
  keystore.crypto.cipher = 'aes-256-cbc';

  await assert.rejects(
    decryptV3Raw(JSON.stringify(keystore), DEMO_PASSWORD),
    /Unsupported cipher/
  );
});

test('decryptV3Raw rejects missing kdfparams', async () => {
  const keystore = cloneDemoKeystore();
  delete keystore.crypto.kdfparams;

  await assert.rejects(
    decryptV3Raw(JSON.stringify(keystore), DEMO_PASSWORD),
    /Missing kdfparams/
  );
});

test('decryptV3Raw rejects missing cipherparams', async () => {
  const keystore = cloneDemoKeystore();
  delete keystore.crypto.cipherparams;

  await assert.rejects(
    decryptV3Raw(JSON.stringify(keystore), DEMO_PASSWORD),
    /Missing cipherparams/
  );
});

test('decryptV3Raw rejects invalid hex input', async () => {
  const keystore = cloneDemoKeystore();
  keystore.crypto.ciphertext = 'zz';

  await assert.rejects(
    decryptV3Raw(JSON.stringify(keystore), DEMO_PASSWORD),
    /Invalid ciphertext/
  );
});

test('decryptV3Raw rejects invalid IV length', async () => {
  const keystore = cloneDemoKeystore();
  keystore.crypto.cipherparams.iv = '0102';

  await assert.rejects(
    decryptV3Raw(JSON.stringify(keystore), DEMO_PASSWORD),
    /Invalid cipher IV/
  );
});

test('decryptV3Raw rejects invalid MAC length', async () => {
  const keystore = cloneDemoKeystore();
  keystore.crypto.mac = '0011';

  await assert.rejects(
    decryptV3Raw(JSON.stringify(keystore), DEMO_PASSWORD),
    /Invalid MAC/
  );
});

test('decryptV3Raw rejects empty ciphertext', async () => {
  const keystore = cloneDemoKeystore();
  keystore.crypto.ciphertext = '';

  await assert.rejects(
    decryptV3Raw(JSON.stringify(keystore), DEMO_PASSWORD),
    /Ciphertext is empty/
  );
});

test('decryptV3Raw accepts empty salt and reaches password/MAC validation', async () => {
  const keystore = cloneDemoKeystore();
  keystore.crypto.kdfparams.salt = '';

  await assert.rejects(
    decryptV3Raw(JSON.stringify(keystore), DEMO_PASSWORD),
    assertWrongPasswordError
  );
});

test('decryptV3Raw accepts provided empty-salt samples', async () => {
  for (const sample of PROVIDED_EMPTY_SALT_SAMPLES) {
    await assert.rejects(
      decryptV3Raw(JSON.stringify(sample), 'definitely-not-the-right-password'),
      assertWrongPasswordError
    );
  }
});

test('decryptV3Raw rejects corrupted MAC', async () => {
  const keystore = cloneDemoKeystore();
  keystore.crypto.mac = `0${keystore.crypto.mac.slice(1)}`;

  await assert.rejects(
    decryptV3Raw(JSON.stringify(keystore), DEMO_PASSWORD),
    /Wrong password or corrupted file/
  );
});

test('decryptV3Raw rejects unsafe scrypt parameters', async () => {
  const keystore = cloneDemoKeystore();
  keystore.crypto.kdfparams.n = 3;

  await assert.rejects(
    decryptV3Raw(JSON.stringify(keystore), DEMO_PASSWORD),
    /Invalid scrypt N/
  );
});

test('decryptV3Raw rejects oversized JSON input', async () => {
  const oversizedJson = JSON.stringify({
    version: 3,
    padding: 'x'.repeat(MAX_JSON_BYTES + 64)
  });

  await assert.rejects(
    decryptV3Raw(oversizedJson, DEMO_PASSWORD),
    /JSON input is too large/
  );
});
