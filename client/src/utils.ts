export const matchesQuery = (s: string, query: string): boolean =>
  s.toLocaleLowerCase().includes(query.toLowerCase());
