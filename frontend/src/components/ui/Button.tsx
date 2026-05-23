import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "quiet" | "danger";
  icon?: ReactNode;
};

export function Button({ children, className = "", variant = "primary", icon, ...props }: ButtonProps) {
  const variants = {
    primary: "bg-rosewood text-white hover:bg-[#c83b68]",
    secondary: "bg-white text-rosewood border border-rosewood/25 hover:bg-[#fff2f5]",
    quiet: "bg-transparent text-rosewood hover:bg-white/60",
    danger: "bg-[#9d3f46] text-white hover:bg-[#85343a]",
  };

  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
