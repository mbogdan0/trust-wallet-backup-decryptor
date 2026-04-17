# Trust Wallet Backup Decryptor

Local offline tool for decrypting Trust Wallet backup files stored as Web3 Secret Storage v3.

## What It Does

- Accepts a backup JSON file and password.
- Decrypts the content entirely in the browser on your local machine.
- Shows the result in `HEX`, `UTF-8`, and `Base64`.
- Makes no HTTP requests and does not require a server.

## Build

```bash
npm install
npm run build
```

The generated HTML artifact is written to `dist/trust-wallet-backup-decryptor.html`.

## Usage

1. Build the project with `npm run build`.
2. Open `dist/trust-wallet-backup-decryptor.html` directly in your browser.
3. Paste the Trust Wallet backup JSON.
4. Enter the password used to protect the backup.
5. Click `Decrypt`.

## Validation

- `npm run check` runs the full validation flow: tests, build, offline verification, and artifact reproducibility checks.
- `npm test` runs the decryption and error-handling tests.
- `npm run verify:offline` checks that the final HTML does not use network APIs or external resources.
- `npm run verify:artifact` checks that repeated builds are reproducible.

## Limitations

- Supports Web3 Secret Storage `version: 3`.
- Supports `scrypt` as the KDF.
- Supports `aes-128-ctr` as the cipher.
- This is a local utility for manual backup-file recovery, not a hosted service or public web app.

## Before Uploading to GitHub

- `dist/` is intentionally ignored because it contains generated build artifacts.
- `.idea/` and `*.iml` are intentionally ignored because they are local IDE files.
- Do not upload real Trust Wallet backup files.
- Do not store real passwords in source files, tests, notes, or commit history.

## Safety Notes

- Use the generated HTML locally on a trusted machine.
- Rebuild the artifact before using it with real backup files if you changed the source code.
