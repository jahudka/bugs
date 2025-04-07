export function unixTimestamp(): number {
  return Math.trunc(Date.now() / 1000);
}
