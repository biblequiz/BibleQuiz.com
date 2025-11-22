declare global {
  interface Window {
    localIdGeneratorIds: WeakMap<any, string>;
    localIdGeneratorNextId: number;
  }
}

/**
 * Generator for local IDs.
 */
export default class LocalIdGenerator {
  
  /**
   * Gets a local id for the object.
   * @param object Object requiring an id.
   * @returns Local id (may be a reuse if the object is already known.)
   */
  public static getLocalId<T>(object: T): string {

    if (!window.localIdGeneratorIds) {
      window.localIdGeneratorIds = new WeakMap<any, string>();
      window.localIdGeneratorNextId = 0;
    }

    const resolvedId = window.localIdGeneratorIds.get(object);
    if (resolvedId) {
      return resolvedId;
    }

    const nextId = --window.localIdGeneratorNextId;
    const localId = `local_${-nextId}`;
    window.localIdGeneratorIds.set(object, localId);

    return localId;
  }
}