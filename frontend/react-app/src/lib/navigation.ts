export function getSafeNextPath(search: string, fallback: string): string {
  const params = new URLSearchParams(search);
  const next = params.get('next');
  if (!next || !next.startsWith('/app')) {
    return fallback;
  }
  return next;
}
