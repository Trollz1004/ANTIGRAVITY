import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function loadCockpitScript() {
  const html = fs.readFileSync(new URL('./index.html', import.meta.url), 'utf8');
  const match = html.match(/<script>([\s\S]*?)<\/script>/i);
  assert.ok(match, 'cockpit inline script must exist');

  const elements = new Map();
  function makeElement(tag = 'div', id = '') {
    return {
      tagName: tag.toUpperCase(),
      id,
      className: '',
      textContent: '',
      innerHTML: '',
      hidden: false,
      href: '',
      value: '',
      dataset: {},
      children: [],
      listeners: {},
      classList: {
        add() {},
        remove() {},
      },
      appendChild(child) {
        this.children.push(child);
        return child;
      },
      querySelector() {
        return null;
      },
      querySelectorAll() {
        return this.children;
      },
      addEventListener(event, fn) {
        this.listeners[event] = fn;
      },
      focus() {},
    };
  }

  const document = {
    getElementById(id) {
      if (!elements.has(id)) {
        elements.set(id, makeElement('div', id));
      }
      return elements.get(id);
    },
    createElement(tag) {
      return makeElement(tag);
    },
    addEventListener() {},
  };

  const windowObj = {
    location: { hostname: '127.0.0.1', protocol: 'file:', port: '' },
    addEventListener() {},
  };

  const context = {
    window: windowObj,
    location: windowObj.location,
    navigator: { onLine: true },
    document,
    sessionStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    fetch: async () => ({ ok: false }),
    AbortController,
    setTimeout: () => 1,
    clearTimeout() {},
    setInterval: () => 1,
    clearInterval() {},
    Date,
    String,
    Array,
    Object,
    console,
  };
  context.globalThis = context;
  vm.runInNewContext(match[1], context);
  return { renderers: context.CockpitRenderers, elements, html };
}

test('Finding 7: escapeHtml and cockpit rendering functions escape <img onerror> payloads and avoid inline onclick', () => {
  const { renderers, elements, html } = loadCockpitScript();
  assert.equal(typeof renderers.escapeHtml, 'function');
  assert.doesNotMatch(html, /\bonclick\s*=/i);

  const payload = '<img src=x onerror=alert(1)>';
  assert.equal(renderers.escapeHtml(payload), '&lt;img src=x onerror=alert(1)&gt;');

  renderers.renderWatchRows([
    {
      id: 'svc-xss',
      label: '<img onerror="alert(1)" src="x">',
      url: 'http://127.0.0.1:9150/<img onerror=alert(2)>',
    },
  ]);

  const watchList = elements.get('watch-list');
  assert.equal(watchList.children.length, 1);
  const watchRowHtml = watchList.children[0].innerHTML;
  assert.match(watchRowHtml, /&lt;img onerror=&quot;alert\(1\)&quot; src=&quot;x&quot;&gt;/);
  assert.match(watchRowHtml, /&lt;img onerror=alert\(2\)&gt;/);
  assert.doesNotMatch(watchRowHtml, /<img/i);

  renderers.pushAlert('bad', '<img onerror=alert(3)>', 'Alert <img onerror=alert(4)>');
  const alertsList = elements.get('alerts-list');
  assert.equal(alertsList.children.length, 1);
  const alertRowHtml = alertsList.children[0].innerHTML;
  assert.match(alertRowHtml, /&lt;img onerror=alert\(3\)&gt;/);
  assert.match(alertRowHtml, /&lt;img onerror=alert\(4\)&gt;/);
  assert.doesNotMatch(alertRowHtml, /<img/i);
});
