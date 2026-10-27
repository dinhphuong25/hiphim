import { NextRequest, NextResponse } from "next/server";
import { getSiteConfig } from "@/lib/site-config";
import {
  getSystemNotifications,
  createSystemNotification,
  deleteSystemNotification,
} from "@/lib/system-notifications-store";
import { isAuthorizedAdminRequest } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const config = getSiteConfig();
    const systemNotifications = await getSystemNotifications(30);

    return NextResponse.json(
      {
        success: true,
        announcement: config.announcement,
        siteName: config.siteName,
        notifications: systemNotifications,
        ads: config.ads,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, max-age=30, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error("Error loading announcements and notifications:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load announcement" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const isAuthorized = await isAuthorizedAdminRequest(req);
  if (!isAuthorized) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, content, type, link, author } = body;

    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: "Tiêu đề và nội dung không được để trống." },
        { status: 400 }
      );
    }

    const notification = await createSystemNotification({
      title: String(title).trim(),
      content: String(content).trim(),
      type: type || "info",
      link: link ? String(link).trim() : undefined,
      author: author || "Ban Quản Trị",
    });

    return NextResponse.json({ success: true, notification });
  } catch (error) {
    console.error("Error creating system notification:", error);
    return NextResponse.json(
      { success: false, error: "Có lỗi xảy ra khi tạo thông báo." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const isAuthorized = await isAuthorizedAdminRequest(req);
  if (!isAuthorized) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "Thiếu ID thông báo." }, { status: 400 });
    }

    const ok = await deleteSystemNotification(id);
    return NextResponse.json({ success: ok });
  } catch (error) {
    console.error("Error deleting system notification:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi xóa thông báo." },
      { status: 500 }
    );
  }
}
