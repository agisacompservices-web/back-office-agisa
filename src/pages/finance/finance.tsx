import React, { useState } from "react";
import { financeData, PaymentStatus, FinanceData } from "../../context/data/dataFinance";
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
import { Filter, X, Eye } from "lucide-react";
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

const Finance: React.FC = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<PaymentStatus | "all">("all");
    const [serviceFilter, setServiceFilter] = useState<string>("all");
    const [selectedTransaction, setSelectedTransaction] = useState<FinanceData | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const itemsPerPage = 5;

    // Get unique services for filter
    const services = Array.from(new Set(financeData.map(item => item.service)));

    const isFiltered = searchQuery !== "" || statusFilter !== "all" || serviceFilter !== "all";

    const filteredData = financeData.filter((item) => {
        const matchesSearch =
            item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.agent.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.status.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === "all" || item.status === statusFilter;
        const matchesService = serviceFilter === "all" || item.service === serviceFilter;

        return matchesSearch && matchesStatus && matchesService;
    });

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentTransactions = filteredData.slice(startIndex, endIndex);

    return (
        <div className="flex-1 space-y-4 pt-6">

            <Card className="bg-white/5 border-white/10 text-white">
                <CardHeader>
                    <CardTitle>Cash Deliveries</CardTitle>
                    <CardDescription>
                        List of recent cash deliveries to services.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center py-4 justify-between">
                        <Input
                            placeholder="Search transactions..."
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
                                    <Button variant="outline" className="ml-auto bg-black/20 border-white/10 text-white hover:bg-white/10 hover:text-white">
                                        <Filter className="mr-2 h-4 w-4" />
                                        Status
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-black/90 border-white/10 text-white">
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
                                        checked={statusFilter === "success"}
                                        onCheckedChange={() => setStatusFilter("success")}
                                        className="focus:bg-white/10 focus:text-white"
                                    >
                                        Success
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={statusFilter === "processing"}
                                        onCheckedChange={() => setStatusFilter("processing")}
                                        className="focus:bg-white/10 focus:text-white"
                                    >
                                        Processing
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={statusFilter === "failed"}
                                        onCheckedChange={() => setStatusFilter("failed")}
                                        className="focus:bg-white/10 focus:text-white"
                                    >
                                        Failed
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={statusFilter === "pending"}
                                        onCheckedChange={() => setStatusFilter("pending")}
                                        className="focus:bg-white/10 focus:text-white"
                                    >
                                        Pending
                                    </DropdownMenuCheckboxItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="ml-auto bg-black/20 border-white/10 text-white hover:bg-white/10 hover:text-white">
                                        <Filter className="mr-2 h-4 w-4" />
                                        Service
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-black/90 border-white/10 text-white">
                                    <DropdownMenuLabel>Filter by Service</DropdownMenuLabel>
                                    <DropdownMenuSeparator className="bg-white/10" />
                                    <DropdownMenuCheckboxItem
                                        checked={serviceFilter === "all"}
                                        onCheckedChange={() => setServiceFilter("all")}
                                        className="focus:bg-white/10 focus:text-white"
                                    >
                                        All Services
                                    </DropdownMenuCheckboxItem>
                                    {services.map((service) => (
                                        <DropdownMenuCheckboxItem
                                            key={service}
                                            checked={serviceFilter === service}
                                            onCheckedChange={() => setServiceFilter(service)}
                                            className="focus:bg-white/10 focus:text-white"
                                        >
                                            {service}
                                        </DropdownMenuCheckboxItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {isFiltered && (
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setSearchQuery("");
                                        setStatusFilter("all");
                                        setServiceFilter("all");
                                        setCurrentPage(1);
                                    }}
                                    className="h-8 px-2 lg:px-3 text-slate-400 hover:text-white hover:bg-white/10"
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
                                    <TableHead className="text-slate-400 font-semibold">Transaction ID</TableHead>
                                    <TableHead className="text-slate-400 font-semibold">Status</TableHead>
                                    <TableHead className="text-slate-400 font-semibold">Service</TableHead>
                                    <TableHead className="text-slate-400 font-semibold">Agent</TableHead>
                                    <TableHead className="text-slate-400 font-semibold">Date</TableHead>
                                    <TableHead className="text-right text-slate-400 font-semibold">Amount</TableHead>
                                    <TableHead className="text-right text-slate-400 font-semibold">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {currentTransactions.map((trx) => (
                                    <TableRow key={trx.id} className="border-white/10 hover:bg-white/5">
                                        <TableCell className="font-medium">{trx.id}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={trx.status === "success" ? "default" : trx.status === "processing" ? "secondary" : "destructive"}
                                                className={trx.status === "success" ? "bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25" : trx.status === "processing" ? "bg-blue-500/15 text-blue-500 hover:bg-blue-500/25" : "bg-red-500/15 text-red-500 hover:bg-red-500/25"}
                                            >
                                                {trx.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{trx.service}</TableCell>
                                        <TableCell>{trx.agent}</TableCell>
                                        <TableCell>{trx.date}</TableCell>
                                        <TableCell className="text-right">${trx.amount.toFixed(2)}</TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 hover:bg-white/10 hover:text-white"
                                                onClick={() => {
                                                    setSelectedTransaction(trx);
                                                    setIsDialogOpen(true);
                                                }}
                                            >
                                                <Eye className="h-4 w-4" />
                                                <span className="sr-only">Voir</span>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
                <CardFooter>
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (currentPage > 1) setCurrentPage(currentPage - 1);
                                    }}
                                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
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
                                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </CardFooter>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="bg-black/90 border-white/10 text-white sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Transaction Details</DialogTitle>
                        <DialogDescription className="text-slate-400">
                            Detailed information about transaction {selectedTransaction?.id}
                        </DialogDescription>
                    </DialogHeader>
                    {selectedTransaction && (
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <span className="text-right font-medium text-slate-400">ID:</span>
                                <span className="col-span-3">{selectedTransaction.id}</span>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <span className="text-right font-medium text-slate-400">Status:</span>
                                <span className="col-span-3">
                                    <Badge
                                        variant={selectedTransaction.status === "success" ? "default" : selectedTransaction.status === "processing" ? "secondary" : "destructive"}
                                        className={selectedTransaction.status === "success" ? "bg-emerald-500/15 text-emerald-500" : selectedTransaction.status === "processing" ? "bg-blue-500/15 text-blue-500" : "bg-red-500/15 text-red-500"}
                                    >
                                        {selectedTransaction.status}
                                    </Badge>
                                </span>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <span className="text-right font-medium text-slate-400">Service:</span>
                                <span className="col-span-3">{selectedTransaction.service}</span>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <span className="text-right font-medium text-slate-400">Amount:</span>
                                <span className="col-span-3">${selectedTransaction.amount.toFixed(2)}</span>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <span className="text-right font-medium text-slate-400">Date:</span>
                                <span className="col-span-3">{selectedTransaction.date}</span>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <span className="text-right font-medium text-slate-400">Agent:</span>
                                <span className="col-span-3">{selectedTransaction.agent}</span>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <span className="text-right font-medium text-slate-400">Email:</span>
                                <span className="col-span-3">{selectedTransaction.email}</span>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
export default Finance;

