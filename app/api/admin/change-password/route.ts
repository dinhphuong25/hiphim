import { NextRequest, NextResponse } from "next/server";
import {
  isAuthorizedAdminRequest,
  checkAdminCredentials,
  updateAdminPassword,
} from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  const isAuthorized = await isAuthorizedAdminRequest(req);

  if (!isAuthorized) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const { username, currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: "Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới!" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: "Mật khẩu mới phải có ít nhất 6 ký tự!" },
        { status: 400 }
      );
    }

    // Verify current credentials
    const isCurrentValid = await checkAdminCredentials(username || "kimdinhphuong205@gmail.com", currentPassword);
    if (!isCurrentValid) {
      return NextResponse.json(
        { success: false, error: "Mật khẩu hiện tại không chính xác!" },
        { status: 400 }
      );
    }

    const updated = await updateAdminPassword(newPassword, username);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Không thể lưu mật khẩu mới vào hệ thống!" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Đổi mật khẩu quản trị viên thành công!",
    });
  } catch (err: any) {
    console.error("Change password error:", err);
    return NextResponse.json(
      { success: false, error: "Lỗi đổi mật khẩu: " + err?.message },
      { status: 500 }
    );
  }
}
