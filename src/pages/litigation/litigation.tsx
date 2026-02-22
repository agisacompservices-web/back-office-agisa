import { useEffect, useCallback, useState } from "react";
import requestApi, { Request, RequestStatus, RequestType } from "../../context/api/request";
import { Badge } from "../../components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "../../components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { Filter, X, CheckCircle2, XCircle, Eye, ShieldAlert, Loader2, ExternalLink, FileCheck, FileText, UserCheck } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../../components/ui/table";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card";
/*
## [Litigation Module Implementation]
- **Live Data Integration**: Connected the Litigation page to the backend `requestApi`, replacing mock data with real-time requests.
- **Status Filtering**: Added dynamic filtering for all litigation-related statuses ({t('litigation.statusInLitigation')}, {t('litigation.statusInFinance')}, {t('litigation.statusAudited')}, {t('litigation.statusCompleted')}, {t('litigation.statusRejected')}).
- **Operational Actions**:
    - Implemented **"Send to Finance"** to move requests along the administrative pipeline.
    - Implemented **"Reject Case"** with reviewer notes.
- **Enhanced Details Dialog**: Refactored the details view to display full request metadata, including the requester, enterprise, creation date, and amounts.
*/
// render_diffs(file:///home/f35raptor/Documents/kolabo/Ag/agisa/src/pages/litigation/litigation.tsx)
// render_diffs(file:///home/f35raptor/Documents/kolabo/Ag/agisa/src/context/api/request.ts)
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "../../components/ui/pagination"
import { getPaginationRange } from "../../lib/pagination-utils"
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

const Litigation: React.FC = () => {
    const { t } = useTranslation();
    const [requests, setRequests] = useState<Request[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<RequestStatus | "all">("all");
    const [selectedCase, setSelectedCase] = useState<Request | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [reviewerNotes, setReviewerNotes] = useState("");
    const itemsPerPage = 10;

    const isFiltered = searchQuery !== "" || statusFilter !== "all";

    const fetchRequests = useCallback(async () => {
        setIsLoading(true);
        try {
            // Fetch all litigation related statuses
            const data = await requestApi.getAll({
                status: statusFilter === "all" ? undefined : statusFilter,
                wasInLitigation: true
            });

            // If filter is "all", we want to show anything that's in a litigation-adjacent state
            // but the backend might return everything if no status is provided.
            // Let's filter client side for safety if statusFilter is all
            if (statusFilter === "all") {
                setRequests(data.data.filter(r =>
                    r.status === RequestStatus.IN_LITIGATION ||
                    r.status === RequestStatus.IN_FINANCE ||
                    r.status === RequestStatus.AUDITED ||
                    r.status === RequestStatus.AUTHORIZED ||
                    r.status === RequestStatus.REJECTED ||
                    r.status === RequestStatus.COMPLETED
                ));
            } else {
                setRequests(data.data);
            }
        } catch (error) {
            console.error("Failed to fetch litigation requests:", error);
            toast.error(t('litigation.toasts.loadFailed'));
        } finally {
            setIsLoading(false);
        }
    }, [statusFilter, t]);

    useEffect(() => {
        fetchRequests();
        const interval = setInterval(fetchRequests, 60000);
        return () => clearInterval(interval);
    }, [fetchRequests]);

    const filteredData = requests.filter((item) => {
        const matchesSearch =
            item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.enterprise?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.requester?.fullName.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === "all" || item.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const isRegistrationRequest = (req: Request) => {
        const desc = req.description?.toLowerCase() || "";
        return desc.includes("initial balance deposit") ||
            desc.includes("registration") ||
            desc.includes("become") ||
            req.type === RequestType.ACTIVATION;
    };

    const currentRequests = filteredData.slice(startIndex, endIndex);

    const handleAction = async (action: "finance" | "audit" | "rejected", id: string) => {
        setIsActionLoading(true);
        try {
            if (action === "finance") {
                await requestApi.finance(id, { reviewerNotes });
                toast.success(t('litigation.toasts.transferred'));
            } else if (action === "audit") {
                await requestApi.audit(id, { reviewerNotes: reviewerNotes || "Approved & Identity Verified by Litigation Management" });
                toast.success(t('litigation.toasts.audited') || "Audited & Verified");
            } else {
                await requestApi.reject(id, { reviewerNotes: reviewerNotes || "Rejected by Litigation Management" });
                toast.success(t('litigation.toasts.rejected'));
            }
            setReviewerNotes("");
            fetchRequests();
            setIsDialogOpen(false);
        } catch (error) {
            console.error(`Failed to ${action} request:`, error);
            toast.error(action === 'finance' ? t('litigation.toasts.financeFailed') : action === 'audit' ? t('litigation.toasts.auditFailed') : t('litigation.toasts.rejectFailed'));
        } finally {
            setIsActionLoading(false);
        }
    }

    const getStatusBadge = (status: RequestStatus) => {
        switch (status) {
            case RequestStatus.COMPLETED:
                return <Badge className="bg-emerald-500/15 rounded-md text-emerald-500 hover:bg-emerald-500/25 border-emerald-500/20">{t('litigation.statusCompleted')}</Badge>
            case RequestStatus.REJECTED:
                return <Badge variant="destructive" className="bg-red-500/15 rounded-md text-red-500 hover:bg-red-500/25 border-red-500/20">{t('litigation.statusRejected')}</Badge>
            case RequestStatus.IN_LITIGATION:
                return <Badge className="bg-red-500/15 rounded-md text-red-500 hover:bg-red-500/25 border-red-500/20 animate-pulse">{t('litigation.statusInLitigation')}</Badge>
            case RequestStatus.IN_FINANCE:
                return <Badge className="bg-blue-500/15 rounded-md text-blue-500 hover:bg-blue-500/25 border-blue-500/20">{t('litigation.statusInFinance')}</Badge>
            case RequestStatus.AUDITED:
                return <Badge className="bg-purple-500/15 rounded-md text-purple-500 hover:bg-purple-500/25 border-purple-500/20">{t('litigation.statusAudited')}</Badge>
            case RequestStatus.AUTHORIZED:
                return <Badge className="bg-emerald-500/15 rounded-md text-emerald-500 hover:bg-emerald-500/25 border-emerald-500/20">{t('litigation.statusAuthorized')}</Badge>
            default:
                return <Badge className="bg-yellow-500/15 rounded-md text-yellow-500 hover:bg-yellow-500/25 border-yellow-500/20">{status}</Badge>
        }
    }

    const getTypeBadge = (type: RequestType) => {
        let label = type as string;
        let colorClass = "bg-yellow-500/15 text-yellow-500 hover:bg-yellow-500/25 border-yellow-500/20";

        switch (type) {
            case RequestType.DEPOSIT:
                label = t('litigation.typeDeposit');
                colorClass = "bg-emerald-500/15 rounded-md text-emerald-500 hover:bg-emerald-500/25 border-emerald-500/20";
                break;
            case RequestType.WITHDRAWAL:
                label = t('litigation.typeWithdrawal');
                colorClass = "bg-red-500/15 rounded-md text-red-500 hover:bg-red-500/25 border-red-500/20";
                break;
            case RequestType.ACTIVATION:
                label = t('litigation.typeActivation');
                colorClass = "bg-blue-500/15 rounded-md text-blue-500 hover:bg-blue-500/25 border-blue-500/20";
                break;
            case RequestType.DEACTIVATION:
                label = t('litigation.typeDeactivation');
                colorClass = "bg-slate-500/15 rounded-md text-slate-500 hover:bg-slate-500/25 border-slate-500/20";
                break;
            case RequestType.CORRECTION:
                label = t('litigation.typeCorrection');
                colorClass = "bg-orange-500/15 rounded-md text-orange-500 hover:bg-orange-500/25 border-orange-500/20";
                break;
        }

        return <Badge className={`${colorClass} whitespace-nowrap`}>{label}</Badge>
    }

    return (
        <div className="flex-1 space-y-4 pt-6">
            <Card className="bg-slate-50 border-slate-200 text-black backdrop-blur-sm">
                <CardHeader>
                    <CardTitle>{t('litigation.title')}</CardTitle>
                    <CardDescription className="text-slate-600">
                        {t('litigation.description')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center py-4 justify-between gap-4">
                        <Input
                            placeholder={t('litigation.search')}
                            value={searchQuery}
                            onChange={(event) => {
                                setSearchQuery(event.target.value);
                                setCurrentPage(1);
                            }}
                            className="max-w-sm bg-black/20 border-slate-200 text-black placeholder:text-slate-600 focus-visible:ring-white/20"
                        />
                        <div className="flex gap-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="bg-black/20 border-slate-200 text-black hover:bg-slate-100 hover:text-black">
                                        <Filter className="mr-2 h-4 w-4" />
                                        {t('litigation.status')}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-white border-slate-200 text-black backdrop-blur-xl">
                                    <DropdownMenuLabel>{t('litigation.filterStatus')}</DropdownMenuLabel>
                                    <DropdownMenuSeparator className="bg-slate-100" />
                                    <DropdownMenuCheckboxItem
                                        checked={statusFilter === "all"}
                                        onCheckedChange={() => setStatusFilter("all")}
                                        className="focus:bg-slate-100 focus:text-black"
                                    >
                                        {t('litigation.allStatuses')}
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={statusFilter === RequestStatus.IN_LITIGATION}
                                        onCheckedChange={() => setStatusFilter(RequestStatus.IN_LITIGATION)}
                                        className="focus:bg-slate-100 focus:text-black"
                                    >
                                        {t('litigation.statusInLitigation')}
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={statusFilter === RequestStatus.IN_FINANCE}
                                        onCheckedChange={() => setStatusFilter(RequestStatus.IN_FINANCE)}
                                        className="focus:bg-slate-100 focus:text-black"
                                    >
                                        {t('litigation.statusInFinance')}
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={statusFilter === RequestStatus.AUDITED}
                                        onCheckedChange={() => setStatusFilter(RequestStatus.AUDITED)}
                                        className="focus:bg-slate-100 focus:text-black"
                                    >
                                        {t('litigation.statusAudited')}
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={statusFilter === RequestStatus.AUTHORIZED}
                                        onCheckedChange={() => setStatusFilter(RequestStatus.AUTHORIZED)}
                                        className="focus:bg-slate-100 focus:text-black"
                                    >
                                        {t('litigation.statusAuthorized')}
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={statusFilter === RequestStatus.COMPLETED}
                                        onCheckedChange={() => setStatusFilter(RequestStatus.COMPLETED)}
                                        className="focus:bg-slate-100 focus:text-black"
                                    >
                                        {t('litigation.statusCompleted')}
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={statusFilter === RequestStatus.REJECTED}
                                        onCheckedChange={() => setStatusFilter(RequestStatus.REJECTED)}
                                        className="focus:bg-slate-100 focus:text-black"
                                    >
                                        Rejected
                                    </DropdownMenuCheckboxItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {isFiltered && (
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setSearchQuery("");
                                        setStatusFilter("all");
                                        setCurrentPage(1);
                                    }}
                                    className="h-9 px-2 lg:px-3 text-slate-600 hover:text-black hover:bg-slate-100"
                                >
                                    Reset
                                    <X className="ml-2 h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="rounded-md border border-slate-200">
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow className="border-slate-200 hover:bg-transparent">
                                    <TableHead className="text-slate-600 font-semibold">{t('litigation.table.id')}</TableHead>
                                    <TableHead className="text-slate-600 font-semibold">{t('litigation.table.type')}</TableHead>
                                    <TableHead className="text-slate-600 font-semibold">{t('litigation.table.status')}</TableHead>
                                    <TableHead className="text-slate-600 font-semibold">{t('litigation.table.requester')}</TableHead>
                                    <TableHead className="text-slate-600 font-semibold text-right">{t('litigation.table.amount')}</TableHead>
                                    <TableHead className="text-slate-600 font-semibold text-right">{t('litigation.table.actions')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-500" />
                                        </TableCell>
                                    </TableRow>
                                ) : currentRequests.length > 0 ? (
                                    currentRequests.map((req) => (
                                        <TableRow key={req.id} className="border-slate-200 hover:bg-slate-50 transition-colors">
                                            <TableCell className="font-mono text-[10px] text-slate-500">{req.id.split('-')[0]}...</TableCell>
                                            <TableCell className="font-medium text-xs">
                                                <div className="flex items-center gap-2">
                                                    {getTypeBadge(req.type)}
                                                    {req.receiptUrl && isRegistrationRequest(req) && (
                                                        <a href={req.receiptUrl} target="_blank" rel="noreferrer" className="text-emerald-500 hover:text-emerald-400" title="View Proof of Payment">
                                                            <FileText className="h-3.5 w-3.5" />
                                                        </a>
                                                    )}
                                                    {req.identityDocUrl && isRegistrationRequest(req) && (
                                                        <a href={req.identityDocUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-400" title="View Identity Document">
                                                            <UserCheck className="h-3.5 w-3.5" />
                                                        </a>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>{getStatusBadge(req.status)}</TableCell>
                                            <TableCell className="text-xs">
                                                <div className="flex flex-col">
                                                    <span className="font-bold">{req.requester?.fullName || 'N/A'}</span>
                                                    <span className="text-[10px] text-slate-500">{req.headquarter?.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-medium text-emerald-400 text-xs">
                                                ${Number(req.amount || 0).toLocaleString('en-US')}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-slate-600 hover:text-black hover:bg-slate-100"
                                                        onClick={async () => {
                                                            try {
                                                                const fullCase = await requestApi.getById(req.id);
                                                                setSelectedCase(fullCase);
                                                                setReviewerNotes("");
                                                            } catch (e) {
                                                                console.error("Failed to fetch full case details:", e);
                                                                setSelectedCase(req);
                                                                setReviewerNotes("");
                                                            }
                                                            setIsDialogOpen(true);
                                                        }}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                        <span className="sr-only">{t('litigation.table.details')}</span>
                                                    </Button>
                                                    {req.status === RequestStatus.IN_LITIGATION && (
                                                        <>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-blue-500 hover:text-blue-400 hover:bg-blue-500/10"
                                                                onClick={() => handleAction((req.type === RequestType.ACTIVATION || isRegistrationRequest(req)) ? "audit" : "finance", req.id)}
                                                                disabled={isActionLoading}
                                                                title={(req.type === RequestType.ACTIVATION || isRegistrationRequest(req)) ? "Verify & Authorize" : t('litigation.table.toFinance')}
                                                            >
                                                                <CheckCircle2 className="h-4 w-4" />
                                                                <span className="sr-only">{(req.type === RequestType.ACTIVATION || isRegistrationRequest(req)) ? "Verify & Authorize" : t('litigation.table.toFinance')}</span>
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                                                                onClick={() => handleAction("rejected", req.id)}
                                                                disabled={isActionLoading}
                                                                title={t('litigation.table.reject')}
                                                            >
                                                                <XCircle className="h-4 w-4" />
                                                                <span className="sr-only">{t('litigation.table.reject')}</span>
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                                            {t('litigation.table.noRequests')}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
                {totalPages > 1 && (
                    <CardFooter className="border-t border-slate-200 py-4">
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            if (currentPage > 1) setCurrentPage(currentPage - 1);
                                        }}
                                        className={currentPage === 1 ? "pointer-events-none opacity-50 text-slate-500" : "text-black hover:bg-slate-100"}
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
                                        className={currentPage === totalPages ? "pointer-events-none opacity-50 text-slate-500" : "text-black hover:bg-slate-100"}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </CardFooter>
                )}
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="bg-white border border-slate-200 text-black sm:max-w-[800px] max-h-[95vh] overflow-y-auto backdrop-blur-xl scrollbar-thin scrollbar-thumb-slate-200">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <ShieldAlert className="h-5 w-5 text-red-500" />
                            {t('litigation.detailsModal.title')}
                        </DialogTitle>
                        <DialogDescription className="text-slate-500">
                            {t('litigation.detailsModal.description')} <span className="text-black font-mono text-xs">{selectedCase?.id}</span>
                        </DialogDescription>
                    </DialogHeader>
                    {selectedCase && (
                        <div className="space-y-6 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                                <div className="space-y-1 flex flex-col">
                                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('litigation.detailsModal.descTitle')}</h4>
                                    <div className="text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200 leading-relaxed text-sm flex-grow min-h-[100px]">
                                        {selectedCase.description || t('litigation.detailsModal.noDesc')}
                                    </div>
                                </div>
                                <div className="space-y-1 flex flex-col">
                                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('litigation.detailsModal.detailsLabel')}</h4>
                                    <div className="bg-slate-50 gap-1 p-2 rounded-xl border border-slate-200 grid grid-cols-3">
                                        <div className="space-y-1">
                                            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('litigation.detailsModal.amount')}</h4>
                                            <p className="text-sm font-black text-emerald-600 font-mono tracking-tighter">{Number(selectedCase.amount || 0).toLocaleString('en-US')}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('litigation.detailsModal.currentStatus')}</h4>
                                            <div>{getStatusBadge(selectedCase.status)}</div>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{t('litigation.detailsModal.enterprise')}</p>
                                            <p className="text-sm font-medium whitespace-nowrap">{selectedCase.enterprise?.name || "N/A"}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{t('litigation.detailsModal.hq')}</p>
                                            <p className="text-sm font-medium">{selectedCase.headquarter?.name || "N/A"}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{t('litigation.detailsModal.type')}</p>
                                            {getTypeBadge(selectedCase.type)}
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest whitespace-nowrap">{t('litigation.detailsModal.date')}</p>
                                            <p className="text-xs text-slate-600">{new Date(selectedCase.createdAt).toLocaleString('en-US')}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {isRegistrationRequest(selectedCase) && (
                                <div className="grid grid-cols-2 md:grid-cols-2 gap-y-4 gap-x-2">
                                    <div className="space-y-1 flex flex-col">
                                        <div className="p-2 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-3">
                                            <h4 className="text-[10px] font-black text-emerald-700 uppercase tracking-widest flex items-center gap-2">
                                                <UserCheck className="h-3 w-3" />
                                                {t('litigation.detailsModal.profileToVerify')}
                                            </h4>
                                            <div className="grid grid-cols-4 gap-2">
                                                <div className="space-y-0.5">
                                                    <p className="text-[9px] text-emerald-600/70 font-bold uppercase">{t('litigation.detailsModal.fullName')}</p>
                                                    <p className="text-sm font-black text-emerald-900 whitespace-nowrap overflow-hidden text-ellipsis">{selectedCase.requester?.fullName || "N/A"}</p>
                                                </div>
                                                <div className="space-y-0.5">
                                                    <p className="text-[9px] text-emerald-600/70 font-bold uppercase">{t('litigation.detailsModal.pointName')}</p>
                                                    <p className="text-sm font-black text-emerald-900 whitespace-nowrap overflow-hidden text-ellipsis">
                                                        {selectedCase.seller?.name || selectedCase.headquarter?.name || "N/A"}
                                                    </p>
                                                </div>
                                                <div className="space-y-0.5">
                                                    <p className="text-[9px] text-emerald-600/70 font-bold uppercase whitespace-nowrap">{t('litigation.detailsModal.userCode')}</p>
                                                    <p className="text-sm font-mono font-bold text-emerald-900 whitespace-nowrap">{selectedCase.requester?.userCode || "N/A"}</p>
                                                </div>
                                                <div className="space-y-0.5">
                                                    <p className="text-[9px] text-emerald-600/70 font-bold uppercase">{t('litigation.detailsModal.category')}</p>
                                                    <p className="text-sm font-mono font-bold text-emerald-900 pl-2">{selectedCase.sellerId ? t('litigation.detailsModal.seller') : t('litigation.detailsModal.headquarter')}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-1 flex flex-col">
                                        <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl space-y-3">
                                            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                                <FileCheck className="h-3 w-3" />
                                                {t('litigation.detailsModal.verificationDocs')}
                                            </h4>
                                            <div className="grid grid-cols-2 gap-2">
                                                {selectedCase.receiptUrl ? (
                                                    <a
                                                        href={selectedCase.receiptUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-md text-xs font-medium hover:bg-slate-100 transition-colors"
                                                    >
                                                        <ExternalLink className="h-3 w-3 text-blue-500" />
                                                        {t('litigation.detailsModal.proofOfPayment')}
                                                    </a>
                                                ) : (
                                                    <span className="text-[10px] text-slate-400 italic bg-white p-2 border border-dashed rounded-md">{t('litigation.detailsModal.noProof')}</span>
                                                )}
                                                {selectedCase.identityDocUrl ? (
                                                    <a
                                                        href={selectedCase.identityDocUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-md text-xs font-medium hover:bg-slate-100 transition-colors whitespace-nowrap"
                                                    >
                                                        <ExternalLink className="h-3 w-3 text-emerald-500" />
                                                        {t('litigation.detailsModal.identityDoc')}
                                                    </a>
                                                ) : (
                                                    <span className="text-[10px] text-slate-400 italic bg-white p-2 border border-dashed rounded-md">{t('litigation.detailsModal.noIdentityDoc')}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('litigation.detailsModal.notes')}</h4>
                                <textarea
                                    className="w-full h-24 bg-slate-50 border border-slate-200 rounded-md p-3 text-sm text-black placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-300 resize-none"
                                    placeholder={t('litigation.detailsModal.notesPlaceholder')}
                                    value={reviewerNotes}
                                    onChange={(e) => setReviewerNotes(e.target.value)}
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="bg-transparent border-slate-200 hover:bg-slate-50" disabled={isActionLoading}>
                                    {t('litigation.detailsModal.close')}
                                </Button>
                                {selectedCase.status === RequestStatus.IN_LITIGATION && (
                                    <>
                                        <Button
                                            variant="destructive"
                                            className="bg-red-600 hover:bg-red-700"
                                            disabled={isActionLoading}
                                            onClick={() => handleAction("rejected", selectedCase.id)}
                                        >
                                            {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            {t('litigation.detailsModal.btnReject')}
                                        </Button>
                                        <Button
                                            className="bg-blue-600 hover:bg-blue-700"
                                            disabled={isActionLoading}
                                            onClick={() => handleAction((selectedCase.type === RequestType.ACTIVATION || isRegistrationRequest(selectedCase)) ? "audit" : "finance", selectedCase.id)}
                                        >
                                            {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            {(selectedCase.type === RequestType.ACTIVATION || isRegistrationRequest(selectedCase)) ? t('litigation.detailsModal.btnVerifyAuthorize') : t('litigation.detailsModal.btnFinance')}
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div >
    );
}

export default Litigation;