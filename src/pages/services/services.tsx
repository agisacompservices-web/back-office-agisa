import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useService } from "../../context/ServiceContext";
import enterpriseApi, { Enterprise } from "../../context/api/enterprise";
import usersApi, { UserProfile } from "../../context/api/users";
import rolesApi, { Role } from "../../context/api/roles";
import membershipApi from "../../context/api/membership";
import { Minus } from "lucide-react";
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
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "../../components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "../../components/ui/popover";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import {
    Filter,
    X,
    Eye,
    Building2,
    Plus,
    LayoutGrid,
    List,
    Check,
    ChevronsUpDown
} from "lucide-react";
import { Label } from "../../components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../../components/ui/select";
import { Switch } from "../../components/ui/switch";
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
import { cn } from "../../lib/utils";
import { useTranslation } from "react-i18next";

type ServiceStatus = "active" | "inactive";

const Services: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { setCurrentService } = useService();
    const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<ServiceStatus | "all">("all");
    const [selectedService, setSelectedService] = useState<Enterprise | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [debouncedSearch, setDebouncedSearch] = useState("");

    const [editEnterpriseName, setEditEnterpriseName] = useState("");
    const [editCategory, setEditCategory] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [editIsActive, setEditIsActive] = useState(true);

    const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
    const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
    const [newEnterpriseName, setNewEnterpriseName] = useState("");
    const [newCategory, setNewCategory] = useState("");
    const [newDescription, setNewDescription] = useState("");

    // Category UI State
    const [openCategory, setOpenCategory] = useState(false);
    const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
    const [newCategoryNameDialog, setNewCategoryNameDialog] = useState("");

    // Member UI State
    const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [selectedUserForMember, setSelectedUserForMember] = useState("");
    const [selectedRoleForMember, setSelectedRoleForMember] = useState("");
    const [isUserComboboxOpen, setIsUserComboboxOpen] = useState(false);
    const [isDeleteMemberOpen, setIsDeleteMemberOpen] = useState(false);
    const [memberToDelete, setMemberToDelete] = useState<string | null>(null);

    useEffect(() => {
        if (isAddMemberOpen) {
            usersApi.getAll({ limit: 100 }).then(res => setUsers(res.data)).catch(console.error);
            rolesApi.getAll().then(res => setRoles(Array.isArray(res) ? res : (res as any).data)).catch(console.error);
        }
    }, [isAddMemberOpen, selectedService]);

    const itemsPerPage = 10;

    const fetchCategories = async () => {
        try {
            const res = await enterpriseApi.getCategories({ limit: 100 });
            setCategories(res.data || []);
        } catch (error) {
            console.error("Failed to fetch categories", error);
        }
    }

    const fetchEnterprises = async (page = 1, search = "") => {
        setIsLoading(true);
        try {
            const res = await enterpriseApi.getAll({
                page,
                limit: itemsPerPage,
                search: search || undefined
            });
            setEnterprises(res.data || []);
            if (res.meta) {
                setTotalPages(res.meta.lastPage || 1);
                setTotalItems(res.meta.total || 0);
            }
        } catch (error) {
            console.error("Failed to fetch enterprises", error);
            toast.error("Error", { description: "Failed to load enterprises" });
        } finally {
            setIsLoading(false);
        }
    };

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setCurrentPage(1); // Reset to first page on search
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        fetchEnterprises(currentPage, debouncedSearch);
    }, [currentPage, debouncedSearch]);

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleCreateCategory = async () => {
        if (!newCategoryNameDialog) return;
        try {
            const cat = await enterpriseApi.createCategory(newCategoryNameDialog);
            setCategories([...categories, cat]);
            setNewCategory(cat.id);
            setIsAddCategoryOpen(false);
            setNewCategoryNameDialog("");
            toast.success(t('services.toasts.catAdded'));
        } catch (error: any) {
            toast.error(t('services.toasts.errorCat'));
        }
    };

    const handleCreateEnterprise = async () => {
        if (!newEnterpriseName || !newCategory) {
            toast.error('Validation', { description: t('services.toasts.reqFields') });
            return;
        }

        try {
            await enterpriseApi.create({
                name: newEnterpriseName,
                // enterpriseCode auto-generated by backend
                categoryId: newCategory,
                description: newDescription
            });
            toast.success('Success', { description: t('services.toasts.createdSuccess') });
            setIsAddDialogOpen(false);
            setNewEnterpriseName("");
            setNewCategory("");
            setNewDescription("");
            fetchEnterprises();
        } catch (error: any) {
            toast.error('Error', { description: error.response?.data?.message || t('services.toasts.createFail') });
        }
    };

    const handleEditService = () => {
        if (!selectedService) return;
        setEditEnterpriseName(selectedService.name);
        setEditCategory(selectedService.category?.id || "");
        setEditDescription(selectedService.description || "");
        setEditIsActive(selectedService.isActive ?? true);
        setIsEditDialogOpen(true);
    };

    const handleUpdateService = async () => {
        if (!selectedService) return;

        try {
            const updated = await enterpriseApi.update(selectedService.id, {
                name: editEnterpriseName,
                description: editDescription,
                categoryId: editCategory,
                isActive: editIsActive,
            });

            setEnterprises((prev) =>
                prev.map((e) => (e.id === selectedService.id ? { ...e, ...updated } : e))
            );
            setSelectedService((prev) => prev ? { ...prev, ...updated } : null);
            setIsEditDialogOpen(false);
            toast.success(t('services.toasts.updateSuccess'));
        } catch (error) {
            console.error("Update error:", error);
            toast.error(t('services.toasts.errorUpdate'));
        }
    };

    const handleToggleMaintenance = async (service: Enterprise, value: boolean) => {
        try {
            const updated = await enterpriseApi.update(service.id, { isMaintenance: value });
            setEnterprises(prev => prev.map(e => e.id === service.id ? { ...e, ...updated } : e));
            if (selectedService?.id === service.id) {
                setSelectedService(prev => prev ? { ...prev, ...updated } : null);
            }
            toast.success(`Service "${service.name}" ${value ? t('services.toasts.maintSuccessActive') : t('services.toasts.maintSuccessInactive')}`);
        } catch (error) {
            console.error("Maintenance toggle error:", error);
            toast.error(t('services.toasts.maintError'));
        }
    };

    const isFiltered = searchQuery !== "" || statusFilter !== "all";

    const handleAddMember = async () => {
        if (!selectedService || !selectedUserForMember || !selectedRoleForMember) return;

        try {
            const newMember = await membershipApi.create({
                userId: selectedUserForMember,
                roleIds: [selectedRoleForMember],
                enterpriseId: selectedService.id
            });
            toast.success(t('services.toasts.memberAdded'));
            setIsAddMemberOpen(false);

            // Optimistic update
            setSelectedService(prev => prev ? ({ ...prev, memberships: [newMember, ...(prev.memberships || [])] }) : null);
            fetchEnterprises();

            setSelectedUserForMember("");
            setSelectedRoleForMember("");
        } catch (e) {
            console.error(e);
            toast.error(t('services.toasts.memberAddError'));
        }
    };

    const removeMember = (membershipId: string) => {
        setMemberToDelete(membershipId);
        setIsDeleteMemberOpen(true);
    };

    const confirmRemoveMember = async () => {
        if (!memberToDelete) return;
        try {
            await membershipApi.delete(memberToDelete);
            toast.success(t('services.toasts.memberRemoved'));

            // Optimistic update
            setSelectedService(prev => prev ? ({
                ...prev,
                memberships: prev.memberships?.filter((m: any) => m.id !== memberToDelete)
            }) : null);

            fetchEnterprises();
            setIsDeleteMemberOpen(false);
            setMemberToDelete(null);
        } catch (e) {
            console.error(e);
            toast.error(t('services.toasts.memberRemoveError'));
        }
    };

    const currentServices = enterprises;

    const getManager = (memberships?: any[]) => {
        if (!memberships || memberships.length === 0) return null;
        // Look for a membership that contains a role with level 'MANAGER'
        const manager = memberships.find(m =>
            m.membershipRoles?.some((mr: any) =>
                mr.role?.level?.toUpperCase() === 'MANAGER'
            )
        );
        return manager || memberships[0];
    };

    const getStatusBadge = (status: ServiceStatus) => {
        switch (status) {
            case "active":
                return <Badge className="bg-emerald-500/15 text-emerald-500 rounded-md hover:bg-emerald-500/25 border-emerald-500/20">{t('services.filterActive')}</Badge>
            case "inactive":
                return <Badge variant="destructive" className="bg-red-500/15 text-red-500 rounded-md hover:bg-red-500/25 border-red-500/20">{t('services.filterInactive')}</Badge>
            default:
                return <Badge className="rounded-md">{status}</Badge>
        }
    }

    const goToService = (service: any) => {
        return <Badge
            onClick={() => {
                setCurrentService(service);
                navigate(`/${service.enterpriseCode}`);
                toast.success(`${t('services.toasts.switching')} ${service.name}`);
            }}
            className="bg-emerald-500/15 text-emerald-500 rounded-md hover:bg-emerald-500/25 border-emerald-500/20 cursor-pointer"
        >
            {t('services.goToBtn')}</Badge>
    }

    return (
        <div className="flex-1 space-y-4 pt-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Building2 className="h-8 w-8 text-emerald-500" />
                    <h2 className="text-3xl font-bold tracking-tight text-black">{t('services.title')}</h2>
                    {totalItems > 0 && <Badge variant="outline" className="ml-2 bg-emerald-500/10 text-emerald-500 border-emerald-500/20">{totalItems} {t('services.totalItems')}</Badge>}
                </div>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-emerald-600 hover:bg-emerald-700 text-black">
                            <Plus className="mr-2 h-4 w-4" />
                            {t('services.addServiceBtn')}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-zinc-900 border border-slate-200 text-black sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold">{t('services.addServiceDialog.title')}</DialogTitle>
                            <DialogDescription className="text-zinc-400">
                                Enter the details of the new business unit or service entity.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="service-name">{t('services.addServiceDialog.nameLabel')} <span className="text-red-500">*</span></Label>
                                <Input
                                    id="service-name"
                                    placeholder={t('services.addServiceDialog.namePlaceholder')}
                                    className="bg-slate-50 border-slate-200 focus:ring-emerald-500/50"
                                    value={newEnterpriseName}
                                    onChange={(e) => setNewEnterpriseName(e.target.value)}
                                />
                            </div>
                            {/* Enterprise Code is auto-generated */}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>{t('services.addServiceDialog.categoryLabel')} <span className="text-red-500">*</span></Label>
                                    <div className="flex gap-2">
                                        <Popover open={openCategory} onOpenChange={setOpenCategory}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={openCategory}
                                                    className="w-full justify-between bg-slate-50 border-slate-200 font-normal hover:bg-slate-100 hover:text-black"
                                                >
                                                    {newCategory
                                                        ? categories.find((c) => c.id === newCategory)?.name || t('services.addServiceDialog.categorySelect')
                                                        : t('services.addServiceDialog.categorySelect')}
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[200px] p-0 bg-zinc-900 border-slate-200 text-black">
                                                <Command className="bg-zinc-900 text-black">
                                                    <CommandInput placeholder={t('services.addServiceDialog.searchCategory')} className="text-black" />
                                                    <CommandList>
                                                        <CommandEmpty>{t('services.addServiceDialog.noCategory')}</CommandEmpty>
                                                        <CommandGroup>
                                                            {categories.map((category) => (
                                                                <CommandItem
                                                                    key={category.id}
                                                                    value={category.name}
                                                                    onSelect={() => {
                                                                        setNewCategory(category.id === newCategory ? "" : category.id)
                                                                        setOpenCategory(false)
                                                                    }}
                                                                    className="text-black hover:bg-slate-100 aria-selected:bg-slate-100"
                                                                >
                                                                    <Check
                                                                        className={cn(
                                                                            "mr-2 h-4 w-4",
                                                                            newCategory === category.id ? "opacity-100" : "opacity-0"
                                                                        )}
                                                                    />
                                                                    {category.name}
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                        <Button
                                            size="icon"
                                            variant="outline"
                                            className="bg-slate-50 border-slate-200 hover:bg-slate-100 shrink-0"
                                            onClick={() => setIsAddCategoryOpen(true)}
                                        >
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="description">{t('services.addServiceDialog.descLabel')}</Label>
                                <textarea
                                    id="description"
                                    className="flex min-h-[100px] w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500/50 text-black"
                                    placeholder={t('services.addServiceDialog.descPlaceholder')}
                                    value={newDescription}
                                    onChange={(e) => setNewDescription(e.target.value)}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="bg-transparent border-slate-200 hover:bg-slate-50">{t('services.addServiceDialog.cancelBtn')}</Button>
                            <Button
                                className="bg-emerald-600 hover:bg-emerald-700"
                                onClick={handleCreateEnterprise}
                            >{t('services.addServiceDialog.createBtn')}</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex items-center justify-between py-4 gap-4">
                <div className="flex flex-1 items-center gap-4">
                    <Input
                        placeholder={t('services.searchPlaceholder')}
                        value={searchQuery}
                        onChange={(event) => {
                            setSearchQuery(event.target.value);
                            setCurrentPage(1);
                        }}
                        className="max-w-sm bg-slate-50 border-slate-200 text-black placeholder:text-slate-500 focus-visible:ring-indigo-500/50"
                    />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="bg-slate-50 border-slate-200 text-black hover:bg-slate-100 hover:text-black">
                                <Filter className="mr-2 h-4 w-4" />
                                {t('services.filterStatus')}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-slate-100 border-slate-200 text-black backdrop-blur-xl">
                            <DropdownMenuLabel>{t('services.filterStatus')}</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-slate-100" />
                            <DropdownMenuCheckboxItem
                                checked={statusFilter === "all"}
                                onCheckedChange={() => setStatusFilter("all")}
                                className="focus:bg-slate-100 focus:text-black"
                            >{t('services.filterAll')}</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                                checked={statusFilter === "active"}
                                onCheckedChange={() => setStatusFilter("active")}
                                className="focus:bg-slate-100 focus:text-black"
                            >{t('services.filterActive')}</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                                checked={statusFilter === "inactive"}
                                onCheckedChange={() => setStatusFilter("inactive")}
                                className="focus:bg-slate-100 focus:text-black"
                            >{t('services.filterInactive')}</DropdownMenuCheckboxItem>
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
                            {t('services.resetBtn')}
                            <X className="ml-2 h-4 w-4" />
                        </Button>
                    )}
                </div>

                <div className="flex items-center border border-slate-200 rounded-lg p-1 bg-slate-50">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setViewMode("grid")}
                        className={`h-8 w-8 ${viewMode === "grid" ? "bg-slate-100 text-black" : "text-slate-500 hover:text-black"}`}
                    >
                        <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setViewMode("table")}
                        className={`h-8 w-8 ${viewMode === "table" ? "bg-slate-100 text-black" : "text-slate-500 hover:text-black"}`}
                    >
                        <List className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <div className="h-12 w-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                    <p className="text-zinc-500 animate-pulse">{t('services.loading')}</p>
                </div>
            ) : viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {currentServices.map((service) => (
                        <Card key={service.id} className="bg-slate-50 border-slate-200 text-black backdrop-blur-sm group hover:border-indigo-500/30 transition-all">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <CardTitle className="text-xl group-hover:text-indigo-400 transition-colors">{service.name}</CardTitle>
                                        <CardDescription className="text-slate-600 text-xs">{service.category?.name || service.enterpriseCode}</CardDescription>
                                    </div>
                                    <div className="flex flex-col items-end gap-2 shrink-0">
                                        <div className="flex flex-wrap items-center justify-end gap-1.5 min-w-0">
                                            {getStatusBadge(service.isActive === false ? "inactive" : "active")}
                                            {goToService(service)}
                                        </div>
                                        <div className="flex items-center gap-2 bg-black/20 p-1.5 rounded-lg border border-white/5">
                                            <Switch
                                                checked={service.isMaintenance}
                                                onCheckedChange={(checked) => handleToggleMaintenance(service, checked)}
                                                className="scale-75 data-[state=checked]:bg-orange-500"
                                            />
                                            <span className="text-[9px] uppercase font-bold text-orange-400">{t('services.grid.maint')}</span>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pb-4">
                                <p className="text-sm text-slate-300 line-clamp-2 h-10">
                                    {service.description}
                                </p>
                                <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-3 gap-1">
                                    <div className="space-y-1">
                                        <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">{t('services.grid.inCharge')}</p>
                                        <div className="flex items-center gap-2">
                                            <div className="h-6 w-6 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-bold text-xs border border-emerald-500/20">
                                                {getManager(service.memberships)?.user?.fullName?.[0] || "?"}
                                            </div>
                                            <p className="text-xs font-medium">
                                                {getManager(service.memberships)?.user?.fullName || "N/A"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-1 text-right">
                                        <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">{t('services.grid.addedOn')}</p>
                                        <p className="text-xs font-medium">{new Date(service.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <div className="space-y-1 text-right">
                                        <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">{t('services.grid.members')}</p>
                                        <p className="text-xs font-medium">{service.memberships?.length || 0}</p>
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
                                    {t('services.grid.viewDetailsBtn')}
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="rounded-md border border-slate-200 bg-slate-50 backdrop-blur-sm overflow-hidden text-black">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow className="border-slate-200 hover:bg-transparent">
                                <TableHead className="text-slate-600 font-semibold">{t('services.table.colName')}</TableHead>
                                <TableHead className="text-slate-600 font-semibold">{t('services.table.colCategory')}</TableHead>
                                <TableHead className="text-slate-600 font-semibold">{t('services.table.colStatus')}</TableHead>
                                <TableHead className="text-slate-600 font-semibold">{t('services.table.colInCharge')}</TableHead>
                                <TableHead className="text-slate-600 font-semibold text-right">{t('services.table.colAddedOn')}</TableHead>
                                <TableHead className="text-slate-600 font-semibold text-center">{t('services.table.colMaint')}</TableHead>
                                <TableHead className="text-slate-600 font-semibold text-right">{t('services.table.colMembers')}</TableHead>
                                <TableHead className="text-slate-600 font-semibold text-right">{t('services.table.colActions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {currentServices.length > 0 ? (
                                currentServices.map((service) => (
                                    <TableRow key={service.id} className="border-slate-200 hover:bg-slate-50 transition-colors">
                                        <TableCell className="font-semibold">{service.name}</TableCell>
                                        <TableCell className="text-slate-600 text-sm">{service.category?.name || service.enterpriseCode}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center flex-wrap gap-2">
                                                {getStatusBadge(service.isActive === false ? "inactive" : "active")}
                                                {goToService(service)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm flex items-center gap-2">
                                            <div className="h-6 w-6 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-bold text-xs border border-emerald-500/20">
                                                {getManager(service.memberships)?.user?.fullName?.[0] || "?"}
                                            </div>
                                            {getManager(service.memberships)?.user?.fullName || "N/A"}
                                        </TableCell>
                                        <TableCell className="text-right font-medium text-slate-600">{new Date(service.createdAt).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-center">
                                            <Switch
                                                checked={service.isMaintenance}
                                                onCheckedChange={(checked) => handleToggleMaintenance(service, checked)}
                                                className="data-[state=checked]:bg-orange-500"
                                            />
                                        </TableCell>
                                        <TableCell className="text-right font-medium text-slate-600">{service.memberships?.length || 0}</TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-slate-600 hover:text-black hover:bg-slate-100"
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
                                        {t('services.table.noServices')}
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
                                    className={currentPage === totalPages ? "pointer-events-none opacity-50 text-slate-500" : "text-black hover:bg-slate-100"}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            )}

            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="bg-zinc-900 border border-slate-200 text-black sm:max-w-[550px]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                                <Building2 className="h-6 w-6 text-indigo-400" />
                            </div>
                            {selectedService?.name}
                        </DialogTitle>
                        <DialogDescription className="text-zinc-400">
                            Conglomerate Agisa • {t('services.detailsDialog.serviceId')}: <span className="text-black font-mono">{selectedService?.id}</span>
                        </DialogDescription>
                    </DialogHeader>
                    {selectedService && (
                        <div className="space-y-6 py-4">
                            <div className="space-y-2">
                                <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">{t('services.detailsDialog.aboutTitle')}</h4>
                                <p className="text-zinc-200 bg-slate-50 p-4 rounded-lg border border-white/5 leading-relaxed">
                                    {selectedService.description || t('services.detailsDialog.noDesc')}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2 group">
                                    <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">{t('services.detailsDialog.catTitle')}</h4>
                                    <p className="text-xs font-medium py-1 px-3 bg-indigo-500/10 rounded-md w-fit border border-indigo-500/20 text-indigo-300">
                                        {selectedService.category?.name || t('services.detailsDialog.uncategorized')}
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">{t('services.detailsDialog.statusTitle')}</h4>
                                    <div>{getStatusBadge(selectedService.isActive === false ? "inactive" : "active")}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-6 pt-4 border-t border-slate-200">
                                <div className="space-y-1">
                                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{t('services.detailsDialog.managerTitle')}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="h-5 w-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-bold text-xs border border-emerald-500/20">
                                            {getManager(selectedService.memberships)?.user?.fullName?.[0] || "?"}
                                        </div>
                                        <p className="text-sm font-semibold">
                                            {getManager(selectedService.memberships)?.user?.fullName || t('services.grid.notAssigned')}
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{t('services.detailsDialog.sinceTitle')}</p>
                                    <p className="text-sm">{new Date(selectedService.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{t('services.detailsDialog.codeTitle')}</p>
                                    <p className="text-sm font-mono text-zinc-400">{selectedService.enterpriseCode}</p>
                                </div>
                            </div>
                            <div className="pt-4 border-t border-slate-200">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{t('services.detailsDialog.teamTitle')} ({selectedService.memberships?.length || 0})</p>
                                    <Button variant="ghost" size="sm" className="h-6 text-xs text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10" onClick={() => setIsAddMemberOpen(true)}>
                                        <Plus className="h-3 w-3 mr-1" /> {t('services.detailsDialog.addMemberBtn')}
                                    </Button>
                                </div>
                                <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                                    {selectedService.memberships?.map((m: any) => (
                                        <div key={m.id} className="flex items-center justify-between bg-slate-50 p-2 rounded text-sm ">
                                            <div className="flex items-center gap-2">
                                                <div className="h-6 w-6 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-300">
                                                    {m.user?.fullName?.[0] || "?"}
                                                </div>
                                                <span>{m.user?.fullName}</span>
                                            </div>
                                            <Badge variant="outline" className="text-[10px] border-slate-200 text-zinc-400 rounded-md">
                                                {m.membershipRoles?.[0]?.role?.name || t('services.detailsDialog.roleMember')}
                                            </Badge>
                                            <Button variant="ghost" size="sm" className="h-6 text-xs text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10" onClick={() => removeMember(m.id)}>
                                                <Minus className="h-3 w-3 mr-1" /> {t('services.detailsDialog.removeMemberBtn')}
                                            </Button>
                                        </div>
                                    ))}
                                    {(!selectedService.memberships || selectedService.memberships.length === 0) && (
                                        <p className="text-xs text-zinc-500 italic">{t('services.detailsDialog.noMembers')}</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-6">
                                <Button variant="outline" onClick={() => setIsDetailsOpen(false)} className="bg-transparent border-slate-200 hover:bg-slate-50">
                                    {t('services.detailsDialog.closeBtn')}
                                </Button>
                                <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleEditService}>
                                    {t('services.detailsDialog.editBtn')}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Edit Service Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="bg-[#0c0c0c] border border-slate-200 text-black sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="uppercase tracking-widest text-indigo-500">{t('services.editDialog.title')}</DialogTitle>
                        <DialogDescription className="text-zinc-500 text-xs font-bold">
                            Update the details of this service.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="edit-name" className="text-xs font-black uppercase text-zinc-500">{t('services.table.colName')}</Label>
                            <Input
                                id="edit-name"
                                value={editEnterpriseName}
                                onChange={(e) => setEditEnterpriseName(e.target.value)}
                                className="bg-slate-50 border-slate-200 h-11 focus:ring-indigo-500/50"
                            />
                        </div>
                        <div className="grid gap-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-black uppercase text-zinc-500">Category</Label>
                                <Button
                                    variant="link"
                                    className="h-auto p-0 text-[10px] text-emerald-500 hover:text-emerald-400 font-bold uppercase"
                                    onClick={() => setIsAddCategoryOpen(true)}
                                >
                                    + Add New
                                </Button>
                            </div>
                            <Select value={editCategory} onValueChange={setEditCategory}>
                                <SelectTrigger className="bg-slate-50 border-slate-200 h-11 focus:ring-indigo-500/50">
                                    <SelectValue placeholder={t('services.editDialog.selectCat')} />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-950 border-slate-200 text-black">
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-status" className="text-xs font-black uppercase text-zinc-500">Status</Label>
                            <Select value={editIsActive ? "active" : "inactive"} onValueChange={(val) => setEditIsActive(val === "active")}>
                                <SelectTrigger className="bg-slate-50 border-slate-200 h-11 focus:ring-indigo-500/50">
                                    <SelectValue placeholder={t('services.editDialog.selectStatus')} />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-950 border-slate-200 text-black">
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-description" className="text-xs font-black uppercase text-zinc-500">{t('services.addServiceDialog.descLabel')}</Label>
                            <Input
                                id="edit-description"
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                className="bg-slate-50 border-slate-200 h-11 focus:ring-indigo-500/50"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="bg-transparent border-slate-200 hover:bg-zinc-800">{t('services.addServiceDialog.cancelBtn')}</Button>
                        <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleUpdateService}>
                            {t('services.editDialog.saveBtn')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
                <DialogContent className="bg-zinc-900 border border-slate-200 text-black sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>{t('services.addCatDialog.title')}</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Label>{t('services.addCatDialog.label')}</Label>
                        <Input
                            className="bg-slate-50 border-slate-200 mt-2 focus:ring-emerald-500/50"
                            value={newCategoryNameDialog}
                            onChange={(e) => setNewCategoryNameDialog(e.target.value)}
                            placeholder={t('services.addCatDialog.placeholder')}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddCategoryOpen(false)} className="bg-transparent border-slate-200 hover:bg-slate-50">{t('services.addServiceDialog.cancelBtn')}</Button>
                        <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleCreateCategory}>
                            Create
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
                <DialogContent className="bg-zinc-900 border border-slate-200 text-black sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>{t('services.addMemberDialog.title')}</DialogTitle>
                        <DialogDescription className="text-zinc-400">{t('services.addMemberDialog.desc')}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>{t('services.addMemberDialog.selectUserLabel')}</Label>
                            <Popover open={isUserComboboxOpen} onOpenChange={setIsUserComboboxOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" role="combobox" aria-expanded={isUserComboboxOpen} className="w-full justify-between bg-slate-50 border-slate-200 text-black hover:bg-slate-100">
                                        {selectedUserForMember ? (
                                            (() => {
                                                const user = users.find((u) => u.id === selectedUserForMember);
                                                return (
                                                    <div className="flex items-baseline gap-2 overflow-hidden">
                                                        <span className="truncate font-medium">{user?.fullName}</span>
                                                        <span className="text-[10px] text-zinc-500 truncate font-normal italic shrink-0">
                                                            ({user?.email})
                                                        </span>
                                                    </div>
                                                );
                                            })()
                                        ) : t('services.addMemberDialog.selectUserReq')}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-zinc-900 border-slate-200">
                                    <Command className="bg-zinc-900 text-black">
                                        <CommandInput placeholder={t('services.addMemberDialog.searchUser')} className="border-none focus:ring-0" />
                                        <CommandEmpty>{t('services.addMemberDialog.noUser')}</CommandEmpty>
                                        <CommandList>
                                            <CommandGroup>
                                                {users.filter(u => {
                                                    // 1. Skip if already a member
                                                    const isAlreadyMember = selectedService?.memberships?.some(
                                                        (m: any) => m.userId === u.id || m.user?.id === u.id
                                                    );
                                                    if (isAlreadyMember) return false;

                                                    // 2. Filter Global Admins (Level != USER AND no enterpriseId)
                                                    const role = u.role as any;
                                                    const isGlobalNonStandardUser = role?.level !== 'USER' && !role?.enterpriseId;

                                                    // Only show if it's NOT a global admin (or if it's a standard USER/enterprise-specific role)
                                                    return !isGlobalNonStandardUser;
                                                }).map((user) => (
                                                    <CommandItem
                                                        key={user.id}
                                                        value={`${user.fullName} ${user.email}`}
                                                        onSelect={() => {
                                                            setSelectedUserForMember(user.id);
                                                            setIsUserComboboxOpen(false);
                                                        }}
                                                        className="text-black hover:bg-slate-100 cursor-pointer"
                                                    >
                                                        <Check className={cn("mr-2 h-4 w-4", selectedUserForMember === user.id ? "opacity-100" : "opacity-0")} />
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{user.fullName}</span>
                                                            <span className="text-[10px] text-zinc-500 italic">{user.email}</span>
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-2">
                            <Label>{t('services.addMemberDialog.selectRoleLabel')}</Label>
                            <Select value={selectedRoleForMember} onValueChange={setSelectedRoleForMember}>
                                <SelectTrigger className="bg-slate-50 border-slate-200 text-black">
                                    <SelectValue placeholder={t('services.addMemberDialog.selectRoleReq')} />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-slate-200 text-black">
                                    {roles.filter(role => role.enterprise?.id === selectedService?.id).map((role) => (
                                        <SelectItem key={role.id} value={role.id} className="focus:bg-slate-100 focus:text-black cursor-pointer">
                                            {role.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddMemberOpen(false)} className="bg-transparent border-slate-200 hover:bg-slate-50">{t('services.addServiceDialog.cancelBtn')}</Button>
                        <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleAddMember}>{t('services.addMemberDialog.title')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isDeleteMemberOpen} onOpenChange={setIsDeleteMemberOpen}>
                <DialogContent className="bg-zinc-900 border border-slate-200 text-black sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>{t('services.removeMemberDialog.title')}</DialogTitle>
                        <DialogDescription className="text-zinc-400">
                            Are you sure you want to remove this member? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteMemberOpen(false)} className="bg-transparent border-slate-200 hover:bg-slate-50">{t('services.addServiceDialog.cancelBtn')}</Button>
                        <Button variant="destructive" onClick={confirmRemoveMember}>{t('services.detailsDialog.removeMemberBtn')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
}

export default Services;