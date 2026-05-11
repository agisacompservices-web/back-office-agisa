import { useServSidebar } from "../../context/ServSidebarContext"
import { useService } from "../../context/ServiceContext"
import { ChevronsUpDown, LayoutDashboard, ShieldHalf, Settings, FileText, User, MonitorCheck, BarChart3, Users, DollarSign, Wallet } from "lucide-react"
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
import headquartersApi from "../../context/api/headquarters"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion"
import { useTranslation } from "react-i18next"

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
        "w-full justify-start hover:bg-slate-100 hover:text-black",
        !isServSidebarOpen && "justify-center px-2",
        isActive && "bg-slate-100 text-black",
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
                    <TooltipContent side="right" className="flex items-center gap-4 bg-white text-black border border-slate-200 backdrop-blur-xl">
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
                <TooltipContent side="right" className="flex items-center gap-4 bg-white text-black border border-slate-200 backdrop-blur-xl">
                    {label}
                </TooltipContent>
            )}
        </Tooltip>
    )
}



export function ServSidebar({ className }: React.HTMLAttributes<HTMLDivElement>) {
    const { t } = useTranslation();
    const { enterpriseCode } = useParams();
    const navigate = useNavigate();
    const { isServSidebarOpen, isMobile, toggleServSidebar, closeServSidebar, setHasHqAccess, hasHqAccess, setIsHqLoading } = useServSidebar();
    const { currentService, setCurrentService } = useService();
    const [openAccordion, setOpenAccordion] = useState<string | undefined>(undefined);

    // Switch Enterprise states
    const [isSelectionDialogOpen, setIsSelectionDialogOpen] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isManager, setIsManager] = useState(false);
    const [isManagerHQ, setIsManagerHQ] = useState(false);
    const [isManagerHQLocal, setIsManagerHQLocal] = useState(false);
    const [isManagerSeller, setIsManagerSeller] = useState(false);
    const [isSeller, setIsSeller] = useState(false);
    const [isBettingEnterprise, setIsBettingEnterprise] = useState(false);
    const [isFintechEnterprise, setIsFintechEnterprise] = useState(false);
    const [userServices, setUserServices] = useState<any[]>([]);

    useEffect(() => {
        const fetchUserData = async () => {
            const storedUser = localStorage.getItem('agisa_user');
            if (!storedUser) return;

            try {
                const userData = JSON.parse(storedUser);
                const roleLevel = userData.role?.level?.toUpperCase();
                const isUserAdmin = roleLevel === 'SUPER_ADMIN' || roleLevel === 'ADMIN';
                const isLocalManager = roleLevel === 'MANAGER_HEADQUARTER_LOCAL';

                setIsAdmin(isUserAdmin);
                setIsManager(roleLevel === 'MANAGER');
                setIsManagerHQ(roleLevel === 'MANAGER_HEADQUARTER');
                setIsManagerHQLocal(isLocalManager);
                setIsManagerSeller(roleLevel === 'MANAGER_SELLER');
                setIsSeller(roleLevel === 'SELLER');

                // 2. Refresh profile from API
                const freshProfile = await usersApi.getMe();
                localStorage.setItem('agisa_user', JSON.stringify(freshProfile));

                const freshRoleLevel = freshProfile.role?.level?.toUpperCase();
                const freshIsAdmin = freshRoleLevel === 'SUPER_ADMIN' || freshRoleLevel === 'ADMIN';
                const freshIsLocalManager = freshRoleLevel === 'MANAGER_HEADQUARTER_LOCAL';

                setIsAdmin(freshIsAdmin);
                setIsManager(freshRoleLevel === 'MANAGER');
                setIsManagerHQ(freshRoleLevel === 'MANAGER_HEADQUARTER');
                setIsManagerHQLocal(freshIsLocalManager);
                setIsManagerSeller(freshRoleLevel === 'MANAGER_SELLER');
                setIsSeller(freshRoleLevel === 'SELLER');

                const freshMemberships = freshProfile.memberships || [];
                const currentMembership = freshMemberships.find(
                    (m: any) => m.enterprise?.enterpriseCode === enterpriseCode
                );

                // DYNAMIC ROLE DETECTION: Use membership-specific role if available
                let activeRoleLevel = freshRoleLevel;
                if (currentMembership && (currentMembership.membershipRoles?.length || 0) > 0) {
                    activeRoleLevel = currentMembership.membershipRoles[0].role?.level?.toUpperCase();
                }

                const finalIsAdmin = freshIsAdmin; // Global admin status is persistent
                const finalIsManager = activeRoleLevel === 'MANAGER';
                const finalIsManagerHQ = activeRoleLevel === 'MANAGER_HEADQUARTER';
                const finalIsManagerHQLocal = activeRoleLevel === 'MANAGER_HEADQUARTER_LOCAL';
                const finalIsManagerSeller = activeRoleLevel === 'MANAGER_SELLER';
                const finalIsSeller = activeRoleLevel === 'SELLER';

                setIsAdmin(finalIsAdmin);
                setIsManager(finalIsManager);
                setIsManagerHQ(finalIsManagerHQ);
                setIsManagerHQLocal(finalIsManagerHQLocal);
                setIsManagerSeller(finalIsManagerSeller);
                setIsSeller(finalIsSeller);

                // Detect if current enterprise is a betting enterprise & enrich service list with categories
                let allEnterprises: any[] = [];
                try {
                    const entRes = await enterpriseApi.getAll();
                    allEnterprises = Array.isArray(entRes) ? entRes : entRes.data || [];
                    const currentEnt = allEnterprises.find(e => e.enterpriseCode === enterpriseCode);
                    const isBetting = currentEnt?.category?.name?.toLowerCase() === 'betting';
                    setIsBettingEnterprise(isBetting);
                    const isFintech = currentEnt?.category?.name?.toLowerCase() === 'fintech';
                    setIsFintechEnterprise(isFintech);

                    // Enrich currentService with category if available
                    if (currentEnt?.category && currentService) {
                        setCurrentService({ ...currentService, category: currentEnt.category });
                    }
                } catch {
                    setIsBettingEnterprise(false);
                }

                if (freshIsLocalManager && currentMembership) {
                    setIsHqLoading(true);
                    let hqId = currentMembership.headquarter?.id;
                    if (!hqId) {
                        const managerHqs = await headquartersApi.getAll({
                            managerId: freshProfile.id,
                            enterpriseId: currentMembership.enterprise?.id,
                            limit: 1
                        });
                        if (managerHqs.data && managerHqs.data.length > 0) {
                            hqId = managerHqs.data[0].id;
                        }
                    }

                    const access = !!hqId;
                    setHasHqAccess(access);
                    setIsHqLoading(false);
                    if (!access) {
                        toast.error("Blocked", { description: "No headquarter assigned to your account." });
                    }
                } else {
                    setHasHqAccess(true); // Other roles always have access to their dashboard
                    setIsHqLoading(false);
                }

                // Determine if current service is accessible
                // Accessible if: (Admin) OR (Member exists AND Active AND Not Maintenance AND [if Local Manager, must have HQ] AND [if Seller, must have Seller Account])
                const enterprise = (currentMembership as any)?.enterprise;
                const isAccessible = isUserAdmin || (
                    currentMembership &&
                    enterprise?.isActive &&
                    !enterprise?.isMaintenance &&
                    (activeRoleLevel !== 'MANAGER_HEADQUARTER_LOCAL' || !!(currentMembership as any).headquarter?.id) &&
                    (activeRoleLevel !== 'SELLER' || !!(currentMembership as any).sellerId)
                );

                if (!isAccessible && enterpriseCode) {
                    let message = "You don't have access to this service anymore.";
                    if (currentMembership) {
                        if (!enterprise?.isActive) {
                            message = `Service "${enterprise?.name || 'Unknown'}" is currently inactive.`;
                        } else if (enterprise?.isMaintenance) {
                            message = `Service "${enterprise?.name || 'Unknown'}" is under maintenance.`;
                        } else if (activeRoleLevel === 'MANAGER_HEADQUARTER_LOCAL' && !(currentMembership as any).headquarter?.id) {
                            message = "You are not assigned to a headquarter for this service.";
                        } else if (activeRoleLevel === 'SELLER' && !(currentMembership as any).sellerId) {
                            message = "You are not assigned to a seller account for this service.";
                        }
                    }

                    toast.error(message);

                    // Find first available service for the user
                    const availableService = freshMemberships.find((m: any) => {
                        const mRole = m.membershipRoles?.[0]?.role?.level?.toUpperCase() || freshRoleLevel;
                        return isUserAdmin || (
                            m.enterprise?.isActive &&
                            !m.enterprise?.isMaintenance &&
                            (mRole !== 'MANAGER_HEADQUARTER_LOCAL' || !!m.headquarter?.id) &&
                            (mRole !== 'SELLER' || !!m.sellerId)
                        );
                    })?.enterprise;


                    if (availableService) {
                        // Switch to the first available service
                        setCurrentService(availableService);
                        navigate(`/${availableService.enterpriseCode}`, { replace: true });
                    } else {
                        // No accessible services left, logout
                        localStorage.removeItem('agisa_token');
                        localStorage.removeItem('agisa_refresh_token');
                        localStorage.removeItem('agisa_user');
                        localStorage.removeItem('agisa_current_service');
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
                    category: m.enterprise.category,
                    canBypass: m.canBypass || isUserAdmin
                }));
                setUserServices(membershipServices);

                // 5. If admin, use already-fetched enterprises to allow switching to any
                if (isUserAdmin && allEnterprises.length > 0) {
                    const formatted = allEnterprises.map(e => ({
                        id: e.id,
                        name: e.name,
                        enterpriseCode: e.enterpriseCode || "",
                        isActive: e.isActive ?? true,
                        isMaintenance: e.isMaintenance ?? false,
                        category: e.category,
                        canBypass: true
                    }));
                    setUserServices(formatted);
                }
            } catch (e) {
                console.error("Failed to parse or refresh user data", e);
            }
        };

        fetchUserData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enterpriseCode, navigate, setCurrentService, setHasHqAccess, setIsHqLoading]);

    const handleServiceSelect = (serviceId: string) => {
        const selected = userServices.find(s => s.id === serviceId);
        if (selected) {
            setCurrentService({
                id: selected.id,
                name: selected.name,
                enterpriseCode: selected.enterpriseCode,
                isActive: selected.isActive,
                isMaintenance: selected.isMaintenance,
                category: (selected as any).category
            } as any);
            setIsSelectionDialogOpen(false);
            navigate(`/${selected.enterpriseCode}`);
        }
    };

    const handleSelectGlobal = () => {
        setIsSelectionDialogOpen(false);
        navigate('/dashboard');
    };

    const handleAccordionTriggerClick = () => {
        if (!isServSidebarOpen) {
            toggleServSidebar();
        }
    };

    const sidebarContent = (
        <div className={cn(
            "bg-slate-50 backdrop-blur-xl border-r border-slate-200 text-black h-full transition-all duration-300 flex flex-col",
            isMobile
                ? cn("fixed inset-y-0 left-0 z-50 w-64", !isServSidebarOpen && "-translate-x-full")
                : cn("relative", isServSidebarOpen ? "w-64" : "w-20"),
            className
        )}>
            <div className={cn("h-16 flex items-center border-b border-slate-200 shrink-0", isServSidebarOpen ? "px-6" : "px-0 justify-center")}>
                {/* Selected enterprise logo */}
                <img src="/ag.webp" alt="" className="w-8 h-8" />
                {isServSidebarOpen && (
                    <h2 className="text-lg font-semibold tracking-tight ml-2 text-black mr-auto truncate">
                        {currentService?.name || currentService?.enterpriseCode || "Service"}
                    </h2>
                )}
            </div>
            {/* Acordion section */}
            <div className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                <div className="px-3 py-2">
                    {isServSidebarOpen && (
                        <h3 className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                            {t('sidebar.general')}
                        </h3>
                    )}
                    {!isManagerHQLocal && !isManagerHQ && !isManagerSeller && !isSeller && (
                        <div className="space-y-1">
                            <ServSidebarItem icon={LayoutDashboard} label={t('sidebar.dashboard')} href={`/${currentService?.enterpriseCode || "service"}`} isServSidebarOpen={isServSidebarOpen} />
                        </div>
                    )}

                    {/* Betting Specific Links - Visible to Admin, Manager */}
                    {isBettingEnterprise && (isAdmin || isManager) && (
                        <div className="space-y-1">
                            <ServSidebarItem
                                icon={BarChart3}
                                label={t('sidebar.bettingReports') || "Betting Reports"}
                                href={`/${currentService?.enterpriseCode}/betting-reports`}
                                isServSidebarOpen={isServSidebarOpen}
                            />
                            <ServSidebarItem
                                icon={Users}
                                label={t('sidebar.bettingParieurs') || "Betting Parieurs"}
                                href={`/${currentService?.enterpriseCode}/betting-parieur`}
                                isServSidebarOpen={isServSidebarOpen}
                            />
                        </div>
                    )}

                    {/* Fintech Specific Links - Visible to Admin, Manager */}
                    {isFintechEnterprise && (isAdmin || isManager) && (
                        <div className="space-y-1">
                            <ServSidebarItem
                                icon={BarChart3}
                                label={t('sidebar.zonecashReports') || "ZoneCash Reports"}
                                href={`/${currentService?.enterpriseCode}/zonecash-reports`}
                                isServSidebarOpen={isServSidebarOpen}
                            />
                            <ServSidebarItem
                                icon={Users}
                                label={t('sidebar.zonecashUsers') || "ZoneCash Clients"}
                                href={`/${currentService?.enterpriseCode}/zonecash-users`}
                                isServSidebarOpen={isServSidebarOpen}
                            />
                            <ServSidebarItem
                                icon={Settings}
                                label={t('sidebar.zonecashRatesSidebar') || "ZoneCash Exchange"}
                                href={`/${currentService?.enterpriseCode}/zonecash-exchange`}
                                isServSidebarOpen={isServSidebarOpen}
                            />
                            <ServSidebarItem
                                icon={DollarSign}
                                label="Global Change"
                                href={`/${currentService?.enterpriseCode}/zonecash-global-change`}
                                isServSidebarOpen={isServSidebarOpen}
                            />
                            <ServSidebarItem
                                icon={FileText}
                                label="GC Applications"
                                href={`/${currentService?.enterpriseCode}/zonecash-global-change-applications`}
                                isServSidebarOpen={isServSidebarOpen}
                            />
                            <ServSidebarItem
                                icon={Wallet}
                                label="GC Profit Basket"
                                href={`/${currentService?.enterpriseCode}/zonecash-global-change-basket`}
                                isServSidebarOpen={isServSidebarOpen}
                            />
                            <ServSidebarItem
                                icon={Settings}
                                label="ZoneCash Fees"
                                href={`/${currentService?.enterpriseCode}/zonecash-fees`}
                                isServSidebarOpen={isServSidebarOpen}
                            />
                        </div>
                    )}

                    {enterpriseCode && hasHqAccess && (
                        <div className="space-y-1">
                            <ServSidebarItem
                                icon={ChevronsUpDown}
                                label={t('sidebar.enterprise')}
                                onClick={() => setIsSelectionDialogOpen(true)}
                                isServSidebarOpen={isServSidebarOpen}
                            />
                        </div>
                    )}

                </div>
                <div className="px-3 py-2">
                    {enterpriseCode && (isAdmin || isManagerHQ || isManagerHQLocal) && (
                        <>
                            {isServSidebarOpen && (
                                <h3 className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    {t('sidebar.headquarters')}
                                </h3>
                            )}
                            <div className="space-y-1">
                                <Accordion type="single" collapsible className="w-full" value={openAccordion} onValueChange={setOpenAccordion}>
                                    <AccordionItem value="services" className="border-b-0">
                                        <Tooltip delayDuration={0}>
                                            <TooltipTrigger asChild>
                                                <AccordionTrigger
                                                    className={cn(
                                                        "py-2 hover:bg-slate-100 hover:text-black hover:no-underline rounded-md px-4 text-sm font-medium",
                                                        !isServSidebarOpen && "justify-center px-2 [&>svg]:hidden"
                                                    )}
                                                    onClick={handleAccordionTriggerClick}
                                                >
                                                    <div className="flex items-center">
                                                        <ShieldHalf className={cn("h-4 w-4", isServSidebarOpen ? "mr-2" : "")} />
                                                        {isServSidebarOpen && <span>{t('sidebar.headquarters')}</span>}
                                                    </div>
                                                </AccordionTrigger>
                                            </TooltipTrigger>
                                            {!isServSidebarOpen && (
                                                <TooltipContent side="right" className="flex items-center gap-4 bg-white text-black border border-slate-200 backdrop-blur-xl">
                                                    {t('sidebar.headquarters')}
                                                </TooltipContent>
                                            )}
                                        </Tooltip>
                                        <AccordionContent className="pb-2">
                                            <div className="pl-4 ml-4 border-l border-slate-200 space-y-1">
                                                <Link
                                                    to={isManagerHQLocal ? `/${enterpriseCode}/headquaterlocal` : `/${enterpriseCode}/headquarters`}
                                                    className={cn(
                                                        "flex items-center py-2 px-3 text-sm font-medium rounded-md hover:bg-slate-100 transition-colors",
                                                        isServSidebarOpen ? "" : "sr-only"
                                                    )}
                                                    onClick={isMobile ? closeServSidebar : undefined}
                                                >
                                                    {isManagerHQLocal ? <User className="h-3 w-3 mr-2 text-zinc-500" /> : <Settings className="h-3 w-3 mr-2 text-zinc-500" />}
                                                    {isManagerHQLocal ? t('sidebar.profile') : t('sidebar.config')}
                                                </Link>
                                                <Link
                                                    to={isManagerHQLocal ? `/${enterpriseCode}/hqlocaltransaction` : `/${enterpriseCode}/hqtransaction`}
                                                    className={cn(
                                                        "flex items-center py-2 px-3 text-sm font-medium rounded-md hover:bg-slate-100 transition-colors",
                                                        isServSidebarOpen ? "" : "sr-only"
                                                    )}
                                                    onClick={isMobile ? closeServSidebar : undefined}
                                                >
                                                    <FileText className="h-3 w-3 mr-2 text-zinc-500" />
                                                    {t('sidebar.transactions')}
                                                </Link>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>
                            </div>
                        </>
                    )}
                </div>
                <div className="px-3 py-2">
                    {enterpriseCode && (isAdmin || isManagerSeller || isSeller) && (
                        <>
                            {isServSidebarOpen && (
                                <h3 className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    {t('sidebar.sellers')}
                                </h3>
                            )}
                            <div className="space-y-1">
                                <Accordion type="single" collapsible className="w-full" value={openAccordion} onValueChange={setOpenAccordion}>
                                    <AccordionItem value="sellers" className="border-b-0">
                                        <Tooltip delayDuration={0}>
                                            <TooltipTrigger asChild>
                                                <AccordionTrigger
                                                    className={cn(
                                                        "py-2 hover:bg-slate-100 hover:text-black hover:no-underline rounded-md px-4 text-sm font-medium",
                                                        !isServSidebarOpen && "justify-center px-2 [&>svg]:hidden"
                                                    )}
                                                    onClick={handleAccordionTriggerClick}
                                                >
                                                    <div className="flex items-center">
                                                        <MonitorCheck className={cn("h-4 w-4", isServSidebarOpen ? "mr-2" : "")} />
                                                        {isServSidebarOpen && <span>{t('sidebar.sellers')}</span>}
                                                    </div>
                                                </AccordionTrigger>
                                            </TooltipTrigger>
                                            {!isServSidebarOpen && (
                                                <TooltipContent side="right" className="flex items-center gap-4 bg-white text-black border border-slate-200 backdrop-blur-xl">
                                                    {t('sidebar.sellers')}
                                                </TooltipContent>
                                            )}
                                        </Tooltip>
                                        <AccordionContent className="pb-2">
                                            <div className="pl-4 ml-4 border-l border-slate-200 space-y-1">
                                                <Link
                                                    to={isSeller ? `/${enterpriseCode}/sellerlocal` : `/${enterpriseCode}/seller`}
                                                    className={cn(
                                                        "flex items-center py-2 px-3 text-sm font-medium rounded-md hover:bg-slate-100 transition-colors",
                                                        isServSidebarOpen ? "" : "sr-only"
                                                    )}
                                                    onClick={isMobile ? closeServSidebar : undefined}
                                                >
                                                    {isSeller ? <User className="h-3 w-3 mr-2 text-zinc-500" /> : <Settings className="h-3 w-3 mr-2 text-zinc-500" />}
                                                    {isSeller ? t('sidebar.profile') : t('sidebar.config')}
                                                </Link>
                                                <Link
                                                    to={isSeller ? `/${enterpriseCode}/sellerlocaltransaction` : `/${enterpriseCode}/sellertransaction`}
                                                    className={cn(
                                                        "flex items-center py-2 px-3 text-sm font-medium rounded-md hover:bg-slate-100 transition-colors",
                                                        isServSidebarOpen ? "" : "sr-only"
                                                    )}
                                                    onClick={isMobile ? closeServSidebar : undefined}
                                                >
                                                    <FileText className="h-3 w-3 mr-2 text-zinc-500" />
                                                    {t('sidebar.transactions')}
                                                </Link>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* User section */}
            <div className={cn("px-3 py-4 mt-auto border-t border-slate-200 flex items-center shrink-0", isServSidebarOpen ? "px-6" : "px-0 justify-center")}>
                <UserNav />
            </div>
            <ServiceSelectionDialog
                isOpen={isSelectionDialogOpen}
                onOpenChange={setIsSelectionDialogOpen}
                services={userServices}
                onSelect={handleServiceSelect}
                onSelectGlobal={isAdmin ? handleSelectGlobal : undefined}
                currentServiceId={currentService?.id}
                title={t('serviceDialog.title')}
                description={t('serviceDialog.description')}
            />
        </div>
    );

    return (
        <TooltipProvider>
            <>
                {isMobile && isServSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-white z-40 backdrop-blur-sm"
                        onClick={closeServSidebar}
                    />
                )}
                {sidebarContent}
            </>
        </TooltipProvider>
    );
}