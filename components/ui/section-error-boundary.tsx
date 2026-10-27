"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  compact?: boolean;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class SectionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const { compact, fallbackTitle, fallbackMessage } = this.props;

    if (compact) {
      return (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <span className="text-white/70">{fallbackTitle || "Không thể tải nội dung này"}</span>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="ml-auto text-primary hover:text-primary/80 font-medium text-xs flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" /> Thử lại
          </button>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="relative w-16 h-16 mb-6">
          <div className="absolute inset-0 bg-red-500/15 rounded-full blur-xl animate-pulse" />
          <div className="relative w-full h-full bg-zinc-900/80 border border-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
        </div>

        <h3 className="text-xl font-bold text-white mb-2">
          {fallbackTitle || "Đã xảy ra lỗi"}
        </h3>
        <p className="text-white/50 text-sm mb-6 max-w-sm">
          {fallbackMessage || "Phần nội dung này gặp sự cố. Các phần khác vẫn hoạt động bình thường."}
        </p>

        <button
          onClick={() => this.setState({ hasError: false })}
          className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/15 border border-white/10 text-white text-sm font-medium rounded-full transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          Tải lại phần này
        </button>
      </div>
    );
  }
}
