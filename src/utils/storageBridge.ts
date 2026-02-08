/**
 * Storage bridge: extension uses chrome.storage.local, web uses sessionStorage.
 * Same keys and values in both; extension cache is synced at app load and on every set/remove.
 */

declare const chrome: { runtime?: { id?: string }; storage?: { local?: { get: (keys: null | string[], cb: (items: Record<string, string>) => void) => void; set: (items: Record<string, string>, cb?: () => void) => void; remove: (keys: string | string[], cb?: () => void) => void } } } | undefined;

const cache: Record<string, string> = {};
let extensionLoaded = false;

export function isExtension(): boolean {
  if (typeof globalThis === 'undefined') return false;
  const w = globalThis as Window & { chrome?: typeof chrome };
  return !!(w.chrome?.runtime?.id && w.chrome?.storage?.local);
}

/**
 * Load extension storage into cache. Call once before any getItem when in extension.
 */
export function loadExtensionStorage(): Promise<void> {
  if (!isExtension()) return Promise.resolve();
  const w = globalThis as Window & { chrome: typeof chrome };
  return new Promise((resolve) => {
    w.chrome.storage!.local!.get(null, (items: Record<string, unknown>) => {
      const raw = items as Record<string, string>;
      if (raw && typeof raw === 'object') {
        for (const k of Object.keys(raw)) if (typeof raw[k] === 'string') cache[k] = raw[k];
      }
      extensionLoaded = true;
      resolve();
    });
  });
}

function getChrome(): typeof chrome | undefined {
  if (typeof globalThis === 'undefined') return undefined;
  return (globalThis as Window & { chrome?: typeof chrome }).chrome;
}

export function getItem(key: string): string | null {
  if (isExtension()) return extensionLoaded ? (cache[key] ?? null) : null;
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

export function setItem(key: string, value: string): void {
  if (isExtension()) {
    cache[key] = value;
    const c = getChrome();
    if (c?.storage?.local) c.storage.local.set({ [key]: value });
    return;
  }
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

export function removeItem(key: string): void {
  if (isExtension()) {
    delete cache[key];
    const c = getChrome();
    if (c?.storage?.local) c.storage.local.remove(key);
    return;
  }
  try {
    sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
}
