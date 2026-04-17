# Trust Wallet Backup Decryptor

Local offline tool for decrypting a Trust Wallet backup file in the browser to recover its plaintext payload, most often a seed phrase. It also accepts compatible Web3 Secret Storage v3 / Wallet Core-style JSON.

## Live Demo

**[Open the example demo](https://mbogdan0.github.io/trust-wallet-backup-decryptor/)**

The public GitHub Pages site is only for the safe built-in example JSON. For any real sensitive backup file, build locally and open `dist/index.html` on a trusted machine.

## What This Project Is For

- Accepts a Trust Wallet backup JSON plus its password.
- Decrypts the protected payload entirely in the browser on your local machine.
- Shows the decrypted payload as `UTF-8`, `HEX`, and `Base64`.
- Makes no HTTP requests and does not require a server.

Trust Wallet's normal consumer backup guidance focuses on viewing, writing down, and restoring the recovery phrase inside the app:

- [Encrypted Cloud Backup guidance](https://support.trustwallet.com/support/solutions/articles/67000734541-best-practices-for-recovery-phrase-storage)
- [How to back up your recovery phrase](https://support.trustwallet.com/support/solutions/articles/67000748490-how-to-backup-your-recovery-phrase-in-trust-wallet)
- [Import a wallet via secret phrase](https://support.trustwallet.com/support/solutions/articles/67000731384-import-a-wallet-via-secret-phrase)

This repository covers the separate encrypted backup file case: if you already have the backup JSON and its password, you can decrypt it locally without opening Trust Wallet itself. The decryptor also accepts compatible Web3 Secret Storage `version: 3` / Wallet Core-style JSON objects with a `crypto` section and optional metadata such as `id`, `name`, or `activeAccounts`.

## Example Backup JSON

Safe built-in demo password:

```text
test-password
```

Safe built-in demo JSON:

```json
{
  "version": 3,
  "id": "00000000-0000-4000-8000-000000000001",
  "name": "Demo wallet",
  "crypto": {
    "ciphertext": "61a52dbeb50fecbb91d6c955bfe994e5fd550a0eec7767a11a84e306c46439b8d83d05bc069e488076043bc364e5610ba1fa56597e778b4454a0508d3a6338b6e26b8aa608b8403ecda1b9",
    "cipherparams": {
      "iv": "0102030405060708090a0b0c0d0e0f10"
    },
    "cipher": "aes-128-ctr",
    "kdf": "scrypt",
    "kdfparams": {
      "dklen": 32,
      "n": 16384,
      "r": 8,
      "p": 1,
      "salt": "00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff"
    },
    "mac": "ebf4ac503ef49ddb5d216e4f5cf2dafa1c272d43dab3bd789a81d96340f7cc61"
  },
  "activeAccounts": [
    {
      "address": "0x219D5b85644457E7bfD42670c545c89c22E2840F",
      "coin": 60,
      "derivationPath": "m/44'/60'/0'/0/0"
    }
  ]
}
```

With the correct password, the `UTF-8` output is:

```text
infant whisper frequent general marble chapter sun dog duck ocean cake hunt
```

The decryptor intentionally ignores metadata outside `crypto` and only uses the fields required to derive the key, verify the MAC, and decrypt the ciphertext.

## Build

```bash
npm ci
npm run check
```

`npm run check` is the universal validation command. It runs tests, builds the final HTML, verifies the offline invariant, and checks reproducible output.

If you only want the artifact:

```bash
npm run build
```

`npm run build` writes one offline artifact: `dist/index.html`.

## Local Usage

1. Build the project with `npm run check` or `npm run build`.
2. Open `dist/index.html` directly in your browser.
3. Paste the Trust Wallet backup JSON.
4. Enter the password used to protect the backup.
5. Click `Decrypt`.

For real secrets, prefer the local HTML file over the public GitHub Pages demo.

## What You Get After Decryption

- `UTF-8` is the most useful view when the decrypted payload is readable text.
- If the payload is mnemonic text, the `UTF-8` section is where you will see the recovery phrase locally, without Trust Wallet.
- `HEX` and `Base64` are binary-safe views for cases where the payload is not plain text or you want an exact byte-for-byte representation.
- `Plaintext length` helps confirm whether the result looks like a short text secret, binary blob, or another encoded payload.

This tool decrypts the payload. It does not claim that every Trust Wallet backup JSON always contains a mnemonic phrase. Depending on how the keystore was created, the plaintext may be a mnemonic, a private key, or another wallet secret representation.

## GitHub Pages Demo

- Pushes to `main` trigger a GitHub Actions workflow that runs `npm run check`, builds the site, and deploys the demo to GitHub Pages.
- GitHub Pages serves `dist/index.html`, so the demo opens at the site root.
- The Pages site is a public demo for the interface and safe built-in example data only.
- For real sensitive Trust Wallet backups, use the locally built `dist/index.html` instead of the public Pages URL.

## Validation and Safety Checks

- `npm run check` runs the full validation flow: tests, build, offline verification, and artifact reproducibility checks.
- `npm test` runs the decryption and error-handling tests.
- `npm run verify:offline` checks that the final HTML does not use network APIs or external resources.
- `npm run verify:artifact` checks that repeated builds are reproducible.

The generated HTML also ships with a restrictive Content Security Policy and the build pipeline rejects external URLs, external scripts, fetch/XHR APIs, WebSockets, and workers.

## Limitations

- Supports Web3 Secret Storage `version: 3`.
- Supports `scrypt` as the KDF.
- Supports `aes-128-ctr` as the cipher.
- Decrypts the protected payload only; it does not derive addresses, validate BIP-39 mnemonics, or reconstruct the full Trust Wallet state.
- Not every compatible backup or keystore necessarily decrypts to a mnemonic; the plaintext may be a recovery phrase, a private key, or another wallet secret representation.
- This is a local utility for manual recovery from encrypted backup JSON, not a hosted service or general wallet replacement.

## Safety Notes

- Use the generated HTML locally on a trusted machine.
- Rebuild the artifact before using it with real backup files if you changed the source code.
- Treat the decrypted output exactly like a recovery phrase or private key: anyone who gets it can control the wallet.
