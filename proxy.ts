import { NextResponse, type NextRequest } from "next/server";
import { isLocale, locales, negotiate } from "@/lib/i18n/config";

/**
 * 没有语言前缀的地址（/、/about、旧链接）重定向到 /zh/… 或 /en/…：
 * 优先用上次选过的语言（cookie），否则看浏览器的 Accept-Language。
 * 带前缀的访问会记下这次的语言。
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const current = locales.find((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`));

  if (current) {
    const res = NextResponse.next();
    if (request.cookies.get("lang")?.value !== current) {
      res.cookies.set("lang", current, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
    }
    return res;
  }

  const saved = request.cookies.get("lang")?.value;
  const lang = isLocale(saved) ? saved : negotiate(request.headers.get("accept-language"));
  const url = request.nextUrl.clone();
  url.pathname = `/${lang}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // 跳过接口、Next 内部文件和带扩展名的静态资源（头像、图标等）
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
