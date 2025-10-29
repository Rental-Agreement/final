import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, Wifi, ServerCrash } from "lucide-react";

interface ErrorStateProps {
  type?: "network" | "server" | "not-found" | "generic";
  message?: string;
  onRetry?: () => void;
  showRetry?: boolean;
}

export function ErrorState({ 
  type = "generic", 
  message, 
  onRetry, 
  showRetry = true 
}: ErrorStateProps) {
  const errorStates = {
    network: {
      icon: Wifi,
      title: "Connection Lost",
      description: message || "Please check your internet connection and try again.",
      color: "text-orange-500",
      bgColor: "bg-orange-50 dark:bg-orange-950/20",
    },
    server: {
      icon: ServerCrash,
      title: "Server Error",
      description: message || "Something went wrong on our end. Our team has been notified.",
      color: "text-red-500",
      bgColor: "bg-red-50 dark:bg-red-950/20",
    },
    "not-found": {
      icon: AlertCircle,
      title: "Not Found",
      description: message || "We couldn't find what you're looking for.",
      color: "text-gray-500",
      bgColor: "bg-gray-50 dark:bg-gray-950/20",
    },
    generic: {
      icon: AlertCircle,
      title: "Something Went Wrong",
      description: message || "An unexpected error occurred. Please try again.",
      color: "text-gray-500",
      bgColor: "bg-gray-50 dark:bg-gray-950/20",
    },
  };

  const state = errorStates[type];
  const Icon = state.icon;

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {/* Error Icon */}
      <div className={`mb-4 p-6 rounded-full ${state.bgColor}`}>
        <Icon className={`w-12 h-12 ${state.color}`} />
      </div>

      {/* Error Message */}
      <h3 className="text-lg font-semibold mb-2">{state.title}</h3>
      <p className="text-sm text-muted-foreground max-w-md mb-6">
        {state.description}
      </p>

      {/* Actions */}
      {showRetry && onRetry && (
        <Button onClick={onRetry} variant="default" size="lg">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      )}

      {/* Help Text */}
      <p className="text-xs text-muted-foreground mt-4">
        If the problem persists, please contact{" "}
        <a href="mailto:support@tenanttown.com" className="text-primary hover:underline">
          support
        </a>
      </p>
    </div>
  );
}
