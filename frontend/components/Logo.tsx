import { cn } from "@/lib/utils";
import Link from "next/link";

interface Props {
  className?: string;
  variant?: "default" | "sm";
  dark?: boolean;
}

const Logo = ({ className, variant = "default", dark = false }: Props) => {
  const textColor = dark ? "text-white" : "text-terracotta";

  if (variant === "sm") {
    return (
      <Link href="/">
        <div className={cn("flex items-center", className)}>
          <span className={cn("font-[family-name:var(--font-caveat)] text-xl font-bold", textColor)}>
            WyZar
          </span>
        </div>
      </Link>
    );
  }

  return (
    <Link href="/">
      <div className={cn("flex items-center", className)}>
        <span className={cn("font-[family-name:var(--font-caveat)] text-3xl font-bold", textColor)}>
          WyZar
        </span>
      </div>
    </Link>
  );
};

export default Logo;
