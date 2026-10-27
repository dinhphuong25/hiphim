import { NextRequest, NextResponse } from "next/server";
import { getMovieRating, submitMovieRating } from "@/lib/rating-store";
import { verifyUserSessionToken } from "@/lib/user-token";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    if (!slug) {
      return NextResponse.json({ success: false, error: "Thiếu slug phim." }, { status: 400 });
    }

    const rating = await getMovieRating(slug);
    return NextResponse.json({ success: true, rating });
  } catch (error) {
    console.error("Error fetching rating:", error);
    return NextResponse.json({ success: false, error: "Lỗi tải đánh giá." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { slug, score } = body;

    if (!slug || typeof score !== "number" || score < 1 || score > 10) {
      return NextResponse.json(
        { success: false, error: "Điểm số không hợp lệ (1-10)." },
        { status: 400 }
      );
    }

    // Identify user or IP
    let identifier = "anon";
    const userCookie = req.cookies.get("hiphim_user_session")?.value;
    if (userCookie) {
      const payload = await verifyUserSessionToken(userCookie);
      if (payload?.userId) {
        identifier = `user_${payload.userId}`;
      }
    }

    if (identifier === "anon") {
      const ip =
        req.headers.get("cf-connecting-ip") ||
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        req.headers.get("x-real-ip") ||
        "unknown";
      identifier = `ip_${ip}`;
    }

    const updatedRating = await submitMovieRating(slug, score, identifier);
    return NextResponse.json({ success: true, rating: updatedRating });
  } catch (error) {
    console.error("Error submitting rating:", error);
    return NextResponse.json({ success: false, error: "Lỗi gửi đánh giá." }, { status: 500 });
  }
}
