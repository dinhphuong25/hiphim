import { Film, Sparkles } from "lucide-react";

export function LoadingWatch() {
  return (
    <div className="bg-cinema-bg min-h-screen text-white flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute inset-0 bg-gradient-to-t from-brand-green/10 via-transparent to-transparent pointer-events-none" />
      <div className="absolute w-96 h-96 bg-brand-green/15 rounded-full blur-[120px] pointer-events-none" />

      <div className="flex flex-col items-center gap-5 relative z-10">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-brand-green/20 border-t-brand-green rounded-full animate-spin shadow-[0_0_30px_rgba(34,197,94,0.4)]" />
          <Film className="w-6 h-6 text-brand-green absolute inset-0 m-auto animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-brand-green animate-bounce" />
          <p className="text-white/80 font-extrabold text-sm tracking-wider uppercase animate-pulse">
            Đang tải phòng chiếu 4K...
          </p>
        </div>
      </div>
    </div>
  );
}

export function LoadingMovieDetail() {
  return (
    <div className="min-h-screen bg-cinema-bg flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute w-96 h-96 bg-brand-green/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="flex flex-col items-center gap-4 relative z-10">
        <div className="w-14 h-14 border-4 border-brand-green/30 border-t-brand-green rounded-full animate-spin shadow-[0_0_25px_rgba(34,197,94,0.3)]" />
        <p className="text-white/70 font-bold text-sm tracking-wide animate-pulse">
          Đang chuẩn bị thông tin phim...
        </p>
      </div>
    </div>
  );
}
