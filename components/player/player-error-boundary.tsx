"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onCatchError?: (error: Error) => void;
  onReset?: () => void;
  onSwitchToEmbed?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class PlayerErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn("PlayerErrorBoundary caught an error:", error, errorInfo);
    this.props.onCatchError?.(error);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="w-full aspect-video bg-black/95 flex flex-col items-center justify-center p-6 text-center text-white rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden">
          <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-4 text-red-400">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white mb-2">
            Không thể tải trình phát video
          </h3>
          <p className="text-xs sm:text-sm text-white/60 mb-5 max-w-md">
            Đã có sự cố trong quá trình khởi tạo trình phát. Vui lòng bấm thử lại để tiếp tục xem phim.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button
              onClick={this.handleRetry}
              variant="outline"
              size="sm"
              className="rounded-xl border-white/15 bg-white/5 hover:bg-white/10 text-white font-bold cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 mr-1.5" />
              Thử lại kết nối
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default PlayerErrorBoundary;
