import { decryptV3Raw } from './decrypt-v3.js';
import { DEMO_KEYSTORE_JSON, DEMO_PASSWORD } from './demo-vector.js';

const DEMO_BANNER_HOSTNAMES = new Set(['mbogdan0.github.io', 'www.mbogdan0.github.io']);
const DEMO_BANNER_TEXT =
  'Demo mode: using real backups here is not recommended. For sensitive data, prefer a local build.';

const THEME = Object.freeze({
  pageBackground: '#f3f0e8',
  pageText: '#1f1d18',
  mutedText: '#4d473d',
  subtleText: '#5c5448',
  inputBorder: '#b9b0a0',
  inputBackground: '#fffdf8',
  buttonBackground: '#2f6f57',
  outputBackground: '#181611',
  outputText: '#f4f0e6',
  demoBannerBorder: '#d4c47a',
  demoBannerBackground: '#f7f1cf',
  demoBannerText: '#5f4d16'
});

const FONT_STACKS = Object.freeze({
  sans: 'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  mono: 'ui-monospace, SFMono-Regular, Menlo, monospace'
});

const CONTROL_BASE_STYLES = Object.freeze({
  width: '100%',
  boxSizing: 'border-box',
  border: `1px solid ${THEME.inputBorder}`,
  borderRadius: '10px',
  backgroundColor: THEME.inputBackground,
  color: THEME.pageText
});

const STYLES = Object.freeze({
  body: {
    margin: '0',
    backgroundColor: THEME.pageBackground,
    color: THEME.pageText,
    fontFamily: FONT_STACKS.sans
  },
  container: {
    maxWidth: '980px',
    margin: '0 auto',
    padding: '32px 18px 48px'
  },
  demoBanner: {
    margin: '0 0 18px',
    padding: '10px 14px',
    borderRadius: '10px',
    border: `1px solid ${THEME.demoBannerBorder}`,
    backgroundColor: THEME.demoBannerBackground,
    color: THEME.demoBannerText,
    fontSize: '14px',
    lineHeight: '1.45',
    fontWeight: '500'
  },
  heading: {
    fontSize: '30px',
    lineHeight: '1.15',
    margin: '0 0 12px'
  },
  description: {
    margin: '0 0 12px',
    fontSize: '15px',
    lineHeight: '1.6',
    color: THEME.mutedText,
    maxWidth: '760px'
  },
  helper: {
    margin: '0 0 24px',
    fontSize: '14px',
    color: THEME.subtleText
  },
  form: {
    display: 'grid',
    gap: '12px'
  },
  label: {
    fontWeight: '600'
  },
  passwordLabel: {
    marginTop: '4px'
  },
  textarea: {
    ...CONTROL_BASE_STYLES,
    minHeight: '280px',
    padding: '14px',
    fontFamily: FONT_STACKS.mono,
    fontSize: '13px',
    lineHeight: '1.55',
    resize: 'vertical'
  },
  passwordInput: {
    ...CONTROL_BASE_STYLES,
    padding: '12px 14px',
    fontSize: '15px'
  },
  submitButton: {
    width: 'fit-content',
    border: '0',
    borderRadius: '999px',
    padding: '12px 18px',
    backgroundColor: THEME.buttonBackground,
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  output: {
    margin: '8px 0 0',
    minHeight: '180px',
    padding: '14px',
    borderRadius: '10px',
    backgroundColor: THEME.outputBackground,
    color: THEME.outputText,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    fontFamily: FONT_STACKS.mono,
    fontSize: '13px',
    lineHeight: '1.55'
  }
});

function setStyles(node, styles) {
  Object.assign(node.style, styles);
  return node;
}

function createNode(tagName, { text, value, attrs, styles } = {}) {
  const node = document.createElement(tagName);

  if (text !== undefined) node.textContent = text;
  if (value !== undefined) node.value = value;
  if (attrs) {
    for (const [name, attrValue] of Object.entries(attrs)) {
      node.setAttribute(name, attrValue);
    }
  }
  if (styles) setStyles(node, styles);

  return node;
}

function formatResult(result) {
  return [
    'OK',
    '',
    `Plaintext length: ${result.length} bytes`,
    '',
    'HEX:',
    result.hex,
    '',
    'UTF-8:',
    result.utf8,
    '',
    'Base64:',
    result.base64
  ].join('\n');
}

function formatErrorMessage(error) {
  return error instanceof Error ? error.message : 'Unknown error';
}

function shouldShowDemoBanner() {
  return DEMO_BANNER_HOSTNAMES.has(window.location.hostname.toLowerCase());
}

function createDemoBanner() {
  return createNode('div', {
    text: DEMO_BANNER_TEXT,
    attrs: {
      role: 'status'
    },
    styles: STYLES.demoBanner
  });
}

function setBusyState(button, isBusy) {
  button.disabled = isBusy;
  button.style.opacity = isBusy ? '0.7' : '1';
  button.style.cursor = isBusy ? 'wait' : 'pointer';
}

function renderSuccess(output, result) {
  output.textContent = formatResult(result);
}

function renderError(output, error) {
  output.textContent = `Decrypt failed: ${formatErrorMessage(error)}`;
}

function clearPlaintext(result) {
  if (result?.plaintext instanceof Uint8Array) {
    result.plaintext.fill(0);
  }
}

function mount() {
  document.title = 'Trust Wallet Backup Decryptor';
  setStyles(document.body, STYLES.body);

  const container = createNode('main', {
    styles: STYLES.container
  });

  if (shouldShowDemoBanner()) {
    container.append(createDemoBanner());
  }

  const heading = createNode('h1', {
    text: 'Trust Wallet backup decryptor',
    styles: STYLES.heading
  });

  const description = createNode('p', {
    text: 'Local browser-based tool for decrypting a Trust Wallet backup JSON and revealing its plaintext payload, often a recovery phrase.',
    styles: STYLES.description
  });

  const helper = createNode('p', {
    text: `Built-in demo JSON password: ${DEMO_PASSWORD}`,
    styles: STYLES.helper
  });

  const form = createNode('form', {
    attrs: {
      novalidate: 'novalidate'
    },
    styles: STYLES.form
  });

  const jsonLabel = createNode('label', {
    text: 'Backup JSON',
    attrs: { for: 'json-input' },
    styles: STYLES.label
  });

  const jsonInput = createNode('textarea', {
    value: DEMO_KEYSTORE_JSON,
    attrs: {
      id: 'json-input',
      spellcheck: 'false',
      autocapitalize: 'off',
      autocomplete: 'off'
    },
    styles: STYLES.textarea
  });

  const passwordLabel = createNode('label', {
    text: 'Password',
    attrs: { for: 'password-input' },
    styles: { ...STYLES.label, ...STYLES.passwordLabel }
  });

  const passwordInput = createNode('input', {
    attrs: {
      id: 'password-input',
      type: 'password',
      placeholder: 'Enter password',
      autocomplete: 'off',
      autocapitalize: 'off',
      spellcheck: 'false'
    },
    styles: STYLES.passwordInput
  });

  const button = createNode('button', {
    text: 'Decrypt',
    attrs: { type: 'submit' },
    styles: STYLES.submitButton
  });

  const output = createNode('pre', {
    attrs: { 'aria-live': 'polite' },
    styles: STYLES.output
  });

  form.append(jsonLabel, jsonInput, passwordLabel, passwordInput, button, output);
  container.append(heading, description, helper, form);
  document.body.replaceChildren(container);

  form.addEventListener('submit', async event => {
    event.preventDefault();

    setBusyState(button, true);
    output.textContent = 'Working...';

    try {
      const result = await decryptV3Raw(jsonInput.value, passwordInput.value);
      try {
        renderSuccess(output, result);
      } finally {
        clearPlaintext(result);
      }
    } catch (error) {
      renderError(output, error);
    } finally {
      passwordInput.value = '';
      setBusyState(button, false);
      passwordInput.focus();
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount, { once: true });
} else {
  mount();
}
