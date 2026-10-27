import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ANDROID_APK_URL =
  "https://expo.dev/artifacts/eas/Ks1hH1Stya9KDKXE6l3XfQGUKDdM3vjbJJmna1_b5f4.apk";

export async function GET() {
  try {
    const upstream = await fetch(ANDROID_APK_URL);

    if (!upstream.ok || !upstream.body) {
      return NextResponse.redirect(ANDROID_APK_URL);
    }

    const headers = new Headers();
    headers.set("Content-Type", "application/vnd.android.package-archive");
    headers.set("Content-Disposition", 'attachment; filename="hiphim.apk"');

    const contentLength = upstream.headers.get("content-length");
    if (contentLength) {
      headers.set("Content-Length", contentLength);
    }
    headers.set("Cache-Control", "public, max-age=3600");

    return new NextResponse(upstream.body as any, {
      status: 200,
      headers,
    });
  } catch {
    return NextResponse.redirect(ANDROID_APK_URL);
  }
}
