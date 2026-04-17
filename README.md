# Trust Wallet Backup Decryptor

Local offline tool for decrypting Trust Wallet backup JSON and compatible Web3 Secret Storage v3 keystore files directly in the browser.

## What This Project Is For

- Accepts a Trust Wallet backup JSON or compatible keystore JSON plus its password.
- Decrypts the protected payload entirely in the browser on your local machine.
- Shows the decrypted payload as `HEX`, `UTF-8`, and `Base64`.
- Makes no HTTP requests and does not require a server.

Trust Wallet's normal consumer backup guidance focuses on manually writing down the recovery phrase inside the app. This repository is for the separate encrypted JSON backup or keystore case: a JSON object with a Web3 Secret Storage v3-style `crypto` section and optional wallet metadata such as `id`, `name`, `type`, or `activeAccounts`.

In other words, if you have the encrypted backup JSON and its password, this tool lets you decrypt that payload locally without opening the Trust Wallet app itself.

## What This Backup JSON Usually Looks Like

The input this tool expects is a JSON object that includes:

- `version: 3`
- a `crypto` object with `ciphertext`, `cipherparams.iv`, `kdf`, `kdfparams`, and `mac`
- optional metadata around the `crypto` section such as `id`, `name`, `type`, `address`, or `activeAccounts`

This matches the Web3 Secret Storage v3 / stored-key style structure used by Trust Wallet Core-style JSON exports. The decryptor intentionally ignores metadata outside the `crypto` section and only uses the fields required to derive the key, verify the MAC, and decrypt the ciphertext.

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

The build writes two equivalent HTML files:

- `dist/trust-wallet-backup-decryptor.html` for local offline use
- `dist/index.html` for GitHub Pages root deployment

## Local Usage

1. Build the project with `npm run check` or `npm run build`.
2. Open `dist/trust-wallet-backup-decryptor.html` directly in your browser.
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

- Preview URL: [https://mbogdan0.github.io/trust-wallet-backup-decryptor/](https://mbogdan0.github.io/trust-wallet-backup-decryptor/)
- Pushes to `main` trigger a GitHub Actions workflow that runs `npm run check`, builds the site, and deploys the demo to GitHub Pages.
- GitHub Pages serves `dist/index.html`, so the demo opens at the site root.
- The Pages site is a public demo for the interface and safe built-in demo vector only.
- For real sensitive Trust Wallet backups, use the locally built `dist/trust-wallet-backup-decryptor.html` instead of the public Pages URL.

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
- This is a local utility for manual recovery from encrypted backup JSON, not a hosted service or general wallet replacement.

## Before Uploading to GitHub

- `dist/` is intentionally ignored because it contains generated build artifacts.
- `.idea/` and `*.iml` are intentionally ignored because they are local IDE files.
- Do not upload real Trust Wallet backup files.
- Do not store real passwords in source files, tests, notes, or commit history.

## Safety Notes

- Use the generated HTML locally on a trusted machine.
- Rebuild the artifact before using it with real backup files if you changed the source code.
- Treat the decrypted output exactly like a recovery phrase or private key: anyone who gets it can control the wallet.
