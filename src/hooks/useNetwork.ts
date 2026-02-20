import { useState, useEffect } from "react";

export interface NetworkStatus {
    isOnline: boolean;
    isPoorConnection: boolean;
    effectiveType: string | null;
}

export const useNetwork = (): NetworkStatus => {
    const [status, setStatus] = useState<NetworkStatus>({
        isOnline: navigator.onLine,
        isPoorConnection: false,
        effectiveType: null,
    });

    useEffect(() => {
        const updateStatus = () => {
            const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
            const effectiveType = connection ? connection.effectiveType : null;
            const isPoorConnection = effectiveType === "slow-2g" || effectiveType === "2g" || effectiveType === "3g";

            setStatus({
                isOnline: navigator.onLine,
                isPoorConnection,
                effectiveType,
            });
        };

        window.addEventListener("online", updateStatus);
        window.addEventListener("offline", updateStatus);

        const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
        if (connection) {
            connection.addEventListener("change", updateStatus);
        }

        // Initial update
        updateStatus();

        return () => {
            window.removeEventListener("online", updateStatus);
            window.removeEventListener("offline", updateStatus);
            if (connection) {
                connection.removeEventListener("change", updateStatus);
            }
        };
    }, []);

    return status;
};
