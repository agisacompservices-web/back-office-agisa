import { useServSidebar } from "../../context/ServSidebarContext"
import { useService } from "../../context/ServiceContext"
import { ChevronsUpDown, LayoutDashboard } from "lucide-react"
import { cn } from "../../lib/utils"
import { Button } from "../ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip"
import { Link, useParams, useNavigate } from "react-router-dom"
import React, { useState, useEffect } from "react"
import { toast } from "sonner"
import { UserNav } from "./UserAvatar"
import ServiceSelectionDialog from "../auth/ServiceSelectionDialog"
import enterpriseApi from "../../context/api/enterprise"
import usersApi from "../../context/api/users"

interface ServSidebarItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    icon: React.ElementType
    label: string
    isServSidebarOpen: boolean
    isActive?: boolean
    expanded?: boolean
    href?: string
}
const ServSidebarItem = ({ icon: Icon, label, isServSidebarOpen, isActive, className, href, ...props }: ServSidebarItemProps) => {
    const { isMobile, closeServSidebar } = useServSidebar();

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (props.onClick) props.onClick(e);
        if (isMobile && href) {
            closeServSidebar();
        }
    }

    const buttonContent = (
        <>
            <Icon className={cn("h-4 w-4", isServSidebarOpen ? "mr-2" : "")} />
            {isServSidebarOpen && <span>{label}</span>}
            {!isServSidebarOpen && <span className="sr-only">{label}</span>}
        </>
    )

    const buttonClasses = cn(
        "w-full justify-start hover:bg-white/10 hover:text-white",
        !isServSidebarOpen && "justify-center px-2",
        isActive && "bg-white/10 text-white",
        isServSidebarOpen ? "pl-4" : "",
        className
    )

    if (href) {
        return (
            <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        className={buttonClasses}
                        asChild
                        onClick={handleClick}
                        {...props}
                    >
                        <Link to={href}>
                            {buttonContent}
                        </Link>
                    </Button>
                </TooltipTrigger>
                {!isServSidebarOpen && (
                    <TooltipContent side="right" className="flex items-center gap-4 bg-black/90 text-white border border-white/10 backdrop-blur-xl">
                        {label}
                    </TooltipContent>
                )}
            </Tooltip>
        )
    }

    return (
        <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
                <Button
                    variant="ghost"
                    className={buttonClasses}
                    onClick={handleClick}
                    {...props}
                >
                    {buttonContent}
                </Button>
            </TooltipTrigger>
            {!isServSidebarOpen && (
                <TooltipContent side="right" className="flex items-center gap-4 bg-black/90 text-white border border-white/10 backdrop-blur-xl">
                    {label}
                </TooltipContent>
            )}
        </Tooltip>
    )
}



export function ServSidebar({ className }: React.HTMLAttributes<HTMLDivElement>) {
    const { enterpriseCode } = useParams();
    const navigate = useNavigate();
    const { isServSidebarOpen, isMobile, closeServSidebar } = useServSidebar();
    const { currentService, setCurrentService } = useService();

    // Switch Enterprise states
    const [isSelectionDialogOpen, setIsSelectionDialogOpen] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [userServices, setUserServices] = useState<any[]>([]);

    useEffect(() => {
        const fetchUserData = async () => {
            const storedUser = localStorage.getItem('agisa_user');
            if (!storedUser) return;

            try {
                // 1. Initial parse for immediate UI responsiveness
                const userData = JSON.parse(storedUser);
                const roleLevel = userData.role?.level?.toUpperCase();
                const isUserAdmin = roleLevel === 'SUPER_ADMIN' || roleLevel === 'ADMIN';
                setIsAdmin(isUserAdmin);

                // 2. Refresh profile from API to ensure memberships are up-to-date
                const freshProfile = await usersApi.getMe();
                localStorage.setItem('agisa_user', JSON.stringify(freshProfile));

                // 3. Handle Membership and Service Status Enforcement
                const freshMemberships = freshProfile.memberships || [];

                // Find current membership
                const currentMembership = freshMemberships.find(
                    (m: any) => m.enterprise?.enterpriseCode === enterpriseCode
                );

                // Determine if current service is accessible
                // Accessible if: (Admin) OR (Member exists AND Active AND Not Maintenance)
                const enterprise = currentMembership?.enterprise;
                const isAccessible = isUserAdmin || (currentMembership && enterprise?.isActive && !enterprise?.isMaintenance);

                if (!isAccessible && enterpriseCode) {
                    const message = !currentMembership
                        ? "You don't have access to this service anymore."
                        : !enterprise?.isActive
                            ? `Service "${enterprise?.name || 'Inconnu'}" is currently inactive.`
                            : `Service "${enterprise?.name || 'Inconnu'}" is under maintenance.`;

                    toast.error(message);

                    // Find first available service for the user
                    const availableService = freshMemberships.find((m: any) =>
                        isUserAdmin || (m.enterprise?.isActive && !m.enterprise?.isMaintenance)
                    )?.enterprise;

                    if (availableService) {
                        // Switch to the first available service
                        setCurrentService(availableService);
                        navigate(`/${availableService.enterpriseCode}`, { replace: true });
                    } else {
                        // No accessible services left, logout
                        localStorage.removeItem('agisa_token');
                        localStorage.removeItem('agisa_refresh_token');
                        localStorage.removeItem('agisa_user');
                        setCurrentService(null);
                        navigate('/login', { replace: true });
                    }
                    return;
                }

                // 4. Update the service list for the switcher
                const membershipServices = freshMemberships.map((m: any) => ({
                    id: m.enterprise.id,
                    name: m.enterprise.name,
                    enterpriseCode: m.enterprise.enterpriseCode,
                    isActive: m.enterprise.isActive,
                    isMaintenance: m.enterprise.isMaintenance,
                    canBypass: m.canBypass || isUserAdmin
                }));
                setUserServices(membershipServices);

                // 5. If admin, fetch all enterprises to allow switching to any
                if (isUserAdmin) {
                    try {
                        const allEnterprisesData = await enterpriseApi.getAll();
                        let allEnterprises: any[] = [];

                        if (Array.isArray(allEnterprisesData)) {
                            allEnterprises = allEnterprisesData;
                        } else if (allEnterprisesData && (allEnterprisesData as any).data && Array.isArray((allEnterprisesData as any).data)) {
                            allEnterprises = (allEnterprisesData as any).data;
                        }

                        const formatted = allEnterprises.map(e => ({
                            id: e.id,
                            name: e.name,
                            enterpriseCode: e.enterpriseCode || "",
                            isActive: e.isActive ?? true,
                            isMaintenance: e.isMaintenance ?? false,
                            canBypass: true
                        }));
                        setUserServices(formatted);
                    } catch (err) {
                        console.error("Failed to fetch all services for admin switcher", err);
                    }
                }
            } catch (e) {
                console.error("Failed to parse or refresh user data", e);
            }
        };

        fetchUserData();
    }, [enterpriseCode, navigate, setCurrentService]);

    const handleServiceSelect = (serviceId: string) => {
        const selected = userServices.find(s => s.id === serviceId);
        if (selected) {
            setCurrentService({
                id: selected.id,
                name: selected.name,
                enterpriseCode: selected.enterpriseCode,
                isActive: selected.isActive,
                isMaintenance: selected.isMaintenance
            } as any);
            setIsSelectionDialogOpen(false);
            navigate(`/${selected.enterpriseCode}`);
        }
    };

    const handleSelectGlobal = () => {
        setIsSelectionDialogOpen(false);
        navigate('/dashboard');
    };

    const sidebarContent = (
        <div className={cn(
            "bg-black/40 backdrop-blur-xl border-r border-white/10 text-white h-full transition-all duration-300 flex flex-col",
            isMobile
                ? cn("fixed inset-y-0 left-0 z-50 w-64", !isServSidebarOpen && "-translate-x-full")
                : cn("relative", isServSidebarOpen ? "w-64" : "w-20"),
            className
        )}>
            <div className={cn("h-16 flex items-center border-b border-white/10 shrink-0", isServSidebarOpen ? "px-6" : "px-0 justify-center")}>
                {/* Selected enterprise logo */}
                <img src="/logo.webp" alt="" className="w-8 h-8" />
                {isServSidebarOpen && (
                    <h2 className="text-lg font-semibold tracking-tight ml-2 text-white mr-auto truncate">
                        {currentService?.name || currentService?.enterpriseCode || "Service"}
                    </h2>
                )}
            </div>
            {/* Acordion section */}
            <div className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                <div className="px-3 py-2">
                    {isServSidebarOpen && (
                        <h3 className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-white/50">
                            Général
                        </h3>
                    )}
                    <div className="space-y-1">
                        <ServSidebarItem icon={LayoutDashboard} label="Dashboard" href={`/${currentService?.enterpriseCode || "service"}`} isServSidebarOpen={isServSidebarOpen} />
                    </div>
                    {enterpriseCode && (
                        <div className="space-y-1">
                            <ServSidebarItem
                                icon={ChevronsUpDown}
                                label="Entreprise"
                                onClick={() => setIsSelectionDialogOpen(true)}
                                isServSidebarOpen={isServSidebarOpen}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* User section */}
            <div className={cn("px-3 py-4 mt-auto border-t border-white/10 flex items-center shrink-0", isServSidebarOpen ? "px-6" : "px-0 justify-center")}>
                <UserNav />
            </div>
            <ServiceSelectionDialog
                isOpen={isSelectionDialogOpen}
                onOpenChange={setIsSelectionDialogOpen}
                services={userServices}
                onSelect={handleServiceSelect}
                onSelectGlobal={isAdmin ? handleSelectGlobal : undefined}
                currentServiceId={currentService?.id}
                title="Change Service"
                description="Select another service to change context."
            />
        </div>
    );

    return (
        <TooltipProvider>
            <>
                {isMobile && isServSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/80 z-40 backdrop-blur-sm"
                        onClick={closeServSidebar}
                    />
                )}
                {sidebarContent}
            </>
        </TooltipProvider>
    );
}