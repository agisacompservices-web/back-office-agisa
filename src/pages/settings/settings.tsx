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
    Shield,
    Save,
    RotateCcw,
    CheckCircle2,
    Users,
    ChevronRight,
    Search
} from "lucide-react"
import { Input } from "../../components/ui/input"
import { allPermissions, rolesData, PermissionCategory } from "../../context/data/dataPermissions"
import { toast } from "sonner"

const Permissions: React.FC = () => {
    const [selectedRole, setSelectedRole] = useState<string>("pdg")
    const [tempPermissions, setTempPermissions] = useState<string[]>(
        rolesData.find(r => r.role === selectedRole)?.permissions || []
    )
    const [searchTerm, setSearchTerm] = useState("")

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

    const categories: PermissionCategory[] = ["Finance", "Accounting", "Litigation", "Services", "Administration"]

    const filteredPermissions = allPermissions.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6 pt-6">
            {/* Page Header (Commented out for consistency with other modules) */}
            {/* <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Lock className="h-8 w-8 text-emerald-500" />
                    <h2 className="text-3xl font-bold tracking-tight text-white">Permissions & Access</h2>
                </div>
            </div> */}

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
                        <CardHeader>
                            <CardTitle className="text-white text-lg">Role Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border border-white/10 overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-white/5">
                                        <TableRow className="border-white/10 hover:bg-transparent">
                                            <TableHead className="text-zinc-500 font-bold uppercase text-[10px]">Role Name</TableHead>
                                            <TableHead className="text-zinc-500 font-bold uppercase text-[10px]">Level</TableHead>
                                            <TableHead className="text-zinc-500 font-bold uppercase text-[10px] text-right">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {rolesData.map((role) => (
                                            <TableRow key={role.role} className="border-white/10 hover:bg-white/5">
                                                <TableCell className="font-black uppercase text-xs text-zinc-300">
                                                    {role.role}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-500">
                                                        {role.role === "pdg" ? "Super Admin" : "Restricted"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <CheckCircle2 className="h-4 w-4 text-emerald-500 ml-auto" />
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
        </div>
    )
}

export default Permissions