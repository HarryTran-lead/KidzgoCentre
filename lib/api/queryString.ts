export type QueryPrimitive = string | number | boolean | null | undefined;
export type QueryValue = QueryPrimitive | QueryPrimitive[];
export type QueryParams = Record<string, QueryValue>;

export function buildQueryString(params?: QueryParams): string {
  if (!params) {
    return "";
  }

  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      value
        .filter(
          (item): item is string | number | boolean =>
            item !== undefined && item !== null && item !== ""
        )
        .forEach((item) => {
          query.append(key, String(item));
        });
      continue;
    }

    if (value === undefined || value === null || value === "") {
      continue;
    }

    query.append(key, String(value));
  }

  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
}
