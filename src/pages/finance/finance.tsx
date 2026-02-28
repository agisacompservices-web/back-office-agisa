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
import { Filter, X, CheckCircle2, XCircle, Eye, Wallet, Loader2 } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../../components/ui/table";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "../../components/ui/pagination"
import { getPaginationRange } from "../../lib/pagination-utils"
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

const Finance: React.FC = () => {
    const { t } = useTranslation();
    const [requests, setRequests] = useState<Request[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<RequestStatus | "all">("all");
    const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [reviewerNotes, setReviewerNotes] = useState("");
    const itemsPerPage = 10;

    const isFiltered = searchQuery !== "" || statusFilter !== "all";

    const fetchRequests = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await requestApi.getAll({
                status: statusFilter === "all" ? undefined : statusFilter,
                type: RequestType.WITHDRAWAL
            });

            // Filter for finance-related statuses if "all" is selected
            if (statusFilter === "all") {
                setRequests(data.data.filter(r =>
                    r.status === RequestStatus.IN_FINANCE ||
                    r.status === RequestStatus.COMPLETED ||
                    r.status === RequestStatus.AUDITED ||
                    r.status === RequestStatus.REJECTED ||
                    r.status === RequestStatus.APPROVED
                ));
            } else {
                setRequests(data.data);
            }
        } catch (error) {
            console.error("Failed to fetch finance requests:", error);
            toast.error(t('finance.toasts.loadFailed'));
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

        return matchesSearch;
    });

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentRequests = filteredData.slice(startIndex, endIndex);

    const handleAction = async (action: "approve" | "rejected", id: string) => {
        setIsActionLoading(true);
        try {
            if (action === "approve") {
                await requestApi.complete(id, { reviewerNotes });
                toast.success(t('finance.toasts.approved'));
            } else {
                await requestApi.reject(id, { reviewerNotes: reviewerNotes || "{t('finance.statusRejected')} by Finance Management" });
                toast.success(t('finance.toasts.rejected'));
            }
            setReviewerNotes("");
            fetchRequests();
            setIsDialogOpen(false);
        } catch (error) {
            console.error(`Failed to ${action} request:`, error);
            toast.error(action === 'approve' ? t('finance.toasts.approveFailed') : t('finance.toasts.rejectFailed'));
        } finally {
            setIsActionLoading(false);
        }
    }

    const getStatusBadge = (status: RequestStatus) => {
        switch (status) {
            case RequestStatus.COMPLETED:
                return <Badge className="bg-emerald-500/15 rounded-md text-emerald-500 hover:bg-emerald-500/25 border-emerald-500/20">{t('finance.statusCompleted')}</Badge>
            case RequestStatus.REJECTED:
                return <Badge variant="destructive" className="bg-red-500/15 rounded-md text-red-500 hover:bg-red-500/25 border-red-500/20">{t('finance.statusRejected')}</Badge>
            case RequestStatus.IN_FINANCE:
                return <Badge className="bg-blue-500/15 rounded-md text-blue-500 hover:bg-blue-500/25 border-blue-500/20 animate-pulse">{t('finance.statusInFinance')}</Badge>
            case RequestStatus.AUDITED:
                return <Badge className="bg-purple-500/15 rounded-md text-purple-500 hover:bg-purple-500/25 border-purple-500/20">{t('finance.statusAudited')}</Badge>
            case RequestStatus.APPROVED:
                return <Badge className="bg-emerald-500/15 rounded-md text-emerald-500 hover:bg-emerald-500/25 border-emerald-500/20">{t('finance.statusApproved', 'Approved')}</Badge>
            default:
                return <Badge className="bg-yellow-500/15 text-yellow-500 hover:bg-yellow-500/25 border-yellow-500/20">{status}</Badge>
        }
    }

    const getRequestTypeBadge = (type: RequestType) => {
        switch (type) {
            case RequestType.DEPOSIT:
                return <Badge className="bg-emerald-500/15 rounded-md text-emerald-500 hover:bg-emerald-500/25 border-emerald-500/20">{t('finance.typeDeposit')}</Badge>
            case RequestType.WITHDRAWAL:
                return <Badge variant="destructive" className="bg-red-500/15 rounded-md text-red-500 hover:bg-red-500/25 border-red-500/20">{t('finance.typeWithdrawal')}</Badge>
            case RequestType.CORRECTION:
                return <Badge className="bg-orange-500/15 rounded-md text-orange-500 hover:bg-orange-500/25 border-orange-500/20">{t('finance.typeCorrection')}</Badge>
            default:
                return <Badge className="bg-yellow-500/15 rounded-md text-yellow-500 hover:bg-yellow-500/25 border-yellow-500/20">{type}</Badge>
        }
    }

    return (
        <div className="flex-1 space-y-4 pt-6">
            <Card className="bg-slate-50 border-slate-200 text-black backdrop-blur-sm">
                <CardHeader>
                    <CardTitle>{t('finance.title')}</CardTitle>
                    <CardDescription className="text-slate-600">
                        {t('finance.description')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center py-4 justify-between gap-4">
                        <Input
                            placeholder={t('finance.search')}
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
                                        {t('finance.status')}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-white border-slate-200 text-black backdrop-blur-xl">
                                    <DropdownMenuLabel>{t('finance.filterStatus')}</DropdownMenuLabel>
                                    <DropdownMenuSeparator className="bg-slate-100" />
                                    <DropdownMenuCheckboxItem
                                        checked={statusFilter === "all"}
                                        onCheckedChange={() => setStatusFilter("all")}
                                        className="focus:bg-slate-100 focus:text-black"
                                    >
                                        {t('finance.allStatuses')}
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={statusFilter === RequestStatus.IN_FINANCE}
                                        onCheckedChange={() => setStatusFilter(RequestStatus.IN_FINANCE)}
                                        className="focus:bg-slate-100 focus:text-black"
                                    >
                                        {t('finance.statusInFinance')}
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={statusFilter === RequestStatus.AUDITED}
                                        onCheckedChange={() => setStatusFilter(RequestStatus.AUDITED)}
                                        className="focus:bg-slate-100 focus:text-black"
                                    >
                                        Audited
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={statusFilter === RequestStatus.COMPLETED}
                                        onCheckedChange={() => setStatusFilter(RequestStatus.COMPLETED)}
                                        className="focus:bg-slate-100 focus:text-black"
                                    >
                                        Completed
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={statusFilter === RequestStatus.REJECTED}
                                        onCheckedChange={() => setStatusFilter(RequestStatus.REJECTED)}
                                        className="focus:bg-slate-100 focus:text-black"
                                    >
                                        Rejected
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={statusFilter === RequestStatus.APPROVED}
                                        onCheckedChange={() => setStatusFilter(RequestStatus.APPROVED)}
                                        className="focus:bg-slate-100 focus:text-black"
                                    >
                                        Approved
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
                                    <TableHead className="text-slate-600 font-semibold">{t('finance.table.id')}</TableHead>
                                    <TableHead className="text-slate-600 font-semibold">{t('finance.table.status')}</TableHead>
                                    <TableHead className="text-slate-600 font-semibold">{t('finance.table.type')}</TableHead>
                                    <TableHead className="text-slate-600 font-semibold">{t('finance.table.target')}</TableHead>
                                    <TableHead className="text-slate-600 font-semibold">{t('finance.table.agent')}</TableHead>
                                    <TableHead className="text-slate-600 font-semibold text-right">{t('finance.table.amount')}</TableHead>
                                    <TableHead className="text-slate-600 font-semibold text-right">{t('finance.table.actions')}</TableHead>
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
                                            <TableCell>{getStatusBadge(req.status)}</TableCell>
                                            <TableCell className="text-xs text-slate-600 font-medium">
                                                {getRequestTypeBadge(req.type)}
                                            </TableCell>
                                            <TableCell className="text-xs">
                                                <div className="flex flex-col">
                                                    <span className="font-bold">{req.enterprise?.name || 'N/A'}</span>
                                                    <span className="text-[10px] text-slate-500">{req.headquarter?.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-xs font-medium">{req.requester?.fullName || 'N/A'}</TableCell>
                                            <TableCell className="text-right font-medium text-emerald-400 text-xs">
                                                ${Number(req.amount || 0).toLocaleString('en-US')}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-slate-600 hover:text-black hover:bg-slate-100"
                                                        onClick={() => {
                                                            setSelectedRequest(req);
                                                            setReviewerNotes("");
                                                            setIsDialogOpen(true);
                                                        }}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                        <span className="sr-only">{t('finance.table.details')}</span>
                                                    </Button>
                                                    {(req.status === RequestStatus.IN_FINANCE || req.status === RequestStatus.AUDITED) && (
                                                        <>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10"
                                                                onClick={() => handleAction("approve", req.id)}
                                                                disabled={isActionLoading}
                                                            >
                                                                <CheckCircle2 className="h-4 w-4" />
                                                                <span className="sr-only">{t('finance.table.approve')}</span>
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                                                                onClick={() => handleAction("rejected", req.id)}
                                                                disabled={isActionLoading}
                                                            >
                                                                <XCircle className="h-4 w-4" />
                                                                <span className="sr-only">{t('finance.table.reject')}</span>
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center text-slate-500">
                                            {t('finance.table.noRequests')}
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
                                                className={currentPage === pageNumber ? "bg-blue-600 text-black hover:bg-blue-700 border-none font-black" : "text-zinc-500 hover:text-black hover:bg-slate-100 font-bold"}
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
                            <Wallet className="h-5 w-5 text-blue-500" />
                            {t('finance.detailsModal.title')}
                        </DialogTitle>
                        <DialogDescription className="text-slate-500">
                            {t('finance.detailsModal.description')} <span className="text-black font-mono text-xs">{selectedRequest?.id}</span>
                        </DialogDescription>
                    </DialogHeader>
                    {selectedRequest && (
                        <div className="space-y-6 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                                <div className="space-y-4 md:col-span-2">
                                    <div className="space-y-2">
                                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('finance.detailsModal.descTitle')}</h4>
                                        <p className="text-slate-700 bg-slate-50 p-3 rounded-md border border-slate-200 leading-relaxed text-sm min-h-[80px]">
                                            {selectedRequest.description || t('finance.detailsModal.noDesc')}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{t('finance.detailsModal.enterprise')}</p>
                                            <p className="text-sm font-medium">{selectedRequest.enterprise?.name || "N/A"}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{t('finance.detailsModal.hq')}</p>
                                            <p className="text-sm font-medium">{selectedRequest.headquarter?.name || "N/A"}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{t('finance.detailsModal.agent')}</p>
                                            <p className="text-sm font-medium text-blue-600">{selectedRequest.requester?.fullName || "N/A"}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{t('finance.detailsModal.date')}</p>
                                            <p className="text-xs text-slate-600">{new Date(selectedRequest.createdAt).toLocaleString('en-US')}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                    <div className="space-y-1 text-center md:text-left">
                                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('finance.detailsModal.amount')}</h4>
                                        <p className="text-3xl font-black text-emerald-600 font-mono">${Number(selectedRequest.amount || 0).toLocaleString('en-US')}</p>
                                    </div>
                                    <div className="space-y-2 text-center md:text-left">
                                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('finance.detailsModal.currentStatus')}</h4>
                                        <div>{getStatusBadge(selectedRequest.status)}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2 pt-4 border-t border-slate-200">
                                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('finance.detailsModal.notes')}</h4>
                                <textarea
                                    className="w-full h-24 bg-slate-50 border border-slate-200 rounded-md p-3 text-sm text-black placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-300 resize-none"
                                    placeholder={t('finance.detailsModal.notesPlaceholder')}
                                    value={reviewerNotes}
                                    onChange={(e) => setReviewerNotes(e.target.value)}
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="bg-transparent border-slate-200 hover:bg-slate-50" disabled={isActionLoading}>
                                    Close
                                </Button>
                                {(selectedRequest.status === RequestStatus.IN_FINANCE || selectedRequest.status === RequestStatus.AUDITED) && (
                                    <>
                                        <Button
                                            variant="destructive"
                                            className="bg-red-600 hover:bg-red-700"
                                            disabled={isActionLoading}
                                            onClick={() => handleAction("rejected", selectedRequest.id)}
                                        >
                                            {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Reject Delivery
                                        </Button>
                                        <Button
                                            className="bg-emerald-600 hover:bg-emerald-700"
                                            disabled={isActionLoading}
                                            onClick={() => handleAction("approve", selectedRequest.id)}
                                        >
                                            {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Approve & Complete
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default Finance;
