export const DEMO_PASSWORD = 'test-password';

export const DEMO_KEYSTORE_OBJECT = Object.freeze({
  version: 3,
  id: '00000000-0000-4000-8000-000000000001',
  name: 'Demo wallet',
  crypto: {
    ciphertext:
      '61a52dbeb50fecbb91d6c955bfe994e5fd550a0eec7767a11a84e306c46439b8d83d05bc069e488076043bc364e5610ba1fa56597e778b4454a0508d3a6338b6e26b8aa608b8403ecda1b9',
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
    mac: 'ebf4ac503ef49ddb5d216e4f5cf2dafa1c272d43dab3bd789a81d96340f7cc61'
  },
  activeAccounts: [
    {
      address: '0x219D5b85644457E7bfD42670c545c89c22E2840F',
      coin: 60,
      derivationPath: "m/44'/60'/0'/0/0"
    }
  ]
});

export const DEMO_KEYSTORE_JSON = JSON.stringify(DEMO_KEYSTORE_OBJECT, null, 2);

export const DEMO_EXPECTED = Object.freeze({
  hex: '696e66616e742077686973706572206672657175656e742067656e6572616c206d6172626c6520636861707465722073756e20646f67206475636b206f6365616e2063616b652068756e74',
  utf8: 'infant whisper frequent general marble chapter sun dog duck ocean cake hunt',
  base64:
    'aW5mYW50IHdoaXNwZXIgZnJlcXVlbnQgZ2VuZXJhbCBtYXJibGUgY2hhcHRlciBzdW4gZG9nIGR1Y2sgb2NlYW4gY2FrZSBodW50',
  length: 75
});
