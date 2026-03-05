import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "../../components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../../components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../../components/ui/dialog";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from "../../components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "../../components/ui/popover";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../../components/ui/select";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "../../components/ui/pagination"
import { getPaginationRange } from "../../lib/pagination-utils"
    ;
import {
    Search,
    MoreVertical,
    Plus,
    Edit,
    Trash,
    Filter,
    X,
    Loader2,
    Building2,
    DollarSign,
    MapPin,
    AlertCircle,
    Eye,
    Ban,
    Users,
    ShieldAlert,
    CheckCircle,
    ArrowRight,
    Calendar,
    AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import sellerApi, { Seller as SellerTypeData, UpdateSellerRequest } from "../../context/api/seller";
import plansApi, { Plan, PlanTarget } from "../../context/api/plans";
import enterpriseApi from "../../context/api/enterprise";
import membershipApi from "../../context/api/membership";
import { cn } from "../../lib/utils";
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import requestApi, { Request, RequestStatus, RequestType } from "../../context/api/request";
import { parseISO, format } from "date-fns";

const getTypeColor = (type: string) => {
    switch (type.toUpperCase()) {
        case 'PLATINUM': return "border-blue-100 text-blue-600 bg-blue-50";
        case 'GOLD': return "border-amber-100 text-amber-600 bg-amber-50";
        case 'SILVER': return "border-slate-200 text-slate-600 bg-slate-50";
        default: return "border-emerald-100 text-emerald-600 bg-emerald-50";
    }
};

const Seller: React.FC = () => {
    const { t } = useTranslation();
    const { enterpriseCode } = useParams<{ enterpriseCode: string }>();
    const [enterpriseId, setEnterpriseId] = useState<string>("");

    // API State
    const [sellers, setSellers] = useState<SellerTypeData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [selectedSeller, setSelectedSeller] = useState<SellerTypeData | null>(null);
    const [viewSellerData, setViewSellerData] = useState<SellerTypeData | null>(null);
    const [availableEnterprises, setAvailableEnterprises] = useState<any[]>([]);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [members, setMembers] = useState<any[]>([]);
    const [isMembersLoading, setIsMembersLoading] = useState(false);

    // State for Search and Filters
    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState<string>("all");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const itemsPerPage = 8;

    // Form States
    const [name, setName] = useState("");
    const [sellerType, setSellerType] = useState<string>("");
    const [sellerId, setSellerId] = useState("");
    const [startedBalance, setStartedBalance] = useState<number>(0);
    const [balance, setBalance] = useState<number>(0);
    const [isActive, setIsActive] = useState(true);

    // Address States
    const [adresseLigne1, setAdresseLigne1] = useState("");
    const [departement, setDepartement] = useState("");
    const [commune, setCommune] = useState("");
    const [sectionCommunale, setSectionCommunale] = useState("");

    const [openManagerPopover, setOpenManagerPopover] = useState(false);

    // Request States
    const [requests, setRequests] = useState<Request[]>([]);
    const [isRequestsLoading, setIsRequestsLoading] = useState(false);
    const [requestPage, setRequestPage] = useState(1);
    const [requestTotalPages, setRequestTotalPages] = useState(1);
    const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
    const [isRequestDetailsDialogOpen, setIsRequestDetailsDialogOpen] = useState(false);
    const [isConfirmCancelDialogOpen, setIsConfirmCancelDialogOpen] = useState(false);
    const [requestToCancelId, setRequestToCancelId] = useState<string | null>(null);
    const requestLimit = 10;

    // 1. Initial Data Fetching
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [enterprisesPromise, plansResponse] = await Promise.all([
                    enterpriseApi.getAll({ limit: 100 }),
                    plansApi.getAll(PlanTarget.SELLER)
                ]);
                let resolvedId = "";

                // Get current user from local storage
                const userStr = localStorage.getItem('agisa_user');
                if (userStr) {
                    try {
                        const user = JSON.parse(userStr);
                        const membership = user.memberships?.find((m: any) => m.enterprise?.enterpriseCode === enterpriseCode);
                        if (membership) {
                            resolvedId = membership.enterprise.id;
                        }
                    } catch (e) {
                        console.error("Failed to parse user data", e);
                    }
                }

                const allEnts = enterprisesPromise.data || (Array.isArray(enterprisesPromise) ? enterprisesPromise : []);
                setAvailableEnterprises(allEnts);
                setPlans(plansResponse || []);

                if (!resolvedId && enterpriseCode) {
                    const found = allEnts.find((e: any) => e.enterpriseCode === enterpriseCode);
                    if (found) resolvedId = found.id;
                }

                if (resolvedId) setEnterpriseId(resolvedId);
            } catch (error) {
                console.error("Failed to fetch initial data", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialData();
    }, [enterpriseCode]);

    // 2. Fetch Members (Managers)
    const fetchMembers = useCallback(async (entId: string) => {
        if (!entId) return;
        setIsMembersLoading(true);
        try {
            const res = await membershipApi.getByEnterprise(entId);
            const allMembers = res.data || [];
            const sellersOnly = allMembers.filter((m: any) =>
                m.membershipRoles?.some((mr: any) => mr.role?.level === "SELLER")
            );
            setMembers(sellersOnly);
        } catch (error) {
            console.error("Failed to fetch members:", error);
        } finally {
            setIsMembersLoading(false);
        }
    }, []);

    useEffect(() => {
        if (enterpriseId && (isDialogOpen || isEditDialogOpen)) {
            fetchMembers(enterpriseId);
        }
    }, [enterpriseId, isDialogOpen, isEditDialogOpen, fetchMembers]);

    // 3. Fetch Sellers
    const loadSellers = useCallback(async (page = 1, search = "") => {
        if (!enterpriseId) {
            setIsLoading(false);
            setSellers([]);
            return;
        }

        setIsLoading(true);
        try {
            const resp = await sellerApi.getAll({
                page,
                limit: itemsPerPage,
                search: search || undefined,
                enterpriseId
            });
            setSellers(resp.data || []);
            setTotalPages(resp.meta?.lastPage || 1);
            setTotalItems(resp.meta?.total || 0);
        } catch (error: any) {
            toast.error(t('seller.toasts.loadFailed'), {
                description: error.response?.data?.message || t('seller.toasts.serverErr')
            });
        } finally {
            setIsLoading(false);
        }
    }, [enterpriseId, t]);

    useEffect(() => {
        const timer = setTimeout(() => {
            loadSellers(currentPage, searchTerm);
        }, 500);
        return () => clearTimeout(timer);
    }, [loadSellers, currentPage, searchTerm]);

    // 4. Fetch Requests
    const fetchRequests = useCallback(async (pageToFetch = 1) => {
        if (!enterpriseId) return;
        setIsRequestsLoading(true);
        try {
            const res = await requestApi.getAll({ enterpriseId, hasSeller: true, page: pageToFetch, limit: requestLimit });
            setRequests(res.data || []);
            setRequestTotalPages(res.meta.lastPage || 1);
            setRequestPage(res.meta.page || pageToFetch);
        } catch (error) {
            console.error("Failed to fetch requests:", error);
        } finally {
            setIsRequestsLoading(false);
        }
    }, [enterpriseId]);

    // Handlers
    const handleCompleteRequest = async (requestId: string, notes?: string) => {
        try {
            await requestApi.complete(requestId, { reviewerNotes: notes || "Completed" });
            toast.success(t('seller.toasts.reqComplete') || "Request Completed");
            fetchRequests();
        } catch (error: any) {
            toast.error(t('seller.toasts.failComplete') || "Failed to complete request", { description: error.response?.data?.message });
        }
    };

    const handleCancelRequest = async (requestId: string) => {
        setRequestToCancelId(requestId);
        setIsConfirmCancelDialogOpen(true);
    };

    const confirmCancel = async () => {
        if (!requestToCancelId) return;
        setIsSubmitting(true);
        try {
            await requestApi.cancel(requestToCancelId);
            toast.success(t('seller.toasts.reqCancelSuccess') || "Request cancelled successfully");
            setIsRequestDetailsDialogOpen(false);
            setIsConfirmCancelDialogOpen(false);
            setRequestToCancelId(null);
            fetchRequests();
        } catch (error: any) {
            toast.error(t('seller.toasts.reqCancelFail') || "Failed to cancel request", { description: error.response?.data?.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResetFilters = () => {
        setSearchTerm("");
        setTypeFilter("all");
        setStatusFilter("all");
        setCurrentPage(1);
    };

    const resetForm = () => {
        setName("");
        setSellerType("");
        setSellerId("");
        setStartedBalance(0);
        setBalance(0);
        setAdresseLigne1("");
        setDepartement("");
        setCommune("");
        setSectionCommunale("");
        setIsActive(true);
        setSelectedSeller(null);
    };

    const handleAddSeller = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) {
            toast.error(t('seller.toasts.nameRequired'));
            return;
        }
        if (!sellerType) {
            toast.error(t('seller.toasts.levelRequired'));
            return;
        }
        setIsSubmitting(true);
        try {
            await sellerApi.create({
                name,
                type: sellerType,
                enterpriseId,
                startedBalance,
                balance,
                sellerId: (sellerId === "none" || !sellerId) ? undefined : sellerId,
                adresse: { adresseLigne1, departement, commune, sectionCommunale }
            });
            toast.success(t('seller.toasts.created'));
            setIsDialogOpen(false);
            resetForm();
            loadSellers();
        } catch (error: any) {
            toast.error(t('seller.toasts.createFailed'), { description: error.response?.data?.message || t('seller.toasts.error') });
        } finally {
            setIsSubmitting(false);
        }
    };

    const openEditSeller = (seller: SellerTypeData) => {
        setSelectedSeller(seller);
        setName(seller.name);
        setSellerType(seller.type);
        setSellerId(seller.sellerId || "");
        setStartedBalance(Number(seller.startedBalance));
        setBalance(Number(seller.balance));
        setAdresseLigne1(seller.adresse?.adresseLigne1 || "");
        setDepartement(seller.adresse?.departement || "");
        setCommune(seller.adresse?.commune || "");
        setSectionCommunale(seller.adresse?.sectionCommunale || "");
        setIsActive(seller.isActive !== false);
        setIsEditDialogOpen(true);
    };

    const openViewSeller = (seller: SellerTypeData) => {
        setViewSellerData(seller);
        setIsViewDialogOpen(true);
    };

    const handleUpdateSeller = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSeller || !sellerType) {
            if (!sellerType) toast.error(t('seller.toasts.levelRequired'));
            return;
        }
        setIsSubmitting(true);
        try {
            await sellerApi.update(selectedSeller.id, {
                name,
                type: sellerType,
                enterpriseId,
                startedBalance,
                balance,
                sellerId: (sellerId === "none" || !sellerId) ? undefined : sellerId,
                adresse: { adresseLigne1, departement, commune, sectionCommunale },
                isActive
            } as UpdateSellerRequest);
            toast.success(t('seller.toasts.updated'));
            setIsEditDialogOpen(false);
            loadSellers();
        } catch (error: any) {
            toast.error(t('seller.toasts.updateFailed'), { description: error.response?.data?.message || t('seller.toasts.error') });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteSeller = async (id: string) => {
        if (!window.confirm(t('seller.toasts.deleteConfirm'))) return;
        try {
            await sellerApi.delete(id);
            toast.success(t('seller.toasts.deleted'));
            loadSellers();
        } catch (error: any) {
            toast.error(t('seller.toasts.deleteFailed'), { description: error.response?.data?.message || t('seller.toasts.error') });
        }
    };

    const filteredSellers = sellers.filter(s => {
        const matchesType = typeFilter === "all" || s.type === typeFilter;
        const matchesStatus = statusFilter === "all" || (statusFilter === "active" ? s.isActive : !s.isActive);
        return matchesType && matchesStatus;
    });

    return (
        <div className="space-y-6 pt-6">
            <Tabs defaultValue="units" className="w-full" onValueChange={(val) => val === 'requests' && fetchRequests()}>
                <div className="flex items-center justify-between mb-2">
                    <TabsList className="bg-slate-50 border border-slate-200 p-1">
                        <TabsTrigger
                            value="units"
                            className="data-[state=active]:bg-emerald-500 data-[state=active]:text-black text-zinc-400 font-bold uppercase text-[10px] tracking-widest px-6"
                        >
                            {t('headquarters.tabs.units')}
                        </TabsTrigger>
                        <TabsTrigger
                            value="requests"
                            className="data-[state=active]:bg-emerald-500 data-[state=active]:text-black text-zinc-400 font-bold uppercase text-[10px] tracking-widest px-6"
                        >
                            {t('headquarters.tabs.requests')}
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="units" className="mt-0">
                    <Card className="border-slate-200 bg-slate-50 backdrop-blur-xl">
                        <CardHeader className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                                <CardTitle className="text-black text-xl flex flex-wrap items-center gap-2 font-bold uppercase tracking-wider">
                                    <Building2 className="h-5 w-5 text-emerald-500 shrink-0" />
                                    <span className="truncate">{t('seller.mgmt.title')}</span>
                                    {totalItems > 0 && (
                                        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-2 py-0.5 rounded-md font-black whitespace-nowrap">
                                            {totalItems} {t('seller.mgmt.total')}
                                        </Badge>
                                    )}
                                </CardTitle>
                                <p className="text-[10px] text-zinc-500 mt-1 font-bold uppercase tracking-tight">{t('seller.mgmt.subtitle')}</p>
                            </div>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                <div className="relative flex-1 sm:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                    <Input
                                        placeholder={t("seller.mgmt.search")}
                                        className="bg-slate-50 border-slate-200 pl-10 text-black focus-visible:ring-emerald-500/50 h-10"
                                        value={searchTerm}
                                        onChange={(e) => {
                                            setSearchTerm(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                    />
                                </div>
                                <Button
                                    onClick={() => { resetForm(); setIsDialogOpen(true); }}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-black font-bold uppercase tracking-widest text-[11px] h-10 px-4"
                                >
                                    <Plus className="h-4 w-4 mr-2" /> {t('seller.mgmt.addBtn')}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-white/5">
                                <div className="flex items-center gap-2">
                                    <Select value={typeFilter} onValueChange={(val) => { setTypeFilter(val); setCurrentPage(1); }}>
                                        <SelectTrigger className="w-[140px] bg-slate-50 border-slate-200 text-black font-bold text-[10px] uppercase h-10">
                                            <div className="flex items-center gap-2">
                                                <Filter className="h-3 w-3 text-emerald-500" />
                                                <SelectValue placeholder={t("seller.filters.type")} />
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent className="bg-white border-slate-200 text-black">
                                            <SelectItem value="all">{t('seller.filters.allTypes')}</SelectItem>
                                            {plans.map(p => (
                                                <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}>
                                        <SelectTrigger className="w-[140px] bg-slate-50 border-slate-200 text-black font-bold text-[10px] uppercase h-10">
                                            <div className="flex items-center gap-2">
                                                <Filter className="h-3 w-3 text-emerald-500" />
                                                <SelectValue placeholder={t("seller.filters.status")} />
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent className="bg-white border-slate-200 text-black">
                                            <SelectItem value="all">{t('seller.filters.allStatus')}</SelectItem>
                                            <SelectItem value="active">{t('seller.filters.active')}</SelectItem>
                                            <SelectItem value="suspended">{t('seller.filters.suspended')}</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    {(searchTerm || typeFilter !== "all" || statusFilter !== "all") && (
                                        <Button
                                            variant="ghost"
                                            onClick={handleResetFilters}
                                            className="text-zinc-500 hover:text-black font-bold text-[10px] uppercase tracking-widest px-3 h-10"
                                        >
                                            <X className="h-3 w-3 mr-1" /> {t('seller.filters.reset')}
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <div className="rounded-md border border-slate-200 overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-slate-50">
                                        <TableRow className="border-slate-200 hover:bg-transparent">
                                            <TableHead className="text-[10px] font-black uppercase text-zinc-500 tracking-widest pl-6 h-12">{t('seller.grid.colPoint')}</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase text-zinc-500 tracking-widest h-12">{t('seller.grid.colType')}</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase text-zinc-500 tracking-widest h-12">{t('seller.grid.colBalance')}</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase text-zinc-500 tracking-widest h-12">{t('seller.grid.colStatus')}</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase text-zinc-500 tracking-widest h-12">{t('seller.grid.colSeller')}</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase text-zinc-500 tracking-widest h-12">{t('seller.grid.colLocation')}</TableHead>
                                            <TableHead className="text-right pr-6 h-12 text-[10px] font-black uppercase text-zinc-500 tracking-widest">{t('seller.grid.colActions')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoading ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="h-64 text-center">
                                                    <div className="flex flex-col items-center justify-center gap-3">
                                                        <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
                                                        <span className="text-zinc-500 font-bold text-xs uppercase tracking-[0.2em] animate-pulse">{t('seller.grid.loadingText')}</span>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : filteredSellers.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="h-64 text-center">
                                                    <div className="flex flex-col items-center justify-center gap-2 opacity-30">
                                                        <AlertCircle className="h-12 w-12 text-zinc-500" />
                                                        <span className="text-zinc-500 font-bold text-xs uppercase tracking-widest uppercase">{t('seller.grid.noMatch')}</span>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredSellers.map((seller) => (
                                                <TableRow key={seller.id} className="border-slate-200 hover:bg-slate-50 transition-colors">
                                                    <TableCell className="pl-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="max-w-[180px]">
                                                                <div className="font-bold text-slate-800 text-sm truncate">{seller.name}</div>
                                                                <div className="text-[10px] text-zinc-500 font-medium uppercase mt-0.5">
                                                                    {seller.enterprise?.name}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant="outline"
                                                            className={cn(
                                                                "text-[10px] rounded-md uppercase font-bold px-2 py-0.5",
                                                                getTypeColor(seller.type)
                                                            )}
                                                        >
                                                            {seller.type}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <div className="flex items-center gap-1.5">
                                                                <DollarSign className="h-3 w-3 text-emerald-500" />
                                                                <span className="text-emerald-500 font-bold text-xs">
                                                                    {seller.balance}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            className={cn(
                                                                "text-[9px] font-bold rounded-md px-2 py-0",
                                                                seller.isActive !== false
                                                                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                                                    : "bg-red-500/10 text-red-500 border-red-500/20"
                                                            )}
                                                            variant="outline"
                                                        >
                                                            {seller.isActive !== false ? t('seller.grid.activeBadge') : t('seller.grid.inactiveBadge')}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-zinc-400 text-xs font-medium">
                                                        {seller.seller ? (
                                                            <div className="flex items-center gap-2.5">
                                                                <div className="h-7 w-7 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[10px] font-bold text-emerald-500 shrink-0">
                                                                    {seller.seller.fullName.charAt(0)}
                                                                </div>
                                                                <div className="flex flex-col min-w-0">
                                                                    <span className="font-bold text-zinc-800 truncate text-[11px]">{seller.seller.fullName}</span>
                                                                    <span className="text-[9px] text-zinc-500 truncate lowercase">{seller.seller.email}</span>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2 text-zinc-600 italic text-[11px]">
                                                                <Users className="h-3.5 w-3.5 opacity-30" />
                                                                <span>{t('seller.grid.notAssigned')}</span>
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col max-w-[150px]">
                                                            <span className="text-[10px] font-bold text-zinc-400 truncate">{seller.adresse?.adresseLigne1 || t('seller.grid.noLocation')}</span>
                                                            <span className="text-[9px] text-zinc-500 font-medium uppercase truncate">
                                                                {seller.adresse?.commune && seller.adresse?.departement
                                                                    ? `${seller.adresse.commune}, ${seller.adresse.departement}`
                                                                    : t('seller.grid.noLocation')}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right pr-6">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" className="h-8 w-8 p-0 text-zinc-500 hover:text-black hover:bg-slate-100 rounded-full">
                                                                    <MoreVertical className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="bg-white border-slate-200 text-black min-w-[160px]">
                                                                <DropdownMenuLabel className="text-[10px] uppercase font-black text-zinc-500 tracking-widest px-2 py-1.5">{t('seller.actions.title')}</DropdownMenuLabel>
                                                                <DropdownMenuSeparator className="bg-slate-50" />
                                                                <DropdownMenuItem className="cursor-pointer gap-2 font-bold text-xs py-2" onClick={() => openViewSeller(seller)}>
                                                                    <Eye className="h-3.5 w-3.5 text-emerald-500" /> {t('seller.actions.view')}
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem className="cursor-pointer gap-2 font-bold text-xs py-2" onClick={() => openEditSeller(seller)}>
                                                                    <Edit className="h-3.5 w-3.5 text-blue-500" /> {t('seller.actions.edit')}
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem className="cursor-pointer gap-2 font-bold text-xs py-2 text-red-500 hover:text-red-600" onClick={() => handleDeleteSeller(seller.id)}>
                                                                    <Trash className="h-3.5 w-3.5" /> {t('seller.actions.delete')}
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                        {totalPages > 1 && (
                            <div className="py-4 border-t border-slate-200 px-6">
                                <Pagination>
                                    <PaginationContent>
                                        <PaginationItem>
                                            <PaginationPrevious
                                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                className={cn("cursor-pointer bg-slate-50 hover:bg-slate-100 text-black border-slate-200 font-bold text-[10px] uppercase", currentPage === 1 && "pointer-events-none opacity-50")}
                                            />
                                        </PaginationItem>
                                        {getPaginationRange(currentPage, totalPages).map((pageNumber, i) => (
                                            <PaginationItem key={i}>
                                                {pageNumber === '...' ? (
                                                    <PaginationEllipsis className="text-zinc-600" />
                                                ) : (
                                                    <PaginationLink
                                                        href="#"
                                                        onClick={(e) => {
                                                            e.preventDefault()
                                                            setCurrentPage(pageNumber as number)
                                                        }}
                                                        isActive={currentPage === pageNumber}
                                                        className={currentPage === pageNumber ? "bg-emerald-600 text-black hover:bg-emerald-700 border-none font-black" : "text-zinc-500 hover:text-black hover:bg-slate-100 font-bold"}
                                                    >
                                                        {pageNumber}
                                                    </PaginationLink>
                                                )}
                                            </PaginationItem>
                                        ))}
                                        <PaginationItem>
                                            <PaginationNext
                                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                className={cn("cursor-pointer bg-slate-50 hover:bg-slate-100 text-black border-slate-200 font-bold text-[10px] uppercase", currentPage === totalPages && "pointer-events-none opacity-50")}
                                            />
                                        </PaginationItem>
                                    </PaginationContent>
                                </Pagination>
                            </div>
                        )}
                    </Card>
                </TabsContent>

                <TabsContent value="requests" className="mt-0">
                    <Card className="border-slate-200 bg-slate-50 backdrop-blur-xl">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-black text-xl flex items-center gap-2 font-bold uppercase tracking-wider">
                                    <ShieldAlert className="h-5 w-5 text-emerald-500" />
                                    {t('headquarters.requests.title')}
                                </CardTitle>
                                <p className="text-[10px] text-zinc-500 mt-1 font-bold uppercase tracking-tight">{t('headquarters.requests.desc')}</p>
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => fetchRequests(requestPage)}
                                className="h-10 border-slate-200 bg-slate-50 text-black hover:bg-slate-100 font-bold text-[10px] uppercase tracking-widest gap-2 px-4 shadow-sm"
                            >
                                <Loader2 className={cn("h-3.5 w-3.5 text-emerald-500", isRequestsLoading && "animate-spin")} />
                                {t('headquarters.requests.refresh')}
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border border-slate-200 overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-slate-50">
                                        <TableRow className="border-slate-200 hover:bg-transparent">
                                            <TableHead className="text-[10px] font-black uppercase text-zinc-500 tracking-widest pl-6 h-12">{t('headquarters.requests.grid.colType')}</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase text-zinc-500 tracking-widest h-12">{t('headquarters.requests.grid.colHq')}</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase text-zinc-500 tracking-widest h-12">{t('headquarters.requests.grid.colAmount')}</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase text-zinc-500 tracking-widest h-12">{t('headquarters.requests.grid.colRequester')}</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase text-zinc-500 tracking-widest h-12">{t('headquarters.requests.grid.colStatus')}</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase text-zinc-500 tracking-widest h-12">{t('headquarters.requests.grid.colDate')}</TableHead>
                                            <TableHead className="text-right pr-6 h-12 text-[10px] font-black uppercase text-zinc-500 tracking-widest">{t('headquarters.requests.grid.colActions')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isRequestsLoading ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="h-64 text-center">
                                                    <div className="flex flex-col items-center justify-center gap-3">
                                                        <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
                                                        <span className="text-zinc-500 font-bold text-xs uppercase tracking-[0.2em] animate-pulse">{t('headquarters.requests.grid.loading')}</span>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : requests.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="h-64 text-center">
                                                    <div className="flex flex-col items-center justify-center gap-2 opacity-30">
                                                        <AlertCircle className="h-12 w-12 text-zinc-500" />
                                                        <span className="text-zinc-500 font-bold text-xs uppercase tracking-widest uppercase">{t('headquarters.requests.grid.noReq')}</span>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : requests.map((req) => (
                                            <TableRow key={req.id} className="border-slate-200 hover:bg-slate-50 transition-colors">
                                                <TableCell className="pl-6">
                                                    <Badge variant="outline" className={cn(
                                                        "text-[10px] font-bold px-2 py-0.5 rounded-md uppercase",
                                                        req.type === RequestType.DEPOSIT ? "text-emerald-500 border-emerald-500/20 bg-emerald-500/5" :
                                                            req.type === RequestType.WITHDRAWAL ? "text-red-500 border-red-500/20 bg-red-500/5" :
                                                                "text-blue-500 border-blue-500/20 bg-blue-500/5"
                                                    )}>
                                                        {req.type}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="font-bold text-slate-800 text-[13px]">{req.seller?.name || "N/A"}</TableCell>
                                                <TableCell className="font-black text-black">
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-xs text-zinc-400">HTG</span>
                                                        {Number(req.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-xs font-bold text-zinc-600">{req.requester?.fullName}</TableCell>
                                                <TableCell>
                                                    <Badge className={cn(
                                                        "text-[9px] font-bold rounded-md px-2 py-0 uppercase border-none",
                                                        req.status === RequestStatus.PENDING ? "bg-orange-500/10 text-orange-500" :
                                                            req.status === RequestStatus.AUTHORIZED ? "bg-blue-500/10 text-blue-500" :
                                                                req.status === RequestStatus.COMPLETED ? "bg-emerald-500/10 text-emerald-500" :
                                                                    req.status === RequestStatus.REJECTED ? "bg-red-500/10 text-red-500" :
                                                                        "bg-zinc-500/10 text-zinc-500"
                                                    )}>
                                                        {req.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight">
                                                    {format(parseISO(req.createdAt), 'MMM dd, HH:mm')}
                                                </TableCell>
                                                <TableCell className="text-right pr-6">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-zinc-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-full transition-all"
                                                            onClick={() => { setSelectedRequest(req); setIsRequestDetailsDialogOpen(true); }}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {requestTotalPages > 1 && (
                                <div className="pt-4 flex items-center justify-between">
                                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
                                        Page <span className="text-black font-black">{requestPage}</span> / <span className="text-black font-black">{requestTotalPages}</span>
                                    </p>
                                    <div className="flex gap-2">
                                        <Button
                                            disabled={requestPage === 1}
                                            onClick={() => fetchRequests(requestPage - 1)}
                                            variant="outline"
                                            className="h-9 border-slate-200 bg-slate-50 text-zinc-400 hover:text-black hover:bg-slate-100 text-[10px] font-bold uppercase tracking-widest px-4 shadow-sm"
                                        >
                                            {t('headquarters.pagination.prev')}
                                        </Button>
                                        <Button
                                            disabled={requestPage === requestTotalPages}
                                            onClick={() => fetchRequests(requestPage + 1)}
                                            variant="outline"
                                            className="h-9 border-slate-200 bg-slate-50 text-zinc-400 hover:text-black hover:bg-slate-100 text-[10px] font-bold uppercase tracking-widest px-4 shadow-sm"
                                        >
                                            {t('headquarters.pagination.next')}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[700px] bg-white border-slate-200 text-slate-800 max-h-[90vh] overflow-y-auto shadow-2xl rounded-2xl">
                    <form onSubmit={handleAddSeller}>
                        <DialogHeader>
                            <DialogTitle className="text-slate-800 text-xl font-bold flex items-center gap-2">
                                <Plus className="h-5 w-5 text-emerald-600" />
                                {t('seller.addDialog.title')}
                            </DialogTitle>
                            <p className="text-xs text-slate-500 mt-1 uppercase font-bold tracking-tight">{t('seller.addDialog.subtitle')}</p>
                        </DialogHeader>

                        {availableEnterprises.length > 0 && (
                            <div className="grid gap-2 px-1 mt-4">
                                <Label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">{t('seller.addDialog.entLabel')}</Label>
                                <Select value={enterpriseId || undefined} onValueChange={setEnterpriseId}>
                                    <SelectTrigger className="bg-slate-50 border-slate-100 text-slate-800 hover:bg-slate-100 transition-colors font-bold h-11 uppercase text-[10px]">
                                        <SelectValue placeholder={t("seller.addDialog.entSelect")} />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border-slate-200 text-slate-800">
                                        {availableEnterprises.map((ent) => (
                                            <SelectItem key={ent.id} value={ent.id} className="text-[10px] font-bold uppercase transition-colors">
                                                {ent.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="grid gap-6 py-6 border-y border-white/5 my-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">{t('seller.addDialog.nameLabel')}</Label>
                                    <Input
                                        className="bg-slate-50 border-slate-100 text-slate-800 focus-visible:ring-emerald-500/50 h-11 font-bold placeholder:text-slate-400"
                                        placeholder={t("seller.addDialog.namePlaceholder")}
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">{t('seller.addDialog.levelLabel')}</Label>
                                    <Select value={sellerType || undefined} onValueChange={(val) => {
                                        setSellerType(val);
                                        const foundPlan = plans.find(p => p.name === val);
                                        if (foundPlan) {
                                            setStartedBalance(Number(foundPlan.startingBalance));
                                            setBalance(Number(foundPlan.startingBalance));
                                        }
                                    }}>
                                        <SelectTrigger className="bg-slate-50 border-slate-100 text-slate-800 hover:bg-slate-100 transition-colors font-bold h-11 uppercase text-[10px]">
                                            <SelectValue placeholder={t("seller.addDialog.levelSelect")} />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white border-slate-200 text-slate-800">
                                            {plans.map(p => (
                                                <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">{t('seller.addDialog.startBal')}</Label>
                                    <Input
                                        type="text"
                                        className="bg-slate-50 border-slate-100 text-slate-800 focus-visible:ring-emerald-500/50 h-11 font-bold"
                                        value={startedBalance}
                                        disabled
                                        onChange={(e) => {
                                            const val = Number(e.target.value);
                                            setStartedBalance(val);
                                            setBalance(val);
                                        }}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">{t('seller.addDialog.curBal')}</Label>
                                    <Input
                                        type="text"
                                        disabled
                                        className="bg-slate-100 border-slate-200 text-slate-400 focus-visible:ring-emerald-500/50 h-11 font-bold cursor-not-allowed opacity-70"
                                        value={balance}
                                        onChange={(e) => setBalance(Number(e.target.value))}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest text-[#50c594]">{t('seller.addDialog.statusLabel')}</Label>
                                    <Select
                                        value={isActive ? "active" : "suspended"}
                                        onValueChange={(val) => setIsActive(val === "active")}
                                    >
                                        <SelectTrigger className="bg-slate-50 border-slate-100 text-slate-800 hover:bg-slate-100 transition-colors font-bold h-11 uppercase text-[10px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white border-slate-200 text-slate-800">
                                            <SelectItem value="active" className="text-[10px] font-bold uppercase transition-colors">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                                    Active
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="suspended" className="text-[10px] font-bold uppercase transition-colors">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-red-500" />
                                                    Suspended
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid gap-2">
                                    <Label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest flex items-center gap-2">
                                        <Users className="h-3 w-3 text-emerald-500" />
                                        {t('seller.addDialog.sellerLabel')}
                                    </Label>
                                    <Popover open={openManagerPopover} onOpenChange={setOpenManagerPopover}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                disabled={!enterpriseId}
                                                className="bg-slate-50 border-slate-100 hover:bg-slate-100 text-slate-800 justify-between font-bold h-11 text-xs disabled:opacity-50"
                                            >
                                                {sellerId
                                                    ? (members.find((m) => m.user?.id === sellerId)?.user?.fullName || t('seller.addDialog.sellerSelect'))
                                                    : t('seller.addDialog.sellerSelect')}
                                                <Users className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-white border-slate-200 shadow-2xl rounded-xl overflow-hidden">
                                            <Command className="bg-white">
                                                <CommandInput placeholder={t("seller.addDialog.sellerSearch")} className="text-slate-800" />
                                                <CommandEmpty className="text-slate-500 py-6 text-center text-xs">
                                                    {isMembersLoading ? t('seller.addDialog.sellerLoading') : t('seller.addDialog.sellerEmpty')}
                                                </CommandEmpty>
                                                <CommandGroup className="max-h-[200px] overflow-y-auto custom-scrollbar">
                                                    <CommandItem
                                                        value="none"
                                                        onSelect={() => {
                                                            setSellerId("");
                                                            setOpenManagerPopover(false);
                                                        }}
                                                        className="text-slate-800 hover:bg-slate-50 cursor-pointer text-xs font-bold"
                                                    >
                                                        <X className="mr-2 h-4 w-4 text-slate-500" />
                                                        {t('seller.addDialog.noSeller')}
                                                    </CommandItem>
                                                    {members.map((member) => (
                                                        <CommandItem
                                                            key={member.user?.id}
                                                            value={member.user?.fullName || "Unknown"}
                                                            onSelect={() => {
                                                                setSellerId(member.user?.id);
                                                                setOpenManagerPopover(false);
                                                            }}
                                                            className="text-slate-800 hover:bg-slate-50 cursor-pointer text-xs font-bold flex items-center gap-2"
                                                        >
                                                            <div className="h-6 w-6 rounded-full bg-emerald-500/10 flex items-center justify-center text-[10px] font-bold text-emerald-500">
                                                                {member.user?.fullName?.charAt(0)}
                                                            </div>
                                                            <span>{member.user?.fullName}</span>
                                                            <span className="text-[10px] text-slate-500 ml-auto">{member.user?.email}</span>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>

                            <div className="space-y-4 pt-2">
                                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
                                    <MapPin className="h-3 w-3 text-emerald-500" /> {t('seller.addDialog.addressTitle')}
                                </h3>
                                <div className="grid gap-4">
                                    <div className="grid gap-2">
                                        <Label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">{t('seller.addDialog.streetLabel')}</Label>
                                        <Input
                                            className="bg-slate-50 border-slate-100 text-slate-800 focus-visible:ring-emerald-500/50 h-11 font-bold placeholder:text-slate-400"
                                            placeholder={t("seller.addDialog.streetPlaceholder")}
                                            value={adresseLigne1}
                                            onChange={(e) => setAdresseLigne1(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">{t('seller.addDialog.stateLabel')}</Label>
                                            <Input
                                                className="bg-slate-50 border-slate-100 text-slate-800 focus-visible:ring-emerald-500/50 h-11 font-bold placeholder:text-slate-400"
                                                placeholder={t("seller.addDialog.statePlaceholder")}
                                                value={departement}
                                                onChange={(e) => setDepartement(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">{t('seller.addDialog.cityLabel')}</Label>
                                            <Input
                                                className="bg-slate-50 border-slate-100 text-slate-800 focus-visible:ring-emerald-500/50 h-11 font-bold placeholder:text-slate-400"
                                                placeholder={t("seller.addDialog.cityPlaceholder")}
                                                value={commune}
                                                onChange={(e) => setCommune(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">{t('seller.addDialog.sectionLabel')}</Label>
                                        <Input
                                            className="bg-slate-50 border-slate-100 text-slate-800 focus-visible:ring-emerald-500/50 h-11 font-bold placeholder:text-slate-400"
                                            placeholder={t("seller.addDialog.sectionPlaceholder")}
                                            value={sectionCommunale}
                                            onChange={(e) => setSectionCommunale(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="bg-slate-50 p-6 border-t border-slate-100 -mx-6 -mb-6 mt-4">
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-emerald-600 hover:bg-emerald-700 text-black w-full uppercase font-bold tracking-widest h-12 shadow-lg shadow-emerald-500/20"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {t('seller.addDialog.creatingBtn')}
                                    </>
                                ) : (
                                    t('seller.addDialog.createBtn')
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[700px] bg-white border-slate-200 text-slate-800 max-h-[90vh] overflow-y-auto shadow-2xl rounded-2xl">
                    <form onSubmit={handleUpdateSeller}>
                        <DialogHeader>
                            <DialogTitle className="text-slate-800 text-xl font-bold flex items-center gap-2">
                                <Edit className="h-5 w-5 text-emerald-600" />
                                {t('seller.editDialog.title')}
                            </DialogTitle>
                            <p className="text-xs text-slate-500 mt-1 uppercase font-bold tracking-tight">{t('seller.editDialog.subtitle')} {selectedSeller?.name}</p>
                        </DialogHeader>

                        <div className="grid gap-6 py-6 border-y border-white/5 my-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">{t('seller.editDialog.nameLabel')}</Label>
                                    <Input
                                        className="bg-slate-50 border-slate-100 text-slate-800 focus-visible:ring-emerald-500/50 h-11 font-bold placeholder:text-slate-400"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">{t('seller.editDialog.typeLabel')}</Label>
                                    <Select value={sellerType || undefined} onValueChange={(val) => {
                                        setSellerType(val);
                                        const foundPlan = plans.find(p => p.name === val);
                                        if (foundPlan) {
                                            setStartedBalance(Number(foundPlan.startingBalance));
                                            setBalance(Number(foundPlan.startingBalance));
                                        }
                                    }}>
                                        <SelectTrigger className="bg-slate-50 border-slate-100 text-slate-800 hover:bg-slate-100 transition-colors font-bold h-11 uppercase text-[10px]">
                                            <SelectValue placeholder={t("seller.addDialog.levelSelect")} />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white border-slate-200 text-slate-800">
                                            {plans.map(p => (
                                                <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">{t('seller.editDialog.startBalHTG')}</Label>
                                    <Input
                                        type="number"
                                        className="bg-slate-50 border-slate-100 text-slate-800 focus-visible:ring-emerald-500/50 h-11 font-bold"
                                        value={startedBalance}
                                        onChange={(e) => setStartedBalance(Number(e.target.value))}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">{t('seller.editDialog.curBalHTG')}</Label>
                                    <Input
                                        type="text"
                                        className="bg-slate-100 border-slate-200 text-slate-400 focus-visible:ring-emerald-500/50 h-11 font-bold cursor-not-allowed opacity-70"
                                        disabled
                                        value={balance}
                                        onChange={(e) => setBalance(Number(e.target.value))}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest text-[#50c594]">{t('seller.addDialog.statusLabel')}</Label>
                                    <Select
                                        value={isActive ? "active" : "suspended"}
                                        onValueChange={(val) => setIsActive(val === "active")}
                                    >
                                        <SelectTrigger className="bg-slate-50 border-slate-100 text-slate-800 hover:bg-slate-100 transition-colors font-bold h-11 uppercase text-[10px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white border-slate-200 text-slate-800">
                                            <SelectItem value="active" className="text-[10px] font-bold uppercase">🟢 Active</SelectItem>
                                            <SelectItem value="suspended" className="text-[10px] font-bold uppercase">🔴 Suspended</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid gap-2">
                                    <Label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest flex items-center gap-2">
                                        <Users className="h-3 w-3 text-emerald-500" />
                                        <Users className="h-3 w-3 text-emerald-500" />
                                        {t('seller.addDialog.sellerLabel')}
                                    </Label>
                                    <Popover open={openManagerPopover} onOpenChange={setOpenManagerPopover}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                className="bg-slate-50 border-slate-100 hover:bg-slate-100 text-slate-800 justify-between font-bold h-11 text-xs"
                                            >
                                                {sellerId
                                                    ? (members.find((m) => m.user?.id === sellerId)?.user?.fullName || t('seller.addDialog.sellerSelect'))
                                                    : t('seller.addDialog.sellerSelect')}
                                                <Users className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-white border-slate-200 shadow-2xl rounded-xl overflow-hidden">
                                            <Command className="bg-white">
                                                <CommandInput placeholder={t("seller.addDialog.sellerSearch")} className="text-slate-800" />
                                                <CommandEmpty className="text-slate-500 py-6 text-center text-xs">
                                                    {isMembersLoading ? t('seller.addDialog.sellerLoading') : t('seller.addDialog.sellerEmpty')}
                                                </CommandEmpty>
                                                <CommandGroup className="max-h-[200px] overflow-y-auto custom-scrollbar">
                                                    <CommandItem
                                                        value="none"
                                                        onSelect={() => {
                                                            setSellerId("");
                                                            setOpenManagerPopover(false);
                                                        }}
                                                        className="text-black hover:bg-slate-50 cursor-pointer text-xs font-bold"
                                                    >
                                                        <X className="mr-2 h-4 w-4 text-zinc-500" />
                                                        {t('seller.addDialog.noSeller')}
                                                    </CommandItem>
                                                    {members.map((member) => (
                                                        <CommandItem
                                                            key={member.user?.id}
                                                            value={member.user?.fullName}
                                                            onSelect={() => {
                                                                setSellerId(member.user?.id);
                                                                setOpenManagerPopover(false);
                                                            }}
                                                            className="text-black hover:bg-slate-50 cursor-pointer text-xs font-bold flex items-center gap-2"
                                                        >
                                                            <div className="h-6 w-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px] font-bold text-emerald-500">
                                                                {member.user?.fullName?.charAt(0)}
                                                            </div>
                                                            <span>{member.user?.fullName}</span>
                                                            <span className="text-[10px] text-zinc-500 ml-auto">{member.user?.email}</span>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>

                            <div className="space-y-4 pt-2">
                                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                                    <MapPin className="h-3 w-3 text-emerald-600" /> {t('seller.addDialog.addressTitle')}
                                </h3>
                                <div className="grid gap-4">
                                    <div className="grid gap-2">
                                        <Label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">{t('seller.addDialog.streetLabel')}</Label>
                                        <Input
                                            className="bg-slate-50 border-slate-100 text-slate-800 focus-visible:ring-emerald-500/50 h-11 font-bold placeholder:text-slate-400"
                                            value={adresseLigne1}
                                            onChange={(e) => setAdresseLigne1(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">{t('seller.addDialog.stateLabel')}</Label>
                                            <Input
                                                className="bg-slate-50 border-slate-100 text-slate-800 focus-visible:ring-emerald-500/50 h-11 font-bold placeholder:text-slate-400"
                                                value={departement}
                                                onChange={(e) => setDepartement(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">{t('seller.addDialog.cityLabel')}</Label>
                                            <Input
                                                className="bg-slate-50 border-slate-100 text-slate-800 focus-visible:ring-emerald-500/50 h-11 font-bold placeholder:text-slate-400"
                                                value={commune}
                                                onChange={(e) => setCommune(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">{t('seller.addDialog.sectionLabel')}</Label>
                                        <Input
                                            className="bg-slate-50 border-slate-100 text-slate-800 focus-visible:ring-emerald-500/50 h-11 font-bold placeholder:text-slate-400"
                                            value={sectionCommunale}
                                            onChange={(e) => setSectionCommunale(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="bg-slate-50 p-6 border-t border-slate-100 -mx-6 -mb-6 mt-4">
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-emerald-600 hover:bg-emerald-700 text-black w-full uppercase font-bold tracking-widest h-12 shadow-lg shadow-emerald-500/20"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {t('seller.editDialog.savingBtn')}
                                    </>
                                ) : (
                                    t('seller.editDialog.saveBtn')
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent className="sm:max-w-[750px] bg-white border-slate-200 text-slate-800 p-0 overflow-hidden max-h-[90vh] flex flex-col shadow-2xl rounded-2xl">
                    <DialogHeader className="p-6 pb-2 border-b border-slate-100">
                        <DialogTitle className="text-slate-800 text-xl font-bold flex items-center gap-2">
                            <Eye className="h-5 w-5 text-emerald-600" />
                            {t('seller.viewDialog.title')}
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mt-1">
                            {t('seller.viewDialog.subtitle')}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 pt-6">
                        {/* Header Info Section */}
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">{viewSellerData?.name}</h2>
                                <div className="flex items-center gap-2">
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                            "text-[10px] rounded-md uppercase font-bold px-2 py-0.5",
                                            getTypeColor(viewSellerData?.type || "")
                                        )}
                                    >
                                        {viewSellerData?.type}
                                    </Badge>
                                    <Badge
                                        className={cn(
                                            "text-[10px] font-bold rounded-md px-2 py-0.5",
                                            viewSellerData?.isActive !== false
                                                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                                : "bg-red-500/10 text-red-500 border-red-500/20"
                                        )}
                                        variant="outline"
                                    >
                                        {viewSellerData?.isActive !== false ? t('seller.grid.activeBadge') : t('seller.grid.inactiveBadge')}
                                    </Badge>
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                            "text-[10px] rounded-md uppercase font-bold px-2 py-0.5",
                                            "bg-orange-500/10 text-orange-500 border-orange-500/20"
                                        )}
                                    >
                                        {viewSellerData?.code || t('seller.grid.noLocation')}
                                    </Badge>
                                </div>
                            </div>
                            <div className="h-12 w-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                                <Building2 className="h-6 w-6 text-emerald-500" />
                            </div>
                        </div>

                        {/* Financials & Management Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 space-y-3 shadow-sm">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                    <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                                    {t('seller.viewDialog.financials')}
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[9px] text-slate-500 font-bold uppercase">{t('seller.viewDialog.balance')}</span>
                                        <span className="text-sm font-black text-emerald-600">
                                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'HTG' }).format(Number(viewSellerData?.balance || 0))}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-end border-t border-slate-200 pt-1">
                                        <span className="text-[9px] text-slate-500 font-bold uppercase">{t('seller.viewDialog.started')}</span>
                                        <span className="text-[11px] font-bold text-slate-700">
                                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'HTG' }).format(Number(viewSellerData?.startedBalance || 0))}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-end border-t border-slate-200 pt-1">
                                        <span className="text-[9px] text-slate-500 font-bold uppercase">{t('seller.viewDialog.commission')}</span>
                                        <span className="text-[11px] font-bold text-blue-600">{viewSellerData?.commission || 0}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 space-y-3 shadow-sm">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                    <Users className="h-3.5 w-3.5 text-blue-600" />
                                    {t('seller.viewDialog.manager')}
                                </div>
                                {viewSellerData?.seller ? (
                                    <div className="space-y-1">
                                        <div className="flex items-start gap-3">
                                            <div className="h-8 w-8 rounded-full bg-blue-500/10 border border-blue-500/10 flex items-center justify-center text-[10px] font-bold text-blue-600 shrink-0">
                                                {viewSellerData.seller.fullName.charAt(0)}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-bold text-slate-800 text-xs truncate">{viewSellerData.seller.fullName}</span>
                                                <span className="text-[9px] text-slate-500 truncate lowercase">{viewSellerData.seller.email}</span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-end border-t border-white/5 pt-1">
                                            {/* Creation Meta */}
                                            <div className="flex items-center justify-between text-[9px] text-zinc-600 font-bold uppercase tracking-widest px-1">
                                                <span>{t('seller.viewDialog.since')} {viewSellerData?.createdAt ? new Date(viewSellerData.createdAt).toLocaleDateString('en-US') : "N/A"}</span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-zinc-600 italic text-[11px] h-8">
                                        <Ban className="h-3.5 w-3.5 opacity-30" />
                                        <span>{t('seller.grid.notAssigned')}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Location Details */}
                        <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 space-y-4 shadow-sm">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                <MapPin className="h-3.5 w-3.5 text-indigo-600" />
                                {t('seller.viewDialog.locAddress')}
                            </div>
                            <div className="grid grid-cols-4 gap-6">
                                <div className="space-y-1">
                                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{t('seller.viewDialog.streetLabel')}</span>
                                    <p className="text-sm font-bold text-slate-800 truncate">{viewSellerData?.adresse?.adresseLigne1 || t('seller.grid.noLocation')}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{t('seller.viewDialog.dept')}</span>
                                    <p className="text-sm font-bold text-slate-800">{viewSellerData?.adresse?.departement || t('seller.grid.noLocation')}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{t('seller.viewDialog.commune')}</span>
                                    <p className="text-sm font-bold text-slate-800">{viewSellerData?.adresse?.commune || t('seller.grid.noLocation')}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{t('seller.viewDialog.section')}</span>
                                    <p className="text-sm font-bold text-slate-800">{viewSellerData?.adresse?.sectionCommunale || t('seller.grid.noLocation')}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-4 bg-slate-50 border-t border-slate-100 shadow-inner">
                        <Button
                            variant="outline"
                            onClick={() => setIsViewDialogOpen(false)}
                            className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold uppercase tracking-widest text-[11px] h-11 shadow-lg shadow-slate-200/50 transition-all active:scale-[0.98]"
                        >
                            {t('seller.viewDialog.closeBtn')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Request Details Dialog */}
            <Dialog open={isRequestDetailsDialogOpen} onOpenChange={setIsRequestDetailsDialogOpen}>
                <DialogContent className="sm:max-w-[600px] bg-white border-slate-200 text-slate-800 p-0 overflow-hidden max-h-[90vh] flex flex-col shadow-2xl rounded-2xl">
                    <DialogHeader className="p-6 pb-2 border-b border-slate-100">
                        <div className="flex items-center justify-between">
                            <DialogTitle className="text-slate-800 text-xl font-bold uppercase tracking-tight flex items-center gap-2">
                                <ShieldAlert className="h-5 w-5 text-emerald-600" />
                                {t('headquarters.requests.details.title')}
                            </DialogTitle>
                            {selectedRequest && (
                                <Badge className={cn(
                                    "text-[10px] font-bold px-2 py-0.5 rounded-md uppercase border shadow-sm",
                                    selectedRequest.status === RequestStatus.PENDING ? "bg-amber-50 text-amber-600 border-amber-100" :
                                        selectedRequest.status === RequestStatus.AUTHORIZED ? "bg-blue-50 text-blue-600 border-blue-100" :
                                            selectedRequest.status === RequestStatus.COMPLETED ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                                selectedRequest.status === RequestStatus.REJECTED ? "bg-red-50 text-red-600 border-red-100" :
                                                    "bg-slate-50 text-slate-600 border-slate-100"
                                )}>
                                    {selectedRequest.status}
                                </Badge>
                            )}
                        </div>
                    </DialogHeader>

                    {selectedRequest && (
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-sm">
                                    <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">{t('headquarters.requests.details.type')}</span>
                                    <div className="flex items-center gap-2">
                                        {selectedRequest.type === RequestType.DEPOSIT ? (
                                            <CheckCircle className="h-4 w-4 text-emerald-600" />
                                        ) : (
                                            <ArrowRight className="h-4 w-4 text-red-600" />
                                        )}
                                        <span className="font-bold text-slate-800">{selectedRequest.type}</span>
                                    </div>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-sm">
                                    <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">{t('headquarters.requests.details.amount')}</span>
                                    <span className="text-lg font-black text-slate-800">HTG {Number(selectedRequest.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100 shadow-sm">
                                    <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                                        <Users className="h-5 w-5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <span className="text-[10px] text-slate-500 font-bold uppercase block">{t('headquarters.requests.details.seller')}</span>
                                        <span className="font-bold text-slate-800 truncate block">{selectedRequest.seller?.name || "N/A"}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100 shadow-sm">
                                    <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600">
                                        <Calendar className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-slate-500 font-bold uppercase block">{t('headquarters.requests.details.date')}</span>
                                        <span className="font-bold text-slate-800">
                                            {selectedRequest.createdAt ? format(parseISO(selectedRequest.createdAt), 'PPP HH:mm') : 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {selectedRequest.description && (
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-sm">
                                    <span className="text-[10px] text-slate-500 font-bold uppercase block mb-2">{t('headquarters.requests.details.description')}</span>
                                    <p className="text-sm text-slate-700 leading-relaxed font-medium bg-white p-3 rounded-lg border border-slate-100">
                                        {selectedRequest.description}
                                    </p>
                                </div>
                            )}

                            <div className="flex flex-col gap-3 pt-2">
                                {selectedRequest.status === RequestStatus.AUTHORIZED && (
                                    <Button
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-black font-bold uppercase tracking-widest h-12 shadow-sm"
                                        onClick={() => handleCompleteRequest(selectedRequest.id)}
                                    >
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        {t('headquarters.requests.details.confirmBtn')}
                                    </Button>
                                )}
                                {selectedRequest.status === RequestStatus.PENDING && (
                                    <Button
                                        variant="outline"
                                        className="w-full border-red-500/30 text-red-500 hover:bg-red-500 hover:text-black font-bold uppercase tracking-widest h-12"
                                        onClick={() => handleCancelRequest(selectedRequest.id)}
                                    >
                                        <X className="h-4 w-4 mr-2" />
                                        {t('headquarters.requests.details.cancelBtn')}
                                    </Button>
                                )}
                                <Button
                                    variant="ghost"
                                    className="text-slate-500 hover:text-slate-800 font-bold uppercase tracking-widest h-10"
                                    onClick={() => setIsRequestDetailsDialogOpen(false)}
                                >
                                    {t('headquarters.requests.details.closeBtn')}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Confirmation d'annulation */}
            <Dialog open={isConfirmCancelDialogOpen} onOpenChange={setIsConfirmCancelDialogOpen}>
                <DialogContent className="sm:max-w-[400px] bg-white border-slate-200 text-slate-800 shadow-2xl rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-slate-800 flex items-center gap-2 font-bold uppercase tracking-tight">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                            {t('headquarters.requests.details.cancelConfirmTitle')}
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 text-sm font-medium">
                            {t('headquarters.requests.details.cancelConfirmDesc')}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0 sm:justify-between pt-6 border-t border-slate-100 mt-4">
                        <Button
                            variant="ghost"
                            onClick={() => setIsConfirmCancelDialogOpen(false)}
                            className="text-slate-500 hover:text-slate-800 font-bold uppercase tracking-widest text-[10px]"
                        >
                            {t('headquarters.requests.details.backBtn')}
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmCancel}
                            disabled={isSubmitting}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-widest text-[10px] px-6 shadow-lg shadow-red-500/20"
                        >
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : t('headquarters.requests.details.yesCancel')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Seller;