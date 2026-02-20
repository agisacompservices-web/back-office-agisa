import React, { useState, useEffect, useCallback } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../../components/ui/table"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "../../components/ui/card"
import { Input } from "../../components/ui/input"
import { Button } from "../../components/ui/button"
import { Badge } from "../../components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "../../components/ui/dialog"
import { Label } from "../../components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../../components/ui/select"
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "../../components/ui/pagination"
import {
    Search,
    MoreHorizontal,
    UserPlus,
    Ban,
    Key,
    User as UserIcon,
    Filter,
    X,
    Loader2,
    ChevronsUpDown,
    Building2,
    Check,
    Edit,
    Eye,
} from "lucide-react"
import usersApi, { UserProfile, CreateUserRequest } from "../../context/api/users"
import { toast } from "sonner"
import rolesApi, { Role } from "../../context/api/roles"
import { Popover, PopoverTrigger } from "../../components/ui/popover"
import { useTranslation } from "react-i18next"
import { PopoverContent } from "../../components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "../../components/ui/command"
import { cn } from "../../lib/utils"

interface EditUserForm extends Partial<UserProfile> {
    roleId?: string;
}

const Users: React.FC = () => {
    const { t } = useTranslation()
    // API State
    const [users, setUsers] = useState<UserProfile[]>([])
    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [availableRoles, setAvailableRoles] = useState<Role[]>([])
    const [openRoleCombobox, setOpenRoleCombobox] = useState(false)

    // View User Dialog State
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
    const [selectedViewUser, setSelectedViewUser] = useState<UserProfile | null>(null)

    // Edit User Dialog State
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [editUserData, setEditUserData] = useState<EditUserForm>({})

    // Filter State
    const [searchTerm, setSearchTerm] = useState("")
    const [roleFilter, setRoleFilter] = useState<string>("all")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    // Pagination State
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalItems, setTotalItems] = useState(0)
    const [debouncedSearch, setDebouncedSearch] = useState("")
    const itemsPerPage = 10

    // Form State for new user
    const [newUser, setNewUser] = useState<CreateUserRequest>({
        fullName: "",
        email: "",
        role: "",
        roleId: "",
        phone: "",
    })

    // Fetch Users
    const loadUsers = useCallback(async (page = 1, search = "") => {
        setIsLoading(true)
        try {
            const [usersResp, rolesData] = await Promise.all([
                usersApi.getAll({ page, limit: itemsPerPage, search: search || undefined }),
                rolesApi.getAll({ limit: 100 }),
            ])

            setUsers((usersResp as any).data || [])
            if ((usersResp as any).meta) {
                setTotalPages((usersResp as any).meta.lastPage || 1)
                setTotalItems((usersResp as any).meta.total || 0)
            }
            setAvailableRoles(Array.isArray(rolesData) ? rolesData : rolesData.data || [])
        } catch (error: any) {
            toast.error("Failed to load data", {
                description: error.response?.data?.message || "Server connection error"
            })
        } finally {
            setIsLoading(false)
        }
    }, [])

    // Load current user
    useEffect(() => {
        const storedUser = localStorage.getItem('agisa_user')
        if (storedUser) {
            try {
                setCurrentUser(JSON.parse(storedUser))
            } catch (e) {
                console.error("Failed to parse current user", e)
            }
        }
    }, [])

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm)
            setCurrentPage(1)
        }, 500)
        return () => clearTimeout(timer)
    }, [searchTerm])

    useEffect(() => {
        loadUsers(currentPage, debouncedSearch)
    }, [loadUsers, currentPage, debouncedSearch])

    // Handling User Creation
    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newUser.fullName || !newUser.email || (!newUser.role && !newUser.roleId)) {
            toast.error("Please fill all required fields")
            return
        }

        setIsSubmitting(true)
        try {
            await usersApi.addUser(newUser)
            toast.success("User created successfully")
            setIsDialogOpen(false)
            setNewUser({ fullName: "", email: "", role: "", roleId: "", phone: "" })
            loadUsers() // Reload list
        } catch (error: any) {
            toast.error("Creation failed", {
                description: error.response?.data?.message || "An error occurred"
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleToggleStatus = async (user: UserProfile) => {
        try {
            await usersApi.update(user.id, { isActive: !user.isActive });
            toast.success(user.isActive ? "Account suspended" : "Account activated");
            loadUsers();
        } catch (error: any) {
            toast.error("Operation failed", {
                description: error.response?.data?.message || "An error occurred"
            });
        }
    };

    const handleUnlockAccount = async (userId: string) => {
        try {
            await usersApi.unlock(userId);
            toast.success("Account unlocked successfully");
            loadUsers();
        } catch (error: any) {
            toast.error("Unlock failed", {
                description: error.response?.data?.message || "An error occurred"
            });
        }
    };

    const handleViewUser = (user: UserProfile) => {
        setSelectedViewUser(user)
        setIsViewDialogOpen(true)
    }

    const handleEditUser = (user: UserProfile) => {
        setEditUserData({
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone || "",
            isActive: user.isActive,
            roleId: user.role?.id || ""
        });
        setIsEditDialogOpen(true);
        setIsViewDialogOpen(false); // Close view dialog if open
    };

    const handleSaveEditUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editUserData.id) return;

        setIsSubmitting(true);
        try {
            await usersApi.update(editUserData.id, {
                fullName: editUserData.fullName,
                email: editUserData.email,
                phone: editUserData.phone,
                isActive: editUserData.isActive,
                roleId: editUserData.roleId,
            });
            toast.success("User updated successfully");
            setIsEditDialogOpen(false);
            loadUsers();
        } catch (error: any) {
            toast.error("Failed to update user", {
                description: error.response?.data?.message || "An error occurred"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Filtering logic (Client-side for now, Search is server-side)
    // Note: statusFilter and roleFilter are still client-side in this specific implementation 
    // because current backend findAll only supports search, but we could extend it if needed.
    // For now we'll keep it simple: Search is server-side, filters are client-side on the fetched page.
    const filteredUsers = users.filter(user => {
        const matchesRole = roleFilter === "all" || user.role?.id === roleFilter
        const matchesStatus = statusFilter === "all" ||
            (statusFilter === "active" ? user.isActive : !user.isActive)

        return matchesRole && matchesStatus
    })

    const getRoleColorClass = (roleName: string) => {
        switch (roleName.toUpperCase()) {
            case "SUPER_ADMIN": return "bg-purple-500/20 text-purple-400 border-purple-500/50 rounded-md"
            case "ADMIN": return "bg-blue-500/20 text-blue-400 border-blue-500/50 rounded-md"
            case "FINANCE": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/50 rounded-md"
            case "AGENT": return "bg-slate-500/20 text-slate-400 border-slate-500/50 rounded-md"
            default: return "bg-blue-500/20 text-blue-400 border-blue-500/50 rounded-md"
        }
    }

    const getRoleBadge = (roleName: string) => {
        return <Badge className={cn("text-[10px] rounded-md", getRoleColorClass(roleName))}>{roleName}</Badge>
    }

    const getVerificationBadge = (isVerified: boolean) => {
        if (!isVerified) return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/50 rounded-md text-[10px]">NOT VERIFIED</Badge>
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50 rounded-md text-[10px]">VERIFIED</Badge>
    }

    const getStatusBadge = (isActive: boolean) => {
        if (!isActive) return <Badge className="bg-red-500/20 text-red-400 border-red-500/50 rounded-md text-[10px]">SUSPENDED</Badge>
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50 rounded-md text-[10px]">ACTIVE</Badge>
    }

    const handleResetFilters = () => {
        setSearchTerm("")
        setRoleFilter("all")
        setStatusFilter("all")
        setCurrentPage(1)
    }

    return (
        <div className="space-y-6">
            <Card className="border-white/10 bg-black/40 backdrop-blur-xl">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-xl font-semibold text-white uppercase tracking-wider flex items-center gap-3">{t('settings.users.manageUsers')}
                            {totalItems > 0 && (
                                <span className="bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full text-[10px] font-black">{totalItems} {t('settings.users.total')}</span>
                            )}
                        </CardTitle>
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-bold uppercase text-xs">
                                    <UserPlus className="h-4 w-4" />
                                    {t('settings.users.addUser')}
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px] bg-[#0c0c0c] border-white/10 text-white">
                                <form onSubmit={handleAddUser}>
                                    <DialogHeader>
                                        <DialogTitle className="uppercase tracking-widest text-emerald-500">{t('settings.users.addDialog.title')}</DialogTitle>
                                        <DialogDescription className="text-zinc-500 font-bold">{t('settings.users.addDialog.description')}</DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-6">
                                        <div className="grid gap-2">
                                            <Label htmlFor="fullName" className="text-xs uppercase font-bold text-zinc-400">{t('settings.users.addDialog.fullName')}</Label>
                                            <Input
                                                id="fullName"
                                                placeholder={t('settings.users.addDialog.fullName')}
                                                className="bg-white/5 border-white/10 focus-visible:ring-emerald-500/50 h-11"
                                                value={newUser.fullName}
                                                onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="email" className="text-xs uppercase font-bold text-zinc-400">{t('settings.users.addDialog.email')}</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="jean@agisa.com"
                                                className="bg-white/5 border-white/10 focus-visible:ring-emerald-500/50 h-11"
                                                value={newUser.email}
                                                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label className="text-xs uppercase font-bold text-zinc-400">{t('settings.users.addDialog.role')}</Label>
                                                <Popover open={openRoleCombobox} onOpenChange={setOpenRoleCombobox}>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            role="combobox"
                                                            className={cn(
                                                                "w-full justify-between bg-white/5 border-white/10 hover:bg-white/10 hover:text-white h-11 font-bold",
                                                                !newUser.roleId && "text-muted-foreground"
                                                            )}
                                                        >
                                                            {newUser.roleId
                                                                ? (() => {
                                                                    const role = availableRoles.find(r => r.id === newUser.roleId);
                                                                    return role ? (
                                                                        <span className="truncate block max-w-[120px] text-left" title={`${role.name} ${role.enterprise ? `(${role.enterprise.name})` : "(Global)"}`}>
                                                                            {role.name} {role.enterprise ? `(${role.enterprise.name})` : "(Global)"}
                                                                        </span>
                                                                    ) : "Unknown Role";
                                                                })()
                                                                : t('settings.users.addDialog.selectRole')}
                                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-[300px] p-0 bg-zinc-950 border-white/10">
                                                        <Command>
                                                            <CommandInput placeholder={t('settings.users.addDialog.searchRole')} className="h-9" />
                                                            <CommandEmpty>{t('settings.users.addDialog.noRole')}</CommandEmpty>
                                                            <CommandGroup className="max-h-[200px] overflow-y-auto">
                                                                {availableRoles.filter(role => role.name !== 'SUPER_ADMIN').map((role) => (
                                                                    <CommandItem
                                                                        key={role.id}
                                                                        value={role.name + (role.enterprise ? ` ${role.enterprise.name}` : "")}
                                                                        onSelect={() => {
                                                                            setNewUser({ ...newUser, roleId: role.id });
                                                                            setOpenRoleCombobox(false);
                                                                        }}
                                                                        className="text-white hover:bg-white/10 cursor-pointer"
                                                                    >
                                                                        <span className="truncate block max-w-[240px]" title={`${role.name} ${role.enterprise ? `(${role.enterprise.name})` : "(Global)"}`}>
                                                                            {role.name} {role.enterprise ? `(${role.enterprise.name})` : "(Global)"}
                                                                        </span>
                                                                        <Check
                                                                            className={cn(
                                                                                "ml-auto h-4 w-4",
                                                                                newUser.roleId === role.id ? "opacity-100" : "opacity-0"
                                                                            )}
                                                                        />
                                                                    </CommandItem>
                                                                ))}
                                                            </CommandGroup>
                                                        </Command>
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="phone" className="text-xs uppercase font-bold text-zinc-400">{t('settings.users.addDialog.phone')}</Label>
                                                <Input
                                                    id="phone"
                                                    placeholder="+509..."
                                                    className="bg-white/5 border-white/10 focus:ring-emerald-500/50 h-11"
                                                    value={newUser.phone}
                                                    onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                    </div>
                                    <DialogFooter>
                                        <Button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white w-full uppercase font-black tracking-widest"
                                        >
                                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t('settings.users.addDialog.title')}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>

                        {/* View User Dialog */}
                        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                            <DialogContent className="bg-zinc-900 border-white/10 text-white max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle className="text-xl font-bold flex items-center gap-2 text-emerald-400">
                                        <UserIcon className="h-5 w-5" /> {t('settings.users.viewDialog.title')}
                                    </DialogTitle>
                                    <DialogDescription className="text-zinc-500">{t('settings.users.viewDialog.description')}</DialogDescription>
                                </DialogHeader>

                                {selectedViewUser && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
                                        <div className="space-y-4">
                                            <div>
                                                <Label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">{t('settings.users.viewDialog.fullName')}</Label>
                                                <p className="text-sm font-bold mt-1">{selectedViewUser.fullName}</p>
                                            </div>
                                            <div>
                                                <Label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">Email</Label>
                                                <p className="text-sm font-bold mt-1 break-all">{selectedViewUser.email}</p>
                                            </div>
                                            <div>
                                                <Label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">Phone</Label>
                                                <p className="text-sm font-bold mt-1">{selectedViewUser.phone || "Not specified"}</p>
                                            </div>
                                            <div>
                                                <Label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">{t('settings.users.viewDialog.userCode')}</Label>
                                                <p className="text-sm font-mono font-bold mt-1 text-emerald-400">{selectedViewUser.userCode}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <Label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">{t('settings.users.viewDialog.globalRole')}</Label>
                                                <div className="mt-1">
                                                    {selectedViewUser.role ? getRoleBadge(selectedViewUser.role.level) : (
                                                        <span className="text-zinc-500 italic text-xs">{t('settings.users.viewDialog.noGlobalRole')}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div>
                                                <Label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">{t('settings.users.viewDialog.accountStatus')}</Label>
                                                <div className="mt-1">
                                                    {getStatusBadge(selectedViewUser.isActive)}
                                                </div>
                                            </div>
                                            <div>
                                                <Label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">{t('settings.users.viewDialog.verification')}</Label>
                                                <div className="mt-1">
                                                    {getVerificationBadge(selectedViewUser.isVerified)}
                                                </div>
                                            </div>
                                            <div>
                                                <Label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">{t('settings.users.viewDialog.sede')}</Label>
                                                <p className="text-sm font-bold mt-1 text-emerald-400">
                                                    {selectedViewUser.memberships?.[0]?.headquarter?.name || "Global"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <Label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">{t('settings.users.viewDialog.memberSince')}</Label>
                                                <p className="text-sm font-bold mt-1 text-zinc-400">
                                                    {new Date(selectedViewUser.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <DialogFooter className="gap-2 sm:gap-0">
                                    <Button
                                        variant="outline"
                                        onClick={() => selectedViewUser && handleEditUser(selectedViewUser)}
                                        className="bg-blue-600/10 border-blue-500/20 text-blue-400 hover:bg-blue-600 hover:text-white font-bold w-full md:w-auto gap-2"
                                    >
                                        <Edit className="h-4 w-4" /> Edit
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => setIsViewDialogOpen(false)}
                                        className="bg-zinc-800 border-white/5 text-white hover:bg-zinc-700 font-bold w-full md:w-auto"
                                    >{t('settings.users.viewDialog.close')}</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        {/* Edit User Dialog */}
                        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                            <DialogContent className="bg-zinc-900 border-white/10 text-white max-w-md">
                                <DialogHeader>
                                    <DialogTitle className="text-xl font-bold flex items-center gap-2 text-blue-400">
                                        <Edit className="h-5 w-5" /> {t('settings.users.editDialog.title')}
                                    </DialogTitle>
                                    <DialogDescription className="text-zinc-500">{t('settings.users.editDialog.description')}</DialogDescription>
                                </DialogHeader>

                                <form onSubmit={handleSaveEditUser} className="space-y-6 py-4">
                                    <div className="space-y-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="edit-name" className="text-xs uppercase font-bold text-zinc-400">Full Name</Label>
                                            <Input
                                                id="edit-name"
                                                className="bg-white/5 border-white/10 focus:ring-blue-500/50 h-11"
                                                value={editUserData.fullName || ""}
                                                onChange={(e) => setEditUserData({ ...editUserData, fullName: e.target.value })}
                                                required
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="edit-email" className="text-xs uppercase font-bold text-zinc-400">Email</Label>
                                            <Input
                                                id="edit-email"
                                                className="bg-white/5 border-white/10 focus:ring-blue-500/50 h-11"
                                                value={editUserData.email || ""}
                                                onChange={(e) => setEditUserData({ ...editUserData, email: e.target.value })}
                                                required
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="edit-phone" className="text-xs uppercase font-bold text-zinc-400">Phone</Label>
                                            <Input
                                                id="edit-phone"
                                                placeholder="+509..."
                                                className="bg-white/5 border-white/10 focus:ring-blue-500/50 h-11"
                                                value={editUserData.phone || ""}
                                                onChange={(e) => setEditUserData({ ...editUserData, phone: e.target.value })}
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label className="text-xs uppercase font-bold text-zinc-400">Role</Label>
                                            <Select
                                                value={editUserData.roleId || ""}
                                                onValueChange={(val) => setEditUserData({ ...editUserData, roleId: val })}
                                            >
                                                <SelectTrigger className="bg-white/5 border-white/10 focus:ring-blue-500/50 h-11 font-bold">
                                                    <SelectValue placeholder={t('settings.users.addDialog.selectRole')} />
                                                </SelectTrigger>
                                                <SelectContent className="bg-zinc-950 border-white/10 text-white">
                                                    {availableRoles.filter(role => !role.enterprise && role.name !== 'SUPER_ADMIN').map((role) => (
                                                        <SelectItem
                                                            key={role.id}
                                                            value={role.id}
                                                            className="text-white hover:bg-white/10 cursor-pointer"
                                                        >
                                                            {role.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                                            <div className="space-y-1">
                                                <Label className="text-sm font-bold">Account Status</Label>
                                                <p className="text-[10px] text-zinc-500 uppercase font-black">{t('settings.users.editDialog.activeSuspended')}</p>
                                            </div>
                                            <Button
                                                type="button"
                                                onClick={() => setEditUserData({ ...editUserData, isActive: !editUserData.isActive })}
                                                className={cn(
                                                    "h-8 px-3 text-[10px] font-black uppercase tracking-widest transition-all",
                                                    editUserData.isActive
                                                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-500 hover:text-white"
                                                        : "bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500 hover:text-white"
                                                )}
                                            >
                                                {editUserData.isActive ? "Active" : t('settings.users.editDialog.suspended')}
                                            </Button>
                                        </div>
                                    </div>

                                    <DialogFooter className="gap-2 sm:gap-0">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setIsEditDialogOpen(false)}
                                            className="bg-zinc-800 border-white/5 text-white hover:bg-zinc-700 font-bold w-full md:w-auto"
                                        >{t('settings.users.editDialog.cancel')}</Button>
                                        <Button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest w-full md:w-auto"
                                        >
                                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : t('settings.users.editDialog.update')}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                            <Input
                                placeholder={t('settings.users.filter.search')}
                                className="pl-10 bg-white/5 border-white/10 text-white focus-visible:ring-emerald-500/50 font-bold"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value)
                                    setCurrentPage(1)
                                }}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Select value={roleFilter} onValueChange={(val) => { setRoleFilter(val); setCurrentPage(1); }}>
                                <SelectTrigger className="w-[150px] bg-white/5 border-white/20 text-white font-black text-[10px] uppercase tracking-tighter">
                                    <div className="flex items-center gap-2 w-full overflow-hidden">
                                        <Filter className="h-3 w-3 text-emerald-500 shrink-0" />
                                        <span className="truncate">
                                            <SelectValue placeholder={t('settings.users.filter.role')} />
                                        </span>
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-white/10 text-white">
                                    <SelectItem value="all">{t('settings.users.filter.allRoles')}</SelectItem>
                                    {availableRoles.map(role => (
                                        <SelectItem key={role.id} value={role.id}>
                                            {role.name} {role.enterprise ? `(${role.enterprise.name})` : "(Global)"}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}>
                                <SelectTrigger className="w-[150px] bg-white/5 border-white/20 text-white font-black text-[10px] uppercase tracking-tighter">
                                    <div className="flex items-center gap-2">
                                        <Filter className="h-3 w-3 text-emerald-500" />
                                        <SelectValue placeholder={t('settings.users.filter.status')} />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-white/10 text-white">
                                    <SelectItem value="all">{t('settings.users.filter.allStatus')}</SelectItem>
                                    <SelectItem value="active">{t('settings.users.filter.active')}</SelectItem>
                                    <SelectItem value="suspended">{t('settings.users.filter.suspended')}</SelectItem>
                                </SelectContent>
                            </Select>

                            {(searchTerm !== "" || roleFilter !== "all" || statusFilter !== "all") && (
                                <Button
                                    variant="ghost"
                                    onClick={handleResetFilters}
                                    className="text-zinc-500 hover:text-white font-bold text-xs uppercase"
                                ><X className="h-4 w-4 mr-1" />{t('settings.users.filter.reset')}</Button>
                            )}
                        </div>
                    </div>

                    <div className="rounded-lg border border-white/10 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-white/5">
                                <TableRow className="border-white/10 hover:bg-transparent">
                                    <TableHead className="text-zinc-500 font-black uppercase text-[10px] tracking-widest">{t('settings.users.table.user')}</TableHead>
                                    <TableHead className="text-zinc-500 font-black uppercase text-[10px] tracking-widest text-center">Role</TableHead>
                                    <TableHead className="text-zinc-500 font-black uppercase text-[10px] tracking-widest text-center">{t('settings.users.table.codePin')}</TableHead>
                                    <TableHead className="text-zinc-500 font-black uppercase text-[10px] tracking-widest text-center">Status</TableHead>
                                    <TableHead className="text-zinc-500 font-black uppercase text-[10px] tracking-widest text-center">{t('settings.users.table.verified')}</TableHead>
                                    <TableHead className="text-right text-zinc-500 font-black uppercase text-[10px] tracking-widest">{t('settings.users.table.actions')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-48 text-center">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <Loader2 className="h-10 w-10 animate-spin text-emerald-500/50" />
                                                <span className="text-zinc-500 font-black text-xs uppercase tracking-widest">{t('settings.users.table.loading')}</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredUsers.length > 0 ? (
                                    filteredUsers.map((user) => (
                                        <TableRow key={user.id} className="border-white/5 hover:bg-white/[0.02] transition-colors">
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                                        {user.avatarUrl ? (
                                                            <img src={user.avatarUrl} alt={user.fullName} className="h-full w-full rounded-full object-cover" />
                                                        ) : (
                                                            <UserIcon className="h-5 w-5 text-emerald-500" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-white text-sm">{user.fullName}</div>
                                                        <div className="text-[10px] text-zinc-500 font-black uppercase tracking-tight">{user.email}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex flex-col gap-1 items-center justify-center">
                                                    {(() => {
                                                        const isRoleInMemberships = user.role && user.memberships?.some(m =>
                                                            m.membershipRoles?.some(mr => mr.role.id === user.role.id)
                                                        );
                                                        return !isRoleInMemberships && user.role && getRoleBadge(user.role.level);
                                                    })()}
                                                    {user.memberships?.map((m, idx) => (
                                                        m.membershipRoles?.map((mr, rIdx) => (
                                                            <div
                                                                key={`${idx}-${rIdx}`}
                                                                className="flex items-center bg-white/5 rounded-md border border-white/10 overflow-hidden h-5 group cursor-help transition-all hover:bg-white/10"
                                                                title={`Role: ${mr.role.name} - Enterprise: ${m.enterprise.name}${m.headquarter ? ` - HQ: ${m.headquarter.name}` : ""}`}
                                                            >
                                                                <div className={cn("px-1.5 h-full flex items-center justify-center text-[9px] font-black uppercase tracking-wider", getRoleColorClass(mr.role.level), "bg-opacity-20 border-r-0 rounded-none")}>
                                                                    {mr.role.level}
                                                                </div>
                                                                <div className="px-1.5 h-full flex items-center text-[9px] text-zinc-400 gap-1 border-l border-white/5 max-w-[120px]">
                                                                    <Building2 className="h-2.5 w-2.5 shrink-0 text-zinc-500 group-hover:text-zinc-300" />
                                                                    <span className="truncate group-hover:text-zinc-200 transition-colors">
                                                                        {m.headquarter ? m.headquarter.name : m.enterprise.name}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))
                                                    ))}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-zinc-400 text-center font-mono text-xs font-bold">{user.userCode}</TableCell>
                                            <TableCell className="text-center">{getStatusBadge(user.isActive)}</TableCell>
                                            <TableCell className="text-zinc-500 text-center text-[10px] font-black uppercase">
                                                {getVerificationBadge(user.isVerified)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild disabled={currentUser?.id === user.id}>
                                                        <Button
                                                            variant="ghost"
                                                            className={cn(
                                                                "h-8 w-8 p-0 text-zinc-500 hover:text-white hover:bg-white/10 rounded-full",
                                                                currentUser?.id === user.id && "opacity-0 cursor-default pointer-events-none"
                                                            )}
                                                        >
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="bg-zinc-900 border-white/10 text-white min-w-[160px]">
                                                        <DropdownMenuLabel className="text-[10px] uppercase font-black text-zinc-500 tracking-widest px-2 py-1.5">{t('settings.users.actions.actionDossier')}</DropdownMenuLabel>
                                                        <DropdownMenuItem className="cursor-pointer gap-2 font-bold text-xs py-2" onClick={() => handleViewUser(user)}>
                                                            <Eye className="h-3.5 w-3.5 text-blue-400" /> {t('settings.users.actions.viewUser')}
                                                        </DropdownMenuItem>
                                                        {(user.loginAttempts >= 3 || (user.lockoutUntil && new Date(user.lockoutUntil) > new Date())) && (
                                                            <DropdownMenuItem className="cursor-pointer gap-2 font-bold text-xs py-2" onClick={() => handleUnlockAccount(user.id)}>
                                                                <Key className="h-3.5 w-3.5 text-amber-400" /> {t('settings.users.actions.unlockAccount')}
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuSeparator className="bg-white/5" />
                                                        <DropdownMenuItem
                                                            className={cn(
                                                                "cursor-pointer gap-2 font-bold text-xs py-2",
                                                                user.isActive ? "text-red-400 hover:text-red-300" : "text-emerald-400 hover:text-emerald-300"
                                                            )}
                                                            onClick={() => handleToggleStatus(user)}
                                                        >
                                                            {user.isActive ? (
                                                                <>
                                                                    <Ban className="h-3.5 w-3.5" /> Suspend User
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Check className="h-3.5 w-3.5" /> Activate User
                                                                </>
                                                            )}
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-32 text-center text-zinc-600 font-black uppercase text-[10px] tracking-widest">
                                            No users found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {!isLoading && totalPages > 1 && (
                        <div className="mt-6">
                            <Pagination>
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationPrevious
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault()
                                                if (currentPage > 1) setCurrentPage(currentPage - 1)
                                            }}
                                            className={currentPage === 1 ? "pointer-events-none opacity-20" : "text-white hover:bg-white/10 font-bold"}
                                        />
                                    </PaginationItem>
                                    {[...Array(totalPages)].map((_, i) => (
                                        <PaginationItem key={i + 1}>
                                            <PaginationLink
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    setCurrentPage(i + 1)
                                                }}
                                                isActive={currentPage === i + 1}
                                                className={currentPage === i + 1 ? "bg-emerald-600 text-white hover:bg-emerald-700 border-none font-black" : "text-zinc-500 hover:text-white hover:bg-white/10 font-black"}
                                            >
                                                {i + 1}
                                            </PaginationLink>
                                        </PaginationItem>
                                    ))}
                                    <PaginationItem>
                                        <PaginationNext
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault()
                                                if (currentPage < totalPages) setCurrentPage(currentPage + 1)
                                            }}
                                            className={currentPage === totalPages ? "pointer-events-none opacity-20" : "text-white hover:bg-white/10 font-bold"}
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div >
    )
}

export default Users