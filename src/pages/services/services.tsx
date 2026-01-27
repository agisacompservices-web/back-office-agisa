import React, { useState } from "react";
import { servicesData, ServiceStatus, AgisaService } from "../../context/data/dataServices";
import { Badge } from "../../components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "../../components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { Filter, X, Eye, Building2, Plus, LayoutGrid, List } from "lucide-react";
import { Label } from "../../components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../../components/ui/select";
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

const Services: React.FC = () => {
    const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<ServiceStatus | "all">("all");
    const [selectedService, setSelectedService] = useState<AgisaService | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const itemsPerPage = 6;

    const isFiltered = searchQuery !== "" || statusFilter !== "all";

    const filteredData = servicesData.filter((item) => {
        const matchesSearch =
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.manager.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === "all" || item.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentServices = filteredData.slice(startIndex, endIndex);

    const getStatusBadge = (status: ServiceStatus) => {
        switch (status) {
            case "active":
                return <Badge className="bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25 border-emerald-500/20">Active</Badge>
            case "inactive":
                return <Badge variant="destructive" className="bg-red-500/15 text-red-500 hover:bg-red-500/25 border-red-500/20">Inactive</Badge>
            case "maintenance":
                return <Badge className="bg-yellow-500/15 text-yellow-500 hover:bg-yellow-500/25 border-yellow-500/20">Maintenance</Badge>
            default:
                return <Badge>{status}</Badge>
        }
    }

    return (
        <div className="flex-1 space-y-4 pt-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Building2 className="h-8 w-8 text-indigo-500" />
                    <h2 className="text-3xl font-bold tracking-tight text-white">Group Services</h2>
                </div>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Service
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-900 border border-white/10 text-white sm:max-w-[500px] backdrop-blur-xl">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold">Register New Service</DialogTitle>
                            <DialogDescription className="text-slate-400">
                                Enter the details of the new business unit or service entity.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="service-name">Service Name</Label>
                                <Input id="service-name" placeholder="e.g. Agisa Tech" className="bg-white/5 border-white/10 focus:ring-indigo-500/50" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Category</Label>
                                    <Select>
                                        <SelectTrigger className="bg-white/5 border-white/10 font-bold">
                                            <SelectValue placeholder="Select sector" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-900 border-white/10 text-white font-bold">
                                            <SelectItem value="finance">Finance</SelectItem>
                                            <SelectItem value="logistics">Logistics</SelectItem>
                                            <SelectItem value="realestate">Real Estate</SelectItem>
                                            <SelectItem value="technology">Technology</SelectItem>
                                            <SelectItem value="security">Security</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="manager">Manager</Label>
                                    <Input id="manager" placeholder="Director Name" className="bg-white/5 border-white/10 focus:ring-indigo-500/50" />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="description">Business Description</Label>
                                <textarea
                                    id="description"
                                    className="flex min-h-[100px] w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500/50"
                                    placeholder="Describe the service objectives..."
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="bg-transparent border-white/10 hover:bg-white/5">
                                Cancel
                            </Button>
                            <Button
                                className="bg-emerald-600 hover:bg-emerald-700"
                                onClick={() => {
                                    toast.success("Service Registered", {
                                        description: "The new service entity has been successfully added to Agisa Group."
                                    });
                                    setIsAddDialogOpen(false);
                                }}
                            >
                                Register Service
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex items-center justify-between py-4 gap-4">
                <div className="flex flex-1 items-center gap-4">
                    <Input
                        placeholder="Search services, categories, managers..."
                        value={searchQuery}
                        onChange={(event) => {
                            setSearchQuery(event.target.value);
                            setCurrentPage(1);
                        }}
                        className="max-w-sm bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-indigo-500/50"
                    />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white">
                                <Filter className="mr-2 h-4 w-4" />
                                Status
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-slate-900 border-white/10 text-white backdrop-blur-xl">
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
                                checked={statusFilter === "active"}
                                onCheckedChange={() => setStatusFilter("active")}
                                className="focus:bg-white/10 focus:text-white"
                            >
                                Active
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                                checked={statusFilter === "inactive"}
                                onCheckedChange={() => setStatusFilter("inactive")}
                                className="focus:bg-white/10 focus:text-white"
                            >
                                Inactive
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                                checked={statusFilter === "maintenance"}
                                onCheckedChange={() => setStatusFilter("maintenance")}
                                className="focus:bg-white/10 focus:text-white"
                            >
                                Maintenance
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

                <div className="flex items-center border border-white/10 rounded-lg p-1 bg-white/5">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setViewMode("grid")}
                        className={`h-8 w-8 ${viewMode === "grid" ? "bg-white/10 text-white" : "text-slate-500 hover:text-white"}`}
                    >
                        <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setViewMode("table")}
                        className={`h-8 w-8 ${viewMode === "table" ? "bg-white/10 text-white" : "text-slate-500 hover:text-white"}`}
                    >
                        <List className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {currentServices.map((service) => (
                        <Card key={service.id} className="bg-white/5 border-white/10 text-white backdrop-blur-sm group hover:border-indigo-500/30 transition-all">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <CardTitle className="text-xl group-hover:text-indigo-400 transition-colors">{service.name}</CardTitle>
                                        <CardDescription className="text-slate-400 text-xs">{service.category}</CardDescription>
                                    </div>
                                    {getStatusBadge(service.status)}
                                </div>
                            </CardHeader>
                            <CardContent className="pb-4">
                                <p className="text-sm text-slate-300 line-clamp-2 h-10">
                                    {service.description}
                                </p>
                                <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Manager</p>
                                        <p className="text-xs font-medium">{service.manager}</p>
                                    </div>
                                    <div className="space-y-1 text-right">
                                        <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Volume</p>
                                        <p className="text-xs font-bold text-emerald-400">${(service.totalVolume / 1000).toFixed(0)}k</p>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="pt-0 border-t border-white/5 mt-auto">
                                <Button
                                    variant="ghost"
                                    className="w-full text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/5 mt-4"
                                    onClick={() => {
                                        setSelectedService(service);
                                        setIsDetailsOpen(true);
                                    }}
                                >
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="rounded-md border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden text-white">
                    <Table>
                        <TableHeader className="bg-white/5">
                            <TableRow className="border-white/10 hover:bg-transparent">
                                <TableHead className="text-slate-400 font-semibold">Service Name</TableHead>
                                <TableHead className="text-slate-400 font-semibold">Category</TableHead>
                                <TableHead className="text-slate-400 font-semibold">Status</TableHead>
                                <TableHead className="text-slate-400 font-semibold">Manager</TableHead>
                                <TableHead className="text-slate-400 font-semibold text-right">Volume</TableHead>
                                <TableHead className="text-slate-400 font-semibold text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {currentServices.length > 0 ? (
                                currentServices.map((service) => (
                                    <TableRow key={service.id} className="border-white/10 hover:bg-white/5 transition-colors">
                                        <TableCell className="font-semibold">{service.name}</TableCell>
                                        <TableCell className="text-slate-400 text-sm">{service.category}</TableCell>
                                        <TableCell>{getStatusBadge(service.status)}</TableCell>
                                        <TableCell className="text-sm">{service.manager}</TableCell>
                                        <TableCell className="text-right font-medium text-emerald-400">${service.totalVolume.toLocaleString()}</TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-slate-400 hover:text-white hover:bg-white/10"
                                                onClick={() => {
                                                    setSelectedService(service);
                                                    setIsDetailsOpen(true);
                                                }}
                                            >
                                                <Eye className="h-4 w-4" />
                                                <span className="sr-only">Details</span>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                                        No services found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}

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
                </div>
            )}

            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="bg-slate-900 border border-white/10 text-white sm:max-w-[550px] backdrop-blur-xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                                <Building2 className="h-6 w-6 text-indigo-400" />
                            </div>
                            {selectedService?.name}
                        </DialogTitle>
                        <DialogDescription className="text-slate-400">
                            Konglomera Agisa • Service ID: <span className="text-white font-mono">{selectedService?.id}</span>
                        </DialogDescription>
                    </DialogHeader>
                    {selectedService && (
                        <div className="space-y-6 py-4">
                            <div className="space-y-2">
                                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">About this Service</h4>
                                <p className="text-slate-200 bg-white/5 p-4 rounded-lg border border-white/5 leading-relaxed">
                                    {selectedService.description}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2 group">
                                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Business Category</h4>
                                    <p className="text-lg font-medium py-1 px-3 bg-indigo-500/10 rounded-md w-fit border border-indigo-500/20 text-indigo-300">
                                        {selectedService.category}
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Operating Status</h4>
                                    <div>{getStatusBadge(selectedService.status)}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6 pt-4 border-t border-white/10">
                                <div className="space-y-1">
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Service Manager</p>
                                    <p className="text-base font-semibold">{selectedService.manager}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Volume (YTD)</p>
                                    <p className="text-xl font-black text-emerald-400">${selectedService.totalVolume.toLocaleString()}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Onboarded Since</p>
                                    <p className="text-sm">{new Date(selectedService.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-6">
                                <Button variant="outline" onClick={() => setIsDetailsOpen(false)} className="bg-transparent border-white/10 hover:bg-white/5">
                                    Close
                                </Button>
                                <Button className="bg-indigo-600 hover:bg-indigo-700">
                                    Edit Service
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default Services;