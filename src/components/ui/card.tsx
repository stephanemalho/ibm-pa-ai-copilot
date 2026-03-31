import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

const Card = ({ className, ...props }: CardProps): ReactNode => {
  return (
    <div
      className={cn(
        "rounded-[1.5rem] border bg-card text-card-foreground shadow-panel",
        className,
      )}
      {...props}
    />
  );
};

const CardHeader = ({ className, ...props }: CardProps): ReactNode => {
  return (
    <div
      className={cn("flex flex-col space-y-1.5 p-6", className)}
      {...props}
    />
  );
};

const CardTitle = ({ className, ...props }: CardProps): ReactNode => {
  return (
    <div
      className={cn(
        "text-2xl font-semibold leading-none tracking-tight",
        className,
      )}
      {...props}
    />
  );
};

const CardDescription = ({ className, ...props }: CardProps): ReactNode => {
  return (
    <div
      className={cn("text-sm leading-6 text-muted-foreground", className)}
      {...props}
    />
  );
};

const CardContent = ({ className, ...props }: CardProps): ReactNode => {
  return <div className={cn("p-6 pt-0", className)} {...props} />;
};

export { Card, CardContent, CardDescription, CardHeader, CardTitle };
