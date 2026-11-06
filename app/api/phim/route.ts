import { NextRequest } from "next/server";
import { isSlugHidden } from "@/lib/hidden-movies";

export async function GET(req: NextRequest) {
  const urlParam = req.nextUrl.searchParams.get("url");

  if (!urlParam) {
    return new Response(
      JSON.stringify({ error: "Missing url param" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (urlParam.length > 512) {
    return new Response(
      JSON.stringify({ error: "URL exceeds maximum length" }),
      { status: 414, headers: { "Content-Type": "application/json" } }
    );
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(urlParam);
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid url" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (urlParam.toLowerCase().includes("ma-xo") || isSlugHidden(urlParam)) {
    return new Response(
      JSON.stringify({ error: "Content disabled or removed" }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  if (parsedUrl.protocol !== "https:") {
    return new Response(
      JSON.stringify({ error: "Only HTTPS protocol allowed" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const ALLOWED_HOSTS = ["phimapi.com", "phim.nguonc.com"];
  const isAllowedHost =
    ALLOWED_HOSTS.some((h) => parsedUrl.hostname === h || parsedUrl.hostname.endsWith(`.${h}`)) &&
    (!parsedUrl.port || parsedUrl.port === "443") &&
    !parsedUrl.username &&
    !parsedUrl.password;

  if (!isAllowedHost) {
    return new Response(
      JSON.stringify({ error: "Forbidden host" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  // Immediate 307 redirect to target upstream URL (both phimapi.com and phim.nguonc.com support CORS *)
  // Browser automatically follows redirect to fetch directly, completely eliminating Cloudflare Worker subrequests!
  return Response.redirect(parsedUrl.toString(), 307);
}
