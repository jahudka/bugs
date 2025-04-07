export function* map<In, Out>(iterable: Iterable<In>, cb: (value: In) => Out): Iterable<Out> {
  for (const value of iterable) {
    yield cb(value);
  }
}

type MapLike<K, V> = Map<K, V> | (K extends object ? WeakMap<K, V> : never);

export function getOrCreate<K, V>(map: MapLike<K, V>, key: K, factory: () => V): V {
  const existing = map.get(key);

  if (existing !== undefined) {
    return existing;
  }

  const value = factory();
  map.set(key, value);
  return value;
}

export type AbortableStream<T> = AsyncIterable<T> & {
  abort(): void;
};

export function toAbortable<T>(src: AsyncIterable<T>): AbortableStream<T> {
  const aborted: PromiseWithResolvers<never> = Promise.withResolvers();

  return {
    abort() {
      aborted.reject(new Aborted());
    },
    async *[Symbol.asyncIterator]() {
      const it = src[Symbol.asyncIterator]();

      try {
        for (
          let res = await Promise.race([it.next(), aborted.promise]);
          !res.done;
          res = await Promise.race([it.next(), aborted.promise])
        ) {
          yield res.value;
        }
      } catch (e: unknown) {
        if (!(e instanceof Aborted)) {
          throw e;
        }
      } finally {
        it.return?.();
      }
    },
  };
}

class Aborted extends Error {}
