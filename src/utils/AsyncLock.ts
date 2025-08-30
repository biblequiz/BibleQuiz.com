/**
 * Async lock imlementation.
 */
export class AsyncLock {
  private _locked = false;
  private _waiting: (() => void)[] = [];

  /**
   * Acquires the lock. If it is already locked, waits until it is released and then acquire it.
   * @returns Promise that resolves when the lock is acquired.
   */
  async acquireOrWait(): Promise<void> {
    if (!this._locked) {
      this._locked = true;
      return;
    }
    await new Promise<void>(resolve => this._waiting.push(resolve));
  }

  /**
   * Releases the lock. This should only be called after `acquireOrWait` has been called.
   */
  release(): void {
    if (this._waiting.length > 0) {
      const next = this._waiting.shift();
      if (next) next();
    } else {
      this._locked = false;
    }
  }
}