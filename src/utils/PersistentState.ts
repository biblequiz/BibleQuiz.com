import { atom } from 'nanostores';

/**
 * Creates an atom backed by sessionStorage. The value persists across page refreshes
 * within the same browser tab but is automatically cleared when the tab is closed.
 * Does not sync between tabs.
 *
 * @param key - The sessionStorage key to persist under.
 * @param defaultValue - The value to use when no stored value exists (or during SSR).
 */
export function sessionAtom<T>(key: string, defaultValue: T) {
    const initial = typeof window !== 'undefined'
        ? (() => { const v = sessionStorage.getItem(key); return v !== null ? JSON.parse(v) : defaultValue; })()
        : defaultValue;
    const store = atom<T>(initial);
    store.listen((value) => {
        sessionStorage.setItem(key, JSON.stringify(value));
    });
    return store;
}