import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { syncUserDataPersistent } from "@/lib/user-store";
import { verifyUserSessionToken, USER_COOKIE_NAME } from "@/lib/user-token";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(USER_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: "Chưa đăng nhập" }, { status: 401 });
    }

    const payload = await verifyUserSessionToken(token);
    if (!payload) {
      return NextResponse.json({ success: false, error: "Phiên đăng nhập không hợp lệ" }, { status: 401 });
    }

    const body = await request.json();
    const { favorites, history, mode = "merge" } = body;

    const synced = await syncUserDataPersistent(payload.userId, favorites, history, mode);

    return NextResponse.json({
      success: true,
      favorites: synced.favorites,
      history: synced.history,
    });
  } catch (err: any) {
    console.error("Sync error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Đã xảy ra lỗi khi đồng bộ dữ liệu" },
      { status: 500 }
    );
  }
}
