export type AuthInput = {
  username: string;
  password: string;
};

const usernamePattern = /^[a-zA-Z0-9_]{3,24}$/;

export function parseAuthInput(value: unknown): AuthInput | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const input = value as Partial<Record<keyof AuthInput, unknown>>;

  if (typeof input.username !== "string" || typeof input.password !== "string") {
    return null;
  }

  const username = input.username.trim();
  const password = input.password;

  if (!usernamePattern.test(username) || password.length < 8 || password.length > 128) {
    return null;
  }

  return { username, password };
}
