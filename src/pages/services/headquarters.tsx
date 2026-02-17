import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../../components/ui/table";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../../components/ui/select";
import {
    ShieldHalf,
    Plus,
    Edit,
    User as UserIcon,
    Search,
    MoreVertical,
    Eye,
    Ban,
    Check,
    Users,
    Loader2,
    MapPin,
    Send
} from "lucide-react";
import { Input } from "../../components/ui/input";
import { toast } from "sonner";
import headquartersApi, { Headquarter } from "../../context/api/headquarters";
import enterpriseApi, { Enterprise } from "../../context/api/enterprise";
import membershipApi from "../../context/api/membership";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "../../components/ui/pagination";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../../components/ui/dropdown-menu";
import { cn } from "../../lib/utils";
import { Label } from "../../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import requestApi, { Request, RequestStatus, RequestType } from "../../context/api/request";
import { parseISO, format } from "date-fns";
import usersApi from "../../context/api/users";

const Headquarters: React.FC = () => {
    const { enterpriseCode } = useParams<{ enterpriseCode: string }>();
    const [headquarters, setHeadquarters] = useState<Headquarter[]>([]);
    const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, _setEnterprises] = [enterprises, setEnterprises];
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Pagination/Search State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const itemsPerPage = 10;

    // Dialog States
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedHq, setSelectedHq] = useState<Headquarter | null>(null);
    const [selectedViewHq, setSelectedViewHq] = useState<Headquarter | null>(null);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)

    // Form States
    const [name, setName] = useState("");
    const [type, setType] = useState<string>("SILVER");
    const [enterpriseId, setEnterpriseId] = useState("");
    const [commission, setCommission] = useState<number>(0);
    const [balance, setBalance] = useState<number>(0);
    const [startedBalance, setStartedBalance] = useState<number>(0);
    const [managerId, setManagerId] = useState("");
    const [adresseLigne1, setAdresseLigne1] = useState("");
    const [departement, setDepartement] = useState("");
    const [commune, setCommune] = useState("");
    const [sectionCommunale, setSectionCommunale] = useState("");

    const [openEnterprisePopover, setOpenEnterprisePopover] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [__, _setOpenEnterprisePopover] = [openEnterprisePopover, setOpenEnterprisePopover];
    const [openManagerPopover, setOpenManagerPopover] = useState(false);
    const [members, setMembers] = useState<any[]>([]);
    const [isMembersLoading, setIsMembersLoading] = useState(false);

    // Request States
    const [requests, setRequests] = useState<Request[]>([]);
    const [isRequestsLoading, setIsRequestsLoading] = useState(false);

    const fetchData = useCallback(async (page = 1, search = "") => {
        setIsLoading(true);
        try {
            const entRes = await enterpriseApi.getAll({ limit: 100 });
            const allEnterprises = entRes.data || (Array.isArray(entRes) ? entRes : []);
            setEnterprises(allEnterprises);

            let effectiveEnterpriseId = enterpriseId;

            // Auto-select enterpriseId if we have enterpriseCode
            if (enterpriseCode) {
                const currentEnt = allEnterprises.find(e => e.enterpriseCode === enterpriseCode);
                if (currentEnt) {
                    effectiveEnterpriseId = currentEnt.id;
                    setEnterpriseId(currentEnt.id);
                }
            }

            const hqRes = await headquartersApi.getAll({
                page,
                limit: itemsPerPage,
                search: search || undefined,
                enterpriseId: effectiveEnterpriseId || undefined
            });

            setHeadquarters(hqRes.data || []);
            if (hqRes.meta) {
                setTotalPages(hqRes.meta.lastPage || 1);
            }

            // Fetch user info for role checking
            await usersApi.getMe();
        } catch (error) {
            console.error("Failed to fetch headquarters:", error);
            toast.error("Error", { description: "Failed to load data" });
        } finally {
            setIsLoading(false);
        }
    }, [enterpriseId, enterpriseCode]);

    const fetchRequests = useCallback(async () => {
        if (!enterpriseId) return;
        setIsRequestsLoading(true);
        try {
            const res = await requestApi.getAll({ enterpriseId });
            setRequests(res || []);
        } catch (error) {
            console.error("Failed to fetch requests:", error);
        } finally {
            setIsRequestsLoading(false);
        }
    }, [enterpriseId]);

    const fetchMembers = useCallback(async (entId: string) => {
        if (!entId) return;
        setIsMembersLoading(true);
        try {
            const res = await membershipApi.getByEnterprise(entId);
            setMembers(res || []);
        } catch (error) {
            console.error("Failed to fetch members:", error);
        } finally {
            setIsMembersLoading(false);
        }
    }, []);

    useEffect(() => {
        if (enterpriseId && (isAddDialogOpen || isEditDialogOpen)) {
            fetchMembers(enterpriseId);
        }
    }, [enterpriseId, isAddDialogOpen, isEditDialogOpen, fetchMembers]);

    // Re-fetch when enterpriseCode, enterpriseId or search changes
    useEffect(() => {
        fetchData(currentPage, debouncedSearch);
    }, [currentPage, debouncedSearch, enterpriseCode, fetchData]);

    // Auto-fetch requests when enterpriseId is resolved
    useEffect(() => {
        if (enterpriseId) {
            fetchRequests();
        }
    }, [enterpriseId, fetchRequests]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setCurrentPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);


    // Sync balance with startedBalance only when creating a new HQ
    useEffect(() => {
        if (isAddDialogOpen) {
            setBalance(startedBalance);
        }
    }, [startedBalance, isAddDialogOpen]);

    const handleCreate = async () => {
        if (!name || !enterpriseId) {
            toast.error("Validation", { description: "Name and Enterprise are required" });
            return;
        }
        setIsSubmitting(true)
        try {
            await headquartersApi.create({
                name,
                type,
                enterpriseId,
                commission,
                managerId: managerId || undefined,
                startedBalance,
                adresse: {
                    adresseLigne1,
                    departement,
                    commune,
                    sectionCommunale
                }
            });
            toast.success("Success", { description: "Headquarter created" });
            setIsAddDialogOpen(false);
            resetForm();
            fetchData();
        } catch (error) {
            toast.error("Error", { description: "Failed to create" });
        } finally {
            setIsSubmitting(false)
        }
    };

    const handleUpdate = async () => {
        if (!selectedHq || !name) return;
        setIsSubmitting(true);
        try {
            await headquartersApi.update(selectedHq.id, {
                name,
                type,
                commission,
                managerId: managerId || undefined,
                startedBalance,
                adresse: {
                    adresseLigne1,
                    departement,
                    commune,
                    sectionCommunale
                }
            });
            toast.success("Success", { description: "Headquarter updated" });
            setIsEditDialogOpen(false);
            fetchData();
        } catch (error) {
            toast.error("Error", { description: "Failed to update" });
        } finally {
            setIsSubmitting(false)
        }
    };

    // const handleDelete = async (id: string) => {
    //     if (!window.confirm("Are you sure?")) return;
    //     try {
    //         await headquartersApi.delete(id);
    //         toast.success("Deleted");
    //         fetchData();
    //     } catch (error) {
    //         toast.error("Failed to delete");
    //     }
    // };
    const handleViewhq = (hq: Headquarter) => {
        setSelectedViewHq(hq)
        setIsViewDialogOpen(true)
    }

    const handleToggleStatus = async (hq: Headquarter) => {
        try {
            await headquartersApi.update(hq.id, { isActive: !hq.isActive });
            toast.success(hq.isActive ? "HQ suspended" : "HQ activated");
            fetchData();
        } catch (error: any) {
            toast.error("Operation failed", {
                description: error.response?.data?.message || "An error occurred"
            });
        }
    };

    const handleApproveRequest = async (requestId: string, notes?: string) => {
        try {
            await requestApi.approve(requestId, { reviewerNotes: notes || "Approved" });
            toast.success("Request approved successfully");
            fetchRequests();
        } catch (error: any) {
            toast.error("Failed to approve", { description: error.response?.data?.message });
        }
    };

    const handleRejectRequest = async (requestId: string, notes: string) => {
        try {
            await requestApi.reject(requestId, { reviewerNotes: notes });
            toast.success("Request rejected");
            fetchRequests();
        } catch (error: any) {
            toast.error("Failed to reject", { description: error.response?.data?.message });
        }
    };

    const handleTransferToAccounting = async (id: string) => {
        try {
            await requestApi.accounting(id);
            toast.success("Request transferred to accounting");
            fetchRequests();
        } catch (error: any) {
            toast.error("Transfer failed", { description: error.response?.data?.message });
        }
    };

    const resetForm = () => {
        setName("");
        setType("SILVER");
        setEnterpriseId("");
        setCommission(0);
        setBalance(0);
        setStartedBalance(0);
        setManagerId("");
        setAdresseLigne1("");
        setDepartement("");
        setCommune("");
        setSectionCommunale("");
        setSelectedHq(null);
        setMembers([]);
    };

    const openEdit = (hq: Headquarter) => {
        setSelectedHq(hq);
        setName(hq.name);
        setType(hq.type as any);
        setEnterpriseId(hq.enterpriseId);
        setCommission(hq.commission || 0);
        setBalance(hq.balance || 0);
        setStartedBalance(hq.startedBalance || 0);
        setManagerId(hq.managerId || "");
        setAdresseLigne1(hq.adresse?.adresseLigne1 || "");
        setDepartement(hq.adresse?.departement || "");
        setCommune(hq.adresse?.commune || "");
        setSectionCommunale(hq.adresse?.sectionCommunale || "");
        setIsEditDialogOpen(true);
    };

    return (
        <div className="space-y-6 pt-6">
            <Tabs defaultValue="units" className="w-full" onValueChange={(val) => val === 'requests' && fetchRequests()}>
                <div className="flex items-center justify-between mb-2">
                    <TabsList className="bg-white/5 border border-white/10 p-1">
                        <TabsTrigger
                            value="units"
                            className="data-[state=active]:bg-emerald-500 data-[state=active]:text-black text-zinc-400 font-bold uppercase text-[10px] tracking-widest px-6"
                        >
                            Units
                        </TabsTrigger>
                        <TabsTrigger
                            value="requests"
                            className="data-[state=active]:bg-emerald-500 data-[state=active]:text-black text-zinc-400 font-bold uppercase text-[10px] tracking-widest px-6"
                        >
                            Requests
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="units" className="mt-0">
                    <Card className="border-white/10 bg-black/40 backdrop-blur-xl">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-white text-xl flex items-center gap-2">
                                    <ShieldHalf className="h-5 w-5 text-emerald-500" />
                                    Headquarters Management
                                </CardTitle>
                                <p className="text-xs text-zinc-500 mt-1">Manage organizational units and their scoping.</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="relative w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                    <Input
                                        placeholder="Search HQ..."
                                        className="bg-white/5 border-white/10 pl-10 text-white focus-visible:ring-emerald-500/50"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <Button
                                    onClick={() => { resetForm(); setIsAddDialogOpen(true); }}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                    <Plus className="h-4 w-4 mr-2" /> Add HQ
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border border-white/10 overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-white/5">
                                        <TableRow className="border-white/10 hover:bg-transparent">
                                            <TableHead className="text-zinc-500 font-bold uppercase text-[10px]">HQ Name</TableHead>
                                            <TableHead className="text-zinc-500 font-bold uppercase text-[10px]">Type</TableHead>
                                            <TableHead className="text-zinc-500 font-bold uppercase text-[10px]">Enterprise</TableHead>
                                            <TableHead className="text-zinc-500 font-bold uppercase text-[10px]">Manager</TableHead>
                                            <TableHead className="text-zinc-500 font-bold uppercase text-[10px]">Status</TableHead>
                                            <TableHead className="text-zinc-500 font-bold uppercase text-[10px] text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoading ? (
                                            <TableRow><TableCell colSpan={6} className="text-center py-10 text-zinc-500 italic">Chargement...</TableCell></TableRow>
                                        ) : headquarters.length === 0 ? (
                                            <TableRow><TableCell colSpan={6} className="text-center py-10 text-zinc-500 italic">Aucun HQ trouvé.</TableCell></TableRow>
                                        ) : headquarters.map((hq) => (
                                            <TableRow key={hq.id} className="border-white/10 hover:bg-white/5 transition-colors">
                                                <TableCell className="font-bold text-zinc-200">{hq.name}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-500 rounded-md">
                                                        {hq.type}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-zinc-400 text-xs font-medium uppercase">
                                                    {hq.enterprise?.name || "Global"}
                                                </TableCell>
                                                <TableCell className="text-zinc-400 text-xs font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <UserIcon className="h-3 w-3 text-emerald-500/70" />
                                                        <span>{hq.manager?.fullName || "Not assigned"}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={hq.isActive ? "bg-emerald-500/10 text-emerald-500 border-none rounded-md" : "bg-red-500/10 text-red-500 border-none rounded-md"}>
                                                        {hq.isActive ? "Active" : "Inactive"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost"
                                                                className="h-8 w-8 p-0 text-zinc-500 hover:text-white hover:bg-white/10 rounded-full">
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="bg-zinc-900 border-white/10 text-white min-w-[160px]">
                                                            <DropdownMenuLabel className="text-[10px] uppercase font-black text-zinc-500 tracking-widest px-2 py-1.5">Actions</DropdownMenuLabel>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem className="cursor-pointer gap-2 font-bold text-xs py-2" onClick={() => handleViewhq(hq)}>
                                                                <Eye className="h-3.5 w-3.5 text-blue-400" /> View HQ
                                                            </DropdownMenuItem>

                                                            <DropdownMenuItem
                                                                className={cn(
                                                                    "cursor-pointer gap-2 font-bold text-xs py-2",
                                                                    hq.isActive ? "text-red-400 hover:text-red-300" : "text-emerald-400 hover:text-emerald-300"
                                                                )}
                                                                onClick={() => handleToggleStatus(hq)}
                                                            >
                                                                {hq.isActive ? (
                                                                    <>
                                                                        <Ban className="h-3.5 w-3.5" /> Suspend HQ
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Check className="h-3.5 w-3.5" /> Activate HQ
                                                                    </>
                                                                )}
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination */}
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
                                                    className={currentPage === 1 ? "pointer-events-none opacity-50 text-zinc-500" : "text-white hover:bg-white/10 cursor-pointer"}
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
                                                        className={currentPage === index + 1 ? "bg-emerald-500 text-black border-none font-bold" : "text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer"}
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
                                                    className={currentPage === totalPages ? "pointer-events-none opacity-50 text-zinc-500" : "text-white hover:bg-white/10 cursor-pointer"}
                                                />
                                            </PaginationItem>
                                        </PaginationContent>
                                    </Pagination>
                                </div>
                            )}

                            {/* View HQ Dialog */}
                            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                                <DialogContent className="bg-zinc-900 border-white/10 text-white max-w-lg">
                                    <DialogHeader>
                                        <DialogTitle className="text-xl font-bold flex items-center gap-2 text-emerald-400">
                                            <ShieldHalf className="h-5 w-5" /> HQ Details
                                        </DialogTitle>
                                        <DialogDescription className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">
                                            Detailed information for organizational unit.
                                        </DialogDescription>
                                    </DialogHeader>

                                    {selectedViewHq && (
                                        <div className="grid gap-6 py-4">
                                            <div className="grid grid-cols-3 gap-4">
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">HQ Name</Label>
                                                    <p className="text-sm font-bold text-white">{selectedViewHq.name}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">Type</Label>
                                                    <div>
                                                        <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-500 rounded-md">
                                                            {selectedViewHq.type}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">Code</Label>
                                                    <p className="text-sm font-bold text-orange-400">{selectedViewHq.code || "N/A"}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">Enterprise</Label>
                                                    <p className="text-sm font-bold text-zinc-400 uppercase">{selectedViewHq.enterprise?.name || "Global"}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">Status</Label>
                                                    <div>
                                                        <Badge className={selectedViewHq.isActive ? "bg-emerald-500/10 text-emerald-500 border-none rounded-md" : "bg-red-500/10 text-red-500 border-none rounded-md"}>
                                                            {selectedViewHq.isActive ? "Active" : "Inactive"}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">In charge by</Label>
                                                    <div className="flex items-center gap-2">
                                                        <UserIcon className="h-4 w-4 text-orange-400" />
                                                        <p className="text-sm font-bold text-orange-400">{selectedViewHq.manager?.fullName || "N/A"}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Location Details */}
                                            <div className="bg-white/5 rounded-xl border border-white/10 p-4 space-y-4 shadow-inner mt-2">
                                                <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                                    <MapPin className="h-3.5 w-3.5 text-red-500" />
                                                    Location Address
                                                </div>
                                                <div className="grid grid-cols-4 gap-6">
                                                    <div className="space-y-1">
                                                        <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Street</span>
                                                        <p className="text-sm font-bold text-zinc-100 truncate">{selectedViewHq.adresse?.adresseLigne1 || "N/A"}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Dept</span>
                                                        <p className="text-sm font-bold text-zinc-100">{selectedViewHq.adresse?.departement || "N/A"}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Commune</span>
                                                        <p className="text-sm font-bold text-zinc-100">{selectedViewHq.adresse?.commune || "N/A"}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Section</span>
                                                        <p className="text-sm font-bold text-zinc-100">{selectedViewHq.adresse?.sectionCommunale || "N/A"}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5">
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">Commission</Label>
                                                    <p className="text-sm font-bold text-emerald-500">{selectedViewHq.commission || "0.00"}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">Started Bal</Label>
                                                    <p className="text-sm font-bold text-orange-400">{selectedViewHq.startedBalance || "0.00"} USD</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">Current Bal</Label>
                                                    <p className="text-sm font-bold text-blue-400">{selectedViewHq.balance || "0.00"} USD</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <DialogFooter className="gap-2 sm:gap-0 border-t border-white/5 pt-4">
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                if (selectedViewHq) {
                                                    openEdit(selectedViewHq);
                                                    setIsViewDialogOpen(false);
                                                }
                                            }}
                                            className="bg-emerald-600/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-600 hover:text-white font-bold w-full md:w-auto gap-2"
                                        >
                                            <Edit className="h-4 w-4" /> Edit HQ
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => setIsViewDialogOpen(false)}
                                            className="bg-zinc-800 border-white/5 text-white hover:bg-zinc-700 font-bold w-full md:w-auto"
                                        >
                                            Close
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="requests" className="mt-0">
                    <Card className="border-white/10 bg-black/40 backdrop-blur-xl">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-white text-xl flex items-center gap-2">
                                    <ShieldHalf className="h-5 w-5 text-emerald-500" />
                                    HQ Requests
                                </CardTitle>
                                <p className="text-xs text-zinc-500 mt-1">Review and manage funding/withdrawal requests from regional units.</p>
                            </div>
                            <Button
                                variant="outline"
                                onClick={fetchRequests}
                                className="bg-white/5 border-white/10 text-white hover:bg-white/10 text-xs font-bold uppercase tracking-widest gap-2"
                            >
                                <Loader2 className={cn("h-3 w-3", isRequestsLoading && "animate-spin")} />
                                Refresh Requests
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border border-white/10 overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-white/5">
                                        <TableRow className="border-white/10 hover:bg-transparent">
                                            <TableHead className="text-zinc-500 font-bold uppercase text-[10px]">Type</TableHead>
                                            <TableHead className="text-zinc-500 font-bold uppercase text-[10px]">Headquarter</TableHead>
                                            <TableHead className="text-zinc-500 font-bold uppercase text-[10px]">Amount</TableHead>
                                            <TableHead className="text-zinc-500 font-bold uppercase text-[10px]">Requester</TableHead>
                                            <TableHead className="text-zinc-500 font-bold uppercase text-[10px]">Status</TableHead>
                                            <TableHead className="text-zinc-500 font-bold uppercase text-[10px]">Date</TableHead>
                                            <TableHead className="text-zinc-500 font-bold uppercase text-[10px] text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isRequestsLoading ? (
                                            <TableRow><TableCell colSpan={7} className="text-center py-10 text-zinc-500 italic">Chargement...</TableCell></TableRow>
                                        ) : requests.length === 0 ? (
                                            <TableRow><TableCell colSpan={7} className="text-center py-10 text-zinc-500 italic">Aucune requête trouvée.</TableCell></TableRow>
                                        ) : requests.map((req) => (
                                            <TableRow key={req.id} className="border-white/10 hover:bg-white/5 transition-colors">
                                                <TableCell>
                                                    <Badge variant="outline" className={cn(
                                                        "text-[10px] font-black uppercase tracking-widest rounded-md",
                                                        req.type === RequestType.DEPOSIT ? "text-emerald-500 border-emerald-500/20" : "text-blue-500 border-blue-500/20"
                                                    )}>
                                                        {req.type}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="font-bold text-zinc-200">{req.headquarter?.name || "N/A"}</TableCell>
                                                <TableCell className="font-black text-white">
                                                    {req.amount ? `${req.amount.toLocaleString()} USD` : "-"}
                                                </TableCell>
                                                <TableCell className="text-zinc-400 text-xs">{req.requester?.fullName || "N/A"}</TableCell>
                                                <TableCell>
                                                    <Badge className={cn(
                                                        "border-none rounded-md text-[10px] font-bold uppercase tracking-tighter",
                                                        req.status === RequestStatus.PENDING ? "bg-orange-500/10 text-orange-500" :
                                                            req.status === RequestStatus.APPROVED ? "bg-emerald-500/10 text-emerald-500" :
                                                                req.status === RequestStatus.IN_ACCOUNTING ? "bg-purple-500/10 text-purple-500" :
                                                                    req.status === RequestStatus.AUDITED ? "bg-blue-500/10 text-blue-500" :
                                                                        req.status === RequestStatus.REJECTED ? "bg-red-500/10 text-red-500" :
                                                                            req.status === RequestStatus.IN_LITIGATION ? "bg-yellow-500/10 text-yellow-500" :
                                                                                req.status === RequestStatus.IN_FINANCE ? "bg-pink-500/10 text-pink-500" :
                                                                                    req.status === RequestStatus.CANCELLED ? "bg-gray-500/10 text-gray-500" :
                                                                                        req.status === RequestStatus.COMPLETED ? "bg-green-500/10 text-green-500" :
                                                                                            "bg-gray-500/10 text-gray-500"
                                                    )}>
                                                        {req.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-zinc-500 text-[10px] uppercase font-bold">
                                                    {format(parseISO(req.createdAt), 'MMM dd, HH:mm')}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {(req.status === RequestStatus.PENDING || req.status === RequestStatus.AUDITED) ? (
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost"
                                                                    className="h-8 w-8 p-0 text-zinc-500 hover:text-white hover:bg-white/10 rounded-full">
                                                                    <MoreVertical className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="bg-zinc-900 border-white/10 text-white min-w-[200px]">
                                                                <DropdownMenuLabel className="text-[10px] uppercase font-black text-zinc-500 tracking-widest px-2 py-1.5">Actions</DropdownMenuLabel>
                                                                <DropdownMenuSeparator className="bg-white/5" />

                                                                {(req.type === RequestType.ACTIVATION || req.type === RequestType.DEACTIVATION) && (
                                                                    <>
                                                                        <DropdownMenuItem
                                                                            onClick={() => handleApproveRequest(req.id, "Approved by Manager")}
                                                                            className="cursor-pointer gap-2 font-bold text-xs py-2 text-emerald-400 hover:text-emerald-300 focus:bg-emerald-500/10 focus:text-emerald-400"
                                                                        >
                                                                            <Check className="h-3.5 w-3.5" /> Approve Request
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem
                                                                            onClick={() => handleRejectRequest(req.id, "Rejected by Manager")}
                                                                            className="cursor-pointer gap-2 font-bold text-xs py-2 text-red-400 hover:text-red-300 focus:bg-red-500/10 focus:text-red-400"
                                                                        >
                                                                            <Ban className="h-3.5 w-3.5" /> Reject Request
                                                                        </DropdownMenuItem>
                                                                    </>
                                                                )}
                                                                {/* Transfer to Accounting for Financial Requests */}
                                                                {(req.type === RequestType.DEPOSIT || req.type === RequestType.WITHDRAWAL) && (
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleTransferToAccounting(req.id)}
                                                                        className="cursor-pointer gap-2 font-bold text-xs py-2 text-purple-400 hover:text-purple-300 focus:bg-purple-500/10 focus:text-purple-400"
                                                                    >
                                                                        <Send className="h-3.5 w-3.5" /> Transfer to Accounting
                                                                    </DropdownMenuItem>
                                                                )}
                                                                {/* Complete after Finance approval */}
                                                                {req.status === RequestStatus.AUDITED && (
                                                                    <DropdownMenuItem>
                                                                        <Check className="h-3.5 w-3.5" /> Complete Request
                                                                    </DropdownMenuItem>
                                                                )}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    ) : (
                                                        <div className="flex items-center justify-end">
                                                            <Badge variant="default" className="h-8 text-[10px] font-bold uppercase text-zinc-600">
                                                                Processed
                                                            </Badge>
                                                        </div>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent className="bg-zinc-900 border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle>Add New Headquarter</DialogTitle>
                        <DialogDescription>Define a new organizational scope.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">HQ Name</label>
                                <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-white/5 border-white/10" placeholder="e.g. Delmas Branch" />
                            </div>

                            <div className="grid gap-2">
                                <label className="text-sm font-medium">In charge by (Optional)</label>
                                <Popover open={openManagerPopover} onOpenChange={setOpenManagerPopover}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            disabled={!enterpriseId}
                                            className="justify-between bg-white/5 border-white/10 text-white disabled:opacity-50"
                                        >
                                            {managerId ? (members.find(m => m.user?.id === managerId)?.user?.fullName || "Select Manager") : "Select Manager"}
                                            <Users className="ml-2 h-4 w-4 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[400px] p-0 bg-zinc-900 border-white/10">
                                        <Command className="bg-transparent">
                                            <CommandInput placeholder="Search member..." />
                                            <CommandEmpty>{isMembersLoading ? "Loading..." : "No members found in this enterprise."}</CommandEmpty>
                                            <CommandGroup>
                                                {members.map(member => (
                                                    <CommandItem
                                                        key={member.user?.id}
                                                        onSelect={() => {
                                                            setManagerId(member.user?.id);
                                                            setOpenManagerPopover(false);
                                                        }}
                                                        className="text-white hover:bg-white/10 cursor-pointer flex items-center gap-2"
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
                            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2 pb-2 border-b border-white/5">
                                <MapPin className="h-3 w-3 text-emerald-500" /> Address Details
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">Street Address</label>
                                    <Input value={adresseLigne1} onChange={(e) => setAdresseLigne1(e.target.value)} className="bg-white/5 border-white/10" placeholder="e.g. 123 Rue de la Paix" />
                                </div>
                                <div className="grid gap-2">
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">Department</label>
                                        <Input value={departement} onChange={(e) => setDepartement(e.target.value)} className="bg-white/5 border-white/10" placeholder="e.g. Ouest" />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">Commune</label>
                                    <Input value={commune} onChange={(e) => setCommune(e.target.value)} className="bg-white/5 border-white/10" placeholder="e.g. Delmas" />
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">Section Communale</label>
                                    <Input value={sectionCommunale} onChange={(e) => setSectionCommunale(e.target.value)} className="bg-white/5 border-white/10" placeholder="e.g. 1re Section" />
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <label className="text-sm font-medium">HQ Type</label>
                            <Select value={type} onValueChange={setType}>
                                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-white/10 text-white">
                                    <SelectItem value="PLATINUM">PLATINUM</SelectItem>
                                    <SelectItem value="SILVER">SILVER</SelectItem>
                                    <SelectItem value="GOLD">GOLD</SelectItem>
                                    <SelectItem value="DIAMOND">DIAMOND</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Started Balance (USD)</label>
                                <Input type="number" step="0.01" value={startedBalance} onChange={(e) => setStartedBalance(parseFloat(e.target.value) || 0)} className="bg-white/5 border-white/10" placeholder="0.00" />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Current Balance (USD)</label>
                                <Input type="number" step="0.01" value={balance} disabled={true} className="bg-white/5 border-white/10 opacity-50 cursor-not-allowed" placeholder="0.00" />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="text-white border-white/10 hover:bg-white/5">Cancel</Button>
                        <Button onClick={handleCreate}
                            disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                "Create"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="bg-zinc-900 border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle>Edit Headquarter</DialogTitle>
                        <DialogDescription>Modify organizational unit details.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">HQ Name</label>
                                <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-white/5 border-white/10" />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">In charge by (Optional)</label>
                                <Popover open={openManagerPopover} onOpenChange={setOpenManagerPopover}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            className="justify-between bg-white/5 border-white/10 text-white"
                                        >
                                            {managerId ? (members.find(m => m.user?.id === managerId)?.user?.fullName || "Select Manager") : "Select Manager"}
                                            <Users className="ml-2 h-4 w-4 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[400px] p-0 bg-zinc-900 border-white/10">
                                        <Command className="bg-transparent">
                                            <CommandInput placeholder="Search member..." />
                                            <CommandEmpty>{isMembersLoading ? "Loading..." : "No members found."}</CommandEmpty>
                                            <CommandGroup>
                                                {members.map(member => (
                                                    <CommandItem
                                                        key={member.user?.id}
                                                        onSelect={() => {
                                                            setManagerId(member.user?.id);
                                                            setOpenManagerPopover(false);
                                                        }}
                                                        className="text-white hover:bg-white/10 cursor-pointer flex items-center gap-2"
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
                            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2 pb-2 border-b border-white/5">
                                <MapPin className="h-3 w-3 text-emerald-500" /> Address Details
                            </h3>
                            <div className="grid gap-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">Street Address</label>
                                        <Input value={adresseLigne1} onChange={(e) => setAdresseLigne1(e.target.value)} className="bg-white/5 border-white/10" />
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">Department</label>
                                        <Input value={departement} onChange={(e) => setDepartement(e.target.value)} className="bg-white/5 border-white/10" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">Commune</label>
                                        <Input value={commune} onChange={(e) => setCommune(e.target.value)} className="bg-white/5 border-white/10" />
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">Section Communale</label>
                                        <Input value={sectionCommunale} onChange={(e) => setSectionCommunale(e.target.value)} className="bg-white/5 border-white/10" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <label className="text-sm font-medium">HQ Type</label>
                            <Select value={type} onValueChange={setType}>
                                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-white/10 text-white">
                                    <SelectItem value="PLATINUM">PLATINUM</SelectItem>
                                    <SelectItem value="SILVER">SILVER</SelectItem>
                                    <SelectItem value="GOLD">GOLD</SelectItem>
                                    <SelectItem value="DIAMOND">DIAMOND</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Started Balance (USD)</label>
                                <Input type="number" step="0.01" value={startedBalance} onChange={(e) => setStartedBalance(parseFloat(e.target.value) || 0)} className="bg-white/5 border-white/10" placeholder="0.00" />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Current Balance (USD)</label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={balance}
                                    disabled={true}
                                    className="bg-white/5 border-white/10 opacity-50 cursor-not-allowed"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="text-white border-white/10 hover:bg-white/5">Cancel</Button>
                        <Button onClick={handleUpdate}
                            disabled={isSubmitting}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white">
                            {isSubmitting ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Headquarters;
