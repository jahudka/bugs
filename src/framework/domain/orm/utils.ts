export function placeholders(values: any[], offset: number = 0): string {
  return [...new Array(values.length).keys()].map((p) => `?${p + offset + 1}`).join(', ');
}
