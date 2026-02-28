import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "../ui/dialog";
import { Badge } from "../ui/badge";
import { Loader2, AlertCircle, Globe } from "lucide-react";
import { cn } from "../../lib/utils";

interface Service {
    id: string;
    name: string;
    enterpriseCode: string;
    isMaintenance: boolean;
    isActive: boolean;
    canBypass: boolean;
}

interface ServiceSelectionDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    services: Service[];
    onSelect: (serviceId: string) => void;
    onSelectGlobal?: () => void;
    isLoading?: boolean;
    currentServiceId?: string;
    title?: string;
    description?: string;
}

const ServiceSelectionDialog: React.FC<ServiceSelectionDialogProps> = ({
    isOpen,
    onOpenChange,
    services,
    onSelect,
    onSelectGlobal,
    isLoading = false,
    currentServiceId,
    title = "Choose a service",
    description = "You are affected by several services. Please choose one to continue."
}) => {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-slate-100 border-gray-800">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-black">{title}</DialogTitle>
                    <DialogDescription className="text-gray-400">
                        {description}
                    </DialogDescription>
                </DialogHeader>

                {isLoading && !services.length ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-4">
                        <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
                        <p className="text-gray-400 text-sm">Verifying...</p>
                    </div>
                ) : (services.length === 0 && !onSelectGlobal) ? (
                    <div className="flex flex-col items-center justify-center py-12 px-6 gap-4 text-center">
                        <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center">
                            <AlertCircle className="h-6 w-6 text-red-500" />
                        </div>
                        <div className="space-y-2">
                            <p className="text-black font-medium">You are not affected by any enterprise</p>
                            <p className="text-gray-400 text-sm">
                                You are not able to connect because you are not affected by any enterprise.
                                Please contact an administrator.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-4 py-4">
                        <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-4 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
                            {services.map((service) => {
                                const isCurrent = service.id === currentServiceId;
                                const isDisabled = isLoading || isCurrent || ((!service.isActive || service.isMaintenance) && !service.canBypass);

                                return (
                                    <button
                                        key={service.id}
                                        disabled={isDisabled}
                                        onClick={() => {
                                            onSelect(service.id);
                                        }}
                                        className={cn(
                                            "flex items-center justify-between p-4 rounded-lg border border-gray-800 transition-all text-left w-full",
                                            "hover:bg-slate-200 hover:border-emerald-500 group",
                                            isCurrent && "border-emerald-500 bg-emerald-500/5 cursor-default",
                                            ((!service.isActive || service.isMaintenance) && !service.canBypass) ? "opacity-40 cursor-not-allowed grayscale" :
                                                (!service.isActive || service.isMaintenance) ? "opacity-70" : ""
                                        )}
                                    >
                                        <div className="flex flex-col items-start text-left">
                                            <div className="flex items-center gap-2">
                                                <span className={cn(
                                                    "font-semibold text-black group-hover:text-emerald-400",
                                                    isCurrent && "text-emerald-400"
                                                )}>
                                                    {service.name}
                                                </span>
                                                {isCurrent && (
                                                    <Badge className="bg-emerald-500/20 text-emerald-400 border-none text-[10px] h-4">
                                                        Current
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex gap-2 mt-1">
                                                {!service.isActive && (
                                                    <Badge variant="destructive" className="border-red-500 text-red-500 bg-transparent text-[10px] uppercase">
                                                        Inactive
                                                    </Badge>
                                                )}
                                                {service.isMaintenance && (
                                                    <Badge variant="outline" className="border-orange-500 text-orange-500 text-[10px] uppercase">
                                                        Maintenance
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                        <div className={cn(
                                            "h-6 w-6 rounded-full border border-gray-700 flex items-center justify-center group-hover:border-emerald-500",
                                            isCurrent && "border-emerald-500 bg-emerald-500"
                                        )}>
                                            <div className={cn(
                                                "h-2 w-2 rounded-full bg-transparent group-hover:bg-emerald-500",
                                                isCurrent && "bg-white"
                                            )} />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {onSelectGlobal && (
                            <>
                                <div className="h-px bg-gray-800 my-2" />
                                <button
                                    onClick={onSelectGlobal}
                                    className={cn(
                                        "flex items-center justify-between p-4 rounded-lg border border-emerald-500/30 bg-emerald-500/5 transition-all text-left w-full",
                                        "hover:bg-emerald-500/10 hover:border-emerald-500 group"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                                            <Globe className="h-5 w-5" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-black group-hover:text-emerald-400 transition-colors">
                                                Global Dashboard
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                Return to main management portal
                                            </span>
                                        </div>
                                    </div>
                                    <div className="h-6 w-6 rounded-full border border-gray-700 flex items-center justify-center group-hover:border-emerald-500 transition-colors">
                                        <div className="h-2 w-2 rounded-full bg-transparent group-hover:bg-emerald-500 transition-colors" />
                                    </div>
                                </button>
                            </>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default ServiceSelectionDialog;
