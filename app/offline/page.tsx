"use client";

import { useEffect } from 'react';

export default function OfflinePage() {
    useEffect(() => {
        // Try to reload when back online
        const handleOnline = () => {
            window.location.reload();
        };

        window.addEventListener('online', handleOnline);
        return () => window.removeEventListener('online', handleOnline);
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center px-4">
                <div className="mb-8">
                    <svg
                        className="w-32 h-32 mx-auto text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
                        />
                    </svg>
                </div>

                <h1 className="text-4xl font-bold text-white mb-4">
                    Không có kết nối
                </h1>

                <p className="text-gray-400 text-lg mb-8">
                    Bạn đang offline. Vui lòng kiểm tra kết nối internet.
                </p>

                <button
                    onClick={() => window.location.reload()}
                    className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
                >
                    Thử lại
                </button>

                <p className="text-gray-500 text-sm mt-8">
                    Trang sẽ tự động tải lại khi có kết nối
                </p>
            </div>
        </div>
    );
}
