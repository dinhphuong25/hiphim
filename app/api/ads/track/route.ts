import { NextRequest, NextResponse } from "next/server";
import { recordAdEvent, AdPlacement, AdEvent } from "@/lib/ads-analytics";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Beacon may send text or empty
    }

    const placement = body.placement as AdPlacement;
    const event = body.event as AdEvent;

    if (!placement || !["popup", "catfish", "tvc"].includes(placement)) {
      return NextResponse.json({ success: false, error: "Invalid placement" }, { status: 400 });
    }

    if (!event || !["impression", "click"].includes(event)) {
      return NextResponse.json({ success: false, error: "Invalid event" }, { status: 400 });
    }

    await recordAdEvent(placement, event);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
