import React, { useState } from "react";
import { accountingData, RequestStatus, AccountingRequest } from "../../context/data/dataAccounting";
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
import { Filter, X, Send, XCircle, Eye, Calculator } from "lucide-react";
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

const Accounting: React.FC = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<RequestStatus | "all">("all");
    const [selectedRequest, setSelectedRequest] = useState<AccountingRequest | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const itemsPerPage = 5;

    const isFiltered = searchQuery !== "" || statusFilter !== "all";

    const filteredData = accountingData.filter((item) => {
        const matchesSearch =
            item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.agent.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === "all" || item.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentRequests = filteredData.slice(startIndex, endIndex);

    const handleAction = (action: "sent_to_litigation" | "rejected", requestId: string) => {
        const message = action === "sent_to_litigation"
            ? `Request ${requestId} has been sent to Litigation for review.`
            : `Request ${requestId} has been rejected.`;

        toast.success(action === "sent_to_litigation" ? "Sent to Litigation" : "Request Rejected", {
            description: message,
        });
    }

    const getStatusBadge = (status: RequestStatus) => {
        switch (status) {
            case "processed":
                return <Badge className="bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25 border-emerald-500/20">Processed</Badge>
            case "rejected":
                return <Badge variant="destructive" className="bg-red-500/15 text-red-500 hover:bg-red-500/25 border-red-500/20">Rejected</Badge>
            case "sent_to_litigation":
                return <Badge className="bg-orange-500/15 text-orange-500 hover:bg-orange-500/25 border-orange-500/20">In Litigation</Badge>
            case "received":
                return <Badge className="bg-blue-500/15 text-blue-500 hover:bg-blue-500/25 border-blue-500/20">New Request</Badge>
            default:
                return <Badge>{status}</Badge>
        }
    }

    return (
        <div className="flex-1 space-y-4 pt-6">
            {/* <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Calculator className="h-8 w-8 text-blue-500" />
                    <h2 className="text-3xl font-bold tracking-tight text-white">Accounting Operations</h2>
                </div>
            </div> */}

            <Card className="bg-white/5 border-white/10 text-white backdrop-blur-sm">
                <CardHeader>
                    <CardTitle>Inbound Demands</CardTitle>
                    <CardDescription className="text-slate-400">
                        Process new customer demands and route them to the appropriate department.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center py-4 justify-between gap-4">
                        <Input
                            placeholder="Search by ID, customer, type..."
                            value={searchQuery}
                            onChange={(event) => {
                                setSearchQuery(event.target.value);
                                setCurrentPage(1);
                            }}
                            className="max-w-sm bg-black/20 border-white/10 text-white placeholder:text-slate-400 focus-visible:ring-white/20"
                        />
                        <div className="flex gap-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="bg-black/20 border-white/10 text-white hover:bg-white/10 hover:text-white">
                                        <Filter className="mr-2 h-4 w-4" />
                                        Status
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-black/90 border-white/10 text-white backdrop-blur-xl">
                                    <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                                    <DropdownMenuSeparator className="bg-white/10" />
                                    <DropdownMenuCheckboxItem
                                        checked={statusFilter === "all"}
                                        onCheckedChange={() => setStatusFilter("all")}
                                        className="focus:bg-white/10 focus:text-white"
                                    >
                                        All Statuses
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={statusFilter === "received"}
                                        onCheckedChange={() => setStatusFilter("received")}
                                        className="focus:bg-white/10 focus:text-white"
                                    >
                                        New Requests
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={statusFilter === "sent_to_litigation"}
                                        onCheckedChange={() => setStatusFilter("sent_to_litigation")}
                                        className="focus:bg-white/10 focus:text-white"
                                    >
                                        In Litigation
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={statusFilter === "processed"}
                                        onCheckedChange={() => setStatusFilter("processed")}
                                        className="focus:bg-white/10 focus:text-white"
                                    >
                                        Processed
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={statusFilter === "rejected"}
                                        onCheckedChange={() => setStatusFilter("rejected")}
                                        className="focus:bg-white/10 focus:text-white"
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
                                    className="h-9 px-2 lg:px-3 text-slate-400 hover:text-white hover:bg-white/10"
                                >
                                    Reset
                                    <X className="ml-2 h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="rounded-md border border-white/10">
                        <Table>
                            <TableHeader className="bg-white/5">
                                <TableRow className="border-white/10 hover:bg-transparent">
                                    <TableHead className="text-slate-400 font-semibold">Req ID</TableHead>
                                    <TableHead className="text-slate-400 font-semibold">Customer</TableHead>
                                    <TableHead className="text-slate-400 font-semibold">Type</TableHead>
                                    <TableHead className="text-slate-400 font-semibold">Status</TableHead>
                                    <TableHead className="text-slate-400 font-semibold text-right">Amount</TableHead>
                                    <TableHead className="text-slate-400 font-semibold text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {currentRequests.length > 0 ? (
                                    currentRequests.map((req) => (
                                        <TableRow key={req.id} className="border-white/10 hover:bg-white/5 transition-colors">
                                            <TableCell className="font-mono text-xs">{req.id}</TableCell>
                                            <TableCell className="font-medium">{req.customerName}</TableCell>
                                            <TableCell className="capitalize">{req.type}</TableCell>
                                            <TableCell>{getStatusBadge(req.status)}</TableCell>
                                            <TableCell className="text-right font-medium text-emerald-400">${req.amount.toFixed(2)}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-slate-400 hover:text-white hover:bg-white/10"
                                                        onClick={() => {
                                                            setSelectedRequest(req);
                                                            setIsDialogOpen(true);
                                                        }}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                        <span className="sr-only">Details</span>
                                                    </Button>
                                                    {req.status === "received" && (
                                                        <>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-orange-500 hover:text-orange-400 hover:bg-orange-500/10"
                                                                onClick={() => handleAction("sent_to_litigation", req.id)}
                                                            >
                                                                <Send className="h-4 w-4" />
                                                                <span className="sr-only">Send to Litigation</span>
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                                                                onClick={() => handleAction("rejected", req.id)}
                                                            >
                                                                <XCircle className="h-4 w-4" />
                                                                <span className="sr-only">Reject</span>
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
                                            No requests found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
                {totalPages > 1 && (
                    <CardFooter className="border-t border-white/10 py-4">
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            if (currentPage > 1) setCurrentPage(currentPage - 1);
                                        }}
                                        className={currentPage === 1 ? "pointer-events-none opacity-50 text-slate-500" : "text-white hover:bg-white/10"}
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
                                            className={currentPage === index + 1 ? "bg-white/10 text-white" : "text-slate-400 hover:text-white hover:bg-white/10"}
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
                                        className={currentPage === totalPages ? "pointer-events-none opacity-50 text-slate-500" : "text-white hover:bg-white/10"}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </CardFooter>
                )}
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="bg-black/95 border border-white/10 text-white sm:max-w-[500px] backdrop-blur-xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <Calculator className="h-5 w-5 text-blue-500" />
                            Request Analysis
                        </DialogTitle>
                        <DialogDescription className="text-slate-400">
                            Detailed view for Request ID: <span className="text-white font-mono">{selectedRequest?.id}</span>
                        </DialogDescription>
                    </DialogHeader>
                    {selectedRequest && (
                        <div className="space-y-6 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <h4 className="text-xs font-semibold text-slate-500 uppercase">Customer</h4>
                                    <p className="text-sm font-medium">{selectedRequest.customerName}</p>
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-xs font-semibold text-slate-500 uppercase">Type</h4>
                                    <p className="text-sm font-medium capitalize">{selectedRequest.type}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-xs font-semibold text-slate-500 uppercase">Context / Description</h4>
                                <p className="text-slate-300 bg-white/5 p-3 rounded-md border border-white/5 text-sm leading-relaxed">
                                    {selectedRequest.description}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <h4 className="text-xs font-semibold text-slate-500 uppercase">Current Status</h4>
                                    <div>{getStatusBadge(selectedRequest.status)}</div>
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-xs font-semibold text-slate-500 uppercase">Amount Involved</h4>
                                    <p className="text-xl font-bold text-emerald-400">${selectedRequest.amount.toFixed(2)}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6 pt-2 border-t border-white/10 mt-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] text-slate-500 font-medium">Capture Date</p>
                                    <p className="text-sm">{selectedRequest.date}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] text-slate-500 font-medium">Assigned Agent</p>
                                    <p className="text-sm">{selectedRequest.agent}</p>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-6">
                                <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="bg-transparent border-white/10 hover:bg-white/5 px-6">
                                    Close
                                </Button>
                                {selectedRequest.status === "received" && (
                                    <>
                                        <Button
                                            variant="destructive"
                                            className="bg-red-600 hover:bg-red-700"
                                            onClick={() => {
                                                handleAction("rejected", selectedRequest.id);
                                                setIsDialogOpen(false);
                                            }}
                                        >
                                            Reject
                                        </Button>
                                        <Button
                                            className="bg-orange-600 hover:bg-orange-700"
                                            onClick={() => {
                                                handleAction("sent_to_litigation", selectedRequest.id);
                                                setIsDialogOpen(false);
                                            }}
                                        >
                                            Send to Litigation
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