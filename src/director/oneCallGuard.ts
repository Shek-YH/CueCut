export interface OneCallGuard<T> {
  run(provider: () => Promise<T>): Promise<T>;
  hasCalled(): boolean;
}

export function createOneCallGuard<T>(): OneCallGuard<T> {
  let called = false;

  return {
    async run(provider) {
      if (called) throw new Error('Director inference is limited to once per Generate operation');
      called = true;
      return provider();
    },
    hasCalled: () => called,
  };
}

