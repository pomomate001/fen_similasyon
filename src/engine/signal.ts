/**
 * Sahne betiğinin bir kullanıcı etkileşimini beklemesi için sinyal.
 * Bekleyen yokken gelen son tetikleme saklanır: öğrenci anlatım bitmeden
 * "Kontrol Et"e basarsa tıklama kaybolmaz, betik sıra gelince onu işler.
 */
export interface Signal<T = void> {
  wait(): Promise<T>;
  fire(value: T): void;
  /** Saklanan tetiklemeyi siler */
  clear(): void;
}

export function createSignal<T = void>(): Signal<T> {
  let waiters: Array<(v: T) => void> = [];
  let pending: { value: T } | null = null;
  return {
    wait() {
      if (pending) {
        const v = pending.value;
        pending = null;
        return Promise.resolve(v);
      }
      return new Promise<T>((resolve) => waiters.push(resolve));
    },
    fire(value: T) {
      if (waiters.length === 0) {
        pending = { value };
        return;
      }
      const w = waiters;
      waiters = [];
      w.forEach((r) => r(value));
    },
    clear() {
      pending = null;
    },
  };
}

export class CancelError extends Error {
  constructor() {
    super('Sahne iptal edildi');
    this.name = 'CancelError';
  }
}

export function isCancel(e: unknown): boolean {
  return e instanceof CancelError;
}

/** Bir sözü AbortSignal ile yarıştırır: iptal edilirse CancelError fırlatır. */
export function guard<T>(signal: AbortSignal, p: Promise<T>): Promise<T> {
  const out = guardRaw(signal, p);
  // Beklenmeden başlatılan adımlar (ör. anlatım işaretinde başlayan animasyon) sahne
  // değişince CancelError ile biter; bu beklenen bir durumdur, "yakalanmamış hata" sayılmaz.
  out.catch((e) => {
    if (!isCancel(e)) throw e;
  });
  return out;
}

function guardRaw<T>(signal: AbortSignal, p: Promise<T>): Promise<T> {
  if (signal.aborted) return Promise.reject(new CancelError());
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(new CancelError());
    signal.addEventListener('abort', onAbort, { once: true });
    p.then(
      (v) => {
        signal.removeEventListener('abort', onAbort);
        resolve(v);
      },
      (e) => {
        signal.removeEventListener('abort', onAbort);
        reject(e);
      },
    );
  });
}
