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
import { Filter, X, Send, Eye, Calculator } from "lucide-react";
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
import requestApi, { Request, RequestStatus, RequestType } from "../../context/api/request";
import enterpriseApi, { Enterprise } from "../../context/api/enterprise";
import { format, parseISO } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";

const Accounting: React.FC = () => {
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
            const res = await requestApi.getAll({
                enterpriseId: selectedEnterpriseId === "all" ? undefined : selectedEnterpriseId
            });

            // We filter for DEPOSIT and WITHDRAWAL only as requested.
            const financialRequests = (res || []).filter(r =>
                r.type === RequestType.DEPOSIT || r.type === RequestType.WITHDRAWAL
            );

            setRequests(financialRequests);
        } catch (error) {
            console.error("Failed to fetch accounting requests:", error);
            toast.error("Error", { description: "Failed to load requests" });
        } finally {
            setIsLoading(false);
        }
    }, [selectedEnterpriseId]);

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

    const handleAction = async (action: "Send to Litigation" | "Reject", requestId: string) => {
        setActionLoading(requestId);
        try {
            if (action === "Send to Litigation") {
                await requestApi.litigate(requestId, { reviewerNotes: "Sent to Litigation from Accounting" });
                toast.success("Sent to Litigation");
            } else if (action === "Reject") {
                await requestApi.reject(requestId, { reviewerNotes: "Rejected from Accounting" });
                toast.success("Request Rejected");
            }
            fetchRequests();
            setIsDialogOpen(false);
        } catch (error: any) {
            toast.error("Action failed", { description: error.response?.data?.message });
        } finally {
            setActionLoading(null);
        }
    }

    const getStatusBadge = (status: RequestStatus) => {
        switch (status) {
            case RequestStatus.COMPLETED:
                return <Badge className="whitespace-nowrap rounded-md bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25 border-emerald-500/20">Completed</Badge>
            case RequestStatus.REJECTED:
                return <Badge variant="destructive" className="whitespace-nowrap rounded-md bg-red-500/15 text-red-500 hover:bg-red-500/25 border-red-500/20">Rejected</Badge>
            case RequestStatus.IN_LITIGATION:
                return <Badge className="whitespace-nowrap rounded-md bg-orange-500/15 text-orange-500 hover:bg-orange-500/25 border-orange-500/20">In Litigation</Badge>
            case RequestStatus.IN_ACCOUNTING:
                return <Badge className="whitespace-nowrap rounded-md bg-purple-500/15 text-purple-500 hover:bg-purple-500/25 border-purple-500/20">In Accounting</Badge>
            case RequestStatus.AUDITED:
                return <Badge className="whitespace-nowrap rounded-md bg-blue-500/15 text-blue-500 hover:bg-blue-500/25 border-blue-500/20">Audited</Badge>
            default:
                return <Badge className="whitespace-nowrap rounded-md bg-zinc-500/15 text-zinc-500 border-zinc-500/20">{status}</Badge>
        }
    }

    return (
        <div className="flex-1 space-y-4 pt-6">
            <Card className="bg-white/5 border-white/10 text-white backdrop-blur-sm">
                <CardHeader>
                    <CardTitle>Accounting Dashboard</CardTitle>
                    <CardDescription className="text-slate-400">
                        Process and verify financial transactions (Deposits & Withdrawals).
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center py-4 justify-between gap-4">
                        <Input
                            placeholder="Search by ID, customer, type, HQ..."
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
                                    <SelectValue placeholder="Enterprise" />
                                </SelectTrigger>
                                <SelectContent className="bg-black/90 border-white/10 text-white backdrop-blur-xl">
                                    <SelectItem value="all">All Enterprises</SelectItem>
                                    {enterprises.map((ent) => (
                                        <SelectItem key={ent.id} value={ent.id}>{ent.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="bg-black/20 border-white/10 text-white hover:bg-white/10 hover:text-white">
                                        <Filter className="mr-2 h-4 w-4" />
                                        {statusFilter === "all" ? "Current Stage" : statusFilter}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-black/90 border-white/10 text-white backdrop-blur-xl">
                                    <DropdownMenuLabel>Filter Stage</DropdownMenuLabel>
                                    <DropdownMenuSeparator className="bg-white/10" />
                                    <DropdownMenuCheckboxItem
                                        checked={statusFilter === "all"}
                                        onCheckedChange={() => setStatusFilter("all")}
                                        className="focus:bg-white/10 focus:text-white"
                                    >
                                        All Stages (History)
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={statusFilter === RequestStatus.IN_ACCOUNTING}
                                        onCheckedChange={() => setStatusFilter(RequestStatus.IN_ACCOUNTING)}
                                        className="focus:bg-white/10 focus:text-white"
                                    >
                                        In Accounting (Pending)
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={statusFilter === RequestStatus.AUDITED}
                                        onCheckedChange={() => setStatusFilter(RequestStatus.AUDITED)}
                                        className="focus:bg-white/10 focus:text-white"
                                    >
                                        Audited
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={statusFilter === RequestStatus.IN_LITIGATION}
                                        onCheckedChange={() => setStatusFilter(RequestStatus.IN_LITIGATION)}
                                        className="focus:bg-white/10 focus:text-white"
                                    >
                                        In Litigation
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={statusFilter === RequestStatus.COMPLETED}
                                        onCheckedChange={() => setStatusFilter(RequestStatus.COMPLETED)}
                                        className="focus:bg-white/10 focus:text-white"
                                    >
                                        Completed
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
                                    <TableHead className="text-zinc-500 font-bold uppercase text-[10px]">Req ID</TableHead>
                                    <TableHead className="text-zinc-500 font-bold uppercase text-[10px]">Requester</TableHead>
                                    <TableHead className="text-zinc-500 font-bold uppercase text-[10px]">Type</TableHead>
                                    <TableHead className="text-zinc-500 font-bold uppercase text-[10px]">Status</TableHead>
                                    <TableHead className="text-zinc-500 font-bold uppercase text-[10px] text-right">Amount</TableHead>
                                    <TableHead className="text-zinc-500 font-bold uppercase text-[10px] text-right">Actions</TableHead>
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
                                                <Badge variant="outline" className={req.type === RequestType.DEPOSIT ? "text-emerald-400 border-emerald-400/20 rounded-md whitespace-nowrap" : "text-red-400 border-red-400/20 rounded-md whitespace-nowrap"}>
                                                    {req.type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{getStatusBadge(req.status)}</TableCell>
                                            <TableCell className="text-right font-black text-white whitespace-nowrap">
                                                {req.amount ? `${Number(req.amount).toLocaleString()} USD` : '-'}
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
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-orange-500 hover:text-orange-400 hover:bg-orange-500/10"
                                                                title="Litigate"
                                                                onClick={() => handleAction("Send to Litigation", req.id)}
                                                            >
                                                                <Send className="h-4 w-4" />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center text-zinc-600 font-bold uppercase text-[10px]">
                                            No requests to process
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
                            Request Analysis
                        </DialogTitle>
                        <DialogDescription className="text-zinc-500 text-xs font-bold uppercase">
                            Detailed view for Request ID: <span className="text-white font-mono">{selectedRequest?.id}</span>
                        </DialogDescription>
                    </DialogHeader>
                    {selectedRequest && (
                        <div className="space-y-6 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Requester</h4>
                                    <p className="text-sm font-bold">{selectedRequest.requester?.fullName || "N/A"}</p>
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Type</h4>
                                    <p className="text-sm font-bold uppercase">{selectedRequest.type}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Notes / Description</h4>
                                <p className="text-zinc-300 bg-white/5 p-3 rounded-lg border border-white/5 text-xs leading-relaxed font-medium">
                                    {selectedRequest.description || "No description provided."}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Status</h4>
                                    <div>{getStatusBadge(selectedRequest.status)}</div>
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Effective Amount</h4>
                                    <p className="text-xl font-black text-emerald-400">
                                        {selectedRequest.amount ? `${Number(selectedRequest.amount).toLocaleString()} USD` : '-'}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6 pt-4 border-t border-white/5">
                                <div className="space-y-1">
                                    <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-tight">Created At</p>
                                    <p className="text-xs font-medium">{format(parseISO(selectedRequest.createdAt), 'MMM dd, yyyy HH:mm')}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-tight">Headquarter</p>
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