import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "../../components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../../components/ui/table";
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../../components/ui/select";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "../../components/ui/pagination";
import {
    Search,
    MoreVertical,
    Plus,
    Edit,
    Trash,
    Filter,
    X,
    Loader2,
    Building2,
    DollarSign,
    MapPin,
    AlertCircle,
    Eye,
    Ban,
    Users
} from "lucide-react";
import { toast } from "sonner";
import sellerApi, { Seller as SellerTypeData, SellerType, UpdateSellerRequest } from "../../context/api/seller";
import enterpriseApi from "../../context/api/enterprise";
import membershipApi from "../../context/api/membership";
import { cn } from "../../lib/utils";

const getTypeColor = (type: string) => {
    switch (type) {
        case SellerType.PLATINUM: return "border-blue-500/30 text-blue-400 bg-blue-500/5";
        case SellerType.GOLD: return "border-yellow-500/30 text-yellow-400 bg-yellow-500/5";
        case SellerType.SILVER: return "border-zinc-500/30 text-zinc-400 bg-zinc-500/5";
        default: return "border-emerald-500/30 text-emerald-400 bg-emerald-500/5";
    }
};

const Seller: React.FC = () => {
    const { enterpriseCode } = useParams<{ enterpriseCode: string }>();
    const [enterpriseId, setEnterpriseId] = useState<string>("");

    // API State
    const [sellers, setSellers] = useState<SellerTypeData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [selectedSeller, setSelectedSeller] = useState<SellerTypeData | null>(null);
    const [viewSellerData, setViewSellerData] = useState<SellerTypeData | null>(null);
    const [availableEnterprises, setAvailableEnterprises] = useState<any[]>([]);
    const [members, setMembers] = useState<any[]>([]);
    const [isMembersLoading, setIsMembersLoading] = useState(false);

    // State for Search and Filters
    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState<string>("all");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const itemsPerPage = 8;

    // Form States (Individual for HQ consistency)
    const [name, setName] = useState("");
    const [sellerType, setSellerType] = useState<SellerType>(SellerType.SILVER);
    const [sellerId, setSellerId] = useState(""); // This is the manager's user ID
    const [startedBalance, setStartedBalance] = useState<number>(0);
    const [balance, setBalance] = useState<number>(0);
    const [isActive, setIsActive] = useState(true);

    // Address States
    const [adresseLigne1, setAdresseLigne1] = useState("");
    const [departement, setDepartement] = useState("");
    const [commune, setCommune] = useState("");
    const [sectionCommunale, setSectionCommunale] = useState("");

    const [openManagerPopover, setOpenManagerPopover] = useState(false);

    // Fetch Enterprise ID
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const enterprisesPromise = enterpriseApi.getAll({ limit: 100 });
                let resolvedId = "";

                // 1. Check local storage cache first
                const storedUser = localStorage.getItem('agisa_user');
                if (storedUser) {
                    const user = JSON.parse(storedUser);
                    const membership = user.memberships?.find((m: any) => m.enterprise?.enterpriseCode === enterpriseCode);
                    if (membership) {
                        resolvedId = membership.enterprise.id;
                    }
                }

                // Fetch enterprises
                const entResp = await enterprisesPromise;
                const allEnts = entResp.data || (Array.isArray(entResp) ? entResp : []);
                setAvailableEnterprises(allEnts);

                // 2. Fallback: Lookup enterprise by code if not in cache
                if (!resolvedId && enterpriseCode) {
                    const found = allEnts.find((e: any) => e.enterpriseCode === enterpriseCode);
                    if (found) {
                        resolvedId = found.id;
                    }
                }

                if (resolvedId) {
                    setEnterpriseId(resolvedId);
                }

            } catch (error) {
                console.error("Failed to fetch initial data", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchInitialData();
    }, [enterpriseCode]);

    const fetchMembers = useCallback(async (entId: string) => {
        if (!entId) return;
        setIsMembersLoading(true);
        try {
            const res = await membershipApi.getByEnterprise(entId);
            const allMembers = res.data || [];
            // Filter to only show users with the 'SELLER' role level in this enterprise
            const sellersOnly = allMembers.filter((m: any) =>
                m.membershipRoles?.some((mr: any) =>
                    mr.role?.level === "SELLER"
                )
            );
            setMembers(sellersOnly);
        } catch (error) {
            console.error("Failed to fetch members:", error);
        } finally {
            setIsMembersLoading(false);
        }
    }, []);

    useEffect(() => {
        if (enterpriseId && (isDialogOpen || isEditDialogOpen)) {
            fetchMembers(enterpriseId);
        }
    }, [enterpriseId, isDialogOpen, isEditDialogOpen, fetchMembers]);

    // Reset sellerId when enterprise changes (only in Add mode)
    useEffect(() => {
        if (isDialogOpen) {
            setSellerId("");
        }
    }, [enterpriseId, isDialogOpen]);

    // Fetch Sellers
    const loadSellers = useCallback(async (page = 1, search = "") => {
        // If no ID, don't attempt to fetch but DO stop loading
        if (!enterpriseId) {
            setIsLoading(false);
            setSellers([]);
            return;
        }

        setIsLoading(true);
        try {
            const resp = await sellerApi.getAll({
                page,
                limit: itemsPerPage,
                search: search || undefined,
                enterpriseId
            });
            setSellers(resp.data || []);
            setTotalPages(resp.meta?.lastPage || 1);
            setTotalItems(resp.meta?.total || 0);
        } catch (error: any) {
            toast.error("Failed to load sellers", {
                description: error.response?.data?.message || "Server connection error"
            });
        } finally {
            setIsLoading(false);
        }
    }, [enterpriseId]);

    useEffect(() => {
        const timer = setTimeout(() => {
            loadSellers(currentPage, searchTerm);
        }, 500);
        return () => clearTimeout(timer);
    }, [loadSellers, currentPage, searchTerm]);

    const handleResetFilters = () => {
        setSearchTerm("");
        setTypeFilter("all");
        setStatusFilter("all");
        setCurrentPage(1);
    };

    const resetForm = () => {
        setName("");
        setSellerType(SellerType.SILVER);
        setSellerId("");
        setStartedBalance(0);
        setBalance(0);
        setAdresseLigne1("");
        setDepartement("");
        setCommune("");
        setSectionCommunale("");
        setIsActive(true);
        setSelectedSeller(null);
    };

    const handleAddSeller = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) {
            toast.error("Please provide a name for the seller");
            return;
        }

        setIsSubmitting(true);
        try {
            await sellerApi.create({
                name,
                type: sellerType,
                enterpriseId,
                startedBalance,
                balance,
                sellerId: (sellerId === "none" || !sellerId) ? undefined : sellerId,
                adresse: {
                    adresseLigne1,
                    departement,
                    commune,
                    sectionCommunale
                }
            });
            toast.success("Seller created successfully");
            setIsDialogOpen(false);
            resetForm();
            loadSellers();
        } catch (error: any) {
            toast.error("Creation failed", {
                description: error.response?.data?.message || "An error occurred"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const openEditSeller = (seller: SellerTypeData) => {
        setSelectedSeller(seller);
        setName(seller.name);
        setSellerType(seller.type as SellerType);
        setSellerId(seller.sellerId || "");
        setStartedBalance(Number(seller.startedBalance));
        setBalance(Number(seller.balance));
        setAdresseLigne1(seller.adresse?.adresseLigne1 || "");
        setDepartement(seller.adresse?.departement || "");
        setCommune(seller.adresse?.commune || "");
        setSectionCommunale(seller.adresse?.sectionCommunale || "");
        setIsActive(seller.isActive !== false);
        setIsEditDialogOpen(true);
    };

    const openViewSeller = (seller: SellerTypeData) => {
        setViewSellerData(seller);
        setIsViewDialogOpen(true);
    };

    const handleUpdateSeller = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSeller) return;

        setIsSubmitting(true);
        try {
            await sellerApi.update(selectedSeller.id, {
                name,
                type: sellerType,
                enterpriseId,
                startedBalance,
                balance,
                sellerId: (sellerId === "none" || !sellerId) ? undefined : sellerId,
                adresse: {
                    adresseLigne1,
                    departement,
                    commune,
                    sectionCommunale,
                },
                isActive
            } as UpdateSellerRequest);
            toast.success("Seller updated successfully");
            setIsEditDialogOpen(false);
            loadSellers();
        } catch (error: any) {
            toast.error("Update failed", {
                description: error.response?.data?.message || "An error occurred"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteSeller = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this seller?")) return;
        try {
            await sellerApi.delete(id);
            toast.success("Seller deleted successfully");
            loadSellers();
        } catch (error: any) {
            toast.error("Deletion failed", {
                description: error.response?.data?.message || "An error occurred"
            });
        }
    };



    const filteredSellers = sellers.filter(s => {
        const matchesType = typeFilter === "all" || s.type === typeFilter;
        const matchesStatus = statusFilter === "all" || (statusFilter === "active" ? s.isActive : !s.isActive);
        return matchesType && matchesStatus;
    });

    return (
        <div className="space-y-6 pt-6">
            <Card className="border-white/10 bg-black/40 backdrop-blur-xl">
                <CardHeader className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <CardTitle className="text-white text-xl flex flex-wrap items-center gap-2 font-bold uppercase tracking-wider">
                            <Building2 className="h-5 w-5 text-emerald-500 shrink-0" />
                            <span className="truncate">Seller Management</span>
                            {totalItems > 0 && (
                                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-2 py-0.5 rounded-md font-black whitespace-nowrap">
                                    {totalItems} TOTAL
                                </Badge>
                            )}
                        </CardTitle>
                        <p className="text-[10px] text-zinc-500 mt-1 font-bold uppercase tracking-tight">Configure and manage enterprise sales points and accounts.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <div className="relative flex-1 sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                            <Input
                                placeholder="Search sellers..."
                                className="bg-white/5 border-white/10 pl-10 text-white focus-visible:ring-emerald-500/50 h-10"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                            />
                        </div>
                        <Button
                            onClick={() => { resetForm(); setIsDialogOpen(true); }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-widest text-[11px] h-10 px-4"
                        >
                            <Plus className="h-4 w-4 mr-2" /> Add Seller
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-white/5">
                        <div className="flex items-center gap-2">
                            <Select value={typeFilter} onValueChange={(val) => { setTypeFilter(val); setCurrentPage(1); }}>
                                <SelectTrigger className="w-[140px] bg-white/5 border-white/10 text-white font-bold text-[10px] uppercase h-10">
                                    <div className="flex items-center gap-2">
                                        <Filter className="h-3 w-3 text-emerald-500" />
                                        <SelectValue placeholder="Type" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-950 border-white/10 text-white">
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value={SellerType.PLATINUM}>PLATINUM</SelectItem>
                                    <SelectItem value={SellerType.GOLD}>GOLD</SelectItem>
                                    <SelectItem value={SellerType.SILVER}>SILVER</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}>
                                <SelectTrigger className="w-[140px] bg-white/5 border-white/10 text-white font-bold text-[10px] uppercase h-10">
                                    <div className="flex items-center gap-2">
                                        <Filter className="h-3 w-3 text-emerald-500" />
                                        <SelectValue placeholder="Status" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-950 border-white/10 text-white">
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="suspended">Suspended</SelectItem>
                                </SelectContent>
                            </Select>

                            {(searchTerm || typeFilter !== "all" || statusFilter !== "all") && (
                                <Button
                                    variant="ghost"
                                    onClick={handleResetFilters}
                                    className="text-zinc-500 hover:text-white font-bold text-[10px] uppercase tracking-widest px-3 h-10"
                                >
                                    <X className="h-3 w-3 mr-1" /> Reset
                                </Button>
                            )}
                        </div>
                    </div>
                    <div className="rounded-md border border-white/10 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-white/5">
                                <TableRow className="border-white/10 hover:bg-transparent">
                                    <TableHead className="text-[10px] font-black uppercase text-zinc-500 tracking-widest pl-6 h-12">Seller Point</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-zinc-500 tracking-widest h-12">Type</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-zinc-500 tracking-widest h-12">Balance</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-zinc-500 tracking-widest h-12">Status</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-zinc-500 tracking-widest h-12">Assigned Seller</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase text-zinc-500 tracking-widest h-12">Location</TableHead>
                                    <TableHead className="text-right pr-6 h-12 text-[10px] font-black uppercase text-zinc-500 tracking-widest">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-64 text-center">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
                                                <span className="text-zinc-500 font-bold text-xs uppercase tracking-[0.2em] animate-pulse">Synchronizing Portfolios...</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredSellers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-64 text-center">
                                            <div className="flex flex-col items-center justify-center gap-2 opacity-30">
                                                <AlertCircle className="h-12 w-12 text-zinc-500" />
                                                <span className="text-zinc-500 font-bold text-xs uppercase tracking-widest uppercase">No sellers found match these parameters</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredSellers.map((seller) => (
                                        <TableRow key={seller.id} className="border-white/10 hover:bg-white/5 transition-colors">
                                            <TableCell className="pl-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="max-w-[180px]">
                                                        <div className="font-bold text-zinc-200 text-sm truncate">{seller.name}</div>
                                                        <div className="text-[10px] text-zinc-500 font-medium uppercase mt-0.5">
                                                            {seller.enterprise?.name}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        "text-[10px] rounded-md uppercase font-bold px-2 py-0.5",
                                                        getTypeColor(seller.type)
                                                    )}
                                                >
                                                    {seller.type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-1.5">
                                                        <DollarSign className="h-3 w-3 text-emerald-500" />
                                                        <span className="text-emerald-500 font-bold text-xs">
                                                            {seller.balance}
                                                        </span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    className={cn(
                                                        "text-[9px] font-bold rounded-md px-2 py-0",
                                                        seller.isActive !== false
                                                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                                            : "bg-red-500/10 text-red-500 border-red-500/20"
                                                    )}
                                                    variant="outline"
                                                >
                                                    {seller.isActive !== false ? "ACTIVE" : "INACTIVE"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-zinc-400 text-xs font-medium">
                                                {seller.seller ? (
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="h-7 w-7 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[10px] font-bold text-emerald-500 shrink-0">
                                                            {seller.seller.fullName.charAt(0)}
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="font-bold text-zinc-300 truncate text-[11px]">{seller.seller.fullName}</span>
                                                            <span className="text-[9px] text-zinc-500 truncate lowercase">{seller.seller.email}</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 text-zinc-600 italic text-[11px]">
                                                        <Users className="h-3.5 w-3.5 opacity-30" />
                                                        <span>Not Assigned</span>
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col max-w-[150px]">
                                                    <span className="text-[10px] font-bold text-zinc-400 truncate">{seller.adresse?.adresseLigne1 || "N/A"}</span>
                                                    <span className="text-[9px] text-zinc-500 font-medium uppercase truncate">
                                                        {seller.adresse?.commune && seller.adresse?.departement
                                                            ? `${seller.adresse.commune}, ${seller.adresse.departement}`
                                                            : "No location"}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0 text-zinc-500 hover:text-white hover:bg-white/10 rounded-full">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="bg-zinc-900 border-white/10 text-white min-w-[160px]">
                                                        <DropdownMenuLabel className="text-[10px] uppercase font-black text-zinc-500 tracking-widest px-2 py-1.5">Actions</DropdownMenuLabel>
                                                        <DropdownMenuSeparator className="bg-white/5" />
                                                        <DropdownMenuItem className="cursor-pointer gap-2 font-bold text-xs py-2" onClick={() => openViewSeller(seller)}>
                                                            <Eye className="h-3.5 w-3.5 text-blue-400" /> View Seller
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="cursor-pointer gap-2 font-bold text-xs py-2" onClick={() => openEditSeller(seller)}>
                                                            <Edit className="h-3.5 w-3.5 text-blue-400" /> Edit Seller
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="cursor-pointer gap-2 font-bold text-xs py-2 text-red-400 hover:text-red-300" onClick={() => handleDeleteSeller(seller.id)}>
                                                            <Trash className="h-3.5 w-3.5" /> Delete Seller
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
                {totalPages > 1 && (
                    <div className="py-4 border-t border-white/5 px-6">
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        className={cn("cursor-pointer bg-white/5 hover:bg-white/10 text-white border-white/10 font-bold text-[10px] uppercase", currentPage === 1 && "pointer-events-none opacity-50")}
                                    />
                                </PaginationItem>
                                {[...Array(totalPages)].map((_, i) => (
                                    <PaginationItem key={i}>
                                        <PaginationLink
                                            isActive={currentPage === i + 1}
                                            onClick={() => setCurrentPage(i + 1)}
                                            className={cn(
                                                "cursor-pointer font-bold text-[10px] border-white/10",
                                                currentPage === i + 1 ? "bg-emerald-600 text-white hover:bg-emerald-500" : "bg-white/5 text-zinc-400 hover:bg-white/10"
                                            )}
                                        >
                                            {i + 1}
                                        </PaginationLink>
                                    </PaginationItem>
                                ))}
                                <PaginationItem>
                                    <PaginationNext
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        className={cn("cursor-pointer bg-white/5 hover:bg-white/10 text-white border-white/10 font-bold text-[10px] uppercase", currentPage === totalPages && "pointer-events-none opacity-50")}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </div>
                )}
            </Card>

            {/* Add Seller Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[700px] bg-zinc-950 border-white/10 text-white max-h-[90vh] overflow-y-auto">
                    <form onSubmit={handleAddSeller}>
                        <DialogHeader>
                            <DialogTitle className="text-white text-xl flex items-center gap-2">
                                <Plus className="h-5 w-5 text-emerald-500" />
                                Add New Seller Point
                            </DialogTitle>
                            <p className="text-xs text-zinc-500 mt-1 uppercase font-bold tracking-tight">Create a new point of sale for this enterprise.</p>
                        </DialogHeader>

                        {availableEnterprises.length > 0 && (
                            <div className="grid gap-2 px-1 mt-4">
                                <Label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">Enterprise</Label>
                                <Select value={enterpriseId} onValueChange={setEnterpriseId}>
                                    <SelectTrigger className="bg-white/5 border-white/10 text-white font-bold h-11 uppercase text-[10px]">
                                        <SelectValue placeholder="Select enterprise" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-950 border-white/10 text-white">
                                        {availableEnterprises.map((ent) => (
                                            <SelectItem key={ent.id} value={ent.id} className="text-[10px] font-bold uppercase transition-colors">
                                                {ent.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="grid gap-6 py-6 border-y border-white/5 my-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">Point Name</Label>
                                    <Input
                                        className="bg-white/5 border-white/10 text-white focus-visible:ring-emerald-500/50 h-11 font-bold"
                                        placeholder="Enter point name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">Point Level</Label>
                                    <Select value={sellerType} onValueChange={(val) => setSellerType(val as SellerType)}>
                                        <SelectTrigger className="bg-white/5 border-white/10 text-white font-bold h-11 uppercase text-[10px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-950 border-white/10 text-white">
                                            <SelectItem value={SellerType.PLATINUM}>💎 PLATINUM</SelectItem>
                                            <SelectItem value={SellerType.GOLD}>🥇 GOLD</SelectItem>
                                            <SelectItem value={SellerType.SILVER}>🥈 SILVER</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">Starting Balance</Label>
                                    <Input
                                        type="number"
                                        className="bg-white/5 border-white/10 text-white focus-visible:ring-emerald-500/50 h-11 font-bold"
                                        value={startedBalance}
                                        onChange={(e) => {
                                            const val = Number(e.target.value);
                                            setStartedBalance(val);
                                            setBalance(val);
                                        }}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">Current Balance</Label>
                                    <Input
                                        type="text"
                                        disabled
                                        className="bg-zinc-800 border-white/5 text-zinc-500 focus-visible:ring-emerald-500/50 h-11 font-bold cursor-not-allowed opacity-50"
                                        value={balance}
                                        onChange={(e) => setBalance(Number(e.target.value))}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest text-[#50c594]">Status</Label>
                                    <Select
                                        value={isActive ? "active" : "suspended"}
                                        onValueChange={(val) => setIsActive(val === "active")}
                                    >
                                        <SelectTrigger className="bg-white/5 border-white/10 text-white font-bold h-11 uppercase text-[10px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-950 border-white/10 text-white">
                                            <SelectItem value="active" className="text-[10px] font-bold uppercase transition-colors">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                                    Active
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="suspended" className="text-[10px] font-bold uppercase transition-colors">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-red-500" />
                                                    Suspended
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid gap-2">
                                    <Label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest flex items-center gap-2">
                                        <Users className="h-3 w-3 text-emerald-500" />
                                        Assigned Seller (Optional)
                                    </Label>
                                    <Popover open={openManagerPopover} onOpenChange={setOpenManagerPopover}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                disabled={!enterpriseId}
                                                className="bg-white/5 border-white/10 hover:bg-white/10 text-white justify-between font-bold h-11 text-xs disabled:opacity-50"
                                            >
                                                {sellerId
                                                    ? (members.find((m) => m.user?.id === sellerId)?.user?.fullName || "Select seller...")
                                                    : "Select seller..."}
                                                <Users className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-zinc-950 border-white/10">
                                            <Command className="bg-transparent">
                                                <CommandInput placeholder="Search member..." className="text-white" />
                                                <CommandEmpty className="text-zinc-500 py-6 text-center text-xs">
                                                    {isMembersLoading ? "Loading..." : "No members found in this enterprise."}
                                                </CommandEmpty>
                                                <CommandGroup className="max-h-[200px] overflow-y-auto custom-scrollbar">
                                                    <CommandItem
                                                        value="none"
                                                        onSelect={() => {
                                                            setSellerId("");
                                                            setOpenManagerPopover(false);
                                                        }}
                                                        className="text-white hover:bg-white/5 cursor-pointer text-xs font-bold"
                                                    >
                                                        <X className="mr-2 h-4 w-4 text-zinc-500" />
                                                        No Seller
                                                    </CommandItem>
                                                    {members.map((member) => (
                                                        <CommandItem
                                                            key={member.user?.id}
                                                            value={member.user?.fullName}
                                                            onSelect={() => {
                                                                setSellerId(member.user?.id);
                                                                setOpenManagerPopover(false);
                                                            }}
                                                            className="text-white hover:bg-white/5 cursor-pointer text-xs font-bold flex items-center gap-2"
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
                                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
                                    <MapPin className="h-3 w-3 text-emerald-500" /> Address Details
                                </h3>
                                <div className="grid gap-4">
                                    <div className="grid gap-2">
                                        <Label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">Street Address</Label>
                                        <Input
                                            className="bg-white/5 border-white/10 text-white focus-visible:ring-emerald-500/50 h-11 font-bold"
                                            placeholder="ex: 734, rue sylvestre"
                                            value={adresseLigne1}
                                            onChange={(e) => setAdresseLigne1(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">Department</Label>
                                            <Input
                                                className="bg-white/5 border-white/10 text-white focus-visible:ring-emerald-500/50 h-11 font-bold"
                                                placeholder="ex: Nord"
                                                value={departement}
                                                onChange={(e) => setDepartement(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">Commune</Label>
                                            <Input
                                                className="bg-white/5 border-white/10 text-white focus-visible:ring-emerald-500/50 h-11 font-bold"
                                                placeholder="ex: Saint-Raphael"
                                                value={commune}
                                                onChange={(e) => setCommune(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">Section Communale</Label>
                                        <Input
                                            className="bg-white/5 border-white/10 text-white focus-visible:ring-emerald-500/50 h-11 font-bold"
                                            placeholder="ex: Sanyago"
                                            value={sectionCommunale}
                                            onChange={(e) => setSectionCommunale(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white w-full uppercase font-bold tracking-widest h-12"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    "Create Seller"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Seller Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[700px] bg-zinc-950 border-white/10 text-white max-h-[90vh] overflow-y-auto">
                    <form onSubmit={handleUpdateSeller}>
                        <DialogHeader>
                            <DialogTitle className="text-white text-xl flex items-center gap-2">
                                <Edit className="h-5 w-5 text-emerald-500" />
                                Edit Seller Profile
                            </DialogTitle>
                            <p className="text-xs text-zinc-500 mt-1 uppercase font-bold tracking-tight">Update details for {selectedSeller?.name}</p>
                        </DialogHeader>

                        <div className="grid gap-6 py-6 border-y border-white/5 my-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">Seller Name</Label>
                                    <Input
                                        className="bg-white/5 border-white/10 text-white focus-visible:ring-emerald-500/50 h-11 font-bold"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">Seller Type</Label>
                                    <Select value={sellerType} onValueChange={(val) => setSellerType(val as SellerType)}>
                                        <SelectTrigger className="bg-white/5 border-white/10 text-white font-bold h-11 uppercase text-[10px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-950 border-white/10 text-white">
                                            <SelectItem value={SellerType.PLATINUM}>💎 PLATINUM</SelectItem>
                                            <SelectItem value={SellerType.GOLD}>🥇 GOLD</SelectItem>
                                            <SelectItem value={SellerType.SILVER}>🥈 SILVER</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">Starting Balance (HTG)</Label>
                                    <Input
                                        type="number"
                                        className="bg-white/5 border-white/10 text-white focus-visible:ring-emerald-500/50 h-11 font-bold"
                                        value={startedBalance}
                                        onChange={(e) => setStartedBalance(Number(e.target.value))}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">Current Balance (HTG)</Label>
                                    <Input
                                        type="text"
                                        className="bg-white/5 border-white/10 text-white focus-visible:ring-emerald-500/50 h-11 font-bold"
                                        disabled
                                        value={balance}
                                        onChange={(e) => setBalance(Number(e.target.value))}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest text-[#50c594]">Status</Label>
                                    <Select
                                        value={isActive ? "active" : "suspended"}
                                        onValueChange={(val) => setIsActive(val === "active")}
                                    >
                                        <SelectTrigger className="bg-white/5 border-white/10 text-white font-bold h-11 uppercase text-[10px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-950 border-white/10 text-white">
                                            <SelectItem value="active" className="text-[10px] font-bold uppercase">🟢 Active</SelectItem>
                                            <SelectItem value="suspended" className="text-[10px] font-bold uppercase">🔴 Suspended</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid gap-2">
                                    <Label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest flex items-center gap-2">
                                        <Users className="h-3 w-3 text-emerald-500" />
                                        Assigned Seller (Optional)
                                    </Label>
                                    <Popover open={openManagerPopover} onOpenChange={setOpenManagerPopover}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                className="bg-white/5 border-white/10 hover:bg-white/10 text-white justify-between font-bold h-11 text-xs"
                                            >
                                                {sellerId
                                                    ? (members.find((m) => m.user?.id === sellerId)?.user?.fullName || "Select seller...")
                                                    : "Select seller..."}
                                                <Users className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-zinc-950 border-white/10">
                                            <Command className="bg-transparent">
                                                <CommandInput placeholder="Search member..." className="text-white" />
                                                <CommandEmpty className="text-zinc-500 py-6 text-center text-xs">
                                                    {isMembersLoading ? "Loading..." : "No members found in this enterprise."}
                                                </CommandEmpty>
                                                <CommandGroup className="max-h-[200px] overflow-y-auto custom-scrollbar">
                                                    <CommandItem
                                                        value="none"
                                                        onSelect={() => {
                                                            setSellerId("");
                                                            setOpenManagerPopover(false);
                                                        }}
                                                        className="text-white hover:bg-white/5 cursor-pointer text-xs font-bold"
                                                    >
                                                        <X className="mr-2 h-4 w-4 text-zinc-500" />
                                                        No Seller
                                                    </CommandItem>
                                                    {members.map((member) => (
                                                        <CommandItem
                                                            key={member.user?.id}
                                                            value={member.user?.fullName}
                                                            onSelect={() => {
                                                                setSellerId(member.user?.id);
                                                                setOpenManagerPopover(false);
                                                            }}
                                                            className="text-white hover:bg-white/5 cursor-pointer text-xs font-bold flex items-center gap-2"
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
                                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
                                    <MapPin className="h-3 w-3 text-emerald-500" /> Address Details
                                </h3>
                                <div className="grid gap-4">
                                    <div className="grid gap-2">
                                        <Label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">Street Address</Label>
                                        <Input
                                            className="bg-white/5 border-white/10 text-white focus-visible:ring-emerald-500/50 h-11 font-bold"
                                            value={adresseLigne1}
                                            onChange={(e) => setAdresseLigne1(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">Department</Label>
                                            <Input
                                                className="bg-white/5 border-white/10 text-white focus-visible:ring-emerald-500/50 h-11 font-bold"
                                                value={departement}
                                                onChange={(e) => setDepartement(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">Commune</Label>
                                            <Input
                                                className="bg-white/5 border-white/10 text-white focus-visible:ring-emerald-500/50 h-11 font-bold"
                                                value={commune}
                                                onChange={(e) => setCommune(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">Section Communale</Label>
                                        <Input
                                            className="bg-white/5 border-white/10 text-white focus-visible:ring-emerald-500/50 h-11 font-bold"
                                            value={sectionCommunale}
                                            onChange={(e) => setSectionCommunale(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white w-full uppercase font-bold tracking-widest h-12"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    "Save Changes"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* View Seller Details Dialog */}
            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent className="sm:max-w-[750px] bg-zinc-950 border-white/10 text-white p-0 overflow-hidden max-h-[90vh] flex flex-col">
                    <DialogHeader className="p-6 pb-1 border-b border-white/5">
                        <DialogTitle className="text-white text-xl flex items-center gap-2">
                            Seller Point Details
                        </DialogTitle>
                        <DialogDescription className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest mt-1">
                            Review full information for this location
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 pt-0">
                        {/* Header Info Section */}
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <h2 className="text-2xl font-black text-white tracking-tight uppercase">{viewSellerData?.name}</h2>
                                <div className="flex items-center gap-2">
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                            "text-[10px] rounded-md uppercase font-bold px-2 py-0.5",
                                            getTypeColor(viewSellerData?.type || "")
                                        )}
                                    >
                                        {viewSellerData?.type}
                                    </Badge>
                                    <Badge
                                        className={cn(
                                            "text-[10px] font-bold rounded-md px-2 py-0.5",
                                            viewSellerData?.isActive !== false
                                                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                                : "bg-red-500/10 text-red-500 border-red-500/20"
                                        )}
                                        variant="outline"
                                    >
                                        {viewSellerData?.isActive !== false ? "ACTIVE" : "INACTIVE"}
                                    </Badge>
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                            "text-[10px] rounded-md uppercase font-bold px-2 py-0.5",
                                            "bg-orange-500/10 text-orange-500 border-orange-500/20"
                                        )}
                                    >
                                        {viewSellerData?.code || "N/A"}
                                    </Badge>
                                </div>
                            </div>
                            <div className="h-12 w-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                                <Building2 className="h-6 w-6 text-emerald-500" />
                            </div>
                        </div>

                        {/* Financials & Management Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 rounded-xl border border-white/10 p-4 space-y-3">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                    <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                                    Financials
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[9px] text-zinc-500 font-bold uppercase">Balance</span>
                                        <span className="text-sm font-black text-emerald-500">
                                            {new Intl.NumberFormat('fr-HT', { style: 'currency', currency: 'HTG' }).format(Number(viewSellerData?.balance || 0))}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-end border-t border-white/5 pt-1">
                                        <span className="text-[9px] text-zinc-500 font-bold uppercase">Started</span>
                                        <span className="text-[11px] font-bold text-zinc-300">
                                            {new Intl.NumberFormat('fr-HT', { style: 'currency', currency: 'HTG' }).format(Number(viewSellerData?.startedBalance || 0))}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <span className="text-[9px] text-zinc-500 font-bold uppercase">Commission</span>
                                        <span className="text-[11px] font-bold text-blue-400">{viewSellerData?.commission || 0}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white/5 rounded-xl border border-white/10 p-4 space-y-3">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                    <Users className="h-3.5 w-3.5 text-blue-400" />
                                    Account Manager
                                </div>
                                {viewSellerData?.seller ? (
                                    <div className="space-y-1">
                                        <div className="flex items-start gap-3">
                                            <div className="h-7 w-7 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[10px] font-bold text-blue-400 shrink-0">
                                                {viewSellerData.seller.fullName.charAt(0)}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-bold text-zinc-200 text-xs truncate">{viewSellerData.seller.fullName}</span>
                                                <span className="text-[9px] text-zinc-500 truncate lowercase">{viewSellerData.seller.email}</span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-end border-t border-white/5 pt-1">
                                            {/* Creation Meta */}
                                            <div className="flex items-center justify-between text-[9px] text-zinc-600 font-bold uppercase tracking-widest px-1">
                                                <span>Since: {viewSellerData?.createdAt ? new Date(viewSellerData.createdAt).toLocaleDateString() : "N/A"}</span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-zinc-600 italic text-[11px] h-8">
                                        <Ban className="h-3.5 w-3.5 opacity-30" />
                                        <span>Not Assigned</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Location Details */}
                        <div className="bg-white/5 rounded-xl border border-white/10 p-4 space-y-4 shadow-inner">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                <MapPin className="h-3.5 w-3.5 text-red-500" />
                                Location Address
                            </div>
                            <div className="grid grid-cols-4 gap-6">
                                <div className="space-y-1">
                                    <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Street Address</span>
                                    <p className="text-sm font-bold text-zinc-100 truncate">{viewSellerData?.adresse?.adresseLigne1 || "N/A"}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Department</span>
                                    <p className="text-sm font-bold text-zinc-100">{viewSellerData?.adresse?.departement || "N/A"}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Commune</span>
                                    <p className="text-sm font-bold text-zinc-100">{viewSellerData?.adresse?.commune || "N/A"}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Section Communale</span>
                                    <p className="text-sm font-bold text-zinc-100">{viewSellerData?.adresse?.sectionCommunale || "N/A"}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-4 bg-white/5 border-t border-white/10">
                        <Button
                            variant="outline"
                            onClick={() => setIsViewDialogOpen(false)}
                            className="w-full bg-white/5 border-white/10 hover:bg-white/10 text-white font-bold uppercase tracking-widest text-[11px]"
                        >
                            Close Details
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Seller;