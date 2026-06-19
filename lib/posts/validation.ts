export const maxPostBodyLength = 180;
export const maxSearchQueryLength = 40;

export function parsePostBody(value: unknown) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const input = value as { body?: unknown };

  if (typeof input.body !== "string") {
    return null;
  }

  const body = input.body.trim();

  if (!body || body.length > maxPostBodyLength) {
    return null;
  }

  return body;
}

export function parseSearchQuery(value: string | null) {
  const query = value?.trim() ?? "";

  if (!query || query.length > maxSearchQueryLength) {
    return null;
  }

  return query;
}
