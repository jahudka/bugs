export function snake(v: string): string {
  return v.replace(/(^|.)([A-Z])/g, (_, p, c) => `${p}${p.length ? '_' : ''}${c.toLowerCase()}`);
}
