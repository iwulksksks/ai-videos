// Password login. When REELHOUSE_PASSWORD is set, every page and API route asks for it (HTTP Basic auth).
import { NextResponse, type NextRequest } from "next/server";

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function proxy(req: NextRequest) {
  const password = process.env.REELHOUSE_PASSWORD;
  if (!password) return NextResponse.next();
  const user = process.env.REELHOUSE_USER || "reelhouse";
  const header = req.headers.get("authorization") ?? "";
  if (header.startsWith("Basic ")) {
    try {
      const [u, ...rest] = atob(header.slice(6)).split(":");
      if (safeEqual(u, user) && safeEqual(rest.join(":"), password)) return NextResponse.next();
    } catch {
      /* fall through */
    }
  }
  return new NextResponse("Reelhouse is locked. Sign in with your user name and password.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Reelhouse", charset="UTF-8"' },
  });
}
