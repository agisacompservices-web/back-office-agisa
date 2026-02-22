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
    // CardDescription,
    CardHeader,
    CardTitle,
} from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Badge } from "../../components/ui/badge"
import { Checkbox } from "../../components/ui/checkbox"
import { useTranslation } from "react-i18next"
// import {
//     Tabs,
//     TabsContent,
//     TabsList,
//     TabsTrigger,
// } from "../../components/ui/tabs"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../../components/ui/dialog"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from "../../components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "../../components/ui/popover"
import {
    Shield,
    // Save,
    // RotateCcw,
    // Users,
    ChevronRight,
    Search,
    Plus,
    Edit,
    Eye
} from "lucide-react"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { cn } from "../../lib/utils"
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "../../components/ui/pagination"
import { getPaginationRange } from "../../lib/pagination-utils"
import { toast } from "sonner"
import rolesApi, { Role } from "../../context/api/roles"
import permissionsApi, { Permission } from "../../context/api/permissions"
import enterpriseApi, { Enterprise } from "../../context/api/enterprise"


const Permissions: React.FC = () => {
    const { t } = useTranslation();
    const [selectedRoleId, setSelectedRoleId] = useState<string>("")
    const [roles, setRoles] = useState<Role[]>([])
    const [allPermissions, setAllPermissions] = useState<Permission[]>([])
    // const [tempPermissions, setTempPermissions] = useState<string[]>([])
    // const [searchTerm, setSearchTerm] = useState("")
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [isAddPermissionDialogOpen, setIsAddPermissionDialogOpen] = useState(false)
    const [newPermissionKey, setNewPermissionKey] = useState("")
    const [newPermissionModule, setNewPermissionModule] = useState("")
    const [newPermissionDescription, setNewPermissionDescription] = useState("")
    const [newRoleName, setNewRoleName] = useState("")
    const [newRoleLevel, setNewRoleLevel] = useState("")
    const [newRoleDescription, setNewRoleDescription] = useState("")
    const [isGlobalRole, setIsGlobalRole] = useState(true)
    const [selectedEnterpriseId, setSelectedEnterpriseId] = useState<string>("")
    const [enterprises, setEnterprises] = useState<Enterprise[]>([])
    const [openEnterprisePopover, setOpenEnterprisePopover] = useState(false)

    // View Role State
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
    const [roleToView, setRoleToView] = useState<Role | null>(null)

    // Edit Role State
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [roleToEdit, setRoleToEdit] = useState<Role | null>(null)
    const [editRoleName, setEditRoleName] = useState("")
    const [editRoleLevel, setEditRoleLevel] = useState("")
    const [editRoleDescription, setEditRoleDescription] = useState("")
    const [selectedEditEnterpriseId, setSelectedEditEnterpriseId] = useState<string>("")
    const [isEditGlobalRole, setIsEditGlobalRole] = useState(true)

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [searchTerm, setSearchTerm] = useState("")
    const [debouncedSearch, setDebouncedSearch] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const itemsPerPage = 10

    const fetchData = useCallback(async (page = 1, search = "") => {
        setIsLoading(true)
        try {
            const [rolesResp, permissionsResp] = await Promise.all([
                rolesApi.getAll({ page, limit: itemsPerPage, search: search || undefined }),
                permissionsApi.getAll({ limit: 100 })
            ])
            const rolesData = Array.isArray(rolesResp) ? rolesResp : (rolesResp as any).data || []
            setRoles(rolesData)
            if ((rolesResp as any).meta) {
                setTotalPages((rolesResp as any).meta.lastPage || 1)
            }
            setAllPermissions(permissionsResp?.data || (Array.isArray(permissionsResp) ? permissionsResp : []))

            if (rolesData.length > 0 && !selectedRoleId) {
                const firstRole = rolesData[0]
                setSelectedRoleId(firstRole.id)
            }
        } catch (error) {
            console.error("Failed to fetch data:", error)
            toast.error("Fetch Error", { description: "Failed to load roles or permissions." })
        } finally {
            setIsLoading(false)
        }
    }, [selectedRoleId])

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm)
            setCurrentPage(1)
        }, 500)
        return () => clearTimeout(timer)
    }, [searchTerm])

    useEffect(() => {
        fetchData(currentPage, debouncedSearch)
    }, [fetchData, currentPage, debouncedSearch])

    useEffect(() => {
        if (isAddDialogOpen || isEditDialogOpen) {
            enterpriseApi.getAll()
                .then(res => setEnterprises(Array.isArray(res) ? res : res.data || []))
                .catch(err => console.error("Failed to fetch enterprises:", err))
        }
    }, [isAddDialogOpen, isEditDialogOpen])

    // const handleRoleChange = (roleId: string) => {
    //     setSelectedRoleId(roleId)
    //     const role = roles.find(r => r.id === roleId)
    //     setTempPermissions(role?.rolePermissions?.map((rp: any) => rp.permissionId) || [])
    // }

    // const togglePermission = (permissionId: string) => {
    //     setTempPermissions(prev =>
    //         prev.includes(permissionId)
    //             ? prev.filter(id => id !== permissionId)
    //             : [...prev, permissionId]
    //     )
    // }

    // const handleSave = async () => {
    //     if (!selectedRoleId) return
    //     try {
    //         await rolesApi.syncPermissions(selectedRoleId, tempPermissions)
    //         toast.success("Permissions Updated", {
    //             description: "Changes have been saved successfully."
    //         })
    //         fetchData() // Refresh to get updated rolePermissions
    //     } catch (error) {
    //         console.error("Failed to sync permissions:", error)
    //         toast.error("Update Failed", { description: "Failed to save permissions." })
    //     }
    // }

    // const handleReset = () => {
    //     const role = roles.find(r => r.id === selectedRoleId)
    //     setTempPermissions(role?.rolePermissions?.map((rp: any) => rp.permissionId) || [])
    //     toast.info("Changes Discarded", {
    //         description: "Permissions have been reset."
    //     })
    // }

    const handleAddRole = async () => {
        if (!newRoleName.trim() || !newRoleLevel.trim()) {
            toast.error("Validation Error", {
                description: "Role name and level are required."
            })
            return
        }

        if (!isGlobalRole && !selectedEnterpriseId) {
            toast.error("Validation Error", {
                description: "Please select an enterprise for enterprise-specific roles."
            })
            return
        }

        try {
            await rolesApi.create({
                name: newRoleName,
                enterpriseId: isGlobalRole ? undefined : selectedEnterpriseId,
                level: newRoleLevel,
                description: newRoleDescription || undefined,
                isSystem: isGlobalRole
            })

            toast.success("Role Created", {
                description: `Role '${newRoleName}' has been created successfully.`
            })

            fetchData() // Refresh list

            // Reset form and close dialog
            setNewRoleName("")
            setNewRoleLevel("")
            setNewRoleDescription("")
            setIsGlobalRole(true)
            setSelectedEnterpriseId("")
            setIsAddDialogOpen(false)
        } catch (error: any) {
            console.error("Failed to create role:", error)
            toast.error("Creation Failed", {
                description: error.response?.data?.message || "Failed to create role."
            })
        }
    }

    const handleAddPermission = async () => {
        if (!newPermissionKey.trim() || !newPermissionModule.trim()) {
            toast.error("Validation Error", {
                description: "Key and Module are required."
            })
            return
        }

        // Backend Regex: /^[a-z]+:[a-z]+(:[a-z]+)?$/
        const keyRegex = /^[a-z]+:[a-z]+(:[a-z]+)?$/
        if (!keyRegex.test(newPermissionKey)) {
            toast.error("Format Error", {
                description: "Key must follow format 'action:resource' or 'action:resource:scope' (lowercase only)."
            })
            return
        }

        try {
            await permissionsApi.create({
                key: newPermissionKey,
                module: newPermissionModule,
                description: newPermissionDescription || undefined
            })

            toast.success("Permission Created", {
                description: `Permission '${newPermissionKey}' has been created.`
            })

            fetchData() // Refresh list

            // Reset form
            setNewPermissionKey("")
            setNewPermissionModule("")
            setNewPermissionDescription("")
            setIsAddPermissionDialogOpen(false)
        } catch (error: any) {
            console.error("Failed to create permission:", error)
            toast.error("Creation Failed", {
                description: error.response?.data?.message || "Failed to create permission."
            })
        }
    }

    const categories = Array.from(new Set((allPermissions || []).map(p => p.module)))

    // const filteredPermissions = (allPermissions || []).filter(p =>
    //     p.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
    //     (p.description?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    //     p.module.toLowerCase().includes(searchTerm.toLowerCase())
    // )

    return (
        <div className="space-y-6 pt-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Roles Sidebar */}
                <div className="lg:col-span-4 space-y-6">
                    {/* <Card className="border-slate-200 bg-slate-50 backdrop-blur-xl h-fit">
                        <CardHeader>
                            <CardTitle className="text-black flex items-center gap-2">
                                <Users className="h-5 w-5 text-emerald-500" />
                                System Roles
                            </CardTitle>
                            <CardDescription className="text-zinc-400 font-bold uppercase text-[10px]">
                                Select a role to define its access limits
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="flex flex-col">
                                {roles.map((role) => (
                                    <button
                                        key={role.id}
                                        onClick={() => handleRoleChange(role.id)}
                                        className={`flex items-center justify-between px-6 py-4 text-left transition-colors border-l-2 ${selectedRoleId === role.id
                                            ? "bg-emerald-500/10 border-emerald-500 text-black"
                                            : "text-zinc-400 border-transparent hover:bg-slate-50 hover:text-black"
                                            }`}
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-bold uppercase tracking-wider text-sm text-zinc-100 italic">
                                                {role.name}
                                            </span>
                                            <span className="text-xs text-zinc-500">
                                                {role.rolePermissions?.length || 0} Permissions Active
                                            </span>
                                        </div>
                                        <ChevronRight className={`h-4 w-4 transition-transform ${selectedRoleId === role.id ? "rotate-90 text-emerald-500" : ""}`} />
                                    </button>
                                ))}
                            </div>
                        </CardContent>
                    </Card> */}

                    <Card className="border-emerald-100 bg-emerald-50 shadow-sm">
                        <CardContent className="pt-6">
                            <div className="flex items-start gap-3">
                                <div className="h-9 w-9 rounded-lg bg-white flex items-center justify-center shadow-sm border border-emerald-100">
                                    <Shield className="h-5 w-5 text-emerald-500 shrink-0" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-slate-800">{t('settings.roles.securityTipTitle')}</p>
                                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                                        Always follow the <span className="text-emerald-600 font-bold uppercase tracking-tighter">Principle of Least Privilege</span>.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Permissions Matrix */}
                <div className="lg:col-span-8 space-y-6">
                    {/* <Card className="border-slate-200 bg-slate-50 backdrop-blur-xl">
                        <CardHeader className="pb-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-black text-xl flex items-center gap-2 uppercase tracking-tight">
                                        Editing Access: <span className="text-emerald-500 underline decoration-emerald-500/30 underline-offset-4">{roles.find(r => r.id === selectedRoleId)?.name}</span>
                                    </CardTitle>
                                    <CardDescription className="text-zinc-400 mt-1">
                                        Configure granular permissions for this role across all modules.
                                    </CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-slate-200 text-zinc-400 hover:text-black hover:bg-slate-50"
                                        onClick={handleReset}
                                    >
                                        <RotateCcw className="h-4 w-4 mr-2" />
                                        Reset
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="bg-emerald-600 hover:bg-emerald-700 text-black"
                                        onClick={handleSave}
                                    >
                                        <Save className="h-4 w-4 mr-2" />
                                        Save Changes
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="relative mb-6 flex gap-3">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                    <Input
                                        placeholder="Filter permissions..."
                                        className="bg-slate-50 border-slate-200 pl-10 text-black focus-visible:ring-emerald-500/50"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <Button
                                    onClick={() => setIsAddPermissionDialogOpen(true)}
                                    className="bg-slate-50 border-slate-200 hover:bg-slate-100 text-zinc-300 gap-2 border"
                                >
                                    <Plus className="h-4 w-4" />
                                    New Permission
                                </Button>
                            </div>

                            <Tabs defaultValue={categories[0]} className="w-full">
                                <TabsList className="bg-slate-50 border border-slate-200 w-full justify-start overflow-x-auto p-1 h-auto flex flex-nowrap scrollbar-none">
                                    {categories.map((cat) => (
                                        <TabsTrigger
                                            key={cat}
                                            value={cat}
                                            className="uppercase text-[10px] font-black tracking-widest px-4 py-2 data-[state=active]:bg-emerald-500 data-[state=active]:text-black transition-all"
                                        >
                                            {cat}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>

                                {categories.map((cat) => (
                                    <TabsContent key={cat} value={cat} className="mt-6 space-y-4">
                                        <div className="grid gap-1">
                                            {filteredPermissions
                                                .filter(p => p.module === cat)
                                                .map((permission) => (
                                                    <div
                                                        key={permission.id}
                                                        className={`flex items-start gap-4 p-4 rounded-lg border transition-all cursor-pointer group ${tempPermissions.includes(permission.id)
                                                            ? "bg-emerald-500/5 border-emerald-500/20"
                                                            : "bg-transparent border-transparent hover:bg-slate-50"
                                                            }`}
                                                        onClick={() => togglePermission(permission.id)}
                                                    >
                                                        <div className="pt-0.5">
                                                            <Checkbox
                                                                checked={tempPermissions.includes(permission.id)}
                                                                onCheckedChange={() => togglePermission(permission.id)}
                                                                className="border-emerald-500/50 data-[state=checked]:bg-emerald-500 data-[state=checked]:text-black"
                                                            />
                                                        </div>
                                                        <div className="flex-1 space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm font-bold text-black group-hover:text-emerald-400 transition-colors">
                                                                    {permission.key}
                                                                </span>
                                                                {tempPermissions.includes(permission.id) && (
                                                                    <Badge className="h-4 px-1.5 text-[8px] bg-emerald-500 text-black border-none font-black uppercase">
                                                                        Enabled
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-zinc-500 font-medium">
                                                                {permission.description}
                                                            </p>
                                                        </div>
                                                        <div className="text-[10px] font-mono text-zinc-700 font-bold group-hover:text-zinc-600">
                                                            ID: {permission.id}
                                                        </div>
                                                    </div>
                                                ))}

                                            {filteredPermissions.filter(p => p.module === cat).length === 0 && (
                                                <div className="py-12 text-center">
                                                    <p className="text-zinc-500 font-bold italic">No permissions found in this category.</p>
                                                </div>
                                            )}
                                        </div>
                                    </TabsContent>
                                ))}
                            </Tabs>
                        </CardContent>
                    </Card> */}

                    {/* Quick Assignment Table */}
                    <Card className="border-slate-200 bg-white shadow-xl shadow-slate-200/50 rounded-xl overflow-hidden">
                        <CardHeader className="border-b border-slate-50">
                            <div className="flex items-center justify-between gap-4">
                                <CardTitle className="text-slate-800 text-lg font-bold">{t('settings.roles.roleSummary')}</CardTitle>
                                <div className="flex items-center gap-3">
                                    <div className="relative w-64 group">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                        <Input
                                            placeholder={t('settings.roles.searchRoles')}
                                            className="bg-slate-50 border-slate-200 pl-10 text-slate-800 focus-visible:ring-indigo-500/30 rounded-lg h-10 font-medium"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <Button
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 rounded-lg shadow-lg shadow-emerald-500/20 transition-all border-none"
                                        onClick={() => setIsAddDialogOpen(true)}
                                    >
                                        <Plus className="h-4 w-4 mr-2" /> {t('settings.roles.addRole')}
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border border-slate-200 overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-slate-50/50">
                                        <TableRow className="border-slate-100 hover:bg-transparent">
                                            <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-wider">{t('settings.roles.table.roleName')}</TableHead>
                                            <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-wider">{t('settings.roles.table.level')}</TableHead>
                                            <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-wider">{t('settings.roles.table.enterprise')}</TableHead>
                                            <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-wider">{t('settings.roles.table.addedOn')}</TableHead>
                                            <TableHead className="text-slate-500 font-bold uppercase text-[10px] text-right tracking-wider">{t('settings.roles.table.actions')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoading ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-10 text-zinc-500 italic">
                                                    {t('settings.roles.table.loading')}
                                                </TableCell>
                                            </TableRow>
                                        ) : roles.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-10 text-zinc-500 italic">
                                                    {t('settings.roles.table.noRoles')}
                                                </TableCell>
                                            </TableRow>
                                        ) : roles.map((role) => (
                                            <TableRow key={role.id} className="border-slate-100 hover:bg-slate-50/50 transition-colors">
                                                <TableCell className="font-bold uppercase text-xs text-slate-800 tracking-tight">
                                                    {role.name}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="text-[10px] font-bold border-emerald-100 bg-emerald-50 text-emerald-700 rounded-md">
                                                        {role.level}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-slate-500 font-bold uppercase text-[10px]">
                                                    {role.enterprise ? role.enterprise.name : <Badge variant="secondary" className="bg-slate-100 text-slate-500 text-[9px] font-bold px-1.5 py-0 border-none">{t('settings.roles.table.global')}</Badge>}
                                                </TableCell>
                                                <TableCell className="text-slate-500 font-bold text-[10px]">
                                                    {new Date(role.createdAt).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 text-zinc-400 hover:text-black hover:bg-slate-100"
                                                            onClick={() => {
                                                                setRoleToView(role)
                                                                setIsViewDialogOpen(true)
                                                            }}
                                                        >
                                                            <Eye className="h-3 w-3" />
                                                        </Button>
                                                    </div>
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
                                                    className={currentPage === 1 ? "pointer-events-none opacity-50 text-zinc-500" : "text-black hover:bg-slate-100 cursor-pointer"}
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
                                                            className={cn(
                                                                "h-9 w-9 font-bold rounded-lg transition-all",
                                                                currentPage === pageNumber
                                                                    ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 border-none"
                                                                    : "text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                                                            )}
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
                                                    className={currentPage === totalPages ? "pointer-events-none opacity-50 text-zinc-500" : "text-black hover:bg-slate-100 cursor-pointer"}
                                                />
                                            </PaginationItem>
                                        </PaginationContent>
                                    </Pagination>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* {t('settings.roles.addRole')} Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent className="bg-white border-slate-200 text-black shadow-2xl rounded-xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-emerald-600 uppercase tracking-tight">{t('settings.roles.addDialog.title')}</DialogTitle>
                        <DialogDescription className="text-slate-500 font-medium">{t('settings.roles.addDialog.description')}</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                                Role Name <span className="text-red-500">*</span>
                            </label>
                            <Input
                                placeholder="e.g., Manager"
                                value={newRoleName}
                                onChange={(e) => setNewRoleName(e.target.value)}
                                className="bg-slate-50 border-slate-200 text-black focus-visible:ring-indigo-500/50 h-11"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                                Level <span className="text-red-500">*</span>
                            </label>
                            <Input
                                placeholder="e.g., MANAGER"
                                value={newRoleLevel}
                                onChange={(e) => setNewRoleLevel(e.target.value)}
                                className="bg-slate-50 border-slate-200 text-black focus-visible:ring-indigo-500/50 h-11"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                                Description
                            </label>
                            <Input
                                placeholder="Brief description of the role"
                                value={newRoleDescription}
                                onChange={(e) => setNewRoleDescription(e.target.value)}
                                className="bg-slate-50 border-slate-200 text-black focus-visible:ring-indigo-500/50 h-11"
                            />
                        </div>

                        {/* Role Scope Selection */}
                        <div className="space-y-3 pt-2">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="globalRole"
                                    checked={isGlobalRole}
                                    onCheckedChange={(checked) => {
                                        setIsGlobalRole(checked as boolean)
                                        if (checked) setSelectedEnterpriseId("")
                                    }}
                                    className="border-indigo-500/50 data-[state=checked]:bg-indigo-600 data-[state=checked]:text-white"
                                />
                                <label
                                    htmlFor="globalRole"
                                    className="text-sm font-bold text-slate-700 cursor-pointer"
                                >
                                    {t('settings.roles.addDialog.globalRole')}
                                </label>
                            </div>

                            {!isGlobalRole && (
                                <div className="space-y-2 pl-6 pt-2">
                                    <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                                        {t('settings.roles.addDialog.selectEnterprise')} <span className="text-red-500">*</span>
                                    </label>
                                    <Popover open={openEnterprisePopover} onOpenChange={setOpenEnterprisePopover}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={openEnterprisePopover}
                                                className="w-full h-11 justify-between bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 font-medium"
                                            >
                                                {selectedEnterpriseId
                                                    ? enterprises.find((e) => e.id === selectedEnterpriseId)?.name
                                                    : "Select enterprise..."}
                                                <ChevronRight className={`ml-2 h-4 w-4 shrink-0 opacity-50 transition-transform ${openEnterprisePopover ? "rotate-90" : ""}`} />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-full p-0 bg-white border-slate-200 shadow-2xl rounded-xl">
                                            <Command className="bg-white text-black">
                                                <CommandInput
                                                    placeholder={t('settings.roles.addDialog.searchEnterprise')}
                                                    className="text-black border-slate-200"
                                                />
                                                <CommandEmpty className="text-slate-500 py-6 text-center text-sm italic">{t('settings.roles.addDialog.noEnterprise')}</CommandEmpty>
                                                <CommandGroup className="max-h-64 overflow-auto custom-scrollbar">
                                                    {enterprises.map((enterprise) => (
                                                        <CommandItem
                                                            key={enterprise.id}
                                                            value={enterprise.name}
                                                            onSelect={() => {
                                                                setSelectedEnterpriseId(enterprise.id)
                                                                setOpenEnterprisePopover(false)
                                                            }}
                                                            className="text-black hover:bg-slate-100 cursor-pointer font-medium"
                                                        >
                                                            {enterprise.name}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsAddDialogOpen(false)}
                            className="border-slate-200 text-zinc-400 hover:text-black hover:bg-slate-50"
                        >{t('settings.roles.addDialog.cancel')}</Button>
                        <Button
                            onClick={handleAddRole}
                            className="bg-emerald-600 hover:bg-emerald-700 text-black"
                        >{t('settings.roles.addDialog.createRole')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* View Role Dialog */}
            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent className="max-w-md bg-white border-slate-200 text-black shadow-2xl rounded-xl">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold flex items-center gap-2 text-slate-800">
                            <Shield className="h-5 w-5 text-indigo-500" />
                            {roleToView?.name}
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 font-medium">{t('settings.roles.viewDialog.title')}</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-3 gap-6">
                            <div>
                                <label className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{t('settings.roles.table.level')}</label>
                                <div className="text-sm font-bold text-slate-800">{roleToView?.level}</div>
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Scope</label>
                                <div className="text-sm font-bold text-slate-800 whitespace-nowrap">
                                    {roleToView?.enterprise ? roleToView.enterprise.name : t('settings.roles.table.global')}
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{t('settings.roles.viewDialog.roleType')}</label>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className={cn("text-[9px] font-bold rounded-md px-1.5 py-0", roleToView?.isSystem ? "border-amber-200 bg-amber-50 text-amber-700" : "border-emerald-200 bg-emerald-50 text-emerald-700")}>
                                        {roleToView?.isSystem ? "System" : "Custom"}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100">
                            <label className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{t('settings.roles.addDialog.roleDescription')}</label>
                            <p className="text-sm text-slate-700 mt-2 p-4 bg-slate-50 rounded-xl border border-slate-100 italic leading-relaxed shadow-sm">
                                {roleToView?.description || t('settings.roles.viewDialog.noDescription')}
                            </p>
                        </div>

                        {/* <div className="flex items-center gap-2 pt-2">
                            <Badge variant="outline" className={roleToView?.isSystem ? "border-amber-500/30 text-amber-500" : "border-emerald-500/30 text-emerald-500"}>
                                {roleToView?.isSystem ? "System Role" : "Custom Role"}
                            </Badge>
                        </div> */}
                    </div>

                    <DialogFooter className="flex gap-2 sm:justify-between w-full">
                        <div className="flex-1">
                            {/* Placeholder for future specific view actions */}
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)} className="bg-transparent border-slate-200 hover:bg-slate-50 text-slate-500 font-bold px-6 rounded-lg">{t('settings.roles.viewDialog.close')}</Button>
                            <Button onClick={() => {
                                if (roleToView) {
                                    setRoleToEdit(roleToView)
                                    setEditRoleName(roleToView.name)
                                    setEditRoleLevel(roleToView.level)
                                    setEditRoleDescription(roleToView.description || "")
                                    setIsEditGlobalRole(!roleToView.enterprise)
                                    setSelectedEditEnterpriseId(roleToView.enterprise?.id || "")

                                    setIsViewDialogOpen(false)
                                    setIsEditDialogOpen(true)
                                }
                            }} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 font-bold px-6 shadow-lg shadow-indigo-500/20 rounded-lg">
                                <Edit className="h-4 w-4" />
                                Edit Role
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* Edit Role Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-md bg-white border-slate-200 text-black shadow-2xl rounded-xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-indigo-600 uppercase tracking-tight">{t('settings.roles.viewDialog.editRole')}</DialogTitle>
                        <DialogDescription className="text-slate-500 font-medium">
                            Update role information and scope.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="flex items-center space-x-3 pb-2">
                            <Checkbox
                                id="edit-global"
                                checked={isEditGlobalRole}
                                onCheckedChange={(checked) => setIsEditGlobalRole(checked as boolean)}
                                className="border-indigo-500/50 data-[state=checked]:bg-indigo-600 data-[state=checked]:text-white"
                            />
                            <Label
                                htmlFor="edit-global"
                                className="text-sm font-bold text-slate-700 cursor-pointer"
                            >
                                Global Role (Applies to all enterprises)
                            </Label>
                        </div>

                        {!isEditGlobalRole && (
                            <div className="space-y-2 pt-2">
                                <Label className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Select Enterprise</Label>
                                <Popover open={openEnterprisePopover} onOpenChange={setOpenEnterprisePopover}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            className="w-full h-11 justify-between bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 font-medium"
                                        >
                                            {selectedEditEnterpriseId
                                                ? enterprises.find((framework) => framework.id === selectedEditEnterpriseId)?.name
                                                : "Select enterprise..."}
                                            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[400px] p-0 bg-white border-slate-200 shadow-2xl rounded-xl">
                                        <Command className="bg-white text-black">
                                            <CommandInput placeholder={t('settings.roles.addDialog.searchEnterprise')} className="h-9 border-slate-200" />
                                            <CommandEmpty className="py-2 text-center text-sm italic text-slate-500">No enterprise found.</CommandEmpty>
                                            <CommandGroup className="max-h-64 overflow-y-auto custom-scrollbar">
                                                {enterprises.map((framework) => (
                                                    <CommandItem
                                                        key={framework.id}
                                                        value={framework.name}
                                                        onSelect={() => {
                                                            setSelectedEditEnterpriseId(framework.id === selectedEditEnterpriseId ? "" : framework.id)
                                                            setOpenEnterprisePopover(false)
                                                        }}
                                                        className="text-black hover:bg-slate-100 cursor-pointer font-medium"
                                                    >
                                                        {framework.name}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{t('settings.roles.table.roleName')}</Label>
                            <Input
                                placeholder="ex: District Manager"
                                className="bg-slate-50 border-slate-200 text-black h-11 focus-visible:ring-indigo-500/50"
                                value={editRoleName}
                                onChange={(e) => setEditRoleName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Level (Code)</Label>
                            <Input
                                placeholder="ex: DISTRICT_MANAGER"
                                className="bg-slate-50 border-slate-200 text-black h-11 focus-visible:ring-indigo-500/50 uppercase"
                                value={editRoleLevel}
                                onChange={(e) => setEditRoleLevel(e.target.value.toUpperCase())}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{t('settings.roles.addDialog.roleDescription')}</Label>
                            <Input
                                placeholder="Describe the role's responsibilities"
                                className="bg-slate-50 border-slate-200 text-black h-11 focus-visible:ring-indigo-500/50"
                                value={editRoleDescription}
                                onChange={(e) => setEditRoleDescription(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsEditDialogOpen(false)} className="text-zinc-400 hover:text-black hover:bg-slate-100">Cancel</Button>
                        <Button onClick={async () => {
                            if (!roleToEdit) return;

                            if (!editRoleName || !editRoleLevel) {
                                toast.error("Validation Error", {
                                    description: "Name and Level are required."
                                })
                                return
                            }

                            if (!isEditGlobalRole && !selectedEditEnterpriseId) {
                                toast.error("Validation Error", {
                                    description: "Please select an enterprise for enterprise-specific roles."
                                })
                                return
                            }

                            try {
                                await rolesApi.update(roleToEdit.id, {
                                    name: editRoleName,
                                    level: editRoleLevel,
                                    description: editRoleDescription || undefined,
                                    enterpriseId: isEditGlobalRole ? null : selectedEditEnterpriseId, // DTO expects null for global if we want to change it
                                    // isSystem logic remains same or protected? Assuming we can edit system status if needed, but usually not.
                                    isSystem: isEditGlobalRole
                                })

                                toast.success("Role Updated", {
                                    description: `Role '${editRoleName}' has been updated.`
                                })

                                fetchData() // Refresh list
                                setIsEditDialogOpen(false)
                            } catch (error) {
                                toast.error("Update Failed", {
                                    description: "Failed to update role. Please try again."
                                })
                                console.error(error)
                            }
                        }} className="bg-emerald-500 hover:bg-emerald-600 text-black">
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Permission Dialog */}
            <Dialog open={isAddPermissionDialogOpen} onOpenChange={setIsAddPermissionDialogOpen}>
                <DialogContent className="bg-white border-slate-200 text-black shadow-2xl rounded-xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-indigo-600 uppercase tracking-tight">Add New Permission</DialogTitle>
                        <DialogDescription className="text-slate-500 font-medium">
                            Define a new system permission with a specific module and action key.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                Permission Key <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                placeholder="e.g., read:reports:daily"
                                value={newPermissionKey}
                                onChange={(e) => setNewPermissionKey(e.target.value)}
                                className="bg-slate-50 border-slate-200 text-black focus-visible:ring-indigo-500/50 font-mono text-xs h-11"
                            />
                            <p className="text-[10px] text-slate-400 italic">Format: action:resource[:scope] (lowercase only)</p>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                Module <span className="text-red-500">*</span>
                            </Label>
                            <div className="flex gap-2">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="grow h-11 justify-between bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 font-medium"
                                        >
                                            {newPermissionModule || "Select Module..."}
                                            <ChevronRight className="h-4 w-4 rotate-90 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[240px] p-0 bg-white border-slate-200 shadow-2xl rounded-xl" align="start">
                                        <Command className="bg-white text-black">
                                            <CommandInput placeholder="Search module..." className="text-black border-none focus:ring-0" />
                                            <CommandEmpty className="py-2 text-center text-xs text-slate-500 italic">No category found.</CommandEmpty>
                                            <CommandGroup className="max-h-[200px] overflow-y-auto custom-scrollbar">
                                                {categories.map((mod) => (
                                                    <CommandItem
                                                        key={mod}
                                                        onSelect={() => {
                                                            setNewPermissionModule(mod)
                                                        }}
                                                        className="text-slate-700 hover:bg-indigo-50 data-[selected=true]:bg-indigo-100 data-[selected=true]:text-indigo-700 cursor-pointer font-medium"
                                                    >
                                                        {mod}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                <Input
                                    placeholder="Or type new..."
                                    value={newPermissionModule}
                                    onChange={(e) => setNewPermissionModule(e.target.value)}
                                    className="bg-slate-50 border-slate-200 text-black focus-visible:ring-indigo-500/50 w-[140px] h-11"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                Description
                            </Label>
                            <Input
                                placeholder="What does this permission allow?"
                                value={newPermissionDescription}
                                onChange={(e) => setNewPermissionDescription(e.target.value)}
                                className="bg-slate-50 border-slate-200 text-black h-11 focus-visible:ring-indigo-500/50"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsAddPermissionDialogOpen(false)}
                            className="bg-transparent border-slate-200 text-slate-500 font-bold hover:bg-slate-50"
                        >{t('settings.roles.addDialog.cancel')}</Button>
                        <Button
                            onClick={handleAddPermission}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-500/20"
                        >
                            Create Permission
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default Permissions