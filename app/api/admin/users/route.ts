import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedAdminRequest } from "@/lib/admin-auth";
import {
  adminResetPasswordPersistent,
  banUserPersistent,
  changeUserRolePersistent,
  clearUserWatchingPersistent,
  deleteUserPersistent,
  getAllUsersForAdminPersistent,
  setUserVerifiedPersistent,
  unbanUserPersistent,
} from "@/lib/user-store";

export async function GET(req: NextRequest) {
  const isAuthorized = await isAuthorizedAdminRequest(req);

  if (!isAuthorized) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Yêu cầu quyền Super Admin" },
      { status: 401 }
    );
  }

  try {
    const users = await getAllUsersForAdminPersistent();
    return NextResponse.json({
      success: true,
      users,
      totalUsers: users.length,
    });
  } catch (err: any) {
    console.error("Admin get users error:", err);
    return NextResponse.json(
      { success: false, error: "Lỗi tải danh sách người dùng: " + err?.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const isAuthorized = await isAuthorizedAdminRequest(req);

  if (!isAuthorized) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Yêu cầu quyền Super Admin" },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { action, userId, durationHours, reason } = body;

    if (!userId || !action) {
      return NextResponse.json(
        { success: false, error: "Thiếu thông tin người dùng hoặc hành động" },
        { status: 400 }
      );
    }

    if (action === "ban_temp") {
      const hours = Number(durationHours) || 24;
      const res = await banUserPersistent(userId, hours, reason || "Tạm khóa quyền xem phim");
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        message: `Đã khóa tạm thời tài khoản trong ${hours} giờ`,
        user: res.user,
      });
    }

    if (action === "ban_perm") {
      const res = await banUserPersistent(userId, "permanent", reason || "Khóa vĩnh viễn do vi phạm quy định");
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        message: "Đã khóa vĩnh viễn tài khoản",
        user: res.user,
      });
    }

    if (action === "unban") {
      const res = await unbanUserPersistent(userId);
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        message: "Đã mở khóa tài khoản thành công",
        user: res.user,
      });
    }

    if (action === "delete") {
      const res = await deleteUserPersistent(userId);
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        message: "Đã xóa hoàn toàn tài khoản khỏi hệ thống",
      });
    }

    if (action === "change_role") {
      const { newRole } = body;
      if (!newRole || !["user", "admin", "vip"].includes(newRole)) {
        return NextResponse.json({ success: false, error: "Vai trò mới không hợp lệ" }, { status: 400 });
      }
      const res = await changeUserRolePersistent(userId, newRole);
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        message: `Đã cập nhật vai trò thành viên thành: ${newRole.toUpperCase()}`,
        user: res.user,
      });
    }

    if (action === "verify_otp") {
      const isVerified = body.isVerified !== undefined ? Boolean(body.isVerified) : true;
      const res = await setUserVerifiedPersistent(userId, isVerified);
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        message: isVerified ? "Đã xác thực OTP thành công cho thành viên" : "Đã hủy trạng thái xác thực OTP",
        user: res.user,
      });
    }

    if (action === "clear_history") {
      const res = await clearUserWatchingPersistent(userId);
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        message: "Đã xóa lịch sử xem và dừng phiên phát của thành viên",
        user: res.user,
      });
    }

    if (action === "reset_password") {
      const { newPassword } = body;
      if (!newPassword || newPassword.length < 6) {
        return NextResponse.json({ success: false, error: "Mật khẩu mới phải có ít nhất 6 ký tự" }, { status: 400 });
      }
      const res = await adminResetPasswordPersistent(userId, newPassword);
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        message: "Đã đặt lại mật khẩu mới cho thành viên thành công!",
      });
    }

    return NextResponse.json(
      { success: false, error: `Hành động không hợp lệ: ${action}` },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("Admin user action error:", err);
    return NextResponse.json(
      { success: false, error: "Lỗi xử lý hành động: " + err?.message },
      { status: 500 }
    );
  }
}
