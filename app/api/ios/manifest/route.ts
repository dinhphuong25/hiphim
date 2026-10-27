import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const ipaUrl =
    searchParams.get("ipa") ||
    "https://expo.dev/artifacts/eas/6ahM1Trwhg6kUcIHiO2Bt-j60VPaxwqo1doGY24SvAQ.ipa";
  const title = searchParams.get("title") || "Hi Phim";
  const bundleId = searchParams.get("bundleId") || "com.hiphim.app";
  const version = searchParams.get("version") || "1.0.0";

  // Construct absolute icon URL
  const origin = request.nextUrl.origin || "https://hiphim.net";
  const iconUrl = `${origin}/icon-192x192.png`;

  // Apple OTA Manifest XML Plist template
  const manifest = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>items</key>
    <array>
        <dict>
            <key>assets</key>
            <array>
                <dict>
                    <key>kind</key>
                    <string>software-package</string>
                    <key>url</key>
                    <string><![CDATA[${ipaUrl}]]></string>
                </dict>
                <dict>
                    <key>kind</key>
                    <string>display-image</string>
                    <key>needs-shine</key>
                    <true/>
                    <key>url</key>
                    <string><![CDATA[${iconUrl}]]></string>
                </dict>
                <dict>
                    <key>kind</key>
                    <string>full-size-image</string>
                    <key>needs-shine</key>
                    <true/>
                    <key>url</key>
                    <string><![CDATA[${iconUrl}]]></string>
                </dict>
            </array>
            <key>metadata</key>
            <dict>
                <key>bundle-identifier</key>
                <string><![CDATA[${bundleId}]]></string>
                <key>bundle-version</key>
                <string><![CDATA[${version}]]></string>
                <key>kind</key>
                <string>software</string>
                <key>title</key>
                <string><![CDATA[${title}]]></string>
            </dict>
        </dict>
    </array>
</dict>
</plist>`;

  return new NextResponse(manifest, {
    status: 200,
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
