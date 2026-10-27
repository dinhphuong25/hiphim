import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  Mail,
  Lock,
  User,
  KeyRound,
  X,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
} from "lucide-react-native";
import { useUserAuth } from "@/context/UserAuthContext";
import { haptic } from "@/services/haptics";

export function AuthModal() {
  const {
    isAuthModalOpen,
    authModalMode,
    pendingEmail,
    closeAuthModal,
    openAuthModal,
    login,
    register,
    verifyOtp,
    resendOtp,
  } = useUserAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [devCodeBanner, setDevCodeBanner] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // OTP Countdown
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (isAuthModalOpen) {
      setErrorMessage("");
      setDevCodeBanner(null);
      setFocusedField(null);
      if (authModalMode === "otp") {
        setOtp("");
        setCountdown(60);
        setCanResend(false);
      }
    }
  }, [isAuthModalOpen, authModalMode]);

  useEffect(() => {
    let timer: any;
    if (isAuthModalOpen && authModalMode === "otp" && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isAuthModalOpen, authModalMode, countdown]);

  if (!isAuthModalOpen) return null;

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setErrorMessage("Vui lòng nhập đầy đủ Email và Mật khẩu");
      haptic.error();
      return;
    }
    setErrorMessage("");
    setIsSubmitting(true);
    const res = await login(email, password);
    setIsSubmitting(false);
    if (!res.success) {
      setErrorMessage(res.error || "Đăng nhập thất bại");
    }
  };

  const handleRegister = async () => {
    setErrorMessage("");
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.endsWith("@gmail.com")) {
      setErrorMessage("Hệ thống chỉ chấp nhận địa chỉ email có đuôi @gmail.com");
      haptic.error();
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Mật khẩu phải có ít nhất 6 ký tự");
      haptic.error();
      return;
    }

    if (!name.trim()) {
      setErrorMessage("Vui lòng nhập họ tên của bạn");
      haptic.error();
      return;
    }

    setIsSubmitting(true);
    const res = await register(cleanEmail, password, name.trim());
    setIsSubmitting(false);
    if (res.success) {
      if (res.devMode && res.devCode) {
        setDevCodeBanner(res.devCode);
        setOtp(res.devCode);
      }
    } else {
      setErrorMessage(res.error || "Đăng ký thất bại");
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6) {
      setErrorMessage("Vui lòng nhập đủ 6 chữ số mã OTP");
      haptic.error();
      return;
    }
    setErrorMessage("");
    setIsSubmitting(true);
    const res = await verifyOtp(pendingEmail || email, otp);
    setIsSubmitting(false);
    if (!res.success) {
      setErrorMessage(res.error || "Mã OTP không chính xác");
    }
  };

  const handleResend = async () => {
    if (!canResend || isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessage("");
    const res = await resendOtp(pendingEmail || email);
    setIsSubmitting(false);
    if (res.success) {
      setCountdown(60);
      setCanResend(false);
      if (res.devMode && res.devCode) {
        setDevCodeBanner(res.devCode);
        setOtp(res.devCode);
      }
    } else {
      setErrorMessage(res.error || "Không thể gửi lại mã OTP");
    }
  };

  const handleDevCodeFill = () => {
    if (devCodeBanner) {
      setOtp(devCodeBanner);
      haptic.success();
    }
  };

  const handleClose = () => {
    haptic.light();
    closeAuthModal();
  };

  return (
    <Modal
      transparent
      visible={isAuthModalOpen}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        {/* Backdrop Tap to close */}
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboardView}
        >
          {/* Cinema Card Container */}
          <View style={styles.modalBox}>
            {/* Ambient Spotlight Glow at Top */}
            <LinearGradient
              colors={["rgba(32, 214, 107, 0.16)", "rgba(32, 214, 107, 0.0)"]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.ambientGlow}
              pointerEvents="none"
            />

            {/* Top Modal Header */}
            <View style={styles.header}>
              <View style={styles.titleGroup}>
                <Text style={styles.title}>
                  {authModalMode === "login"
                    ? "Đăng Nhập"
                    : authModalMode === "register"
                    ? "Tạo Tài Khoản"
                    : "Xác Thực OTP"}
                </Text>
                <Text style={styles.subtitle}>
                  {authModalMode === "login"
                    ? "Chào mừng bạn trở lại rạp chiếu phim"
                    : authModalMode === "register"
                    ? "Trải nghiệm điện ảnh chuẩn rạp không giới hạn"
                    : "Nhập mã bảo mật gồm 6 chữ số gửi tới email"}
                </Text>
              </View>

              <Pressable
                onPress={handleClose}
                style={({ pressed }) => [
                  styles.closeBtn,
                  pressed && styles.btnPressed,
                ]}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={16} color="rgba(255, 255, 255, 0.75)" strokeWidth={2.2} />
              </Pressable>
            </View>

            {/* Segmented Mode Pill Switcher (Login / Register) */}
            {authModalMode !== "otp" && (
              <View style={styles.segmentedContainer}>
                <Pressable
                  onPress={() => {
                    haptic.selection();
                    setErrorMessage("");
                    openAuthModal("login");
                  }}
                  style={[
                    styles.segmentTab,
                    authModalMode === "login" && styles.segmentTabActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      authModalMode === "login" && styles.segmentTextActive,
                    ]}
                  >
                    Đăng Nhập
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    haptic.selection();
                    setErrorMessage("");
                    openAuthModal("register");
                  }}
                  style={[
                    styles.segmentTab,
                    authModalMode === "register" && styles.segmentTabActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      authModalMode === "register" && styles.segmentTextActive,
                    ]}
                  >
                    Đăng Ký
                  </Text>
                </Pressable>
              </View>
            )}

            {/* Error Message Box */}
            {errorMessage ? (
              <View style={styles.errorBox}>
                <AlertCircle size={15} color="#EF4444" strokeWidth={2.4} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Dev Code Banner */}
            {devCodeBanner ? (
              <Pressable onPress={handleDevCodeFill} style={styles.devBox}>
                <View style={styles.devBoxLeft}>
                  <CheckCircle2 size={15} color="#20D66B" strokeWidth={2.4} />
                  <Text style={styles.devText}>
                    Mã OTP thử nghiệm: <Text style={styles.devCodeHighlight}>{devCodeBanner}</Text>
                  </Text>
                </View>
                <View style={styles.devFillBadge}>
                  <Text style={styles.devFillText}>Điền mã</Text>
                </View>
              </Pressable>
            ) : null}

            <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
              {/* ==================================================== */}
              {/* MODE: LOGIN                                          */}
              {/* ==================================================== */}
              {authModalMode === "login" && (
                <View style={styles.form}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>ĐỊA CHỈ EMAIL</Text>
                    <View
                      style={[
                        styles.inputWrapper,
                        focusedField === "email" && styles.inputWrapperFocused,
                      ]}
                    >
                      <Mail
                        size={17}
                        color={
                          focusedField === "email"
                            ? "#20D66B"
                            : "rgba(255, 255, 255, 0.4)"
                        }
                        strokeWidth={2}
                      />
                      <TextInput
                        value={email}
                        onChangeText={setEmail}
                        placeholder="tenban@gmail.com"
                        placeholderTextColor="rgba(255, 255, 255, 0.3)"
                        style={styles.input}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        onFocus={() => setFocusedField("email")}
                        onBlur={() => setFocusedField(null)}
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>MẬT KHẨU</Text>
                    <View
                      style={[
                        styles.inputWrapper,
                        focusedField === "password" && styles.inputWrapperFocused,
                      ]}
                    >
                      <Lock
                        size={17}
                        color={
                          focusedField === "password"
                            ? "#20D66B"
                            : "rgba(255, 255, 255, 0.4)"
                        }
                        strokeWidth={2}
                      />
                      <TextInput
                        value={password}
                        onChangeText={setPassword}
                        placeholder="••••••••"
                        placeholderTextColor="rgba(255, 255, 255, 0.3)"
                        style={styles.input}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        onFocus={() => setFocusedField("password")}
                        onBlur={() => setFocusedField(null)}
                      />
                      <Pressable
                        onPress={() => setShowPassword(!showPassword)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        {showPassword ? (
                          <EyeOff size={17} color="rgba(255, 255, 255, 0.6)" />
                        ) : (
                          <Eye size={17} color="rgba(255, 255, 255, 0.45)" />
                        )}
                      </Pressable>
                    </View>
                  </View>

                  {/* Submit Button */}
                  <Pressable
                    onPress={handleLogin}
                    disabled={isSubmitting}
                    style={({ pressed }) => [
                      styles.submitBtn,
                      pressed && styles.btnPressed,
                    ]}
                  >
                    <LinearGradient
                      colors={["#2CE577", "#16B856"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.submitBtnGradient}
                    >
                      {isSubmitting ? (
                        <ActivityIndicator size="small" color="#050807" />
                      ) : (
                        <View style={styles.btnRow}>
                          <Text style={styles.submitBtnText}>Đăng Nhập Ngay</Text>
                          <ArrowRight size={16} color="#050807" strokeWidth={2.6} />
                        </View>
                      )}
                    </LinearGradient>
                  </Pressable>

                  {/* Guest / Close Option */}
                  <View style={styles.dividerRow}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>HOẶC</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  <Pressable
                    onPress={handleClose}
                    style={({ pressed }) => [
                      styles.guestBtn,
                      pressed && styles.btnPressed,
                    ]}
                  >
                    <Text style={styles.guestBtnText}>
                      Tiếp tục xem phim với tư cách Khách
                    </Text>
                  </Pressable>
                </View>
              )}

              {/* ==================================================== */}
              {/* MODE: REGISTER                                       */}
              {/* ==================================================== */}
              {authModalMode === "register" && (
                <View style={styles.form}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>HỌ VÀ TÊN</Text>
                    <View
                      style={[
                        styles.inputWrapper,
                        focusedField === "name" && styles.inputWrapperFocused,
                      ]}
                    >
                      <User
                        size={17}
                        color={
                          focusedField === "name"
                            ? "#20D66B"
                            : "rgba(255, 255, 255, 0.4)"
                        }
                        strokeWidth={2}
                      />
                      <TextInput
                        value={name}
                        onChangeText={setName}
                        placeholder="Nguyễn Văn A"
                        placeholderTextColor="rgba(255, 255, 255, 0.3)"
                        style={styles.input}
                        autoCorrect={false}
                        onFocus={() => setFocusedField("name")}
                        onBlur={() => setFocusedField(null)}
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <View style={styles.labelRow}>
                      <Text style={styles.inputLabel}>EMAIL GMAIL</Text>
                      <Text style={styles.labelHint}>(Chỉ nhận @gmail.com)</Text>
                    </View>
                    <View
                      style={[
                        styles.inputWrapper,
                        focusedField === "reg_email" && styles.inputWrapperFocused,
                      ]}
                    >
                      <Mail
                        size={17}
                        color={
                          focusedField === "reg_email"
                            ? "#20D66B"
                            : "rgba(255, 255, 255, 0.4)"
                        }
                        strokeWidth={2}
                      />
                      <TextInput
                        value={email}
                        onChangeText={setEmail}
                        placeholder="tenban@gmail.com"
                        placeholderTextColor="rgba(255, 255, 255, 0.3)"
                        style={styles.input}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        onFocus={() => setFocusedField("reg_email")}
                        onBlur={() => setFocusedField(null)}
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <View style={styles.labelRow}>
                      <Text style={styles.inputLabel}>MẬT KHẨU</Text>
                      <Text style={styles.labelHint}>(Tối thiểu 6 ký tự)</Text>
                    </View>
                    <View
                      style={[
                        styles.inputWrapper,
                        focusedField === "reg_password" && styles.inputWrapperFocused,
                      ]}
                    >
                      <Lock
                        size={17}
                        color={
                          focusedField === "reg_password"
                            ? "#20D66B"
                            : "rgba(255, 255, 255, 0.4)"
                        }
                        strokeWidth={2}
                      />
                      <TextInput
                        value={password}
                        onChangeText={setPassword}
                        placeholder="••••••••"
                        placeholderTextColor="rgba(255, 255, 255, 0.3)"
                        style={styles.input}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        onFocus={() => setFocusedField("reg_password")}
                        onBlur={() => setFocusedField(null)}
                      />
                      <Pressable
                        onPress={() => setShowPassword(!showPassword)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        {showPassword ? (
                          <EyeOff size={17} color="rgba(255, 255, 255, 0.6)" />
                        ) : (
                          <Eye size={17} color="rgba(255, 255, 255, 0.45)" />
                        )}
                      </Pressable>
                    </View>
                  </View>

                  {/* Submit Button */}
                  <Pressable
                    onPress={handleRegister}
                    disabled={isSubmitting}
                    style={({ pressed }) => [
                      styles.submitBtn,
                      pressed && styles.btnPressed,
                    ]}
                  >
                    <LinearGradient
                      colors={["#2CE577", "#16B856"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.submitBtnGradient}
                    >
                      {isSubmitting ? (
                        <ActivityIndicator size="small" color="#050807" />
                      ) : (
                        <View style={styles.btnRow}>
                          <Text style={styles.submitBtnText}>Đăng Ký & Nhận Mã OTP</Text>
                          <ArrowRight size={16} color="#050807" strokeWidth={2.6} />
                        </View>
                      )}
                    </LinearGradient>
                  </Pressable>

                  {/* Guest / Close Option */}
                  <View style={styles.dividerRow}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>HOẶC</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  <Pressable
                    onPress={handleClose}
                    style={({ pressed }) => [
                      styles.guestBtn,
                      pressed && styles.btnPressed,
                    ]}
                  >
                    <Text style={styles.guestBtnText}>
                      Tiếp tục xem phim với tư cách Khách
                    </Text>
                  </Pressable>
                </View>
              )}

              {/* ==================================================== */}
              {/* MODE: OTP VERIFICATION                               */}
              {/* ==================================================== */}
              {authModalMode === "otp" && (
                <View style={styles.form}>
                  {/* Back to Login link */}
                  <Pressable
                    onPress={() => {
                      haptic.light();
                      openAuthModal("login");
                    }}
                    style={styles.backBtn}
                  >
                    <ArrowLeft size={14} color="#20D66B" strokeWidth={2.2} />
                    <Text style={styles.backBtnText}>Quay lại Đăng nhập</Text>
                  </Pressable>

                  <View style={styles.otpHeaderBox}>
                    <Text style={styles.otpPrompt}>
                      Mã xác thực gồm 6 chữ số đã được gửi tới email:
                    </Text>
                    <View style={styles.otpEmailBadge}>
                      <Mail size={13} color="#20D66B" />
                      <Text style={styles.otpEmailText}>
                        {pendingEmail || email}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <View
                      style={[
                        styles.inputWrapper,
                        styles.otpWrapper,
                        focusedField === "otp" && styles.inputWrapperFocused,
                      ]}
                    >
                      <KeyRound size={18} color="#20D66B" strokeWidth={2.2} />
                      <TextInput
                        value={otp}
                        onChangeText={(t) => setOtp(t.replace(/\D/g, "").slice(0, 6))}
                        placeholder="123456"
                        placeholderTextColor="rgba(255, 255, 255, 0.25)"
                        style={[styles.input, styles.otpInput]}
                        keyboardType="number-pad"
                        maxLength={6}
                        autoFocus
                        onFocus={() => setFocusedField("otp")}
                        onBlur={() => setFocusedField(null)}
                      />
                    </View>
                  </View>

                  <Pressable
                    onPress={handleVerifyOtp}
                    disabled={isSubmitting}
                    style={({ pressed }) => [
                      styles.submitBtn,
                      pressed && styles.btnPressed,
                    ]}
                  >
                    <LinearGradient
                      colors={["#2CE577", "#16B856"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.submitBtnGradient}
                    >
                      {isSubmitting ? (
                        <ActivityIndicator size="small" color="#050807" />
                      ) : (
                        <View style={styles.btnRow}>
                          <Text style={styles.submitBtnText}>Xác Thực & Kích Hoạt</Text>
                          <ArrowRight size={16} color="#050807" strokeWidth={2.6} />
                        </View>
                      )}
                    </LinearGradient>
                  </Pressable>

                  <View style={styles.resendRow}>
                    {canResend ? (
                      <Pressable onPress={handleResend} style={styles.resendBtn}>
                        <Text style={styles.resendLink}>Gửi lại mã OTP mới</Text>
                      </Pressable>
                    ) : (
                      <View style={styles.countdownPill}>
                        <Text style={styles.countdownText}>
                          Gửi lại mã sau <Text style={styles.countdownNum}>{countdown}s</Text>
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(3, 7, 5, 0.88)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  keyboardView: {
    width: "100%",
    maxWidth: 400,
  },
  modalBox: {
    width: "100%",
    backgroundColor: "rgba(10, 16, 13, 0.98)",
    borderRadius: 28,
    borderWidth: 1.2,
    borderColor: "rgba(32, 214, 107, 0.28)",
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 24,
    shadowColor: "#20D66B",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 28,
    elevation: 20,
    position: "relative",
    overflow: "hidden",
  },
  ambientGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  titleGroup: {
    flex: 1,
    marginRight: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 12.5,
    color: "rgba(255, 255, 255, 0.45)",
    fontWeight: "500",
    marginTop: 4,
    lineHeight: 18,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  segmentedContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    borderRadius: 14,
    padding: 3,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  segmentTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
  },
  segmentTabActive: {
    backgroundColor: "#20D66B",
    shadowColor: "#20D66B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.5)",
  },
  segmentTextActive: {
    color: "#050807",
    fontWeight: "900",
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(239, 68, 68, 0.14)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.4)",
    borderRadius: 13,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 14,
  },
  errorText: {
    color: "#FCA5A5",
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
  },
  devBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(32, 214, 107, 0.14)",
    borderWidth: 1,
    borderColor: "rgba(32, 214, 107, 0.4)",
    borderRadius: 13,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 14,
  },
  devBoxLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  devText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  devCodeHighlight: {
    color: "#20D66B",
    fontWeight: "900",
    letterSpacing: 1,
  },
  devFillBadge: {
    backgroundColor: "#20D66B",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  devFillText: {
    color: "#050807",
    fontSize: 11,
    fontWeight: "800",
  },
  form: {
    gap: 13,
  },
  inputGroup: {
    gap: 5,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "rgba(255, 255, 255, 0.65)",
    letterSpacing: 0.6,
  },
  labelHint: {
    fontSize: 10.5,
    fontWeight: "600",
    color: "rgba(32, 214, 107, 0.75)",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1.2,
    borderColor: "rgba(255, 255, 255, 0.10)",
    borderRadius: 15,
    paddingHorizontal: 12,
    height: 48,
    gap: 10,
  },
  inputWrapperFocused: {
    borderColor: "#20D66B",
    backgroundColor: "rgba(32, 214, 107, 0.08)",
  },
  input: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 13.5,
    paddingVertical: 0,
    fontWeight: "500",
  },
  submitBtn: {
    height: 48,
    borderRadius: 15,
    overflow: "hidden",
    marginTop: 4,
    shadowColor: "#20D66B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  submitBtnGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  btnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  submitBtnText: {
    color: "#050807",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  dividerText: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "rgba(255, 255, 255, 0.35)",
    letterSpacing: 0.8,
  },
  guestBtn: {
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  guestBtnText: {
    color: "rgba(255, 255, 255, 0.75)",
    fontSize: 12.5,
    fontWeight: "600",
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  backBtnText: {
    color: "#20D66B",
    fontSize: 12.5,
    fontWeight: "700",
  },
  otpHeaderBox: {
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
  },
  otpPrompt: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.65)",
    textAlign: "center",
  },
  otpEmailBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(32, 214, 107, 0.12)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(32, 214, 107, 0.3)",
  },
  otpEmailText: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#20D66B",
  },
  otpWrapper: {
    height: 54,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  otpInput: {
    fontSize: 24,
    letterSpacing: 12,
    fontWeight: "900",
    textAlign: "center",
    color: "#20D66B",
  },
  resendRow: {
    alignItems: "center",
    marginTop: 4,
  },
  resendBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  resendLink: {
    fontSize: 12.5,
    color: "#20D66B",
    fontWeight: "800",
  },
  countdownPill: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  countdownText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.45)",
    fontWeight: "500",
  },
  countdownNum: {
    color: "#20D66B",
    fontWeight: "700",
  },
  btnPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
