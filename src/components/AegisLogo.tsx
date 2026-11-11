import type { ImgHTMLAttributes } from "react";
import whiteLogo from "@/assets/aegis-logo-white.png.asset.json";
import blackLogo from "@/assets/aegis-logo-black.png.asset.json";
import { cn } from "@/lib/utils";

type AegisLogoProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  variant?: "auto" | "white" | "black";
};

/** Follow the surrounding theme, or pin the variant for a fixed-color surface. */
export default function AegisLogo({ variant = "auto", className, alt = "Aegis", ...props }: AegisLogoProps) {
  if (variant !== "auto") {
    return <img {...props} src={variant === "white" ? whiteLogo.url : blackLogo.url} alt={alt} className={className} />;
  }

  return (
    <>
      <img {...props} src={blackLogo.url} alt={alt} className={cn(className, "dark:hidden")} />
      <img {...props} src={whiteLogo.url} alt={alt} className={cn(className, "hidden dark:block")} />
    </>
  );
}