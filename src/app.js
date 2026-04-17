import { decryptV3Raw } from './decrypt-v3.js';
import { DEMO_KEYSTORE_JSON, DEMO_PASSWORD } from './demo-vector.js';

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

function mount() {
  document.title = 'Trust Wallet Backup Decryptor';
  setStyles(document.body, {
    margin: '0',
    backgroundColor: '#f3f0e8',
    color: '#1f1d18',
    fontFamily: 'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  });

  const container = createNode('main', {
    styles: {
      maxWidth: '980px',
      margin: '0 auto',
      padding: '32px 18px 48px'
    }
  });

  const heading = createNode('h1', {
    text: 'Trust Wallet backup decryptor',
    styles: {
      fontSize: '30px',
      lineHeight: '1.15',
      margin: '0 0 12px'
    }
  });

  const description = createNode('p', {
    text: 'Local browser-based tool for decrypting a Trust Wallet backup JSON and revealing its plaintext payload, often a recovery phrase.',
    styles: {
      margin: '0 0 12px',
      fontSize: '15px',
      lineHeight: '1.6',
      color: '#4d473d',
      maxWidth: '760px'
    }
  });

  const helper = createNode('p', {
    text: `Built-in demo JSON password: ${DEMO_PASSWORD}`,
    styles: {
      margin: '0 0 24px',
      fontSize: '14px',
      color: '#5c5448'
    }
  });

  const form = createNode('form', {
    attrs: {
      novalidate: 'novalidate'
    },
    styles: {
      display: 'grid',
      gap: '12px'
    }
  });

  const jsonLabel = createNode('label', {
    text: 'Backup JSON',
    attrs: { for: 'json-input' },
    styles: {
      fontWeight: '600'
    }
  });

  const jsonInput = createNode('textarea', {
    value: DEMO_KEYSTORE_JSON,
    attrs: {
      id: 'json-input',
      spellcheck: 'false',
      autocapitalize: 'off',
      autocomplete: 'off'
    },
    styles: {
      width: '100%',
      minHeight: '280px',
      boxSizing: 'border-box',
      border: '1px solid #b9b0a0',
      borderRadius: '10px',
      padding: '14px',
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      fontSize: '13px',
      lineHeight: '1.55',
      backgroundColor: '#fffdf8',
      color: '#1f1d18',
      resize: 'vertical'
    }
  });

  const passwordLabel = createNode('label', {
    text: 'Password',
    attrs: { for: 'password-input' },
    styles: {
      fontWeight: '600',
      marginTop: '4px'
    }
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
    styles: {
      width: '100%',
      boxSizing: 'border-box',
      border: '1px solid #b9b0a0',
      borderRadius: '10px',
      padding: '12px 14px',
      fontSize: '15px',
      backgroundColor: '#fffdf8',
      color: '#1f1d18'
    }
  });

  const button = createNode('button', {
    text: 'Decrypt',
    attrs: { type: 'submit' },
    styles: {
      width: 'fit-content',
      border: '0',
      borderRadius: '999px',
      padding: '12px 18px',
      backgroundColor: '#2f6f57',
      color: '#ffffff',
      fontSize: '15px',
      fontWeight: '600',
      cursor: 'pointer'
    }
  });

  const output = createNode('pre', {
    attrs: { 'aria-live': 'polite' },
    styles: {
      margin: '8px 0 0',
      minHeight: '180px',
      padding: '14px',
      borderRadius: '10px',
      backgroundColor: '#181611',
      color: '#f4f0e6',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      fontSize: '13px',
      lineHeight: '1.55'
    }
  });

  form.append(jsonLabel, jsonInput, passwordLabel, passwordInput, button, output);
  container.append(heading, description, helper, form);
  document.body.replaceChildren(container);

  form.addEventListener('submit', async event => {
    event.preventDefault();

    button.disabled = true;
    button.style.opacity = '0.7';
    button.style.cursor = 'wait';
    output.textContent = 'Working...';

    try {
      const result = await decryptV3Raw(jsonInput.value, passwordInput.value);
      try {
        output.textContent = formatResult(result);
      } finally {
        if (result.plaintext instanceof Uint8Array) {
          result.plaintext.fill(0);
        }
      }
    } catch (error) {
      output.textContent = `Decrypt failed: ${formatErrorMessage(error)}`;
    } finally {
      passwordInput.value = '';
      button.disabled = false;
      button.style.opacity = '1';
      button.style.cursor = 'pointer';
      passwordInput.focus();
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount, { once: true });
} else {
  mount();
}
