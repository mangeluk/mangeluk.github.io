import '@testing-library/jest-dom';

// Polyfill localStorage for jsdom environment
interface LocalStorageStore {
  [key: string]: string;
}

declare global {
  // eslint-disable-next-line no-var
  var __localStorageStore: LocalStorageStore | undefined;
}

const localStorageMock: Storage = {
  getItem: (key: string) => {
    return global.__localStorageStore?.[key] ?? null;
  },
  setItem: (key: string, value: string) => {
    if (!global.__localStorageStore) {
      global.__localStorageStore = {};
    }
    global.__localStorageStore[key] = value;
  },
  removeItem: (key: string) => {
    delete global.__localStorageStore?.[key];
  },
  clear: () => {
    global.__localStorageStore = {};
  },
  length: 0,
  key: () => null,
};

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});
