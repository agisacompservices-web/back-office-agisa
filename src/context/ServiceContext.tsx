import React, { createContext, useContext, useState, useEffect } from "react";
import { Enterprise } from "./api/enterprise";

interface ServiceContextType {
    currentService: Enterprise | null;
    setCurrentService: (service: Enterprise | null) => void;
    clearService: () => void;
}

const ServiceContext = createContext<ServiceContextType | undefined>(undefined);

export const ServiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentService, setCurrentService] = useState<Enterprise | null>(() => {
        const saved = localStorage.getItem("agisa_current_service");
        return saved ? JSON.parse(saved) : null;
    });

    useEffect(() => {
        if (currentService) {
            localStorage.setItem("agisa_current_service", JSON.stringify(currentService));
        } else {
            localStorage.removeItem("agisa_current_service");
        }
    }, [currentService]);

    const clearService = () => {
        setCurrentService(null);
    };

    return (
        <ServiceContext.Provider value={{ currentService, setCurrentService, clearService }}>
            {children}
        </ServiceContext.Provider>
    );
};

export const useService = () => {
    const context = useContext(ServiceContext);
    if (context === undefined) {
        throw new Error("useService must be used within a ServiceProvider");
    }
    return context;
};
