import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../../components/ui/table";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../../components/ui/select";
import {
    ShieldHalf,
    Plus,
    Edit,
    User as UserIcon,
    Search,
    MoreVertical,
    Eye,
    Ban,
    Check,
    Users,
    Loader2,
    MapPin,
    ShieldAlert,
    AlertCircle,
    XCircle,
} from "lucide-react";
import { Input } from "../../components/ui/input";
import { toast } from "sonner";
import headquartersApi, { Headquarter } from "../../context/api/headquarters";
import enterpriseApi, { Enterprise } from "../../context/api/enterprise";
import membershipApi from "../../context/api/membership";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "../../components/ui/pagination"
import { getPaginationRange } from "../../lib/pagination-utils"
    ;
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../../components/ui/dropdown-menu";
import { cn } from "../../lib/utils";
import { Label } from "../../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import requestApi, { Request, RequestStatus, RequestType } from "../../context/api/request";
import transactionApi, { Transaction } from "../../context/api/transaction";
import { parseISO, format } from "date-fns";
import usersApi from "../../context/api/users";
import { useTranslation } from "react-i18next";

const Headquarters: React.FC = () => {
    const { t } = useTranslation();
    const { enterpriseCode } = useParams<{ enterpriseCode: string }>();
    const [headquarters, setHeadquarters] = useState<Headquarter[]>([]);
    const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, _setEnterprises] = [enterprises, setEnterprises];
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Pagination/Search State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const itemsPerPage = 10;

    // Dialog States
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedHq, setSelectedHq] = useState<Headquarter | null>(null);
    const [selectedViewHq, setSelectedViewHq] = useState<Headquarter | null>(null);
    const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
    const [isRequestDetailsDialogOpen, setIsRequestDetailsDialogOpen] = useState(false)
    const [isCorrectionDialogOpen, setIsCorrectionDialogOpen] = useState(false);
    const [correctionHqId, setCorrectionHqId] = useState("");
    const [correctionDescription, setCorrectionDescription] = useState("");
    const [correctionTransactionId, setCorrectionTransactionId] = useState("");
    const [correctionAmount, setCorrectionAmount] = useState("");
    const [hqTransactions, setHqTransactions] = useState<Transaction[]>([]);
    const [isHqTransactionsLoading, setIsHqTransactionsLoading] = useState(false);
    const [isConfirmCancelDialogOpen, setIsConfirmCancelDialogOpen] = useState(false);
    const [requestToCancelId, setRequestToCancelId] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);

    // Form States
    const [name, setName] = useState("");
    const [type, setType] = useState<string>("");
    const [enterpriseId, setEnterpriseId] = useState("");
    const [commission, setCommission] = useState<number>(0);
    const [balance, setBalance] = useState<number>(0);
    const [startedBalance, setStartedBalance] = useState<number>(0);
    const [managerId, setManagerId] = useState("");

    useEffect(() => {
        const fetchHqTransactionsList = async () => {
            if (!correctionHqId) {
                setHqTransactions([]);
                return;
            }
            setIsHqTransactionsLoading(true);

            // Get current user ID from localStorage
            let userId = undefined;
            const userData = localStorage.getItem('agisa_user');
            if (userData) {
                try {
                    const parsed = JSON.parse(userData);
                    userId = parsed.id;
                } catch (e) {
                    console.error("Failed to parse user data", e);
                }
            }

            try {
                const res = await transactionApi.getAll(undefined, correctionHqId, undefined, 1, 50, undefined, userId);
                const list = res.data || [];
                setHqTransactions(list);
            } catch (error) {
                console.error("Failed to fetch HQ transactions", error);
            } finally {
                setIsHqTransactionsLoading(false);
            }
        };

        if (isCorrectionDialogOpen) {
            fetchHqTransactionsList();
        }
    }, [correctionHqId, isCorrectionDialogOpen]);
    useEffect(() => {
        const userData = localStorage.getItem('agisa_user');
        if (userData) {
            try {
                setCurrentUser(JSON.parse(userData));
            } catch (e) {
                console.error("Failed to parse user data for currentUser", e);
            }
        }
    }, []);

    const [adresseLigne1, setAdresseLigne1] = useState("");
    const [departement, setDepartement] = useState("");
    const [commune, setCommune] = useState("");
    const [sectionCommunale, setSectionCommunale] = useState("");

    const [openEnterprisePopover, setOpenEnterprisePopover] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [__, _setOpenEnterprisePopover] = [openEnterprisePopover, setOpenEnterprisePopover];
    const [openManagerPopover, setOpenManagerPopover] = useState(false);
    const [members, setMembers] = useState<any[]>([]);
    const [isMembersLoading, setIsMembersLoading] = useState(false);

    // Request States
    const [requests, setRequests] = useState<Request[]>([]);
    const [isRequestsLoading, setIsRequestsLoading] = useState(false);
    const [requestPage, setRequestPage] = useState(1);
    const [requestTotalPages, setRequestTotalPages] = useState(1);
    const requestLimit = 10;

    const fetchData = useCallback(async (page = 1, search = "") => {
        setIsLoading(true);
        try {
            const entRes = await enterpriseApi.getAll({ limit: 100 });
            const allEnterprises = entRes.data || (Array.isArray(entRes) ? entRes : []);
            setEnterprises(allEnterprises);

            let effectiveEnterpriseId = enterpriseId;

            // Auto-select enterpriseId if we have enterpriseCode
            if (enterpriseCode) {
                const currentEnt = allEnterprises.find(e => e.enterpriseCode === enterpriseCode);
                if (currentEnt) {
                    effectiveEnterpriseId = currentEnt.id;
                    setEnterpriseId(currentEnt.id);
                }
            }

            const hqRes = await headquartersApi.getAll({
                page,
                limit: itemsPerPage,
                search: search || undefined,
                enterpriseId: effectiveEnterpriseId || undefined
            });

            setHeadquarters(hqRes.data || []);
            if (hqRes.meta) {
                setTotalPages(hqRes.meta.lastPage || 1);
            }

            // Fetch user info for role checking
            await usersApi.getMe();
        } catch (error) {
            console.error("Failed to fetch headquarters:", error);
            toast.error(t('headquarters.toasts.error'), { description: t('headquarters.toasts.failLoad') });
        } finally {
            setIsLoading(false);
        }
    }, [enterpriseId, enterpriseCode, t]);

    const fetchRequests = useCallback(async (pageToFetch = 1) => {
        if (!enterpriseId) return;
        setIsRequestsLoading(true);
        try {
            const res = await requestApi.getAll({ enterpriseId, page: pageToFetch, limit: requestLimit });
            setRequests(res.data || []);
            setRequestTotalPages(res.meta.lastPage || 1);
            setRequestPage(res.meta.page || pageToFetch);
        } catch (error) {
            console.error("Failed to fetch requests:", error);
        } finally {
            setIsRequestsLoading(false);
        }
    }, [enterpriseId]);

    const fetchMembers = useCallback(async (entId: string) => {
        if (!entId) return;
        setIsMembersLoading(true);
        try {
            const res = await membershipApi.getByEnterprise(entId);
            setMembers(res.data || []);
        } catch (error) {
            console.error("Failed to fetch members:", error);
        } finally {
            setIsMembersLoading(false);
        }
    }, []);

    useEffect(() => {
        if (enterpriseId && (isAddDialogOpen || isEditDialogOpen)) {
            fetchMembers(enterpriseId);
        }
    }, [enterpriseId, isAddDialogOpen, isEditDialogOpen, fetchMembers]);

    // Re-fetch when enterpriseCode, enterpriseId or search changes
    useEffect(() => {
        fetchData(currentPage, debouncedSearch);
    }, [currentPage, debouncedSearch, enterpriseCode, fetchData]);

    // Auto-fetch requests when enterpriseId is resolved
    useEffect(() => {
        if (enterpriseId) {
            fetchRequests();
        }
    }, [enterpriseId, fetchRequests]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setCurrentPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);


    // Sync balance with startedBalance only when creating a new HQ
    useEffect(() => {
        if (isAddDialogOpen) {
            setBalance(startedBalance);
        }
    }, [startedBalance, isAddDialogOpen]);

    const handleCreate = async () => {
        if (!name || !enterpriseId) {
            toast.error(t('headquarters.toasts.validation'), { description: t('headquarters.toasts.reqFields') });
            return;
        }
        if (!type) {
            toast.error(t('headquarters.toasts.validation'), { description: t('headquarters.toasts.reqType') });
            return;
        }
        setIsSubmitting(true)
        try {
            await headquartersApi.create({
                name,
                type,
                enterpriseId,
                commission,
                managerId: managerId || undefined,
                startedBalance,
                adresse: {
                    adresseLigne1,
                    departement,
                    commune,
                    sectionCommunale
                }
            });
            toast.success(t('headquarters.toasts.success'), { description: t('headquarters.toasts.created') });
            setIsAddDialogOpen(false);
            resetForm();
            fetchData();
        } catch (error) {
            toast.error(t('headquarters.toasts.error'), { description: t('headquarters.toasts.failCreate') });
        } finally {
            setIsSubmitting(false)
        }
    };

    const handleUpdate = async () => {
        if (!selectedHq || !name) return;
        if (!type) {
            toast.error(t('headquarters.toasts.validation'), { description: t('headquarters.toasts.reqType') });
            return;
        }
        setIsSubmitting(true);
        try {
            await headquartersApi.update(selectedHq.id, {
                name,
                type,
                commission,
                managerId: managerId || undefined,
                startedBalance,
                adresse: {
                    adresseLigne1,
                    departement,
                    commune,
                    sectionCommunale
                }
            });
            toast.success(t('headquarters.toasts.success'), { description: t('headquarters.toasts.updated') });
            setIsEditDialogOpen(false);
            fetchData();
        } catch (error) {
            toast.error(t('headquarters.toasts.error'), { description: t('headquarters.toasts.failUpdate') });
        } finally {
            setIsSubmitting(false)
        }
    };

    // const handleDelete = async (id: string) => {
    //     if (!window.confirm("Are you sure?")) return;
    //     try {
    //         await headquartersApi.delete(id);
    //         toast.success("Deleted");
    //         fetchData();
    //     } catch (error) {
    //         toast.error("Failed to delete");
    //     }
    // };
    const handleViewhq = (hq: Headquarter) => {
        setSelectedViewHq(hq)
        setIsViewDialogOpen(true)
    }

    const handleToggleStatus = async (hq: Headquarter) => {
        try {
            await headquartersApi.update(hq.id, { isActive: !hq.isActive });
            toast.success(hq.isActive ? t('headquarters.toasts.suspend') : t('headquarters.toasts.activate'));
            fetchData();
        } catch (error: any) {
            toast.error(t('headquarters.toasts.failStatus'), {
                description: error.response?.data?.message || "An error occurred"
            });
        }
    };

    const handleApproveRequest = async (requestId: string, notes?: string) => {
        try {
            await requestApi.approve(requestId, { reviewerNotes: notes || "Approved" });
            toast.success(t('headquarters.toasts.reqApprove'));
            fetchRequests();
        } catch (error: any) {
            toast.error(t('headquarters.toasts.failApprove'), { description: error.response?.data?.message });
        }
    };

    const handleRejectRequest = async (requestId: string, notes?: string) => {
        try {
            await requestApi.reject(requestId, { reviewerNotes: notes || "Rejected by Manager" });
            toast.success(t('headquarters.toasts.reqReject'));
            fetchRequests();
        } catch (error: any) {
            toast.error(t('headquarters.toasts.failReject'), { description: error.response?.data?.message });
        }
    };


    const handleCompleteRequest = async (requestId: string, notes?: string) => {
        try {
            await requestApi.complete(requestId, { reviewerNotes: notes || "Completed" });
            toast.success(t('headquarters.toasts.reqComplete') || "Request Completed");
            fetchRequests();
        } catch (error: any) {
            toast.error(t('headquarters.toasts.failComplete') || "Failed to complete request", { description: error.response?.data?.message });
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
            toast.success(t('headquarters.toasts.reqCancelSuccess') || "Request cancelled successfully");
            setIsRequestDetailsDialogOpen(false);
            setIsConfirmCancelDialogOpen(false);
            setRequestToCancelId(null);
            fetchRequests();
        } catch (error: any) {
            toast.error(t('headquarters.toasts.reqCancelFail') || "Failed to cancel request", { description: error.response?.data?.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCreateCorrection = async () => {
        if (!correctionTransactionId || !correctionDescription || !correctionAmount) {
            toast.error(t('headquarters.toasts.fillAllFields'));
            return;
        }

        setIsSubmitting(true);
        try {
            await requestApi.create({
                type: RequestType.CORRECTION,
                headquarterId: correctionHqId,
                description: correctionDescription,
                enterpriseId: enterpriseId,
                referencedTransactionId: correctionTransactionId,
                amount: Number(correctionAmount)
            });
            toast.success(t('headquarters.toasts.correctionCreated'));
            setIsCorrectionDialogOpen(false);
            setCorrectionDescription("");
            setCorrectionHqId("");
            setCorrectionTransactionId("");
            setCorrectionAmount("");
            fetchRequests();
        } catch (error) {
            console.error("Failed to create correction request", error);
            toast.error(t('headquarters.toasts.createFailed'));
        } finally {
            setIsSubmitting(false);
        }
    }
        ;

    const resetForm = () => {
        setName("");
        setType("");
        setEnterpriseId("");
        setCommission(0);
        setBalance(0);
        setStartedBalance(0);
        setManagerId("");
        setAdresseLigne1("");
        setDepartement("");
        setCommune("");
        setSectionCommunale("");
        setSelectedHq(null);
        setMembers([]);
    };

    const openEdit = (hq: Headquarter) => {
        setSelectedHq(hq);
        setName(hq.name);
        setType(hq.type as any);
        setEnterpriseId(hq.enterpriseId);
        setCommission(hq.commission || 0);
        setBalance(hq.balance || 0);
        setStartedBalance(hq.startedBalance || 0);
        setManagerId(hq.managerId || "");
        setAdresseLigne1(hq.adresse?.adresseLigne1 || "");
        setDepartement(hq.adresse?.departement || "");
        setCommune(hq.adresse?.commune || "");
        setSectionCommunale(hq.adresse?.sectionCommunale || "");
        setIsEditDialogOpen(true);
    };

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
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-black text-xl flex items-center gap-2">
                                    <ShieldHalf className="h-5 w-5 text-emerald-500" />
                                    {t('headquarters.units.title')}
                                </CardTitle>
                                <p className="text-xs text-zinc-500 mt-1">{t('headquarters.units.desc')}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="relative w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                    <Input
                                        placeholder={t('headquarters.units.search')}
                                        className="bg-slate-50 border-slate-200 pl-10 text-black focus-visible:ring-emerald-500/50"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <Button
                                    onClick={() => { resetForm(); setIsAddDialogOpen(true); }}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-black"
                                >
                                    <Plus className="h-4 w-4 mr-2" /> {t('headquarters.units.addBtn')}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border border-slate-200 overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-slate-50">
                                        <TableRow className="border-slate-200 hover:bg-transparent">
                                            <TableHead className="text-zinc-500 font-bold uppercase text-[10px]">{t('headquarters.units.grid.colName')}</TableHead>
                                            <TableHead className="text-zinc-500 font-bold uppercase text-[10px]">{t('headquarters.units.grid.colType')}</TableHead>
                                            <TableHead className="text-zinc-500 font-bold uppercase text-[10px]">{t('headquarters.units.grid.colEnt')}</TableHead>
                                            <TableHead className="text-zinc-500 font-bold uppercase text-[10px]">{t('headquarters.units.grid.colManager')}</TableHead>
                                            <TableHead className="text-zinc-500 font-bold uppercase text-[10px]">{t('headquarters.units.grid.colStatus')}</TableHead>
                                            <TableHead className="text-zinc-500 font-bold uppercase text-[10px] text-right">{t('headquarters.units.grid.colActions')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoading ? (
                                            <TableRow><TableCell colSpan={6} className="text-center py-10 text-zinc-500 italic">{t('headquarters.units.grid.loading')}</TableCell></TableRow>
                                        ) : headquarters.length === 0 ? (
                                            <TableRow><TableCell colSpan={6} className="text-center py-10 text-zinc-500 italic">{t('headquarters.units.grid.noHq')}</TableCell></TableRow>
                                        ) : headquarters.map((hq) => (
                                            <TableRow key={hq.id} className="border-slate-200 hover:bg-slate-50 transition-colors">
                                                <TableCell className="font-bold text-slate-500">{hq.name}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-500 rounded-md">
                                                        {hq.type}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-zinc-400 text-xs font-medium uppercase">
                                                    {hq.enterprise?.name || t('headquarters.units.grid.global')}
                                                </TableCell>
                                                <TableCell className="text-zinc-400 text-xs font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <UserIcon className="h-3 w-3 text-emerald-500/70" />
                                                        <span>{hq.manager?.fullName || t('headquarters.units.grid.notAssigned')}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={hq.isActive ? "bg-emerald-500/10 text-emerald-500 border-none rounded-md" : "bg-red-500/10 text-red-500 border-none rounded-md"}>
                                                        {hq.isActive ? t('headquarters.units.grid.active') : t('headquarters.units.grid.inactive')}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost"
                                                                className="h-8 w-8 p-0 text-zinc-500 hover:text-black hover:bg-slate-100 rounded-full">
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="bg-white border-slate-200 text-black min-w-[160px]">
                                                            <DropdownMenuLabel className="text-[10px] uppercase font-black text-zinc-500 tracking-widest px-2 py-1.5">{t('headquarters.units.grid.colActions')}</DropdownMenuLabel>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem className="cursor-pointer gap-2 font-bold text-xs py-2" onClick={() => handleViewhq(hq)}>
                                                                <Eye className="h-3.5 w-3.5 text-blue-400" /> {t('headquarters.units.actions.view')}
                                                            </DropdownMenuItem>

                                                            <DropdownMenuItem
                                                                className={cn(
                                                                    "cursor-pointer gap-2 font-bold text-xs py-2",
                                                                    hq.isActive ? "text-red-400 hover:text-red-300" : "text-emerald-400 hover:text-emerald-300"
                                                                )}
                                                                onClick={() => handleToggleStatus(hq)}
                                                            >
                                                                {hq.isActive ? (
                                                                    <>
                                                                        <Ban className="h-3.5 w-3.5" /> {t('headquarters.units.actions.suspend')}
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Check className="h-3.5 w-3.5" /> {t('headquarters.units.actions.activate')}
                                                                    </>
                                                                )}
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="pt-4 flex justify-center">
                                    <Pagination>
                                        <PaginationContent>
                                            <PaginationItem>
                                                <PaginationPrevious
                                                    href="#"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        if (currentPage > 1) setCurrentPage(currentPage - 1);
                                                    }}
                                                    className={currentPage === 1 ? "pointer-events-none opacity-50 text-zinc-500" : "text-black hover:bg-slate-100 cursor-pointer"}
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
                                                    href="#"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                                                    }}
                                                    className={currentPage === totalPages ? "pointer-events-none opacity-50 text-zinc-500" : "text-black hover:bg-slate-100 cursor-pointer"}
                                                />
                                            </PaginationItem>
                                        </PaginationContent>
                                    </Pagination>
                                </div>
                            )}

                            {/* View HQ Dialog */}
                            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                                <DialogContent className="bg-white border-slate-200 text-black max-w-lg">
                                    <DialogHeader>
                                        <DialogTitle className="text-xl font-bold flex items-center gap-2 text-emerald-400">
                                            <ShieldHalf className="h-5 w-5" /> {t('headquarters.viewDialog.title')}
                                        </DialogTitle>
                                        <DialogDescription className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">
                                            Detailed information for organizational unit.
                                        </DialogDescription>
                                    </DialogHeader>

                                    {selectedViewHq && (
                                        <div className="grid gap-6 py-4">
                                            <div className="grid grid-cols-3 gap-4">
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">{t('headquarters.viewDialog.hqName')}</Label>
                                                    <p className="text-sm font-bold text-black">{selectedViewHq.name}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">{t('headquarters.viewDialog.type')}</Label>
                                                    <div>
                                                        <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-500 rounded-md">
                                                            {selectedViewHq.type}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">{t('headquarters.viewDialog.code')}</Label>
                                                    <p className="text-sm font-bold text-orange-400">{selectedViewHq.code || "N/A"}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">{t('headquarters.viewDialog.ent')}</Label>
                                                    <p className="text-sm font-bold text-zinc-400 uppercase">{selectedViewHq.enterprise?.name || t('headquarters.units.grid.global')}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">{t('headquarters.viewDialog.status')}</Label>
                                                    <div>
                                                        <Badge className={selectedViewHq.isActive ? "bg-emerald-500/10 text-emerald-500 border-none rounded-md" : "bg-red-500/10 text-red-500 border-none rounded-md"}>
                                                            {selectedViewHq.isActive ? "Active" : "Inactive"}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">{t('headquarters.viewDialog.manager')}</Label>
                                                    <div className="flex items-center gap-2">
                                                        <UserIcon className="h-4 w-4 text-orange-400" />
                                                        <p className="text-sm font-bold text-orange-400">{selectedViewHq.manager?.fullName || "N/A"}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Location Details */}
                                            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-4 shadow-inner mt-2">
                                                <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                                    <MapPin className="h-3.5 w-3.5 text-red-500" />
                                                    {t('headquarters.viewDialog.locAddr')}
                                                </div>
                                                <div className="grid grid-cols-4 gap-6">
                                                    <div className="space-y-1">
                                                        <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">{t('headquarters.viewDialog.street')}</span>
                                                        <p className="text-sm font-bold text-zinc-100 truncate">{selectedViewHq.adresse?.adresseLigne1 || "N/A"}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">{t('headquarters.viewDialog.dept')}</span>
                                                        <p className="text-sm font-bold text-zinc-100">{selectedViewHq.adresse?.departement || "N/A"}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">{t('headquarters.viewDialog.commune')}</span>
                                                        <p className="text-sm font-bold text-zinc-100">{selectedViewHq.adresse?.commune || "N/A"}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">{t('headquarters.viewDialog.section')}</span>
                                                        <p className="text-sm font-bold text-zinc-100">{selectedViewHq.adresse?.sectionCommunale || "N/A"}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5">
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">{t('headquarters.viewDialog.commission')}</Label>
                                                    <p className="text-sm font-bold text-emerald-500">{selectedViewHq.commission || "0.00"}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">{t('headquarters.viewDialog.startedBal')}</Label>
                                                    <p className="text-sm font-bold text-orange-400">{selectedViewHq.startedBalance || "0.00"} USD</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">{t('headquarters.viewDialog.currentBal')}</Label>
                                                    <p className="text-sm font-bold text-blue-400">{selectedViewHq.balance || "0.00"} USD</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <DialogFooter className="gap-2 sm:gap-0 border-t border-white/5 pt-4">
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                if (selectedViewHq) {
                                                    openEdit(selectedViewHq);
                                                    setIsViewDialogOpen(false);
                                                }
                                            }}
                                            className="bg-emerald-600/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-600 hover:text-black font-bold w-full md:w-auto gap-2"
                                        >
                                            <Edit className="h-4 w-4" /> {t('headquarters.viewDialog.editBtn')}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => setIsViewDialogOpen(false)}
                                            className="bg-zinc-800 border-white/5 text-black hover:bg-zinc-700 font-bold w-full md:w-auto"
                                        >
                                            {t('headquarters.viewDialog.closeBtn')}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="requests" className="mt-0">
                    <Card className="border-slate-200 bg-slate-50 backdrop-blur-xl">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-black text-xl flex items-center gap-2">
                                    <ShieldHalf className="h-5 w-5 text-emerald-500" />
                                    {t('headquarters.requests.title')}
                                </CardTitle>
                                <p className="text-xs text-zinc-500 mt-1">{t('headquarters.requests.desc')}</p>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsCorrectionDialogOpen(true)}
                                    className="bg-slate-50 border-slate-200 text-black hover:bg-slate-100 text-xs font-bold uppercase tracking-widest"
                                >
                                    <Plus className="h-3 w-3" />
                                    {t('headquarters.requests.newRequestBtn')}
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => fetchRequests(1)}
                                    className="bg-slate-50 border-slate-200 text-black hover:bg-slate-100 text-xs font-bold uppercase tracking-widest gap-2"
                                >
                                    <Loader2 className={cn("h-3 w-3", isRequestsLoading && "animate-spin")} />
                                    {t('headquarters.requests.refreshBtn')}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border border-slate-200 overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-slate-50">
                                        <TableRow className="border-slate-200 hover:bg-transparent">
                                            <TableHead className="text-zinc-500 font-bold uppercase text-[10px]">{t('headquarters.units.grid.colType')}</TableHead>
                                            <TableHead className="text-zinc-500 font-bold uppercase text-[10px]">{t('headquarters.requests.grid.colHq')}</TableHead>
                                            <TableHead className="text-zinc-500 font-bold uppercase text-[10px]">{t('headquarters.requests.grid.colAmount')}</TableHead>
                                            <TableHead className="text-zinc-500 font-bold uppercase text-[10px]">{t('headquarters.requests.grid.colRequester')}</TableHead>
                                            <TableHead className="text-zinc-500 font-bold uppercase text-[10px]">{t('headquarters.units.grid.colStatus')}</TableHead>
                                            <TableHead className="text-zinc-500 font-bold uppercase text-[10px]">{t('headquarters.requests.grid.colDate')}</TableHead>
                                            <TableHead className="text-zinc-500 font-bold uppercase text-[10px] text-right">{t('headquarters.units.grid.colActions')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isRequestsLoading ? (
                                            <TableRow><TableCell colSpan={7} className="text-center py-10 text-zinc-500 italic">{t('headquarters.units.grid.loading')}</TableCell></TableRow>
                                        ) : requests.length === 0 ? (
                                            <TableRow><TableCell colSpan={7} className="text-center py-10 text-zinc-500 italic">{t('headquarters.requests.grid.noReq')}</TableCell></TableRow>
                                        ) : (
                                            requests.map((req) => (
                                                <TableRow key={req.id} className="border-slate-200 hover:bg-slate-50 transition-colors">
                                                    <TableCell>
                                                        <Badge variant="outline" className={cn(
                                                            "text-[10px] font-black uppercase tracking-widest rounded-md",
                                                            req.type === RequestType.DEPOSIT ? "text-emerald-500 border-emerald-500/20" :
                                                                req.type === RequestType.CORRECTION ? "text-orange-500 border-orange-500/20" :

                                                                    req.type === RequestType.WITHDRAWAL ? "text-red-500 border-red-500/20" :
                                                                        req.type === RequestType.ACTIVATION ? "text-blue-500 border-blue-500/20" :
                                                                            req.type === RequestType.DEACTIVATION ? "text-blue-500 border-blue-500/20" :
                                                                                "text-red-500 border-red-500/20"
                                                        )}>
                                                            {req.type}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="font-bold text-slate-500">{req.headquarter?.name || "N/A"}</TableCell>
                                                    <TableCell className="font-black text-black">
                                                        {req.amount ? `${req.amount.toLocaleString('en-US')}` : "-"}
                                                    </TableCell>
                                                    <TableCell className="text-slate-500 text-xs">{req.requester?.fullName || "N/A"}</TableCell>
                                                    <TableCell>
                                                        <Badge className={cn(
                                                            "border-none rounded-md text-[10px] font-bold uppercase tracking-tighter",
                                                            req.status === RequestStatus.PENDING ? "bg-orange-500/10 text-orange-500" :
                                                                req.status === RequestStatus.APPROVED ? "bg-emerald-500/10 text-emerald-500" :
                                                                    req.status === RequestStatus.IN_ACCOUNTING ? "bg-purple-500/10 text-purple-500" :
                                                                        (req.status === RequestStatus.AUDITED || req.status === RequestStatus.AUTHORIZED) ? "bg-blue-500/10 text-blue-500" :
                                                                            req.status === RequestStatus.REJECTED ? "bg-red-500/10 text-red-500" :
                                                                                req.status === RequestStatus.IN_LITIGATION ? "bg-yellow-500/10 text-yellow-500" :
                                                                                    req.status === RequestStatus.IN_FINANCE ? "bg-pink-500/10 text-pink-500" :
                                                                                        req.status === RequestStatus.CANCELLED ? "bg-gray-500/10 text-gray-500" :
                                                                                            req.status === RequestStatus.COMPLETED ? "bg-green-500/10 text-green-500" :
                                                                                                "bg-gray-500/10 text-gray-500"
                                                        )}>
                                                            {t(`accounting.statusNames.${req.status.toLowerCase().replace(/_([a-z])/g, (g) => g[1].toUpperCase())}`) || req.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-zinc-500 text-[10px] uppercase font-bold">
                                                        {format(parseISO(req.createdAt), 'MMM dd, HH:mm')}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-zinc-500 hover:text-black hover:bg-slate-100 rounded-full"
                                                                onClick={async () => {
                                                                    try {
                                                                        const fullReq = await requestApi.getById(req.id);
                                                                        setSelectedRequest(fullReq);
                                                                        setIsRequestDetailsDialogOpen(true);
                                                                    } catch (e) {
                                                                        console.error("Failed to fetch full request details:", e);
                                                                        setSelectedRequest(req);
                                                                        setIsRequestDetailsDialogOpen(true);
                                                                    }
                                                                }}
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>

                                                            {(req.status === RequestStatus.PENDING || req.status === RequestStatus.AUDITED || req.status === RequestStatus.AUTHORIZED) && req.type !== RequestType.DEPOSIT ? (
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button variant="ghost"
                                                                            className="h-8 w-8 p-0 text-zinc-500 hover:text-black hover:bg-slate-100 rounded-full">
                                                                            <MoreVertical className="h-4 w-4" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end" className="bg-white border-slate-200 text-black min-w-[200px]">
                                                                        <DropdownMenuLabel className="text-[10px] uppercase font-black text-zinc-500 tracking-widest px-2 py-1.5">{t('headquarters.units.grid.colActions')}</DropdownMenuLabel>
                                                                        <DropdownMenuSeparator className="bg-slate-50" />

                                                                        {(req.status === RequestStatus.AUDITED || req.status === RequestStatus.AUTHORIZED) && (
                                                                            <DropdownMenuItem
                                                                                onClick={() => handleCompleteRequest(req.id, "Final Transaction processed from HQ")}
                                                                                className="cursor-pointer gap-2 font-black text-xs py-2 text-emerald-500 hover:text-emerald-400 focus:bg-emerald-500/10 focus:text-emerald-500"
                                                                            >
                                                                                <Check className="h-4 w-4" />
                                                                                {t('headquarters.requests.actions.complete') || "Process & Deposit"}
                                                                            </DropdownMenuItem>
                                                                        )}

                                                                        {(req.type === RequestType.ACTIVATION || req.type === RequestType.DEACTIVATION) && (
                                                                            <>
                                                                                <DropdownMenuItem
                                                                                    onClick={() => handleApproveRequest(req.id, "Approved by Manager")}
                                                                                    className="cursor-pointer gap-2 font-bold text-xs py-2 text-emerald-400 hover:text-emerald-300 focus:bg-emerald-500/10 focus:text-emerald-400"
                                                                                >
                                                                                    <Check className="h-4 w-4" />
                                                                                    {t('headquarters.requests.grid.approveBtn')}
                                                                                </DropdownMenuItem>
                                                                            </>
                                                                        )}
                                                                        <DropdownMenuItem
                                                                            onClick={() => handleRejectRequest(req.id)}
                                                                            className="cursor-pointer gap-2 font-black text-xs py-2 text-red-500 hover:text-red-400 focus:bg-red-500/10 focus:text-red-500 border-t border-slate-50 mt-1"
                                                                        >
                                                                            <XCircle className="h-4 w-4" />
                                                                            {t('headquarters.requests.actions.reject') || "Reject Request"}
                                                                        </DropdownMenuItem>
                                                                        {req.requesterId === currentUser?.id && (
                                                                            <DropdownMenuItem
                                                                                onClick={() => handleCancelRequest(req.id)}
                                                                                className="cursor-pointer gap-2 font-bold text-xs py-2 text-orange-400 hover:text-orange-300 focus:bg-orange-500/10 focus:text-orange-400"
                                                                            >
                                                                                <Ban className="h-4 w-4" />
                                                                                {t('headquarters.requests.grid.cancelBtn') || "Cancel Request"}
                                                                            </DropdownMenuItem>
                                                                        )}
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            ) : (
                                                                <Badge variant="default" className="h-8 text-[10px] font-bold uppercase text-zinc-600 bg-slate-100 border-none">
                                                                    {t('headquarters.requests.grid.processed')}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination Controls */}
                            {requests.length > 0 && (
                                <div className="flex items-center justify-between mt-4">
                                    {t('headquarters.pagination.info', { page: requestPage, totalPages: requestTotalPages })}
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => fetchRequests(requestPage - 1)}
                                            disabled={requestPage <= 1 || isRequestsLoading}
                                            className="h-8 border-slate-200 bg-slate-50 text-zinc-400 hover:text-black hover:bg-slate-100 text-[10px] font-bold uppercase tracking-widest"
                                        >
                                            {t('headquarters.pagination.prev')}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => fetchRequests(requestPage + 1)}
                                            disabled={requestPage >= requestTotalPages || isRequestsLoading}
                                            className="h-8 border-slate-200 bg-slate-50 text-zinc-400 hover:text-black hover:bg-slate-100 text-[10px] font-bold uppercase tracking-widest"
                                        >
                                            {t('headquarters.pagination.next')}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent >
                    </Card >
                </TabsContent >
            </Tabs >

            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent className="bg-white border-slate-200 text-black">
                    <DialogHeader>
                        <DialogTitle>{t('headquarters.addDialog.title')}</DialogTitle>
                        <DialogDescription>{t('headquarters.addDialog.desc')}</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">{t('headquarters.addDialog.nameLabel')}</label>
                                <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-slate-50 border-slate-200" placeholder={t("headquarters.addDialog.namePlaceholder")} />
                            </div>

                            <div className="grid gap-2">
                                <label className="text-sm font-medium">{t("headquarters.addDialog.managerLabel")}</label>
                                <Popover open={openManagerPopover} onOpenChange={setOpenManagerPopover}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            disabled={!enterpriseId}
                                            className="justify-between bg-slate-50 border-slate-200 text-black disabled:opacity-50"
                                        >
                                            {managerId ? (members.find(m => m.user?.id === managerId)?.user?.fullName || t('headquarters.addDialog.managerSelect')) : t('headquarters.addDialog.managerSelect')}
                                            <Users className="ml-2 h-4 w-4 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[400px] p-0 bg-white border-slate-200">
                                        <Command className="bg-transparent">
                                            <CommandInput placeholder={t("headquarters.addDialog.managerSearch")} />
                                            <CommandEmpty>{isMembersLoading ? t('headquarters.units.grid.loading') : t('headquarters.addDialog.managerNoFound')}</CommandEmpty>
                                            <CommandGroup>
                                                {members.map(member => (
                                                    <CommandItem
                                                        key={member.user?.id}
                                                        onSelect={() => {
                                                            setManagerId(member.user?.id);
                                                            setOpenManagerPopover(false);
                                                        }}
                                                        className="text-black hover:bg-slate-100 cursor-pointer flex items-center gap-2"
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
                            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2 pb-2 border-b border-white/5">
                                <MapPin className="h-3 w-3 text-emerald-500" /> {t('headquarters.addDialog.addrTitle')}
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">{t('headquarters.addDialog.streetLabel')}</label>
                                    <Input value={adresseLigne1} onChange={(e) => setAdresseLigne1(e.target.value)} className="bg-slate-50 border-slate-200" placeholder={t("headquarters.addDialog.streetPlaceholder")} />
                                </div>
                                <div className="grid gap-2">
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">{t('headquarters.addDialog.stateLabel')}</label>
                                        <Input value={departement} onChange={(e) => setDepartement(e.target.value)} className="bg-slate-50 border-slate-200" placeholder={t("headquarters.addDialog.statePlaceholder")} />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">{t('headquarters.addDialog.cityLabel')}</label>
                                    <Input value={commune} onChange={(e) => setCommune(e.target.value)} className="bg-slate-50 border-slate-200" placeholder={t("headquarters.addDialog.cityPlaceholder")} />
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">{t('headquarters.addDialog.sectionLabel')}</label>
                                    <Input value={sectionCommunale} onChange={(e) => setSectionCommunale(e.target.value)} className="bg-slate-50 border-slate-200" placeholder={t("headquarters.addDialog.sectionPlaceholder")} />
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <label className="text-sm font-medium">{t('headquarters.addDialog.typeLabel')}</label>
                            <Select value={type || undefined} onValueChange={(val) => {
                                setType(val);
                                // Auto-set starting balance based on level
                                if (val === "PLATINUM") {
                                    setStartedBalance(150000);
                                    setBalance(150000);
                                } else if (val === "SILVER") {
                                    setStartedBalance(300000);
                                    setBalance(300000);
                                } else if (val === "GOLD") {
                                    setStartedBalance(500000);
                                    setBalance(500000);
                                } else if (val === "DIAMOND") {
                                    setStartedBalance(1000000);
                                    setBalance(1000000);
                                }
                            }}>
                                <SelectTrigger className="bg-slate-50 border-slate-200 text-black">
                                    <SelectValue placeholder={t("headquarters.addDialog.typeSelect")} />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-slate-200 text-black">
                                    <SelectItem value="PLATINUM">PLATINUM</SelectItem>
                                    <SelectItem value="SILVER">SILVER</SelectItem>
                                    <SelectItem value="GOLD">GOLD</SelectItem>
                                    <SelectItem value="DIAMOND">DIAMOND</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">{t('headquarters.addDialog.startedBalHTG')}</label>
                                <Input type="number" step="0.01" value={startedBalance} onChange={(e) => setStartedBalance(parseFloat(e.target.value) || 0)} className="bg-slate-50 border-slate-200" placeholder="0.00" />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">{t('headquarters.addDialog.currentBalUSD')}</label>
                                <Input type="number" step="0.01" value={balance} disabled={true} className="bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed" placeholder="0.00" />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="text-black border-slate-200 hover:bg-slate-50">{t('headquarters.addDialog.cancelBtn')}</Button>
                        <Button onClick={handleCreate}
                            disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-black">
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {t('headquarters.addDialog.creatingBtn')}
                                </>
                            ) : (
                                t('headquarters.addDialog.createBtn')
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="bg-white border-slate-200 text-black">
                    <DialogHeader>
                        <DialogTitle>{t('headquarters.editDialog.title')}</DialogTitle>
                        <DialogDescription>{t('headquarters.editDialog.desc')}</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">{t('headquarters.addDialog.nameLabel')}</label>
                                <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-slate-50 border-slate-200" />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">{t("headquarters.addDialog.managerLabel")}</label>
                                <Popover open={openManagerPopover} onOpenChange={setOpenManagerPopover}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            className="justify-between bg-slate-50 border-slate-200 text-black"
                                        >
                                            {managerId ? (members.find(m => m.user?.id === managerId)?.user?.fullName || t('headquarters.addDialog.managerSelect')) : t('headquarters.addDialog.managerSelect')}
                                            <Users className="ml-2 h-4 w-4 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[400px] p-0 bg-white border-slate-200">
                                        <Command className="bg-transparent">
                                            <CommandInput placeholder={t("headquarters.addDialog.managerSearch")} />
                                            <CommandEmpty>{isMembersLoading ? t('headquarters.units.grid.loading') : t('headquarters.addDialog.managerNoFoundGlobal')}</CommandEmpty>
                                            <CommandGroup>
                                                {members.map(member => (
                                                    <CommandItem
                                                        key={member.user?.id}
                                                        onSelect={() => {
                                                            setManagerId(member.user?.id);
                                                            setOpenManagerPopover(false);
                                                        }}
                                                        className="text-black hover:bg-slate-100 cursor-pointer flex items-center gap-2"
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
                            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2 pb-2 border-b border-white/5">
                                <MapPin className="h-3 w-3 text-emerald-500" /> {t('headquarters.addDialog.addrTitle')}
                            </h3>
                            <div className="grid gap-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">{t('headquarters.addDialog.streetLabel')}</label>
                                        <Input value={adresseLigne1} onChange={(e) => setAdresseLigne1(e.target.value)} className="bg-slate-50 border-slate-200" />
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">{t('headquarters.addDialog.stateLabel')}</label>
                                        <Input value={departement} onChange={(e) => setDepartement(e.target.value)} className="bg-slate-50 border-slate-200" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">{t('headquarters.addDialog.cityLabel')}</label>
                                        <Input value={commune} onChange={(e) => setCommune(e.target.value)} className="bg-slate-50 border-slate-200" />
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">{t('headquarters.addDialog.sectionLabel')}</label>
                                        <Input value={sectionCommunale} onChange={(e) => setSectionCommunale(e.target.value)} className="bg-slate-50 border-slate-200" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <label className="text-sm font-medium">{t('headquarters.addDialog.typeLabel')}</label>
                            <Select value={type || undefined} onValueChange={(val) => {
                                setType(val);
                                // Auto-set starting balance based on level
                                if (val === "PLATINUM") {
                                    setStartedBalance(150000);
                                    setBalance(150000);
                                } else if (val === "SILVER") {
                                    setStartedBalance(300000);
                                    setBalance(300000);
                                } else if (val === "GOLD") {
                                    setStartedBalance(500000);
                                    setBalance(500000);
                                } else if (val === "DIAMOND") {
                                    setStartedBalance(1000000);
                                    setBalance(1000000);
                                }
                            }}>
                                <SelectTrigger className="bg-slate-50 border-slate-200 text-black">
                                    <SelectValue placeholder={t("headquarters.addDialog.typeSelect")} />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-slate-200 text-black">
                                    <SelectItem value="PLATINUM">PLATINUM</SelectItem>
                                    <SelectItem value="SILVER">SILVER</SelectItem>
                                    <SelectItem value="GOLD">GOLD</SelectItem>
                                    <SelectItem value="DIAMOND">DIAMOND</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">{t('headquarters.addDialog.startedBalUSD')}</label>
                                <Input type="number" step="0.01" value={startedBalance} onChange={(e) => setStartedBalance(parseFloat(e.target.value) || 0)} className="bg-slate-50 border-slate-200" placeholder="0.00" />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">{t('headquarters.addDialog.currentBalUSD')}</label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={balance}
                                    disabled={true}
                                    className="bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="text-black border-slate-200 hover:bg-slate-50">{t('headquarters.addDialog.cancelBtn')}</Button>
                        <Button onClick={handleUpdate}
                            disabled={isSubmitting}
                            className="bg-emerald-600 hover:bg-emerald-700 text-black">
                            {isSubmitting ? t('headquarters.editDialog.savingBtn') : t('headquarters.editDialog.saveBtn')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Error Correction Request Dialog */}
            <Dialog open={isCorrectionDialogOpen} onOpenChange={setIsCorrectionDialogOpen}>
                <DialogContent className="bg-white border-slate-200 text-black sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2 text-red-500">
                            <ShieldAlert className="h-5 w-5" />
                            {t('headquarters.errorDialog.title')}
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 text-xs uppercase font-bold tracking-tight">
                            {t('headquarters.errorDialog.desc')}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 py-4 overflow-y-auto max-h-[70vh] pr-2 custom-scrollbar">
                        <div className="grid gap-2">
                            <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                                {t('headquarters.errorDialog.hqLabel')}
                            </label>
                            <Select value={correctionHqId} onValueChange={setCorrectionHqId}>
                                <SelectTrigger className="bg-slate-50 border-slate-200 text-black focus:ring-red-500/50 h-10">
                                    <SelectValue placeholder={t('headquarters.errorDialog.hqPlaceholder')} />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-slate-200 text-black">
                                    {headquarters.map((hq) => (
                                        <SelectItem key={hq.id} value={hq.id}>
                                            {hq.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                                {t('headquarters.errorDialog.transactionLabel')}
                            </label>
                            <Select value={correctionTransactionId} onValueChange={setCorrectionTransactionId} disabled={!correctionHqId || isHqTransactionsLoading}>
                                <SelectTrigger className="bg-slate-50 border-slate-200 text-black focus:ring-red-500/50 h-10">
                                    <SelectValue placeholder={isHqTransactionsLoading ? t('headquarters.units.grid.loading') : t('headquarters.errorDialog.transactionPlaceholder')} />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-slate-200 text-black">
                                    {hqTransactions.map((trx) => (
                                        <SelectItem key={trx.id} value={trx.id}>
                                            <span className="font-bold">[{trx.type.toUpperCase()}]</span> {trx.amount ? `${Number(trx.amount).toLocaleString('en-US')}` : ""} - {trx.id.split('-')[0]}
                                        </SelectItem>
                                    ))}
                                    {hqTransactions.length === 0 && !isHqTransactionsLoading && (
                                        <div className="p-2 text-xs text-zinc-500 italic text-center">
                                            {t('headquarters.requests.grid.noReq')}
                                        </div>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                                {t('headquarters.errorDialog.amountLabel')}
                            </label>
                            <Input
                                type="number"
                                placeholder={t('headquarters.errorDialog.amountPlaceholder')}
                                value={correctionAmount}
                                onChange={(e) => setCorrectionAmount(e.target.value)}
                                className="bg-slate-50 border-slate-200 text-black focus:ring-red-500/50 h-10"
                            />
                            <p className="text-[9px] text-zinc-400 italic">
                                {t('headquarters.errorDialog.amountHelp')}
                            </p>
                        </div>

                        <div className="grid gap-2 md:col-span-2">
                            <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                                {t('headquarters.errorDialog.descLabel')}
                            </label>
                            <textarea
                                className="min-h-[100px] w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-black placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500/50"
                                placeholder={t('headquarters.errorDialog.descPlaceholder')}
                                value={correctionDescription}
                                onChange={(e) => setCorrectionDescription(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => setIsCorrectionDialogOpen(false)}
                            className="text-black border-slate-200 hover:bg-slate-50"
                        >
                            {t('headquarters.errorDialog.cancelBtn')}
                        </Button>
                        <Button
                            onClick={handleCreateCorrection}
                            disabled={isSubmitting}
                            className="bg-red-600 hover:bg-red-700 text-black"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {t('headquarters.errorDialog.submittingBtn')}
                                </>
                            ) : (
                                t('headquarters.errorDialog.submitBtn')
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* Request Details Dialog */}
            <Dialog open={isRequestDetailsDialogOpen} onOpenChange={setIsRequestDetailsDialogOpen}>
                <DialogContent className="bg-white border border-slate-200 text-black sm:max-w-2xl backdrop-blur-xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
                            <Eye className="h-5 w-5 text-emerald-500" />
                            {t('accounting.detailsModal.title')}
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 text-xs font-bold uppercase">
                            {t('accounting.detailsModal.description')} <span className="text-black font-mono">{selectedRequest?.id}</span>
                        </DialogDescription>
                    </DialogHeader>
                    {selectedRequest && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 py-4">
                            <div className="space-y-1">
                                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('accounting.detailsModal.requester')}</h4>
                                <p className="text-sm font-bold">{selectedRequest.requester?.fullName || "N/A"}</p>
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('accounting.detailsModal.type')}</h4>
                                <p className="text-sm font-bold uppercase">{selectedRequest.type}</p>
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('accounting.detailsModal.descTitle')}</h4>
                                <p className="text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs leading-relaxed font-medium">
                                    {selectedRequest.description || t('accounting.detailsModal.noDesc')}
                                </p>
                            </div>

                            {selectedRequest.type === RequestType.CORRECTION && (
                                <div className="md:col-span-2 space-y-4 p-4 rounded-xl border-2 border-dashed border-red-100 bg-red-50/30">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="p-1 rounded bg-red-100 text-red-600">
                                            <ShieldAlert className="h-3 w-3" />
                                        </div>
                                        <h4 className="text-[10px] font-black text-red-600 uppercase tracking-widest">
                                            {t('accounting.detailsModal.originalTransactionTitle')}
                                        </h4>
                                    </div>

                                    {!selectedRequest.referencedTransaction ? (
                                        <div className="text-[10px] font-bold text-slate-400 italic">
                                            Loading details for ID: {selectedRequest.referencedTransactionId || "N/A"}
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-8 gap-y-4">
                                            <div className="space-y-1">
                                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                                    {t('accounting.detailsModal.originalId')}
                                                </h4>
                                                <p className="text-[10px] font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded w-fit">
                                                    {selectedRequest.referencedTransaction.id.split('-')[0]}...
                                                </p>
                                            </div>
                                            <div className="space-y-1">
                                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                                    {t('headquarters.requests.grid.colHq')}
                                                </h4>
                                                <p className="text-xs font-bold text-slate-700">
                                                    {selectedRequest.referencedTransaction.headquarter?.name || "N/A"}
                                                </p>
                                            </div>
                                            <div className="space-y-1">
                                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                                    {t('accounting.detailsModal.originalDate')}
                                                </h4>
                                                <p className="text-xs font-bold text-slate-700">
                                                    {format(parseISO(selectedRequest.referencedTransaction.createdAt), 'MMM dd, yyyy HH:mm')}
                                                </p>
                                            </div>
                                            <div className="space-y-1">
                                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                                    {t('accounting.detailsModal.originalUser')}
                                                </h4>
                                                <p className="text-xs font-bold text-slate-700">
                                                    {selectedRequest.referencedTransaction.user?.fullName || "N/A"}
                                                </p>
                                            </div>
                                            <div className="space-y-1">
                                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                                    {t('accounting.detailsModal.originalAmount')}
                                                </h4>
                                                <p className="text-xs font-bold text-slate-700">
                                                    {Number(selectedRequest.referencedTransaction.amount).toLocaleString('en-US')}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="space-y-2">
                                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('accounting.detailsModal.status')}</h4>
                                <Badge className={cn(
                                    "border-none rounded-md text-[10px] font-bold uppercase tracking-tighter",
                                    selectedRequest.status === RequestStatus.PENDING ? "bg-orange-500/10 text-orange-500" :
                                        selectedRequest.status === RequestStatus.APPROVED ? "bg-emerald-500/10 text-emerald-500" :
                                            selectedRequest.status === RequestStatus.IN_ACCOUNTING ? "bg-purple-500/10 text-purple-500" :
                                                (selectedRequest.status === RequestStatus.AUDITED || selectedRequest.status === RequestStatus.AUTHORIZED) ? "bg-blue-500/10 text-blue-500" :
                                                    selectedRequest.status === RequestStatus.REJECTED ? "bg-red-500/10 text-red-500" :
                                                        selectedRequest.status === RequestStatus.IN_LITIGATION ? "bg-yellow-500/10 text-yellow-500" :
                                                            "bg-gray-500/10 text-gray-500"
                                )}>
                                    {selectedRequest.status}
                                </Badge>
                            </div>
                            <div className="space-y-2">
                                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('accounting.detailsModal.amount')}</h4>
                                <p className="text-xl font-black text-emerald-600">
                                    {selectedRequest.amount !== undefined && selectedRequest.amount !== null
                                        ? `${Number(selectedRequest.amount).toLocaleString('en-US')} USD`
                                        : '0 USD'}
                                </p>
                            </div>

                            <div className="space-y-1">
                                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-tight">{t('accounting.detailsModal.createdAt')}</p>
                                <p className="text-xs font-medium">{format(parseISO(selectedRequest.createdAt), 'MMM dd, yyyy HH:mm')}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">{t('headquarters.units.grid.colEnt')}</p>
                                <p className="text-xs font-medium">{selectedRequest.enterprise?.name || "N/A"}</p>
                            </div>

                            <div className="flex justify-end items-center gap-3 pt-4 md:col-span-2 border-t border-slate-200">
                                <Button variant="outline" onClick={() => setIsRequestDetailsDialogOpen(false)} className="bg-transparent border-slate-200 hover:bg-slate-50 px-8 font-bold text-xs uppercase text-black">
                                    {t('headquarters.requests.actions.closeBtn') || "Close"}
                                </Button>
                                {(selectedRequest.status === RequestStatus.PENDING || selectedRequest.status === RequestStatus.IN_ACCOUNTING) && selectedRequest.requesterId === currentUser?.id && (
                                    <Button
                                        variant="destructive"
                                        onClick={() => handleCancelRequest(selectedRequest.id)}
                                        className="bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 px-8 font-bold text-xs uppercase"
                                    >
                                        {t('headquarters.requests.actions.cancelBtn') || "Cancel Request"}
                                    </Button>
                                )}
                                {(selectedRequest.status === RequestStatus.AUDITED || selectedRequest.status === RequestStatus.AUTHORIZED) && (
                                    <Button
                                        onClick={() => {
                                            handleCompleteRequest(selectedRequest.id, "Final Transaction processed from HQ");
                                            setIsRequestDetailsDialogOpen(false);
                                        }}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 font-bold text-xs uppercase"
                                    >
                                        {t('headquarters.requests.actions.complete') || "Complete Request"}
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Confirmation Dialog for Cancellation */}
            <Dialog open={isConfirmCancelDialogOpen} onOpenChange={setIsConfirmCancelDialogOpen}>
                <DialogContent className="bg-white border border-slate-200 text-black sm:max-w-md backdrop-blur-xl">
                    <DialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-full bg-red-50 text-red-500">
                                <AlertCircle className="h-6 w-6" />
                            </div>
                            <DialogTitle className="text-xl font-black uppercase tracking-tighter">
                                {t('headquarters.requests.actions.cancelBtn')}
                            </DialogTitle>
                        </div>
                        <DialogDescription className="text-slate-600 font-bold text-sm">
                            {t('headquarters.requests.actions.cancelConfirm')}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-3 sm:gap-0 pt-6 border-t border-slate-100">
                        <Button
                            variant="outline"
                            onClick={() => setIsConfirmCancelDialogOpen(false)}
                            className="bg-transparent border-slate-200 hover:bg-slate-50 font-bold text-xs uppercase text-black px-6"
                        >
                            {t('headquarters.requests.actions.closeBtn')}
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmCancel}
                            disabled={isSubmitting}
                            className="bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase px-8 shadow-lg shadow-red-200"
                        >
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            {t('headquarters.requests.actions.cancelConfirmBtn') || "Confirm Cancellation"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Headquarters;
