import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface LoadingProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  fullScreen?: boolean;
}

export function Loading({
  message = "Loading...",
  size = "md",
  fullScreen = false
}: LoadingProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  const content = (
    <div className="flex flex-col items-center justify-center gap-3 p-6">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {content}
      </div>
    );
  }

  return <Card><CardContent>{content}</CardContent></Card>;
}

export function PageLoading({ message }: { message?: string }) {
  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 flex items-center justify-center">
        <Loading message={message} size="lg" />
      </div>
    </div>
  );
}

export function InlineLoading({ message, size = "sm" }: { message?: string; size?: "sm" | "md" | "lg" }) {
  return (
    <div className="flex items-center gap-2">
      <Loader2 className={`${size === "sm" ? "h-4 w-4" : size === "md" ? "h-6 w-6" : "h-8 w-8"} animate-spin`} />
      {message && <span className="text-sm">{message}</span>}
    </div>
  );
}
