export const DEMO_PASSWORD = 'test-password';

export const DEMO_KEYSTORE_OBJECT = Object.freeze({
  version: 3,
  id: '00000000-0000-4000-8000-000000000001',
  crypto: {
    ciphertext: '7fae29ecab1abfbfd9dbdf48b5bbc7e6ec421e0f83',
    cipherparams: {
      iv: '0102030405060708090a0b0c0d0e0f10'
    },
    cipher: 'aes-128-ctr',
    kdf: 'scrypt',
    kdfparams: {
      dklen: 32,
      n: 16384,
      r: 8,
      p: 1,
      salt: '00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff'
    },
    mac: '1ced198e10eae74958fcc31612617c389f247b3d2e4b5a9cdece7c6ff16f8717'
  }
});

export const DEMO_KEYSTORE_JSON = JSON.stringify(DEMO_KEYSTORE_OBJECT, null, 2);

export const DEMO_EXPECTED = Object.freeze({
  hex: '77656233706173732064656d6f207365637265740a',
  utf8: 'web3pass demo secret\n',
  base64: 'd2ViM3Bhc3MgZGVtbyBzZWNyZXQK',
  length: 21
});
