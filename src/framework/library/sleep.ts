export async function sleep(t: number, signal?: AbortSignal): Promise<void> {
  const done: PromiseWithResolvers<void> = Promise.withResolvers();
  const tmr = setTimeout(done.resolve, t);

  signal?.addEventListener('abort', interrupt);
  await done.promise;
  signal?.removeEventListener('abort', interrupt);

  function interrupt(): void {
    clearTimeout(tmr);
    done.resolve();
  }
}
