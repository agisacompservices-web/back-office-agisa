import React, { createContext, useContext, useState } from "react";

interface ServSidebarContextType {
    isServSidebarOpen: boolean;
    toggleServSidebar: () => void;
    closeServSidebar: () => void;
    isMobile: boolean;
    hasHqAccess: boolean;
    setHasHqAccess: (val: boolean) => void;
    isHqLoading: boolean;
    setIsHqLoading: (val: boolean) => void;
}

export const ServSidebarContext = createContext<ServSidebarContextType | undefined>(undefined);

export function ServSidebarProvider({ children }: { children: React.ReactNode }) {
    const [isServSidebarOpen, setIsServSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const [hasHqAccess, setHasHqAccess] = useState(true);
    const [isHqLoading, setIsHqLoading] = useState(true);

    React.useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 768; // md breakpoint
            setIsMobile(mobile);
            if (mobile) {
                setIsServSidebarOpen(false);
            } else {
                setIsServSidebarOpen(true);
            }
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const toggleServSidebar = () => {
        setIsServSidebarOpen(!isServSidebarOpen);
    };

    const closeServSidebar = () => {
        setIsServSidebarOpen(false);
    };

    return (
        <ServSidebarContext.Provider value={{
            isServSidebarOpen,
            toggleServSidebar,
            closeServSidebar,
            isMobile,
            hasHqAccess,
            setHasHqAccess,
            isHqLoading,
            setIsHqLoading
        }}>
            {children}
        </ServSidebarContext.Provider>
    );
}

export function useServSidebar() {
    const context = useContext(ServSidebarContext);
    if (context === undefined) {
        throw new Error("useServSidebar must be used within a ServSidebarProvider");
    }
    return context;
}