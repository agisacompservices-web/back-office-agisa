import React, { useState, useEffect, useCallback } from "react";
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
import { Filter, X, Send, Eye, Calculator, FileText, CheckCircle } from "lucide-react";
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
import requestApi, { Request, RequestStatus, RequestType } from "../../context/api/request";
import enterpriseApi, { Enterprise } from "../../context/api/enterprise";
import { format, parseISO } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";

const Accounting: React.FC = () => {
    const { t } = useTranslation();
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<RequestStatus | "all">('all');
    const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [requests, setRequests] = useState<Request[]>([]);
    const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
    const [selectedEnterpriseId, setSelectedEnterpriseId] = useState<string>("all");
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const itemsPerPage = 10;

    const fetchRequests = useCallback(async () => {
        setIsLoading(true);
        try {
            // Fetch everything permitted (inbox + history)
            // Fetch everything permitted (inbox + history)
            const res = await requestApi.getAll({
                enterpriseId: selectedEnterpriseId === "all" ? undefined : selectedEnterpriseId
            });

            // We filter for DEPOSIT and WITHDRAWAL only as requested.
            const financialRequests = (res.data || []).filter(r =>
                r.type === RequestType.DEPOSIT || r.type === RequestType.WITHDRAWAL || r.type === RequestType.CORRECTION
            );

            setRequests(financialRequests);
        } catch (error) {
            console.error("Failed to fetch accounting requests:", error);
            toast.error(t('accounting.toasts.loadFailed'));
        } finally {
            setIsLoading(false);
        }
    }, [selectedEnterpriseId, t]);

    const fetchEnterprises = useCallback(async () => {
        try {
            const res = await enterpriseApi.getAll({});
            setEnterprises(res.data || []);
        } catch (error) {
            console.error("Failed to fetch enterprises:", error);
        }
    }, []);

    useEffect(() => {
        fetchEnterprises();
    }, [fetchEnterprises]);

    useEffect(() => {
        fetchRequests();

        // Set up polling interval (e.g., every 15 seconds)
        const interval = setInterval(() => {
            fetchRequests();
        }, 60000);

        return () => clearInterval(interval);
    }, [fetchRequests]);

    const isFiltered = searchQuery !== "" || statusFilter !== "all";

    const filteredData = requests.filter((item) => {
        const matchesSearch =
            item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.requester?.fullName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.headquarter?.name || "").toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === "all" || item.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentRequests = filteredData.slice(startIndex, endIndex);

    const isRegistrationRequest = (req: Request) => {
        const desc = req.description?.toLowerCase() || "";
        return desc.includes("initial balance deposit") || desc.includes("registration") || desc.includes("become");
    };

    const handleAction = async (action: "Approve" | "Audit" | "Send to Litigation" | "Reject", requestId: string) => {
        setActionLoading(requestId);
        try {
            if (action === "Approve") {
                await requestApi.approve(requestId, { reviewerNotes: "Approved directly from Accounting" });
                toast.success(t('accounting.toasts.approved'));
            } else if (action === "Audit") {
                await requestApi.audit(requestId, { reviewerNotes: "Authorized & Verified in Accounting" });
                toast.success(t('accounting.toasts.authorized') || "Authorized successfully");
            } else if (action === "Send to Litigation") {
                await requestApi.litigate(requestId, { reviewerNotes: "Sent to Litigation from Accounting" });
                toast.success(t('accounting.toasts.litigated'));
            } else if (action === "Reject") {
                await requestApi.reject(requestId, { reviewerNotes: "Rejected from Accounting" });
                toast.success(t('accounting.toasts.rejected'));
            }
            fetchRequests();
        } catch (error: any) {
            console.error(`Failed to ${action}:`, error);
            toast.error(t('accounting.toasts.actionFailed'), { description: error.response?.data?.message });
        } finally {
            setActionLoading(null);
        }
    };

    const getStatusBadge = (status: RequestStatus) => {
        switch (status) {
            case RequestStatus.COMPLETED:
                return <Badge className="whitespace-nowrap rounded-md bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25 border-emerald-500/20">{t('accounting.statusNames.completed')}</Badge>
            case RequestStatus.REJECTED:
                return <Badge variant="destructive" className="whitespace-nowrap rounded-md bg-red-500/15 text-red-500 hover:bg-red-500/25 border-red-500/20">{t('accounting.statusNames.rejected')}</Badge>
            case RequestStatus.IN_LITIGATION:
                return <Badge className="whitespace-nowrap rounded-md bg-orange-500/15 text-orange-500 hover:bg-orange-500/25 border-orange-500/20">{t('accounting.statusNames.inLitigation')}</Badge>
            case RequestStatus.IN_ACCOUNTING:
                return <Badge className="whitespace-nowrap rounded-md bg-purple-500/15 text-purple-500 hover:bg-purple-500/25 border-purple-500/20">{t('accounting.statusNames.inAccounting')}</Badge>
            case RequestStatus.AUDITED:
                return <Badge className="whitespace-nowrap rounded-md bg-blue-500/15 text-blue-500 hover:bg-blue-500/25 border-blue-500/20">{t('accounting.statusNames.audited')}</Badge>
            case RequestStatus.AUTHORIZED:
                return <Badge className="whitespace-nowrap rounded-md bg-blue-600/15 text-blue-600 hover:bg-blue-600/25 border-blue-600/20 font-black uppercase text-[10px]">{t('accounting.statusNames.authorized') || "Authorized"}</Badge>
            case RequestStatus.APPROVED:
                return <Badge className="whitespace-nowrap rounded-md bg-green-500/15 text-green-500 hover:bg-green-500/25 border-green-500/20">{t('accounting.statusNames.approved')}</Badge>
            case RequestStatus.PENDING:
                return <Badge className="whitespace-nowrap rounded-md bg-yellow-500/15 text-yellow-500 hover:bg-yellow-500/25 border-yellow-500/20">{t('accounting.statusNames.pending')}</Badge>
            case RequestStatus.CANCELLED:
                return <Badge className="whitespace-nowrap rounded-md bg-red-500/15 text-red-500 hover:bg-red-500/25 border-red-500/20">{t('accounting.statusNames.cancelled')}</Badge>
            default:
                return <Badge className="whitespace-nowrap rounded-md bg-zinc-500/15 text-zinc-500 border-zinc-500/20">{status}</Badge>
        }
    }

    return (
        <div className="flex-1 space-y-4 pt-6">
            <Card className="bg-slate-50 border-slate-200 text-black backdrop-blur-sm">
                <CardHeader>
                    <CardTitle>{t('accounting.title')}</CardTitle>
                    <CardDescription className="text-slate-600">
                        {t('accounting.description')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center py-4 justify-between gap-4">
                        <Input
                            placeholder={t('accounting.search')}
                            value={searchQuery}
                            onChange={(event) => {
                                setSearchQuery(event.target.value);
                                setCurrentPage(1);
                            }}
                            className="max-w-sm bg-black/20 border-slate-200 text-black placeholder:text-slate-600 focus-visible:ring-white/20"
                        />
                        <div className="flex gap-2">
                            <Select value={selectedEnterpriseId} onValueChange={(val) => {
                                setSelectedEnterpriseId(val);
                                setCurrentPage(1);
                            }}>
                                <SelectTrigger className="w-[180px] bg-black/20 border-slate-200 text-black focus:ring-white/20 focus:border-white/20">
                                    <SelectValue placeholder={t('accounting.enterprise')} />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-slate-200 text-black backdrop-blur-xl">
                                    <SelectItem value="all">{t('accounting.allEnterprises')}</SelectItem>
                                    {enterprises.map((ent) => (
                                        <SelectItem key={ent.id} value={ent.id}>{ent.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="bg-black/20 border-slate-200 text-black hover:bg-slate-100 hover:text-black">
                                        <Filter className="mr-2 h-4 w-4" />
                                        {statusFilter === "all" ? t('accounting.filterStage') : statusFilter}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-white border-slate-200 text-black backdrop-blur-xl">
                                    <DropdownMenuLabel>{t('accounting.filterStage')}</DropdownMenuLabel>
                                    <DropdownMenuSeparator className="bg-slate-100" />
                                    <DropdownMenuCheckboxItem
                                        checked={statusFilter === "all"}
                                        onCheckedChange={() => setStatusFilter("all")}
                                        className="focus:bg-slate-100 focus:text-black"
                                    >
                                        {t('accounting.allStages')}
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={statusFilter === RequestStatus.IN_ACCOUNTING}
                                        onCheckedChange={() => setStatusFilter(RequestStatus.IN_ACCOUNTING)}
                                        className="focus:bg-slate-100 focus:text-black"
                                    >
                                        {t('accounting.inAccounting')}
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={statusFilter === RequestStatus.AUDITED}
                                        onCheckedChange={() => setStatusFilter(RequestStatus.AUDITED)}
                                        className="focus:bg-slate-100 focus:text-black"
                                    >
                                        {t('accounting.audited')}
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={statusFilter === RequestStatus.IN_LITIGATION}
                                        onCheckedChange={() => setStatusFilter(RequestStatus.IN_LITIGATION)}
                                        className="focus:bg-slate-100 focus:text-black"
                                    >
                                        {t('accounting.inLitigation')}
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={statusFilter === RequestStatus.COMPLETED}
                                        onCheckedChange={() => setStatusFilter(RequestStatus.COMPLETED)}
                                        className="focus:bg-slate-100 focus:text-black"
                                    >
                                        {t('accounting.completed')}
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

                    <div className="rounded-md border border-slate-200 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-100">
                                <TableRow className="border-slate-200 hover:bg-transparent">
                                    <TableHead className="text-zinc-500 font-bold uppercase text-[10px]">{t('accounting.table.id')}</TableHead>
                                    <TableHead className="text-zinc-500 font-bold uppercase text-[10px]">{t('accounting.table.requester')}</TableHead>
                                    <TableHead className="text-zinc-500 font-bold uppercase text-[10px]">{t('accounting.table.type')}</TableHead>
                                    <TableHead className="text-zinc-500 font-bold uppercase text-[10px]">{t('accounting.table.status')}</TableHead>
                                    <TableHead className="text-zinc-500 font-bold uppercase text-[10px] text-right">{t('accounting.table.amount')}</TableHead>
                                    <TableHead className="text-zinc-500 font-bold uppercase text-[10px] text-right">{t('accounting.table.actions')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            <Calculator className="h-5 w-5 animate-pulse mx-auto text-zinc-500" />
                                        </TableCell>
                                    </TableRow>
                                ) : currentRequests.length > 0 ? (
                                    currentRequests.map((req) => (
                                        <TableRow key={req.id} className="border-white/5 hover:bg-slate-50 transition-colors">
                                            <TableCell className="font-mono text-[10px] text-zinc-500">{req.id.split('-')[0]}</TableCell>
                                            <TableCell className="font-bold text-xs">{req.requester?.fullName || "N/A"}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className={
                                                        req.type === RequestType.DEPOSIT ? "text-emerald-400 border-emerald-400/20 rounded-md whitespace-nowrap" :
                                                            req.type === RequestType.CORRECTION ? "text-orange-400 border-orange-400/20 rounded-md whitespace-nowrap" :
                                                                "text-red-400 border-red-400/20 rounded-md whitespace-nowrap"
                                                    }>
                                                        {req.type}
                                                    </Badge>
                                                    {req.receiptUrl && (
                                                        <a href={req.receiptUrl} target="_blank" rel="noreferrer" className="text-emerald-500 hover:text-emerald-400" title="View Transaction Receipt">
                                                            <FileText className="h-4 w-4" />
                                                        </a>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>{getStatusBadge(req.status)}</TableCell>
                                            <TableCell className="text-right font-black text-black whitespace-nowrap">
                                                {req.amount ? `${Number(req.amount).toLocaleString('en-US')}` : '-'}
                                            </TableCell>
                                            <TableCell className="text-right whitespace-nowrap">
                                                <div className="flex justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-zinc-500 hover:text-black hover:bg-slate-100"
                                                        onClick={async () => {
                                                            console.log("Request selected:", req);
                                                            try {
                                                                const fullReq = await requestApi.getById(req.id);
                                                                console.log("Full Request details:", fullReq);
                                                                setSelectedRequest(fullReq);
                                                            } catch (e) {
                                                                console.error("Failed to fetch full request details:", e);
                                                                setSelectedRequest(req);
                                                            }
                                                            setIsDialogOpen(true);
                                                        }}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    {req.status === RequestStatus.IN_ACCOUNTING && (
                                                        <>
                                                            {(req.type === RequestType.DEPOSIT || req.type === RequestType.CORRECTION) && !isRegistrationRequest(req) ? (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10"
                                                                    title={req.type === RequestType.CORRECTION ? t('accounting.detailsModal.applyCorrection') : t('accounting.detailsModal.btnAudit') || "Audit"}
                                                                    onClick={() => handleAction("Audit", req.id)}
                                                                >
                                                                    <CheckCircle className="h-4 w-4" />
                                                                </Button>
                                                            ) : (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-orange-500 hover:text-orange-400 hover:bg-orange-500/10"
                                                                    title={isRegistrationRequest(req) ? "Send to Litigation (Registration)" : "Litigate"}
                                                                    onClick={() => handleAction("Send to Litigation", req.id)}
                                                                >
                                                                    <Send className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center text-zinc-600 font-bold uppercase text-[10px]">
                                            {t('accounting.table.noRequests')}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
                {totalPages > 1 && (
                    <CardFooter className="border-t border-white/5 py-4">
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            if (currentPage > 1) setCurrentPage(currentPage - 1);
                                        }}
                                        className={currentPage === 1 ? "pointer-events-none opacity-50 text-zinc-600" : "text-black hover:bg-slate-100"}
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
                                        className={currentPage === totalPages ? "pointer-events-none opacity-50 text-zinc-600" : "text-black hover:bg-slate-100"}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </CardFooter>
                )}
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="bg-white border border-slate-200 text-black sm:max-w-2xl backdrop-blur-xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
                            <Calculator className="h-5 w-5 text-blue-500" />
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

                            {selectedRequest.receiptUrl && (
                                <div className="space-y-2 md:col-span-2">
                                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('accounting.detailsModal.receiptTitle')}</h4>
                                    <a
                                        href={selectedRequest.receiptUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-500 bg-emerald-50 border border-emerald-200 rounded-lg p-3 transition-colors"
                                    >
                                        <FileText className="h-4 w-4" />
                                        <span className="font-bold">{t('accounting.detailsModal.viewReceipt')}</span>
                                    </a>
                                </div>
                            )}

                            {selectedRequest.type === RequestType.CORRECTION && (
                                <div className="md:col-span-2 space-y-4 p-4 rounded-xl border-2 border-dashed border-red-100 bg-red-50/30">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="p-1 rounded bg-red-100 text-red-600">
                                            <Calculator className="h-3 w-3" />
                                        </div>
                                        <h4 className="text-[10px] font-black text-red-600 uppercase tracking-widest">
                                            {t('accounting.detailsModal.originalTransactionTitle')}
                                        </h4>
                                    </div>

                                    {!selectedRequest.referencedTransaction ? (
                                        <div className="text-xs font-black text-red-600 animate-pulse bg-red-100 p-2 rounded-lg text-center">
                                            DEBUG: Missing Transaction Info for ID: {selectedRequest.referencedTransactionId || "NULL"}
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
                                                    {t('accounting.detailsModal.hq')}
                                                </h4>
                                                <p className="text-xs font-bold text-slate-700">
                                                    {selectedRequest.referencedTransaction.headquarter?.name || "N/A"}
                                                </p>
                                            </div>
                                            <div className="space-y-1">
                                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                                    {t('accounting.detailsModal.originalDate')}
                                                </h4>
                                                <p className="text-xs font-bold text-slate-700 whitespace-nowrap">
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
                                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-tight whitespace-nowrap">
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
                                <div>{getStatusBadge(selectedRequest.status)}</div>
                            </div>
                            <div className="space-y-2">
                                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                    {selectedRequest.type === RequestType.CORRECTION
                                        ? t('accounting.detailsModal.correctionDelta')
                                        : t('accounting.detailsModal.amount')}
                                </h4>
                                <p className={`text-xl font-black ${selectedRequest.type === RequestType.CORRECTION ? (Number(selectedRequest.amount) < 0 ? 'text-red-500' : 'text-blue-500') : 'text-emerald-600'}`}>
                                    {selectedRequest.amount !== undefined && selectedRequest.amount !== null
                                        ? `${Number(selectedRequest.amount).toLocaleString('en-US')}`
                                        : '0'}
                                </p>
                            </div>

                            <div className="space-y-1">
                                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-tight">{t('accounting.detailsModal.createdAt')}</p>
                                <p className="text-xs font-medium">{format(parseISO(selectedRequest.createdAt), 'MMM dd, yyyy HH:mm')}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-tight">{t('headquarters.units.grid.colEnt')}</p>
                                <p className="text-xs font-medium">{selectedRequest.enterprise?.name || "N/A"}</p>
                            </div>

                            <div className="flex justify-end gap-3 pt-6 md:col-span-2 border-t border-slate-200">
                                <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="bg-transparent border-slate-200 hover:bg-slate-50 px-6 font-bold text-xs uppercase text-black">
                                    {t('headquarters.requests.actions.closeBtn') || "Close"}
                                </Button>
                                {selectedRequest.status === RequestStatus.IN_ACCOUNTING && (
                                    <>
                                        <Button
                                            variant="destructive"
                                            className="bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 font-bold text-xs uppercase px-6"
                                            disabled={!!actionLoading}
                                            onClick={() => handleAction("Reject", selectedRequest.id)}
                                        >
                                            {t('accounting.detailsModal.btnReject')}
                                        </Button>
                                        {selectedRequest.type === RequestType.DEPOSIT && !isRegistrationRequest(selectedRequest) ? (
                                            <Button
                                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase px-6"
                                                disabled={!!actionLoading}
                                                onClick={() => handleAction("Audit", selectedRequest.id)}
                                            >
                                                {t('accounting.detailsModal.btnAuthorize') || "Authorize"}
                                            </Button>
                                        ) : selectedRequest.type === RequestType.CORRECTION ? (
                                            <Button
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase px-6"
                                                disabled={!!actionLoading}
                                                onClick={() => handleAction("Approve", selectedRequest.id)}
                                            >
                                                {t('accounting.detailsModal.applyCorrection')}
                                            </Button>
                                        ) : (
                                            <Button
                                                className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs uppercase px-6"
                                                disabled={!!actionLoading}
                                                onClick={() => handleAction("Send to Litigation", selectedRequest.id)}
                                            >
                                                {isRegistrationRequest(selectedRequest) ? "Envoyer en Litige" : t('accounting.detailsModal.btnLitigate')}
                                            </Button>
                                        )}
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

export default Accounting;