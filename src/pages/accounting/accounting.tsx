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
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "../../components/ui/pagination"
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
                r.type === RequestType.DEPOSIT || r.type === RequestType.WITHDRAWAL
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

    const handleAction = async (action: "Approve" | "Send to Litigation" | "Reject", requestId: string) => {
        setActionLoading(requestId);
        try {
            if (action === "Approve") {
                await requestApi.approve(requestId, { reviewerNotes: "Approved directly from Accounting" });
                toast.success(t('accounting.toasts.approved'));
            } else if (action === "Send to Litigation") {
                await requestApi.litigate(requestId, { reviewerNotes: "Sent to Litigation from Accounting" });
                toast.success(t('accounting.toasts.litigated'));
            } else if (action === "Reject") {
                await requestApi.reject(requestId, { reviewerNotes: "Rejected from Accounting" });
                toast.success(t('accounting.toasts.rejected'));
            }
            fetchRequests();
            setIsDialogOpen(false);
        } catch (error: any) {
            toast.error(t('accounting.toasts.actionFailed'), { description: error.response?.data?.message });
        } finally {
            setActionLoading(null);
        }
    }

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
            default:
                return <Badge className="whitespace-nowrap rounded-md bg-zinc-500/15 text-zinc-500 border-zinc-500/20">{status}</Badge>
        }
    }

    return (
        <div className="flex-1 space-y-4 pt-6">
            <Card className="bg-white/5 border-white/10 text-white backdrop-blur-sm">
                <CardHeader>
                    <CardTitle>{t('accounting.title')}</CardTitle>
                    <CardDescription className="text-slate-400">
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
                            className="max-w-sm bg-black/20 border-white/10 text-white placeholder:text-slate-400 focus-visible:ring-white/20"
                        />
                        <div className="flex gap-2">
                            <Select value={selectedEnterpriseId} onValueChange={(val) => {
                                setSelectedEnterpriseId(val);
                                setCurrentPage(1);
                            }}>
                                <SelectTrigger className="w-[180px] bg-black/20 border-white/10 text-white focus:ring-white/20 focus:border-white/20">
                                    <SelectValue placeholder={t('accounting.enterprise')} />
                                </SelectTrigger>
                                <SelectContent className="bg-black/90 border-white/10 text-white backdrop-blur-xl">
                                    <SelectItem value="all">{t('accounting.allEnterprises')}</SelectItem>
                                    {enterprises.map((ent) => (
                                        <SelectItem key={ent.id} value={ent.id}>{ent.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="bg-black/20 border-white/10 text-white hover:bg-white/10 hover:text-white">
                                        <Filter className="mr-2 h-4 w-4" />
                                        {statusFilter === "all" ? t('accounting.filterStage') : statusFilter}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-black/90 border-white/10 text-white backdrop-blur-xl">
                                    <DropdownMenuLabel>{t('accounting.filterStage')}</DropdownMenuLabel>
                                    <DropdownMenuSeparator className="bg-white/10" />
                                    <DropdownMenuCheckboxItem
                                        checked={statusFilter === "all"}
                                        onCheckedChange={() => setStatusFilter("all")}
                                        className="focus:bg-white/10 focus:text-white"
                                    >
                                        {t('accounting.allStages')}
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={statusFilter === RequestStatus.IN_ACCOUNTING}
                                        onCheckedChange={() => setStatusFilter(RequestStatus.IN_ACCOUNTING)}
                                        className="focus:bg-white/10 focus:text-white"
                                    >
                                        {t('accounting.inAccounting')}
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={statusFilter === RequestStatus.AUDITED}
                                        onCheckedChange={() => setStatusFilter(RequestStatus.AUDITED)}
                                        className="focus:bg-white/10 focus:text-white"
                                    >
                                        {t('accounting.audited')}
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={statusFilter === RequestStatus.IN_LITIGATION}
                                        onCheckedChange={() => setStatusFilter(RequestStatus.IN_LITIGATION)}
                                        className="focus:bg-white/10 focus:text-white"
                                    >
                                        {t('accounting.inLitigation')}
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={statusFilter === RequestStatus.COMPLETED}
                                        onCheckedChange={() => setStatusFilter(RequestStatus.COMPLETED)}
                                        className="focus:bg-white/10 focus:text-white"
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
                                    className="h-9 px-2 lg:px-3 text-slate-400 hover:text-white hover:bg-white/10"
                                >
                                    Reset
                                    <X className="ml-2 h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="rounded-md border border-white/10 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-white/10">
                                <TableRow className="border-white/10 hover:bg-transparent">
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
                                        <TableRow key={req.id} className="border-white/5 hover:bg-white/5 transition-colors">
                                            <TableCell className="font-mono text-[10px] text-zinc-500">{req.id.split('-')[0]}</TableCell>
                                            <TableCell className="font-bold text-xs">{req.requester?.fullName || "N/A"}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className={req.type === RequestType.DEPOSIT ? "text-emerald-400 border-emerald-400/20 rounded-md whitespace-nowrap" : "text-red-400 border-red-400/20 rounded-md whitespace-nowrap"}>
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
                                            <TableCell className="text-right font-black text-white whitespace-nowrap">
                                                {req.amount ? `${Number(req.amount).toLocaleString('en-US')} USD` : '-'}
                                            </TableCell>
                                            <TableCell className="text-right whitespace-nowrap">
                                                <div className="flex justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-zinc-500 hover:text-white hover:bg-white/10"
                                                        onClick={() => {
                                                            setSelectedRequest(req);
                                                            setIsDialogOpen(true);
                                                        }}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    {req.status === RequestStatus.IN_ACCOUNTING && (
                                                        <>
                                                            {req.type === RequestType.DEPOSIT ? (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10"
                                                                    title="Approve"
                                                                    onClick={() => handleAction("Approve", req.id)}
                                                                >
                                                                    <CheckCircle className="h-4 w-4" />
                                                                </Button>
                                                            ) : (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-orange-500 hover:text-orange-400 hover:bg-orange-500/10"
                                                                    title="Litigate"
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
                                        className={currentPage === 1 ? "pointer-events-none opacity-50 text-zinc-600" : "text-white hover:bg-white/10"}
                                    />
                                </PaginationItem>
                                {Array.from({ length: totalPages }).map((_, index) => (
                                    <PaginationItem key={index}>
                                        <PaginationLink
                                            href="#"
                                            isActive={currentPage === index + 1}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setCurrentPage(index + 1);
                                            }}
                                            className={currentPage === index + 1 ? "bg-white/10 text-white" : "text-zinc-400 hover:text-white hover:bg-white/10"}
                                        >
                                            {index + 1}
                                        </PaginationLink>
                                    </PaginationItem>
                                ))}
                                <PaginationItem>
                                    <PaginationNext
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                                        }}
                                        className={currentPage === totalPages ? "pointer-events-none opacity-50 text-zinc-600" : "text-white hover:bg-white/10"}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </CardFooter>
                )}
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="bg-zinc-950 border border-white/10 text-white sm:max-w-[500px] backdrop-blur-xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
                            <Calculator className="h-5 w-5 text-blue-500" />
                            {t('accounting.detailsModal.title')}
                        </DialogTitle>
                        <DialogDescription className="text-zinc-500 text-xs font-bold uppercase">
                            {t('accounting.detailsModal.description')} <span className="text-white font-mono">{selectedRequest?.id}</span>
                        </DialogDescription>
                    </DialogHeader>
                    {selectedRequest && (
                        <div className="space-y-6 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('accounting.detailsModal.requester')}</h4>
                                    <p className="text-sm font-bold">{selectedRequest.requester?.fullName || "N/A"}</p>
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('accounting.detailsModal.type')}</h4>
                                    <p className="text-sm font-bold uppercase">{selectedRequest.type}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('accounting.detailsModal.descTitle')}</h4>
                                <p className="text-zinc-300 bg-white/5 p-3 rounded-lg border border-white/5 text-xs leading-relaxed font-medium">
                                    {selectedRequest.description || "{t('accounting.detailsModal.noDesc')}"}
                                </p>
                            </div>

                            {selectedRequest.receiptUrl && (
                                <div className="space-y-2">
                                    <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('accounting.detailsModal.receiptTitle')}</h4>
                                    <a
                                        href={selectedRequest.receiptUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 transition-colors"
                                    >
                                        <FileText className="h-4 w-4" />
                                        <span className="font-bold">{t('accounting.detailsModal.viewReceipt')}</span>
                                    </a>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('accounting.detailsModal.status')}</h4>
                                    <div>{getStatusBadge(selectedRequest.status)}</div>
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('accounting.detailsModal.amount')}</h4>
                                    <p className="text-xl font-black text-emerald-400">
                                        {selectedRequest.amount ? `${Number(selectedRequest.amount).toLocaleString('en-US')} USD` : '-'}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6 pt-4 border-t border-white/5">
                                <div className="space-y-1">
                                    <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-tight">{t('accounting.detailsModal.createdAt')}</p>
                                    <p className="text-xs font-medium">{format(parseISO(selectedRequest.createdAt), 'MMM dd, yyyy HH:mm')}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-tight">{t('accounting.detailsModal.hq')}</p>
                                    <p className="text-xs font-medium">{selectedRequest.headquarter?.name || "N/A"}</p>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-6">
                                <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="bg-transparent border-white/10 hover:bg-white/5 px-6 font-bold text-xs uppercase">
                                    Close
                                </Button>
                                {selectedRequest.status === RequestStatus.IN_ACCOUNTING && (
                                    <>
                                        <Button
                                            variant="destructive"
                                            className="bg-red-500/20 text-red-500 border border-red-500/20 hover:bg-red-500/30 font-bold text-xs uppercase px-6"
                                            disabled={!!actionLoading}
                                            onClick={() => handleAction("Reject", selectedRequest.id)}
                                        >
                                            Reject
                                        </Button>
                                        {selectedRequest.type === RequestType.DEPOSIT ? (
                                            <Button
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase px-6"
                                                disabled={!!actionLoading}
                                                onClick={() => handleAction("Approve", selectedRequest.id)}
                                            >
                                                Approve Deposit
                                            </Button>
                                        ) : (
                                            <Button
                                                className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs uppercase px-6"
                                                disabled={!!actionLoading}
                                                onClick={() => handleAction("Send to Litigation", selectedRequest.id)}
                                            >
                                                Send to Litigation
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