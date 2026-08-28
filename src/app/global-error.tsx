"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[global-error]", error);
  }, [error]);

  return (
    <html lang="ko">
      <body className="flex min-h-dvh flex-col items-center justify-center gap-4 p-8 text-center">
        <h1 style={{ fontSize: "1.125rem", fontWeight: 600 }}>예기치 못한 오류가 발생했습니다</h1>
        <p style={{ fontSize: "0.875rem", color: "#71717a" }}>페이지를 다시 불러오는 중 문제가 발생했습니다.</p>
        <button
          onClick={reset}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "0.5rem",
            background: "#18181b",
            color: "#fff",
            fontSize: "0.875rem",
          }}
        >
          다시 시도
        </button>
      </body>
    </html>
  );
}
