import { atom } from "nanostores";

/**
 * Creates a new atom that works across a single window in multiple react roots.
 * @param key Key for the atom.
 * @param initial Initial value.
 * @returns Shared atom.
 */
export function createMultiReactAtom<T>(key: string, initial: T): ReturnType<typeof atom<T>> {

    const windowKey: any = `__nano_${key}`;
    if (typeof window === "undefined") {
        return atom<T>(initial);
    }

    const currentAtom = window[windowKey] as any as ReturnType<typeof atom<T>> | undefined;
    if (currentAtom) {
        return currentAtom;
    }

    const newAtom = atom<T>(initial);
    (window as any)[windowKey as any] = newAtom;
    return newAtom;
}