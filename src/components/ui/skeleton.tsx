import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-md bg-muted/60 animate-[pulse_1.1s_ease-in-out_infinite]", className)}
      {...props}
    />
  );
}

export { Skeleton };
