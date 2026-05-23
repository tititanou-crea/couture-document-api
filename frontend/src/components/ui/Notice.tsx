import type { ReactNode } from "react";

type NoticeProps = {
  type?: "info" | "success" | "error";
  children: ReactNode;
};

export function Notice({ type = "info", children }: NoticeProps) {
  const styles = {
    info: "border-thread/25 bg-cream text-ink",
    success: "border-sage/30 bg-[#f1f6eb] text-[#52613f]",
    error: "border-[#b94d55]/30 bg-[#fff1f1] text-[#8b333a]",
  };

  return <div className={`rounded-lg border px-4 py-3 text-base leading-6 ${styles[type]}`}>{children}</div>;
}
