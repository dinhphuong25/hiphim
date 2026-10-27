import { NextRequest, NextResponse } from "next/server";
import { verifyP12Password } from "@/lib/pkcs12-validator";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const p12File = formData.get("p12");
    const password = (formData.get("password") as string) || "";

    if (!p12File || !(p12File instanceof Blob)) {
      return NextResponse.json(
        {
          success: false,
          isP12: false,
          requiresPassword: false,
          isValid: false,
          error: "Không tìm thấy tệp chứng chỉ .p12",
        },
        { status: 400 }
      );
    }

    const arrayBuffer = await p12File.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length === 0) {
      return NextResponse.json(
        {
          success: false,
          isP12: false,
          requiresPassword: false,
          isValid: false,
          error: "Tệp chứng chỉ rỗng",
        },
        { status: 400 }
      );
    }

    const result = verifyP12Password(buffer, password);

    return NextResponse.json({
      success: true,
      isP12: result.isP12,
      requiresPassword: result.requiresPassword,
      isValid: result.isValid,
      reason: result.reason,
      error: result.error,
    });
  } catch (error: any) {
    console.error("Error verifying .p12 password:", error);
    return NextResponse.json(
      {
        success: false,
        isP12: false,
        requiresPassword: false,
        isValid: false,
        error: error?.message || "Lỗi xử lý kiểm tra chứng chỉ",
      },
      { status: 500 }
    );
  }
}
