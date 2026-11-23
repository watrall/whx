import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/' });
const { window } = dom;

window.matchMedia = (query) => {
  const listeners = new Set();
  return {
    media: query,
    matches: window.__matches?.[query] ?? false,
    addEventListener: (_, fn) => listeners.add(fn),
    removeEventListener: (_, fn) => listeners.delete(fn),
    emit: (matches) => listeners.forEach((fn) => fn({ matches })),
  };
};

for (const key of ['window', 'document', 'localStorage', 'HTMLElement', 'Node', 'MutationObserver']) {
  Object.defineProperty(globalThis, key, { value: window[key], configurable: true, writable: true });
}
Object.defineProperty(globalThis, 'navigator', { value: window.navigator, configurable: true });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

export { window };
