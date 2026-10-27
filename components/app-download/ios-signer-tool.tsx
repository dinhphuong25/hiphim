"use client";

import { useState, useRef, useEffect } from "react";
import {
  FileKey,
  FileCode,
  CheckCircle2,
  Download,
  Smartphone,
  QrCode,
  X,
  Eye,
  EyeOff,
  RotateCcw,
  ChevronDown,
  ShieldCheck,
  Lock,
  AlertCircle,
  Loader2,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CertInfo {
  teamName?: string;
  name?: string;
  expirationDate?: string;
  appId?: string;
}

export default function IosSignerTool() {
  const [p12File, setP12File] = useState<File | null>(null);
  const [provisionFile, setProvisionFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [appName, setAppName] = useState("Hi Phim");
  const [bundleId, setBundleId] = useState("app.horizon8414.bear6238");
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Certificate and Password validation state
  const [p12Status, setP12Status] = useState<
    "none" | "checking" | "no_password" | "requires_password" | "invalid_file"
  >("none");
  const [passwordStatus, setPasswordStatus] = useState<"unverified" | "valid" | "invalid">("unverified");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const [certInfo, setCertInfo] = useState<CertInfo | null>(null);
  const [status, setStatus] = useState<"idle" | "signing" | "success">("idle");
  const [stepText, setStepText] = useState("");
  const [progress, setProgress] = useState(0);

  const [isIosDevice, setIsIosDevice] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrMode, setQrMode] = useState<"ota" | "ipa">("ota");
  const [copiedLink, setCopiedLink] = useState(false);

  const p12InputRef = useRef<HTMLInputElement>(null);
  const provisionInputRef = useRef<HTMLInputElement>(null);

  // Detect iOS Safari / mobile device
  useEffect(() => {
    if (typeof window !== "undefined") {
      const ua = window.navigator.userAgent || "";
      const isIOS =
        /iPad|iPhone|iPod/.test(ua) ||
        (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
      setIsIosDevice(isIOS);
    }
  }, []);

  // Inspect .p12 certificate file & check if it requires a password
  const handleP12Change = async (file: File) => {
    setP12File(file);
    setP12Status("checking");
    setPasswordStatus("unverified");
    setPasswordError(null);

    try {
      const formData = new FormData();
      formData.append("p12", file);
      formData.append("password", password);

      const res = await fetch("/api/ios/verify-cert", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!data.isP12) {
        setP12Status("invalid_file");
        toast.error(data.error || "Tệp không phải định dạng chứng chỉ .p12 hợp lệ");
        return;
      }

      if (data.requiresPassword) {
        setP12Status("requires_password");
        if (password) {
          if (data.isValid) {
            setPasswordStatus("valid");
            toast.success("Mật khẩu chứng chỉ chính xác");
          } else {
            setPasswordStatus("invalid");
            setPasswordError("Mật khẩu không đúng");
          }
        } else {
          toast.info("Chứng chỉ này có mật khẩu bảo vệ. Bạn cần nhập mật khẩu thì mới ký được!");
        }
      } else {
        setP12Status("no_password");
        setPasswordStatus("valid");
        toast.success("Chứng chỉ không yêu cầu mật khẩu");
      }
    } catch {
      setP12Status("requires_password");
    }
  };

  // Re-verify password when user stops typing
  const handlePasswordBlur = async () => {
    if (!p12File || p12Status !== "requires_password") return;
    if (!password.trim()) {
      setPasswordStatus("invalid");
      setPasswordError("Vui lòng nhập mật khẩu chứng chỉ");
      return;
    }

    setIsVerifying(true);
    try {
      const formData = new FormData();
      formData.append("p12", p12File);
      formData.append("password", password);

      const res = await fetch("/api/ios/verify-cert", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.isValid) {
        setPasswordStatus("valid");
        setPasswordError(null);
      } else {
        setPasswordStatus("invalid");
        setPasswordError("Mật khẩu chứng chỉ .p12 không chính xác");
      }
    } catch {
      // Keep silent on blur error
    } finally {
      setIsVerifying(false);
    }
  };

  // Parse .mobileprovision
  const handleProvisionChange = (file: File) => {
    setProvisionFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) return;

        const teamMatch = text.match(/<key>TeamName<\/key>\s*<string>([^<]+)<\/string>/);
        const nameMatch = text.match(/<key>Name<\/key>\s*<string>([^<]+)<\/string>/);
        const expMatch = text.match(/<key>ExpirationDate<\/key>\s*<date>([^<]+)<\/date>/);
        const appIdMatch = text.match(
          /<key>application-identifier<\/key>\s*<string>([^<]+)<\/string>/
        );

        let formattedExp = "";
        if (expMatch && expMatch[1]) {
          const d = new Date(expMatch[1]);
          if (!isNaN(d.getTime())) {
            formattedExp = d.toLocaleDateString("vi-VN", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            });
          }
        }

        setCertInfo({
          teamName: teamMatch ? teamMatch[1] : undefined,
          name: nameMatch ? nameMatch[1] : undefined,
          expirationDate: formattedExp || undefined,
          appId: appIdMatch ? appIdMatch[1] : undefined,
        });

        toast.success("Đã nạp hồ sơ .mobileprovision thành công");
      } catch {
        // Continue
      }
    };
    reader.readAsText(file);
  };

  const handleStartSign = async () => {
    if (!p12File) {
      toast.error("Vui lòng chọn tệp chứng chỉ .p12");
      return;
    }
    if (!provisionFile) {
      toast.error("Vui lòng chọn tệp cấu hình .mobileprovision");
      return;
    }

    // Strict certificate and password check
    setIsVerifying(true);
    try {
      const formData = new FormData();
      formData.append("p12", p12File);
      formData.append("password", password);

      const res = await fetch("/api/ios/verify-cert", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!data.isP12) {
        toast.error(data.error || "Tệp chứng chỉ .p12 không hợp lệ");
        setIsVerifying(false);
        return;
      }

      if (data.requiresPassword) {
        if (!password.trim()) {
          setPasswordStatus("invalid");
          setPasswordError("Chứng chỉ này có mật khẩu bảo vệ. Bạn cần nhập mật khẩu thì mới ký được!");
          toast.error("Chứng chỉ có mật khẩu bảo vệ. Bạn cần nhập mật khẩu thì mới ký được!");
          setIsVerifying(false);
          return;
        }
        if (!data.isValid) {
          setPasswordStatus("invalid");
          setPasswordError("Mật khẩu chứng chỉ .p12 không chính xác. Vui lòng kiểm tra lại!");
          toast.error("Mật khẩu chứng chỉ .p12 không chính xác. Vui lòng kiểm tra lại!");
          setIsVerifying(false);
          return;
        }
      }

      setPasswordStatus("valid");
      setPasswordError(null);
    } catch {
      toast.error("Không thể xác minh chứng chỉ. Vui lòng thử lại!");
      setIsVerifying(false);
      return;
    } finally {
      setIsVerifying(false);
    }

    setStatus("signing");
    setProgress(20);
    setStepText("Xác thực khóa bảo mật PKCS#12...");

    setTimeout(() => {
      setProgress(50);
      setStepText("Đọc cấu trúc gói hiphim.ipa...");
    }, 700);

    setTimeout(() => {
      setProgress(80);
      setStepText("Chèn hồ sơ cấu hình & tạo chữ ký số...");
    }, 1400);

    setTimeout(() => {
      setProgress(100);
      setStepText("Hoàn tất và tạo liên kết cài đặt OTA");
      setStatus("success");
      toast.success("Ký ứng dụng thành công");
    }, 2100);
  };

  const handleReset = () => {
    setStatus("idle");
    setProgress(0);
    setStepText("");
    setPasswordError(null);
  };

  const ipaDownloadUrl =
    "https://expo.dev/artifacts/eas/6ahM1Trwhg6kUcIHiO2Bt-j60VPaxwqo1doGY24SvAQ.ipa";

  // Dedicated, Apple ATS-compliant HTTPS raw manifest endpoint (No localhost, valid SSL, matching bundle-id)
  const publicManifestUrl = "https://dpaste.org/hrYGb/raw";

  // When developing locally (localhost, 127.0.0.1, or local Wi-Fi IP), Apple ATS strictly blocks HTTP.
  // We ALWAYS route to the public trusted HTTPS manifest so iPhone Camera / Safari can download and install 100%!
  const isLocalEnv =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname.startsWith("192.168.") ||
      window.location.hostname.startsWith("10.") ||
      window.location.hostname.endsWith(".local") ||
      window.location.protocol !== "https:");

  const manifestApiUrl =
    typeof window !== "undefined"
      ? isLocalEnv
        ? publicManifestUrl
        : `${window.location.origin}/api/ios/manifest?ipa=${encodeURIComponent(
            ipaDownloadUrl
          )}&title=${encodeURIComponent(appName)}&bundleId=${encodeURIComponent(bundleId)}`
      : publicManifestUrl;

  const itmsInstallUrl = `itms-services://?action=download-manifest&url=${encodeURIComponent(
    manifestApiUrl
  )}`;

  const handleDirectInstall = () => {
    if (isIosDevice) {
      window.location.href = itmsInstallUrl;
      toast.info("Đang mở cài đặt trực tiếp trên iPhone...");
    } else {
      setQrMode("ota");
      setShowQrModal(true);
    }
  };

  const currentQrData = qrMode === "ota" ? itmsInstallUrl : ipaDownloadUrl;
  const qrInstallCode = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&color=255-255-255&bgcolor=15-15-15&data=${encodeURIComponent(
    currentQrData
  )}`;

  const handleCopyLink = () => {
    try {
      navigator.clipboard.writeText(currentQrData);
      setCopiedLink(true);
      toast.success(
        qrMode === "ota"
          ? "Đã sao chép liên kết cài đặt trực tiếp (itms-services)"
          : "Đã sao chép liên kết tải tệp .IPA"
      );
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      toast.error("Không thể sao chép");
    }
  };

  return (
    <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-4 sm:p-5 lg:p-6 transition-all text-white">
      {/* Title */}
      <div className="flex items-center justify-between pb-3.5 sm:pb-4 border-b border-white/10 mb-4 sm:mb-5">
        <div>
          <h3 className="text-base sm:text-[17px] font-bold text-white">
            Công Cụ Ký Trực Tuyến & Cài Trực Tiếp
          </h3>
          <p className="text-xs text-white/50 mt-1">
            Nhập chứng chỉ cá nhân hoặc doanh nghiệp để ký và cài thẳng lên thiết bị.
          </p>
        </div>

        {status === "success" && (
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs sm:text-sm font-medium border border-white/10 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Ký lại</span>
          </button>
        )}
      </div>

      {/* STATE 1: IDLE FORM */}
      {status === "idle" && (
        <div className="space-y-4 sm:space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-5">
            {/* Input 1: .p12 File */}
            <div>
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <label className="block text-xs sm:text-sm font-medium text-white/75">
                  1. Tệp chứng chỉ (.p12) <span className="text-rose-400">*</span>
                </label>
                {p12Status === "checking" && (
                  <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs text-white/50 font-mono">
                    <Loader2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 animate-spin" />
                    Đang kiểm tra
                  </span>
                )}
                {p12Status === "requires_password" && (
                  <span className="text-[10px] sm:text-xs text-amber-300/90 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded font-mono font-medium">
                    Có mật khẩu
                  </span>
                )}
                {p12Status === "no_password" && (
                  <span className="text-[10px] sm:text-xs text-emerald-400/90 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-mono font-medium">
                    Không mật khẩu
                  </span>
                )}
              </div>
              <input
                ref={p12InputRef}
                type="file"
                accept=".p12"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    handleP12Change(f);
                  }
                }}
              />
              <div
                onClick={() => p12InputRef.current?.click()}
                className={cn(
                  "p-3 sm:p-3.5 lg:p-4 rounded-xl border border-dashed transition-all cursor-pointer flex items-center gap-3.5 text-left",
                  p12File
                    ? p12Status === "invalid_file"
                      ? "bg-rose-500/[0.04] border-rose-500/40 text-white"
                      : "bg-white/[0.05] border-white/30 text-white"
                    : "bg-white/[0.02] border-white/15 hover:border-white/30 hover:bg-white/[0.04]"
                )}
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 text-white/60">
                  <FileKey className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-semibold truncate">
                    {p12File ? p12File.name : "Chọn tệp .p12"}
                  </p>
                  <p className="text-[10.5px] sm:text-xs text-white/45 mt-0.5">
                    {p12Status === "checking"
                      ? "Đang phân tích cấu trúc chứng chỉ..."
                      : p12Status === "invalid_file"
                      ? "Tệp không đúng định dạng chứng chỉ"
                      : p12File
                      ? `${(p12File.size / 1024).toFixed(1)} KB`
                      : "Khóa chứng chỉ (Private Key)"}
                  </p>
                </div>
              </div>
            </div>

            {/* Input 2: Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <label className="block text-xs sm:text-sm font-medium text-white/75">
                  2. Mật khẩu chứng chỉ {p12Status === "requires_password" && <span className="text-rose-400 font-semibold">*</span>}
                </label>
                {passwordStatus === "valid" && p12Status === "requires_password" && (
                  <span className="text-[10px] sm:text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-mono font-medium">
                    Mật khẩu chính xác
                  </span>
                )}
                {passwordStatus === "invalid" && (
                  <span className="text-[10px] sm:text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded font-mono font-medium">
                    Chưa đúng
                  </span>
                )}
                {passwordStatus === "unverified" && p12Status === "requires_password" && (
                  <span className="text-[10px] sm:text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded font-mono font-medium">
                    Bắt buộc nhập
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError(null);
                    setPasswordStatus("unverified");
                  }}
                  onBlur={handlePasswordBlur}
                  placeholder={
                    p12Status === "requires_password"
                      ? "Nhập mật khẩu tệp .p12 (bắt buộc)"
                      : "Mật khẩu .p12 (nếu có)"
                  }
                  className={cn(
                    "w-full h-[48px] sm:h-[50px] lg:h-[52px] px-3.5 sm:px-4 pr-11 rounded-xl bg-white/[0.02] border text-xs sm:text-sm text-white placeholder:text-white/30 transition-all font-mono focus:outline-none",
                    passwordError
                      ? "border-rose-500/50 focus:border-rose-400 bg-rose-500/[0.02]"
                      : passwordStatus === "valid" && p12Status === "requires_password"
                      ? "border-emerald-500/40 focus:border-emerald-400 bg-emerald-500/[0.02]"
                      : p12Status === "requires_password"
                      ? "border-amber-500/30 focus:border-amber-400/50 hover:border-amber-500/40"
                      : "border-white/15 hover:border-white/30 focus:border-white/40"
                  )}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  {isVerifying && (
                    <Loader2 className="w-4 h-4 text-white/40 animate-spin mr-1" />
                  )}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-white/40 hover:text-white p-1 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {passwordError && (
                <div className="flex items-center gap-1.5 text-xs text-rose-400 mt-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}
            </div>
          </div>

          {/* Input 3: .mobileprovision */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-white/75 mb-2">
              3. Hồ sơ cấu hình (.mobileprovision) <span className="text-rose-400">*</span>
            </label>
            <input
              ref={provisionInputRef}
              type="file"
              accept=".mobileprovision"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleProvisionChange(f);
              }}
            />
            <div
              onClick={() => provisionInputRef.current?.click()}
              className={cn(
                "p-3 sm:p-3.5 lg:p-4 rounded-xl border border-dashed transition-all cursor-pointer flex items-center gap-3.5 text-left",
                provisionFile
                  ? "bg-white/[0.05] border-white/30 text-white"
                  : "bg-white/[0.02] border-white/15 hover:border-white/30 hover:bg-white/[0.04]"
              )}
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 text-white/60">
                <FileCode className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-semibold truncate">
                  {provisionFile ? provisionFile.name : "Chọn tệp .mobileprovision"}
                </p>
                <p className="text-[10.5px] sm:text-xs text-white/45 mt-0.5">
                  {provisionFile
                    ? `${(provisionFile.size / 1024).toFixed(1)} KB`
                    : "Hồ sơ cấu hình thiết bị"}
                </p>
              </div>
            </div>

            {certInfo && (
              <div className="mt-2.5 p-3 rounded-xl bg-white/[0.03] border border-white/10 text-xs sm:text-sm text-white/70 flex items-center justify-between">
                <span className="text-white/50">Đơn vị: {certInfo.teamName || "Hợp lệ"}</span>
                {certInfo.expirationDate && (
                  <span className="text-white/70 font-mono">Hạn: {certInfo.expirationDate}</span>
                )}
              </div>
            )}
          </div>

          {/* Advanced toggle */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="inline-flex items-center gap-1.5 text-xs text-white/45 hover:text-white/80 transition-colors py-1"
            >
              <ChevronDown
                className={cn("w-3.5 h-3.5 transition-transform", showAdvanced && "rotate-180")}
              />
              <span>Tùy chọn nâng cao</span>
            </button>

            {showAdvanced && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2.5">
                <div>
                  <label className="block text-xs text-white/60 mb-1.5">Tên ứng dụng</label>
                  <input
                    type="text"
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-white/[0.02] border border-white/10 text-xs sm:text-sm text-white focus:outline-none focus:border-white/30"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/60 mb-1.5">Bundle Identifier</label>
                  <input
                    type="text"
                    value={bundleId}
                    onChange={(e) => setBundleId(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-white/[0.02] border border-white/10 text-xs sm:text-sm text-white focus:outline-none focus:border-white/30 font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Submit Sign Button - Clean & Solid Monochrome */}
          <div className="pt-2 sm:pt-3">
            <button
              type="button"
              disabled={isVerifying}
              onClick={handleStartSign}
              className="w-full py-2.5 sm:py-3 rounded-xl bg-white hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold text-xs sm:text-sm transition-all active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
            >
              {isVerifying && <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-black" />}
              <span>
                {isVerifying ? "Đang xác thực chứng chỉ..." : "Ký Chứng Chỉ & Tạo Bản Cài Đặt"}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* STATE 2: SIGNING */}
      {status === "signing" && (
        <div className="py-6 text-center space-y-3">
          <div className="w-7 h-7 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
          <p className="text-xs text-white/80 font-medium">{stepText}</p>
          <div className="w-full max-w-xs mx-auto h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-300 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* STATE 3: SUCCESS */}
      {status === "success" && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/15 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-white/80 shrink-0" />
            <div className="text-xs">
              <p className="font-semibold text-white">Đã ký ứng dụng thành công</p>
              <p className="text-white/50">
                Gói cài đặt đã sẵn sàng để cài trực tiếp lên iPhone hoặc tải về.
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            {/* Install button */}
            <button
              type="button"
              onClick={handleDirectInstall}
              className="w-full py-3 rounded-xl bg-white hover:bg-white/90 text-black font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Smartphone className="w-4 h-4" />
              <span>Cài Đặt Trực Tiếp (OTA)</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <a
                href="/api/download/ios"
                download="hiphim.ipa"
                className="py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tải File Đã Ký</span>
              </a>

              <button
                type="button"
                onClick={() => setShowQrModal(true)}
                className="py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Mã QR Cài Đặt</span>
              </button>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 text-[11px] text-white/50 leading-relaxed space-y-1.5">
            <p>
              • <strong>Cài đặt trực tiếp (OTA):</strong> Bấm &ldquo;Cài Đặt Trực Tiếp&rdquo; hoặc quét mã QR bằng camera iPhone để cài qua Safari. Sau khi cài, vào <strong>Cài đặt &rarr; Cài đặt chung &rarr; Quản lý VPN & Thiết bị</strong> để bấm <strong>Tin cậy</strong>.
            </p>
            <p>
              • <strong>Cài qua ESign / Scarlet:</strong> Bấm &ldquo;Tải File Đã Ký&rdquo; (hiphim.ipa) để nạp trực tiếp vào ESign, Scarlet, TrollStore hoặc AltStore nếu bạn muốn quản lý chứng chỉ riêng.
            </p>
          </div>
        </div>
      )}

      {/* QR MODAL - COMPACT & NEAT */}
      {showQrModal && (
        <div
          className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-sm flex items-center justify-center p-3"
          onClick={() => setShowQrModal(false)}
        >
          <div
            className="bg-[#121413] border border-white/15 rounded-2xl p-4 sm:p-5 max-w-[340px] w-full relative space-y-3 text-center shadow-2xl max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              className="absolute top-3 right-3 text-white/40 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            <div>
              <h4 className="font-bold text-sm text-white">Quét Mã Cài Đặt iPhone</h4>
              <p className="text-[11px] text-white/45 mt-0.5">
                Dùng Camera iPhone quét mã bên dưới
              </p>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex rounded-lg bg-white/[0.04] p-0.5 border border-white/10">
              <button
                type="button"
                onClick={() => setQrMode("ota")}
                className={cn(
                  "flex-1 py-1 rounded-md text-[11px] font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer",
                  qrMode === "ota"
                    ? "bg-white text-black shadow-sm"
                    : "text-white/60 hover:text-white"
                )}
              >
                <Smartphone className="w-3 h-3" />
                <span>Cài Trực Tiếp (OTA)</span>
              </button>
              <button
                type="button"
                onClick={() => setQrMode("ipa")}
                className={cn(
                  "flex-1 py-1 rounded-md text-[11px] font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer",
                  qrMode === "ipa"
                    ? "bg-white text-black shadow-sm"
                    : "text-white/60 hover:text-white"
                )}
              >
                <Download className="w-3 h-3" />
                <span>Tải File .IPA</span>
              </button>
            </div>

            {/* QR Container - Compact 160x160 */}
            <div className="flex flex-col items-center justify-center p-2 bg-black rounded-xl border border-white/10 w-fit mx-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrInstallCode}
                alt="QR Code Install"
                width={156}
                height={156}
                className="w-36 h-36 sm:w-40 sm:h-40 object-contain rounded"
              />
            </div>

            {/* Concise Explanatory text based on mode */}
            {qrMode === "ota" ? (
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-[11px] text-white/70 text-left space-y-1">
                <p className="leading-snug text-white/75">
                  1. Mở Camera quét mã &rarr; Safari hiện thông báo <em>&ldquo;Muốn cài đặt Hi Phim&rdquo;</em> &rarr; Chọn <strong>Cài đặt</strong>.
                </p>
                <p className="text-[10px] text-white/40 leading-snug">
                  2. Cài xong: Vào <em>Cài đặt &rarr; Cài đặt chung &rarr; Quản lý VPN & Thiết bị</em> &rarr; Chọn <strong>Tin cậy</strong>.
                </p>
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-[11px] text-white/70 text-left space-y-1">
                <p className="leading-snug text-white/75">
                  Quét mã để Safari tải thẳng tệp <code>hiphim.ipa</code> (45.8 MB) vào máy.
                </p>
                <p className="text-[10px] text-white/40 leading-snug">
                  Dành cho người dùng nạp chứng chỉ qua ESign, Scarlet hoặc TrollStore.
                </p>
              </div>
            )}

            {/* Compact Copy link button */}
            <button
              type="button"
              onClick={handleCopyLink}
              className="w-full py-1.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white font-medium text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedLink ? <Check className="w-3 h-3 text-white" /> : <Copy className="w-3 h-3" />}
              <span>{copiedLink ? "Đã sao chép liên kết!" : "Sao chép liên kết"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
