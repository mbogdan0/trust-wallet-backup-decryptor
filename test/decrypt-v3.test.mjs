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

test('decryptV3Raw rejects invalid hex input', async () => {
  const keystore = cloneDemoKeystore();
  keystore.crypto.ciphertext = 'zz';

  await assert.rejects(
    decryptV3Raw(JSON.stringify(keystore), DEMO_PASSWORD),
    /Invalid hex/
  );
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
