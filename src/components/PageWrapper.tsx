import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" as const } },
  exit: { opacity: 0, y: -4, transition: { duration: 0.15 } },
};

export function PageWrapper({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const isMobile = useIsMobile();

  return (
    <motion.div
      className={cn(isMobile && "pb-3", className)}
      variants={pageVariants}
      initial={false}
      animate="animate"
      exit="exit"
    >
      {children}
    </motion.div>
  );
}
