# Trust Wallet Backup Decryptor

Offline browser tool to decrypt a Trust Wallet backup JSON (Web3 Secret Storage v3 style) using its password.

## What It Does

- Decrypts locally in the browser, with no server.
- Outputs plaintext as `UTF-8`, `HEX`, `Base64`, and byte length.
- Accepts Trust Wallet / Wallet Core style metadata, but uses only `crypto` fields for decryption.

## Quick Start

1. Install dependencies:
   ```bash
   npm ci
   ```
2. Run full validation (tests + artifact verification):
   ```bash
   npm run check
   ```
3. Open `dist/index.html` locally in your browser.
4. Paste backup JSON, enter password, click `Decrypt`.

## Security Model

- Intended for local, offline use on a trusted machine.
- Final artifact is a single HTML file with strict CSP.
- Verification rejects external resources and network APIs.
- Artifact reproducibility check ensures stable output hash across builds.

## Supported Input and Limits

- Supports only:
  - `version: 3`
  - `kdf: scrypt`
  - `cipher: aes-128-ctr`
- Required decryption fields:

```json
{
  "version": 3,
  "crypto": {
    "ciphertext": "<hex>",
    "cipherparams": { "iv": "<16-byte hex>" },
    "cipher": "aes-128-ctr",
    "kdf": "scrypt",
    "kdfparams": { "n": 16384, "r": 8, "p": 1, "dklen": 32, "salt": "<hex>" },
    "mac": "<32-byte hex>"
  }
}
```

- JSON input size limit: 1 MiB.
- Decrypts payload bytes only (no address derivation or mnemonic validation).

## What Is Used

- Runtime: Node.js (ESM) and browser-only offline artifact.
- Crypto:
  - `scrypt-js` (key derivation)
  - `@noble/hashes` (`keccak_256` MAC check)
  - `@noble/ciphers` (`aes-128-ctr` decryption)
- Build: `esbuild`.
- Validation: `node:test` and custom offline/reproducibility checks.
- CI/CD: GitHub Actions + GitHub Pages.

## Demo vs Local Usage

- Public demo: [mbogdan0.github.io/trust-wallet-backup-decryptor](https://mbogdan0.github.io/trust-wallet-backup-decryptor/)
- Demo is for the safe built-in example vector only.
- For real backups, use a local build (`dist/index.html`) instead of the public site.
- Demo vector lives in [`src/demo-vector.js`](src/demo-vector.js).

## Validation Commands

- `npm test`: decryption and error-path unit tests.
- `npm run build`: produces `dist/index.html`.
- `npm run verify:offline`: validates a built artifact for offline constraints.
- `npm run verify:artifact`: builds twice, validates each output, checks identical hashes.
- `npm run check`: `npm test` + `npm run verify:artifact` (recommended).
