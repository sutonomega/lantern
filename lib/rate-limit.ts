import { NextResponse, type NextRequest } from "next/server";
import { sessionCookieName } from "@/lib/auth/session";

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export function rateLimit(
  request: NextRequest,
  action: string,
  options: { limit: number; windowMs: number }
) {
  const now = Date.now();
  const identity =
    request.cookies.get(sessionCookieName)?.value ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "anonymous";
  const key = `${action}:${identity}`;
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + options.windowMs });
    return null;
  }

  if (current.count >= options.limit) {
    return NextResponse.json(
      { error: "操作が続いています。少し時間をおいてください。" },
      { status: 429 }
    );
  }

  current.count += 1;
  return null;
}
