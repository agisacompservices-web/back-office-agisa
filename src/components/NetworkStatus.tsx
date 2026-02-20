import React, { useEffect } from "react";
import { useNetwork } from "../hooks/useNetwork";
import { toast } from "sonner";
import { WifiOff, Wifi, AlertTriangle } from "lucide-react";

export const NetworkStatus: React.FC = () => {
    const { isOnline, isPoorConnection } = useNetwork();

    useEffect(() => {
        if (!isOnline) {
            toast.error("Woups! Internet down", {
                id: "offline-notification",
                icon: <WifiOff className="h-4 w-4" />,
                description: "Please check your internet connection. You can't perform any operations.",
                duration: Infinity, // Persistent until online
            });
        } else {
            // Check if it was offline before Dismissing
            toast.dismiss("offline-notification");

            // Only show "Back online" if it was triggered by a real transition (not initial mount)
            // Sonner dismiss is safe even if not exists.

            // Note: We could use a ref to track previous state if we want to avoid 
            // the "Back online" toast on first mount when online.
        }
    }, [isOnline]);

    useEffect(() => {
        if (isOnline && isPoorConnection) {
            toast.warning("Internet slow", {
                id: "slow-connection",
                icon: <AlertTriangle className="h-4 w-4" />,
                description: "Your internet connection is slow. Some operations may take longer.",
                duration: 5000,
            });
        } else {
            toast.dismiss("slow-connection");
        }
    }, [isOnline, isPoorConnection]);

    // Handle the "Back Online" separately to avoid firing on mount
    useEffect(() => {
        const handleOnline = () => {
            toast.success("Internet back online!", {
                icon: <Wifi className="h-4 w-4" />,
                description: "You can continue working normally.",
                duration: 4000,
            });
        };

        window.addEventListener("online", handleOnline);
        return () => window.removeEventListener("online", handleOnline);
    }, []);

    return null; // This component doesn't render anything visible, it just manages toasts
};
