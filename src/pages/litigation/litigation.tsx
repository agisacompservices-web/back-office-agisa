import React, { useState } from "react";
import { litigationData, CaseStatus, LitigationCase } from "../../context/data/dataLitigation";
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
import { Filter, X, CheckCircle2, XCircle, Eye, ShieldAlert } from "lucide-react";
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

const Litigation: React.FC = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<CaseStatus | "all">("all");
    const [selectedCase, setSelectedCase] = useState<LitigationCase | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const itemsPerPage = 5;

    const isFiltered = searchQuery !== "" || statusFilter !== "all";

    const filteredData = litigationData.filter((item) => {
        const matchesSearch =
            item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.agent.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === "all" || item.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentCases = filteredData.slice(startIndex, endIndex);

    const handleAction = (action: "validated" | "rejected", caseId: string) => {
        toast.success(`Case ${caseId} has been ${action}`, {
            description: `The case status has been updated to ${action}.`,
        });
    }

    const getStatusBadge = (status: CaseStatus) => {
        switch (status) {
            case "validated":
                return <Badge className="bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25 border-emerald-500/20">Validated</Badge>
            case "rejected":
                return <Badge variant="destructive" className="bg-red-500/15 text-red-500 hover:bg-red-500/25 border-red-500/20">Rejected</Badge>
            case "investigating":
                return <Badge className="bg-blue-500/15 text-blue-500 hover:bg-blue-500/25 border-blue-500/20">Investigating</Badge>
            case "under_review":
                return <Badge className="bg-yellow-500/15 text-yellow-500 hover:bg-yellow-500/25 border-yellow-500/20">Under Review</Badge>
            default:
                return <Badge>{status}</Badge>
        }
    }

    return (
        <div className="flex-1 space-y-4 pt-6">
            {/* <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <ShieldAlert className="h-8 w-8 text-red-500" />
                    <h2 className="text-3xl font-bold tracking-tight text-white">Litigation Management</h2>
                </div>
            </div> */}

            <Card className="bg-white/5 border-white/10 text-white backdrop-blur-sm">
                <CardHeader>
                    <CardTitle>Open Cases</CardTitle>
                    <CardDescription className="text-slate-400">
                        Review and validate suspicious transactions before processing.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center py-4 justify-between gap-4">
                        <Input
                            placeholder="Search by ID, title, service..."
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
                                        checked={statusFilter === "under_review"}
                                        onCheckedChange={() => setStatusFilter("under_review")}
                                        className="focus:bg-white/10 focus:text-white"
                                    >
                                        Under Review
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={statusFilter === "investigating"}
                                        onCheckedChange={() => setStatusFilter("investigating")}
                                        className="focus:bg-white/10 focus:text-white"
                                    >
                                        Investigating
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={statusFilter === "validated"}
                                        onCheckedChange={() => setStatusFilter("validated")}
                                        className="focus:bg-white/10 focus:text-white"
                                    >
                                        Validated
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
                                    <TableHead className="text-slate-400 font-semibold">Case ID</TableHead>
                                    <TableHead className="text-slate-400 font-semibold">Title</TableHead>
                                    <TableHead className="text-slate-400 font-semibold">Status</TableHead>
                                    <TableHead className="text-slate-400 font-semibold">Service</TableHead>
                                    <TableHead className="text-slate-400 font-semibold text-right">Amount</TableHead>
                                    <TableHead className="text-slate-400 font-semibold text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {currentCases.length > 0 ? (
                                    currentCases.map((caseItem) => (
                                        <TableRow key={caseItem.id} className="border-white/10 hover:bg-white/5 transition-colors">
                                            <TableCell className="font-mono text-xs">{caseItem.id}</TableCell>
                                            <TableCell className="max-w-[200px] truncate font-medium">{caseItem.title}</TableCell>
                                            <TableCell>{getStatusBadge(caseItem.status)}</TableCell>
                                            <TableCell>{caseItem.service}</TableCell>
                                            <TableCell className="text-right font-medium text-emerald-400">${caseItem.amount.toFixed(2)}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-slate-400 hover:text-white hover:bg-white/10"
                                                        onClick={() => {
                                                            setSelectedCase(caseItem);
                                                            setIsDialogOpen(true);
                                                        }}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                        <span className="sr-only">Details</span>
                                                    </Button>
                                                    {caseItem.status !== "validated" && caseItem.status !== "rejected" && (
                                                        <>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10"
                                                                onClick={() => handleAction("validated", caseItem.id)}
                                                            >
                                                                <CheckCircle2 className="h-4 w-4" />
                                                                <span className="sr-only">Validate</span>
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                                                                onClick={() => handleAction("rejected", caseItem.id)}
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
                                            No cases found.
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
                            <ShieldAlert className="h-5 w-5 text-red-500" />
                            Case Details
                        </DialogTitle>
                        <DialogDescription className="text-slate-400">
                            Comprehensive assessment for Case ID: <span className="text-white font-mono">{selectedCase?.id}</span>
                        </DialogDescription>
                    </DialogHeader>
                    {selectedCase && (
                        <div className="space-y-6 py-4">
                            <div className="space-y-2">
                                <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Subject</h4>
                                <p className="text-lg font-medium">{selectedCase.title}</p>
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Description</h4>
                                <p className="text-slate-300 bg-white/5 p-3 rounded-md border border-white/5 leading-relaxed">
                                    {selectedCase.description}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Status</h4>
                                    <div>{getStatusBadge(selectedCase.status)}</div>
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Amount</h4>
                                    <p className="text-xl font-bold text-emerald-400">${selectedCase.amount.toFixed(2)}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6 pt-2 border-t border-white/10 mt-4">
                                <div className="space-y-1">
                                    <p className="text-xs text-slate-500 font-medium">Reporting Service</p>
                                    <p className="text-sm">{selectedCase.service}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-slate-500 font-medium">Detection Date</p>
                                    <p className="text-sm">{selectedCase.date}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-slate-500 font-medium">Responsible Agent</p>
                                    <p className="text-sm">{selectedCase.agent}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-slate-500 font-medium">Customer Contact</p>
                                    <p className="text-sm text-blue-400 underline cursor-pointer">{selectedCase.customerEmail}</p>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-6">
                                <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="bg-transparent border-white/10 hover:bg-white/5">
                                    Close
                                </Button>
                                {selectedCase.status !== "validated" && selectedCase.status !== "rejected" && (
                                    <>
                                        <Button
                                            variant="destructive"
                                            className="bg-red-600 hover:bg-red-700"
                                            onClick={() => {
                                                handleAction("rejected", selectedCase.id);
                                                setIsDialogOpen(false);
                                            }}
                                        >
                                            Reject Case
                                        </Button>
                                        <Button
                                            className="bg-emerald-600 hover:bg-emerald-700"
                                            onClick={() => {
                                                handleAction("validated", selectedCase.id);
                                                setIsDialogOpen(false);
                                            }}
                                        >
                                            Validate Case
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

export default Litigation;