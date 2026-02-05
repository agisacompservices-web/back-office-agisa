import React, { useState } from "react"
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
    CardDescription,
    CardHeader,
    CardTitle,
} from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Badge } from "../../components/ui/badge"
import { Checkbox } from "../../components/ui/checkbox"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "../../components/ui/tabs"
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
    Save,
    RotateCcw,
    Users,
    ChevronRight,
    Search,
    Plus,
    Edit,
    Eye
} from "lucide-react"
import { Input } from "../../components/ui/input"
import { allPermissions, rolesData, PermissionCategory } from "../../context/data/dataPermissions"
import { toast } from "sonner"
import rolesApi, { Role } from "../../context/api/roles"
import enterpriseApi, { Enterprise } from "../../context/api/enterprise"
import { useEffect } from "react"

const Permissions: React.FC = () => {
    const [selectedRole, setSelectedRole] = useState<string>("pdg")
    const [roles, setRoles] = useState<Role[]>([])
    const [tempPermissions, setTempPermissions] = useState<string[]>(
        rolesData.find(r => r.role === selectedRole)?.permissions || []
    )
    const [searchTerm, setSearchTerm] = useState("")
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
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

    const fetchRoles = async () => {
        try {
            const data = await rolesApi.getAll()
            setRoles(data)
        } catch (error) {
            console.error("Failed to fetch roles:", error)
        }
    }

    useEffect(() => {
        fetchRoles()
    }, [])

    useEffect(() => {
        if (isAddDialogOpen) {
            enterpriseApi.getAll()
                .then(data => setEnterprises(data))
                .catch(err => console.error("Failed to fetch enterprises:", err))
        }
    }, [isAddDialogOpen])

    const handleRoleChange = (role: string) => {
        setSelectedRole(role)
        const roleData = rolesData.find(r => r.role === role)
        setTempPermissions(roleData ? [...roleData.permissions] : [])
    }

    const togglePermission = (permissionId: string) => {
        setTempPermissions(prev =>
            prev.includes(permissionId)
                ? prev.filter(id => id !== permissionId)
                : [...prev, permissionId]
        )
    }

    const handleSave = () => {
        toast.success("Permissions Updated", {
            description: `Changes for role '${selectedRole.toUpperCase()}' have been saved successfully.`
        })
    }

    const handleReset = () => {
        const roleData = rolesData.find(r => r.role === selectedRole)
        setTempPermissions(roleData ? [...roleData.permissions] : [])
        toast.info("Changes Discarded", {
            description: "Permissions have been reset to their last saved state."
        })
    }

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

            fetchRoles() // Refresh list

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

    const categories: PermissionCategory[] = ["Finance", "Accounting", "Litigation", "Services", "Administration"]

    const filteredPermissions = allPermissions.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6 pt-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Roles Sidebar */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="border-white/10 bg-black/40 backdrop-blur-xl h-fit">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <Users className="h-5 w-5 text-emerald-500" />
                                System Roles
                            </CardTitle>
                            <CardDescription className="text-zinc-400 font-bold uppercase text-[10px]">
                                Select a role to define its access limits
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="flex flex-col">
                                {rolesData.map((role) => (
                                    <button
                                        key={role.role}
                                        onClick={() => handleRoleChange(role.role)}
                                        className={`flex items-center justify-between px-6 py-4 text-left transition-colors border-l-2 ${selectedRole === role.role
                                            ? "bg-emerald-500/10 border-emerald-500 text-white"
                                            : "text-zinc-400 border-transparent hover:bg-white/5 hover:text-white"
                                            }`}
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-bold uppercase tracking-wider text-sm">
                                                {role.role}
                                            </span>
                                            <span className="text-xs text-zinc-500">
                                                {role.permissions.length} Permissions Active
                                            </span>
                                        </div>
                                        <ChevronRight className={`h-4 w-4 transition-transform ${selectedRole === role.role ? "rotate-90 text-emerald-500" : ""}`} />
                                    </button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-emerald-500/20 bg-emerald-500/5 backdrop-blur-xl">
                        <CardContent className="pt-6">
                            <div className="flex items-start gap-3">
                                <Shield className="h-5 w-5 text-emerald-500 shrink-0 mt-1" />
                                <div className="space-y-1">
                                    <p className="text-sm font-semibold text-white">Security Tip</p>
                                    <p className="text-xs text-zinc-400 leading-relaxed">
                                        Always follow the <span className="text-emerald-400 font-bold">Principle of Least Privilege</span>.
                                        Only grant permissions users absolutely need to perform their duties.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Permissions Matrix */}
                <div className="lg:col-span-8 space-y-6">
                    <Card className="border-white/10 bg-black/40 backdrop-blur-xl">
                        <CardHeader className="pb-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-white text-xl flex items-center gap-2 uppercase tracking-tight">
                                        Editing Access: <span className="text-emerald-500 underline decoration-emerald-500/30 underline-offset-4">{selectedRole}</span>
                                    </CardTitle>
                                    <CardDescription className="text-zinc-400 mt-1">
                                        Configure granular permissions for this role across all modules.
                                    </CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-white/10 text-zinc-400 hover:text-white hover:bg-white/5"
                                        onClick={handleReset}
                                    >
                                        <RotateCcw className="h-4 w-4 mr-2" />
                                        Reset
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                        onClick={handleSave}
                                    >
                                        <Save className="h-4 w-4 mr-2" />
                                        Save Changes
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="relative mb-6">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                <Input
                                    placeholder="Filter permissions..."
                                    className="bg-white/5 border-white/10 pl-10 text-white focus-visible:ring-emerald-500/50"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <Tabs defaultValue="Finance" className="w-full">
                                <TabsList className="bg-white/5 border border-white/10 w-full justify-start overflow-x-auto p-1 h-auto flex flex-nowrap scrollbar-none">
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
                                                .filter(p => p.category === cat)
                                                .map((permission) => (
                                                    <div
                                                        key={permission.id}
                                                        className={`flex items-start gap-4 p-4 rounded-lg border transition-all cursor-pointer group ${tempPermissions.includes(permission.id)
                                                            ? "bg-emerald-500/5 border-emerald-500/20"
                                                            : "bg-transparent border-transparent hover:bg-white/5"
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
                                                                <span className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                                                                    {permission.name}
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

                                            {filteredPermissions.filter(p => p.category === cat).length === 0 && (
                                                <div className="py-12 text-center">
                                                    <p className="text-zinc-500 font-bold italic">No permissions found in this category.</p>
                                                </div>
                                            )}
                                        </div>
                                    </TabsContent>
                                ))}
                            </Tabs>
                        </CardContent>
                    </Card>

                    {/* Quick Assignment Table */}
                    <Card className="border-white/10 bg-black/40 backdrop-blur-xl">
                        <CardHeader className="grid grid-cols-2 gap-6">
                            <CardTitle className="text-white text-lg">Role Summary</CardTitle>
                            <CardTitle className="text-white text-lg text-right">
                                <Button
                                    className="border-white/10 hover:bg-white/5 bg-emerald-500"
                                    onClick={() => setIsAddDialogOpen(true)}
                                >
                                    <Plus className="h-4 w-4" /> Add Role
                                </Button>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border border-white/10 overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-white/5">
                                        <TableRow className="border-white/10 hover:bg-transparent">
                                            <TableHead className="text-zinc-500 font-bold uppercase text-[10px]">Role Name</TableHead>
                                            <TableHead className="text-zinc-500 font-bold uppercase text-[10px]">Level</TableHead>
                                            <TableHead className="text-zinc-500 font-bold uppercase text-[10px]">Enterprise</TableHead>
                                            <TableHead className="text-zinc-500 font-bold uppercase text-[10px]">Added On</TableHead>
                                            <TableHead className="text-zinc-500 font-bold uppercase text-[10px] text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {roles.map((role) => (
                                            <TableRow key={role.id} className="border-white/10 hover:bg-white/5">
                                                <TableCell className="font-black uppercase text-xs text-zinc-300">
                                                    {role.name}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-500">
                                                        {role.level}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-zinc-500 font-bold uppercase text-[10px]">
                                                    {role.enterprise ? role.enterprise.name : "Global"}
                                                </TableCell>
                                                <TableCell className="text-zinc-500 font-bold uppercase text-[10px]">
                                                    {new Date(role.createdAt).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 text-zinc-400 hover:text-white hover:bg-white/10"
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
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Add Role Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent className="bg-zinc-900 border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Add New Role</DialogTitle>
                        <DialogDescription className="text-zinc-400">
                            Create a new role with custom permissions and access levels.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">
                                Role Name <span className="text-red-500">*</span>
                            </label>
                            <Input
                                placeholder="e.g., Manager"
                                value={newRoleName}
                                onChange={(e) => setNewRoleName(e.target.value)}
                                className="bg-white/5 border-white/10 text-white focus-visible:ring-emerald-500/50"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">
                                Level <span className="text-red-500">*</span>
                            </label>
                            <Input
                                placeholder="e.g., MANAGER"
                                value={newRoleLevel}
                                onChange={(e) => setNewRoleLevel(e.target.value)}
                                className="bg-white/5 border-white/10 text-white focus-visible:ring-emerald-500/50"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-300">
                                Description
                            </label>
                            <Input
                                placeholder="Brief description of the role"
                                value={newRoleDescription}
                                onChange={(e) => setNewRoleDescription(e.target.value)}
                                className="bg-white/5 border-white/10 text-white focus-visible:ring-emerald-500/50"
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
                                    className="border-emerald-500/50 data-[state=checked]:bg-emerald-500 data-[state=checked]:text-black"
                                />
                                <label
                                    htmlFor="globalRole"
                                    className="text-sm font-medium text-zinc-300 cursor-pointer"
                                >
                                    Global Role (applies to all enterprises)
                                </label>
                            </div>

                            {!isGlobalRole && (
                                <div className="space-y-2 pl-6">
                                    <label className="text-sm font-medium text-zinc-300">
                                        Select Enterprise <span className="text-red-500">*</span>
                                    </label>
                                    <Popover open={openEnterprisePopover} onOpenChange={setOpenEnterprisePopover}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={openEnterprisePopover}
                                                className="w-full justify-between bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white"
                                            >
                                                {selectedEnterpriseId
                                                    ? enterprises.find((e) => e.id === selectedEnterpriseId)?.name
                                                    : "Select enterprise..."}
                                                <ChevronRight className={`ml-2 h-4 w-4 shrink-0 opacity-50 transition-transform ${openEnterprisePopover ? "rotate-90" : ""}`} />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-full p-0 bg-zinc-900 border-white/10">
                                            <Command className="bg-zinc-900">
                                                <CommandInput
                                                    placeholder="Search enterprise..."
                                                    className="text-white border-white/10"
                                                />
                                                <CommandEmpty className="text-zinc-500 py-6 text-center text-sm">
                                                    No enterprise found.
                                                </CommandEmpty>
                                                <CommandGroup className="max-h-64 overflow-auto">
                                                    {enterprises.map((enterprise) => (
                                                        <CommandItem
                                                            key={enterprise.id}
                                                            value={enterprise.name}
                                                            onSelect={() => {
                                                                setSelectedEnterpriseId(enterprise.id)
                                                                setOpenEnterprisePopover(false)
                                                            }}
                                                            className="text-white hover:bg-white/10 cursor-pointer"
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
                            className="border-white/10 text-zinc-400 hover:text-white hover:bg-white/5"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddRole}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            Create Role
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* View Role Dialog */}
            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent className="max-w-md border-white/5 bg-zinc-900/95 backdrop-blur-xl text-zinc-100">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold flex items-center gap-2">
                            <Shield className="h-5 w-5 text-emerald-500" />
                            {roleToView?.name}
                        </DialogTitle>
                        <DialogDescription className="text-zinc-400">
                            Role Details and Configuration
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="text-xs text-zinc-500 uppercase font-bold">Level</label>
                                <div className="text-sm font-medium text-white">{roleToView?.level}</div>
                            </div>
                            <div>
                                <label className="text-xs text-zinc-500 uppercase font-bold">Scope</label>
                                <div className="text-sm font-medium text-white">
                                    {roleToView?.enterprise ? roleToView.enterprise.name : "Global"}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-zinc-500 uppercase font-bold">Role Type</label>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className={roleToView?.isSystem ? "border-amber-500/30 rounded-md text-amber-500" : "text-sm font-medium border-emerald-500/30 rounded-md text-emerald-500"}>
                                        {roleToView?.isSystem ? "System Role" : "Custom Role"}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs text-zinc-500 uppercase font-bold">Description</label>
                            <p className="text-sm text-zinc-300 mt-1 p-3 bg-white/5 rounded-md border border-white/5 italic">
                                {roleToView?.description || "No description provided."}
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
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)} className="border-white/10 hover:bg-white/5 text-zinc-400">
                                Close
                            </Button>
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
                            }} className="bg-emerald-500 hover:bg-emerald-600 text-white gap-2">
                                <Edit className="h-4 w-4" />
                                Edit Role
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* Edit Role Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-md border-white/5 bg-zinc-900/95 backdrop-blur-xl text-zinc-100">
                    <DialogHeader>
                        <DialogTitle>Edit Role</DialogTitle>
                        <DialogDescription>
                            Update role information.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="flex items-center space-x-2 pb-2">
                            <Checkbox
                                id="edit-global"
                                checked={isEditGlobalRole}
                                onCheckedChange={(checked) => setIsEditGlobalRole(checked as boolean)}
                            />
                            <label
                                htmlFor="edit-global"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                Global Role (Applies to all enterprises)
                            </label>
                        </div>

                        {!isEditGlobalRole && (
                            <div className="space-y-2">
                                <label className="text-xs uppercase font-bold text-zinc-500">Select Enterprise</label>
                                <Popover open={openEnterprisePopover} onOpenChange={setOpenEnterprisePopover}>
                                    {/* Reusing existing popover state might conflict if both dialogs open, but they are modal so it's fine */}
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            className="w-full justify-between bg-white/5 border-white/10 text-white hover:bg-white/10"
                                        >
                                            {selectedEditEnterpriseId
                                                ? enterprises.find((framework) => framework.id === selectedEditEnterpriseId)?.name
                                                : "Select enterprise..."}
                                            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[400px] p-0 bg-zinc-950 border-white/10">
                                        <Command className="bg-transparent">
                                            <CommandInput placeholder="Search enterprise..." className="h-9" />
                                            <CommandEmpty>No enterprise found.</CommandEmpty>
                                            <CommandGroup>
                                                {enterprises.map((framework) => (
                                                    <CommandItem
                                                        key={framework.id}
                                                        value={framework.name}
                                                        onSelect={() => {
                                                            setSelectedEditEnterpriseId(framework.id === selectedEditEnterpriseId ? "" : framework.id)
                                                            setOpenEnterprisePopover(false)
                                                        }}
                                                        className="text-zinc-400 aria-selected:bg-white/10 aria-selected:text-white"
                                                    >
                                                        {framework.name}
                                                        {/* Check icon logic would go here */}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-xs uppercase font-bold text-zinc-500">Role Name</label>
                            <Input
                                placeholder="ex: District Manager"
                                className="bg-white/5 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-emerald-500/50"
                                value={editRoleName}
                                onChange={(e) => setEditRoleName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs uppercase font-bold text-zinc-500">Level (Code)</label>
                            <Input
                                placeholder="ex: DISTRICT_MANAGER"
                                className="bg-white/5 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-emerald-500/50 uppercase"
                                value={editRoleLevel}
                                onChange={(e) => setEditRoleLevel(e.target.value.toUpperCase())}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs uppercase font-bold text-zinc-500">Description</label>
                            <Input
                                placeholder="Describe the role's responsibilities"
                                className="bg-white/5 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-emerald-500/50"
                                value={editRoleDescription}
                                onChange={(e) => setEditRoleDescription(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsEditDialogOpen(false)} className="text-zinc-400 hover:text-white hover:bg-white/10">Cancel</Button>
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

                                fetchRoles() // Refresh list
                                setIsEditDialogOpen(false)
                            } catch (error) {
                                toast.error("Update Failed", {
                                    description: "Failed to update role. Please try again."
                                })
                                console.error(error)
                            }
                        }} className="bg-emerald-500 hover:bg-emerald-600 text-white">
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default Permissions