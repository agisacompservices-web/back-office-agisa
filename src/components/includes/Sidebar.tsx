import { useSidebar } from "../../context/SidebarContext"
import { ArrowDownAZ, BanknoteArrowDown, Calculator, ClipboardPlus, Cog, GitPullRequestArrow, LayoutDashboard, Lock, Logs, LucideIcon, Monitor, MonitorCloud, MonitorCog, Percent, ShieldHalf, SquareAsterisk, Users, Wallet } from "lucide-react"
import { cn } from "../../lib/utils"
import { Button } from "../ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip"
import { Link } from "react-router-dom"
import React from "react"
import { UserNav } from "./UserAvatar"
import { useTranslation } from "react-i18next";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion"

interface SidebarItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    icon: LucideIcon
    label: string
    isSidebarOpen: boolean
    isActive?: boolean
    expanded?: boolean
    href?: string
}
const SidebarItem = ({ icon: Icon, label, isSidebarOpen, isActive, className, href, ...props }: SidebarItemProps) => {
    const { isMobile, closeSidebar } = useSidebar();

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (props.onClick) props.onClick(e);
        if (isMobile && href) {
            closeSidebar();
        }
    }

    const buttonContent = (
        <>
            <Icon className={cn("h-4 w-4", isSidebarOpen ? "mr-2" : "")} />
            {isSidebarOpen && <span>{label}</span>}
            {!isSidebarOpen && <span className="sr-only">{label}</span>}
        </>
    )

    const buttonClasses = cn(
        "w-full justify-start hover:bg-white/10 hover:text-white",
        !isSidebarOpen && "justify-center px-2",
        isActive && "bg-white/10 text-white",
        isSidebarOpen ? "pl-4" : "",
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
                {!isSidebarOpen && (
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
            {!isSidebarOpen && (
                <TooltipContent side="right" className="flex items-center gap-4 bg-black/90 text-white border border-white/10 backdrop-blur-xl">
                    {label}
                </TooltipContent>
            )}
        </Tooltip>
    )
}

export function Sidebar({ className }: React.HTMLAttributes<HTMLDivElement>) {
    const { t } = useTranslation();
    const { isSidebarOpen, toggleSidebar, isMobile, closeSidebar } = useSidebar();
    const [openAccordion, setOpenAccordion] = React.useState<string>("");


    React.useEffect(() => {
        if (!isSidebarOpen) {
            setOpenAccordion("");
        }
    }, [isSidebarOpen]);

    const [user, setUser] = React.useState<any>(null);

    React.useEffect(() => {
        const storedUser = localStorage.getItem('agisa_user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error("Failed to parse user for sidebar visibility", e);
            }
        }
    }, []);

    const role = user?.role?.level?.toUpperCase();
    const isSuperAdmin = role === 'SUPER_ADMIN';
    const isAdmin = role === 'ADMIN';
    const isAnyAdmin = isSuperAdmin || isAdmin;
    const isFinance = role === 'FINANCE';
    const isAccounting = role === 'ACCOUNTING';
    const isLitigation = role === 'LITIGATION';
    const isManagerHQ = role === 'MANAGER_HEADQUARTER';

    const handleAccordionTriggerClick = () => {
        if (!isSidebarOpen) {
            toggleSidebar();
        }
    };

    const handleLinkClick = () => {
        if (isMobile) closeSidebar();
    };

    const sidebarContent = (
        <div className={cn(
            "bg-black/40 backdrop-blur-xl border-r border-white/10 text-white h-full transition-all duration-300 flex flex-col",
            isMobile
                ? cn("fixed inset-y-0 left-0 z-50 w-64", !isSidebarOpen && "-translate-x-full")
                : cn("relative", isSidebarOpen ? "w-64" : "w-20"),
            className
        )}>
            <div className={cn("h-16 flex items-center border-b border-white/10 shrink-0", isSidebarOpen ? "px-6" : "px-0 justify-center")}>
                {/* Agisa logo */}
                <img src="/ag.webp" alt="" className="w-8 h-8" />
                {isSidebarOpen && (
                    <h2 className="text-lg font-semibold tracking-tight ml-2 text-white mr-auto">
                        AGISA
                    </h2>
                )}
            </div>
            {/* Acordion section */}
            <div className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                <div className="px-3 py-2">
                    {isAnyAdmin && (
                        <>
                            {isSidebarOpen && (
                                <h3 className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-white/50">{t('sidebar.general')}</h3>
                            )}
                            <div className="space-y-1">
                                <SidebarItem icon={LayoutDashboard} label={t('sidebar.dashboard')} href="/dashboard" isSidebarOpen={isSidebarOpen} />

                            </div>
                        </>
                    )}
                </div>
                {/* Finance section */}
                {(isAnyAdmin || isFinance) && (
                    <div className="px-3 py-2">
                        {isSidebarOpen && (
                            <h3 className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-white/50">{t('sidebar.finance')}</h3>
                        )}
                        <div className="space-y-1">
                            <Accordion type="single" collapsible className="w-full" value={openAccordion} onValueChange={setOpenAccordion}>
                                <AccordionItem value="finance" className="border-b-0">
                                    <Tooltip delayDuration={0}>
                                        <TooltipTrigger asChild>
                                            <AccordionTrigger
                                                className={cn(
                                                    "py-2 hover:bg-white/10 hover:text-white hover:no-underline rounded-md px-4 text-sm font-medium",
                                                    !isSidebarOpen && "justify-center px-2 [&>svg]:hidden"
                                                )}
                                                onClick={handleAccordionTriggerClick}
                                            >
                                                <div className="flex items-center">
                                                    <Wallet className={cn("h-4 w-4", isSidebarOpen ? "mr-2" : "")} />
                                                    {isSidebarOpen && <span>{t('sidebar.finance')}</span>}
                                                </div>
                                            </AccordionTrigger>
                                        </TooltipTrigger>
                                        {!isSidebarOpen && (
                                            <TooltipContent side="right" className="flex items-center gap-4 bg-black/90 text-white border border-white/10 backdrop-blur-xl">{t('sidebar.finance')}</TooltipContent>
                                        )}
                                    </Tooltip>
                                    <AccordionContent className="pb-0 pl-10">
                                        <div className="space-y-1 mt-1">
                                            <Button variant="ghost" size="sm" className="w-full justify-start h-8 hover:bg-white/10 hover:text-white" asChild onClick={handleLinkClick}>
                                                <Link to="/finance">
                                                    <BanknoteArrowDown className="mr-2 h-4 w-4" />
                                                    {t('sidebar.cashDelivery')}
                                                </Link>
                                            </Button>
                                        </div>
                                        <div className="space-y-1 mt-1">
                                            <Button variant="ghost" size="sm" className="w-full justify-start h-8 hover:bg-white/10 hover:text-white" asChild onClick={handleLinkClick}>
                                                <Link to="/finance/report">
                                                    <ClipboardPlus className="mr-2 h-4 w-4" />
                                                    {t('sidebar.cashReports')}
                                                </Link>
                                            </Button>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </div>
                    </div>
                )}
                {/* Accounting section */}
                {(isAnyAdmin || isAccounting) && (
                    <div className="px-3 py-2">
                        {isSidebarOpen && (
                            <h3 className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-white/50">{t('sidebar.accounting')}</h3>
                        )}
                        <div className="space-y-1">
                            <Accordion type="single" collapsible className="w-full" value={openAccordion} onValueChange={setOpenAccordion}>
                                <AccordionItem value="accounting" className="border-b-0">
                                    <Tooltip delayDuration={0}>
                                        <TooltipTrigger asChild>
                                            <AccordionTrigger
                                                className={cn(
                                                    "py-2 hover:bg-white/10 hover:text-white hover:no-underline rounded-md px-4 text-sm font-medium",
                                                    !isSidebarOpen && "justify-center px-2 [&>svg]:hidden"
                                                )}
                                                onClick={handleAccordionTriggerClick}
                                            >
                                                <div className="flex items-center">
                                                    <Calculator className={cn("h-4 w-4", isSidebarOpen ? "mr-2" : "")} />
                                                    {isSidebarOpen && <span>{t('sidebar.accounting')}</span>}
                                                </div>
                                            </AccordionTrigger>
                                        </TooltipTrigger>
                                        {!isSidebarOpen && (
                                            <TooltipContent side="right" className="flex items-center gap-4 bg-black/90 text-white border border-white/10 backdrop-blur-xl">{t('sidebar.accounting')}</TooltipContent>
                                        )}
                                    </Tooltip>
                                    <AccordionContent className="pb-0 pl-10">
                                        <div className="space-y-1 mt-1">
                                            <Button variant="ghost" size="sm" className="w-full justify-start h-8 hover:bg-white/10 hover:text-white" asChild onClick={handleLinkClick}>
                                                <Link to="/accounting">
                                                    <GitPullRequestArrow className="mr-2 h-4 w-4" />
                                                    {t('sidebar.request')}
                                                </Link>
                                            </Button>
                                        </div>
                                        <div className="space-y-1 mt-1">
                                            <Button variant="ghost" size="sm" className="w-full justify-start h-8 hover:bg-white/10 hover:text-white" asChild onClick={handleLinkClick}>
                                                <Link to="/accounting/report">
                                                    <ClipboardPlus className="mr-2 h-4 w-4" />
                                                    {t('sidebar.requestReports')}
                                                </Link>
                                            </Button>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </div>
                    </div>
                )}
                {/* Litigation section */}
                {(isAnyAdmin || isLitigation) && (
                    <div className="px-3 py-2">
                        {isSidebarOpen && (
                            <h3 className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-white/50">{t('sidebar.litigation')}</h3>
                        )}
                        <div className="space-y-1">
                            <Accordion type="single" collapsible className="w-full" value={openAccordion} onValueChange={setOpenAccordion}>
                                <AccordionItem value="litigation" className="border-b-0">
                                    <Tooltip delayDuration={0}>
                                        <TooltipTrigger asChild>
                                            <AccordionTrigger
                                                className={cn(
                                                    "py-2 hover:bg-white/10 hover:text-white hover:no-underline rounded-md px-4 text-sm font-medium",
                                                    !isSidebarOpen && "justify-center px-2 [&>svg]:hidden"
                                                )}
                                                onClick={handleAccordionTriggerClick}
                                            >
                                                <div className="flex items-center">
                                                    <ShieldHalf className={cn("h-4 w-4", isSidebarOpen ? "mr-2" : "")} />
                                                    {isSidebarOpen && <span>{t('sidebar.litigation')}</span>}
                                                </div>
                                            </AccordionTrigger>
                                        </TooltipTrigger>
                                        {!isSidebarOpen && (
                                            <TooltipContent side="right" className="flex items-center gap-4 bg-black/90 text-white border border-white/10 backdrop-blur-xl">{t('sidebar.litigation')}</TooltipContent>
                                        )}
                                    </Tooltip>
                                    <AccordionContent className="pb-0 pl-10">
                                        <div className="space-y-1 mt-1">
                                            <Button variant="ghost" size="sm" className="w-full justify-start h-8 hover:bg-white/10 hover:text-white" asChild onClick={handleLinkClick}>
                                                <Link to="/litigation">
                                                    <GitPullRequestArrow className="mr-2 h-4 w-4" />
                                                    {t('sidebar.validateCase')}
                                                </Link>
                                            </Button>
                                        </div>
                                        <div className="space-y-1 mt-1">
                                            <Button variant="ghost" size="sm" className="w-full justify-start h-8 hover:bg-white/10 hover:text-white" asChild onClick={handleLinkClick}>
                                                <Link to="/litigation/report">
                                                    <ClipboardPlus className="mr-2 h-4 w-4" />
                                                    {t('sidebar.caseReports')}
                                                </Link>
                                            </Button>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </div>
                    </div>
                )}
                {/* Services Section */}
                {(isAnyAdmin || isManagerHQ) && (
                    <div className="px-3 py-2">
                        {isSidebarOpen && (
                            <h3 className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-white/50">{t('sidebar.services')}</h3>
                        )}
                        <div className="space-y-1">
                            <Accordion type="single" collapsible className="w-full" value={openAccordion} onValueChange={setOpenAccordion}>
                                <AccordionItem value="services" className="border-b-0">
                                    <Tooltip delayDuration={0}>
                                        <TooltipTrigger asChild>
                                            <AccordionTrigger
                                                className={cn(
                                                    "py-2 hover:bg-white/10 hover:text-white hover:no-underline rounded-md px-4 text-sm font-medium",
                                                    !isSidebarOpen && "justify-center px-2 [&>svg]:hidden"
                                                )}
                                                onClick={handleAccordionTriggerClick}
                                            >
                                                <div className="flex items-center">
                                                    <MonitorCloud className={cn("h-4 w-4", isSidebarOpen ? "mr-2" : "")} />
                                                    {isSidebarOpen && <span>{t('sidebar.services')}</span>}
                                                </div>
                                            </AccordionTrigger>
                                        </TooltipTrigger>
                                        {!isSidebarOpen && (
                                            <TooltipContent side="right" className="flex items-center gap-4 bg-black/90 text-white border border-white/10 backdrop-blur-xl">{t('sidebar.services')}</TooltipContent>
                                        )}
                                    </Tooltip>
                                    <AccordionContent className="pb-0 pl-10">
                                        {isAnyAdmin && (
                                            <div className="space-y-1 mt-1">
                                                <Button variant="ghost" size="sm" className="w-full justify-start h-8 hover:bg-white/10 hover:text-white" asChild onClick={handleLinkClick}>
                                                    <Link to="/services">
                                                        <GitPullRequestArrow className="mr-2 h-4 w-4" />
                                                        {t('sidebar.allServices')}
                                                    </Link>
                                                </Button>
                                            </div>
                                        )}
                                        {isAnyAdmin && (
                                            <div className="space-y-1 mt-1">
                                                <Button variant="ghost" size="sm" className="w-full justify-start h-8 hover:bg-white/10 hover:text-white" asChild onClick={handleLinkClick}>
                                                    <Link to="/services/report">
                                                        <ClipboardPlus className="mr-2 h-4 w-4" />
                                                        {t('sidebar.servicesReports')}
                                                    </Link>
                                                </Button>
                                            </div>
                                        )}
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </div>
                    </div>
                )}
                {/* Services Section end */}
                {/* Global Reports */}
                {isAnyAdmin && (
                    <div className="px-3 py-2">
                        {isSidebarOpen && (
                            <h3 className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-white/50">{t('sidebar.globalReports')}</h3>
                        )}
                        <div className="space-y-1">
                            <Accordion type="single" collapsible className="w-full" value={openAccordion} onValueChange={setOpenAccordion}>
                                <AccordionItem value="global-reports" className="border-b-0">
                                    <Tooltip delayDuration={0}>
                                        <TooltipTrigger asChild>
                                            <AccordionTrigger
                                                className={cn(
                                                    "py-2 hover:bg-white/10 hover:text-white hover:no-underline rounded-md px-4 text-sm font-medium",
                                                    !isSidebarOpen && "justify-center px-2 [&>svg]:hidden"
                                                )}
                                                onClick={handleAccordionTriggerClick}
                                            >
                                                <div className="flex items-center">
                                                    <SquareAsterisk className={cn("h-4 w-4", isSidebarOpen ? "mr-2" : "")} />
                                                    {isSidebarOpen && <span>{t('sidebar.globalReports')}</span>}
                                                </div>
                                            </AccordionTrigger>
                                        </TooltipTrigger>
                                        {!isSidebarOpen && (
                                            <TooltipContent side="right" className="flex items-center gap-4 bg-black/90 text-white border border-white/10 backdrop-blur-xl">{t('sidebar.globalReports')}</TooltipContent>
                                        )}
                                    </Tooltip>
                                    <AccordionContent className="pb-0 pl-10">
                                        <div className="space-y-1 mt-1">
                                            <Button variant="ghost" size="sm" className="w-full justify-start h-8 hover:bg-white/10 hover:text-white" asChild onClick={handleLinkClick}>
                                                <Link to="/global-reports">
                                                    <ArrowDownAZ className="mr-2 h-4 w-4" />
                                                    {t('sidebar.allReports')}
                                                </Link>
                                            </Button>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </div>
                    </div>
                )}
                {/* Global Reports end */}
                {/* Administration Section */}
                {isAnyAdmin && (
                    <div className="px-3 py-2">
                        {isSidebarOpen && (
                            <h3 className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-white/50">{t('sidebar.administration')}</h3>
                        )}
                        <div className="space-y-1">
                            <Accordion type="single" collapsible className="w-full" value={openAccordion} onValueChange={setOpenAccordion}>
                                <AccordionItem value="global-settings" className="border-b-0">
                                    <Tooltip delayDuration={0}>
                                        <TooltipTrigger asChild>
                                            <AccordionTrigger
                                                className={cn(
                                                    "py-2 hover:bg-white/10 hover:text-white hover:no-underline rounded-md px-4 text-sm font-medium",
                                                    !isSidebarOpen && "justify-center px-2 [&>svg]:hidden"
                                                )}
                                                onClick={handleAccordionTriggerClick}
                                            >
                                                <div className="flex items-center">
                                                    <Cog className={cn("h-4 w-4", isSidebarOpen ? "mr-2" : "")} />
                                                    {isSidebarOpen && <span>{t('sidebar.globalSettings')}</span>}
                                                </div>
                                            </AccordionTrigger>
                                        </TooltipTrigger>
                                        {!isSidebarOpen && (
                                            <TooltipContent side="right" className="flex items-center gap-4 bg-black/90 text-white border border-white/10 backdrop-blur-xl">{t('sidebar.globalSettings')}</TooltipContent>
                                        )}
                                    </Tooltip>
                                    <AccordionContent className="pb-0 pl-10">
                                        <div className="space-y-1 mt-1">
                                            <Button variant="ghost" size="sm" className="w-full justify-start h-8 hover:bg-white/10 hover:text-white" asChild onClick={handleLinkClick}>
                                                <Link to="/permissions">
                                                    <Lock className="mr-2 h-4 w-4" />
                                                    {t('sidebar.permissionsAndRoles')}
                                                </Link>
                                            </Button>
                                        </div>
                                        <div className="space-y-1 mt-1">
                                            <Button variant="ghost" size="sm" className="w-full justify-start h-8 hover:bg-white/10 hover:text-white" asChild onClick={handleLinkClick}>
                                                <Link to="/permissions/audit">
                                                    <Logs className="mr-2 h-4 w-4" />
                                                    {t('sidebar.auditLogs')}
                                                </Link>
                                            </Button>
                                        </div>
                                        <div className="space-y-1 mt-1">
                                            <Button variant="ghost" size="sm" className="w-full justify-start h-8 hover:bg-white/10 hover:text-white" asChild onClick={handleLinkClick}>
                                                <Link to="/permissions/users">
                                                    <Users className="mr-2 h-4 w-4" />
                                                    {t('sidebar.users')}
                                                </Link>
                                            </Button>
                                        </div>
                                        <div className="space-y-1 mt-1">
                                            <Button variant="ghost" size="sm" className="w-full justify-start h-8 hover:bg-white/10 hover:text-white" asChild onClick={handleLinkClick}>
                                                <Link to="/permissions/monitoring">
                                                    <Monitor className="mr-2 h-4 w-4" />
                                                    {t('sidebar.monitoring')}
                                                </Link>
                                            </Button>
                                        </div>
                                        <div className="space-y-1 mt-1">
                                            <Button variant="ghost" size="sm" className="w-full justify-start h-8 hover:bg-white/10 hover:text-white" asChild onClick={handleLinkClick}>
                                                <Link to="/permissions/system">
                                                    <MonitorCog className="mr-2 h-4 w-4" />
                                                    {t('sidebar.system')}
                                                </Link>
                                            </Button>
                                        </div>
                                        <div className="space-y-1 mt-1">
                                            <Button variant="ghost" size="sm" className="w-full justify-start h-8 hover:bg-white/10 hover:text-white" asChild onClick={handleLinkClick}>
                                                <Link to="/permissions/commission">
                                                    <Percent className="mr-2 h-4 w-4" />
                                                    {t('sidebar.commissionRates')}
                                                </Link>
                                            </Button>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </div>
                    </div>
                )}
            </div>
            {/* Acordion section end */}
            <div className={cn("px-3 py-4 mt-auto border-t border-white/10 flex items-center shrink-0", isSidebarOpen ? "px-6" : "px-0 justify-center")}>
                <UserNav />
            </div>
        </div>
    )
    return (
        <TooltipProvider>
            <>
                {isMobile && isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/80 z-40 backdrop-blur-sm"
                        onClick={closeSidebar}
                    />
                )}
                {sidebarContent}
            </>
        </TooltipProvider>
    )
}