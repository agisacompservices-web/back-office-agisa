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
    Edit,
    Ban,
    Key,
    User as UserIcon,
    Filter,
    X
} from "lucide-react"
import { usersData, UserRole, UserStatus } from "../../context/data/dataUsers"
import { toast } from "sonner"

const Users: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState("")
    const [roleFilter, setRoleFilter] = useState<string>("all")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 5

    // Filtering logic
    const filteredUsers = usersData.filter(user => {
        const matchesSearch =
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.id.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesRole = roleFilter === "all" || user.role === roleFilter
        const matchesStatus = statusFilter === "all" || user.status === statusFilter

        return matchesSearch && matchesRole && matchesStatus
    })

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage
    const indexOfFirstItem = indexOfLastItem - itemsPerPage
    const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem)
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)

    const getRoleBadge = (role: UserRole) => {
        switch (role) {
            case "pdg": return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50">PDG</Badge>
            case "finance": return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50">Finance</Badge>
            case "accounting": return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">Accounting</Badge>
            case "litigation": return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/50">Litigation</Badge>
            case "agent": return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/50">Agent</Badge>
            default: return <Badge>{role}</Badge>
        }
    }

    const getStatusBadge = (status: UserStatus) => {
        switch (status) {
            case "active": return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50">Active</Badge>
            case "inactive": return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/50">Inactive</Badge>
            case "suspended": return <Badge className="bg-red-500/20 text-red-400 border-red-500/50">Suspended</Badge>
            default: return <Badge>{status}</Badge>
        }
    }

    const handleResetFilters = () => {
        setSearchTerm("")
        setRoleFilter("all")
        setStatusFilter("all")
        setCurrentPage(1)
    }

    const handleAction = (action: string, userName: string) => {
        toast.success(`${action} for ${userName} successful`)
    }

    return (
        <div className="space-y-6">
            {/* Page Header (Commented out as per user preference in other pages) */}
            {/* <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Shield className="h-8 w-8 text-emerald-500" />
                    <h2 className="text-3xl font-bold tracking-tight text-white">User Management</h2>
                </div>
            </div> */}

            <Card className="border-white/10 bg-black/40 backdrop-blur-xl">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-xl font-semibold text-white">System Users</CardTitle>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                                    <UserPlus className="h-4 w-4" />
                                    Add User
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px] bg-zinc-900 border-zinc-800 text-white">
                                <DialogHeader>
                                    <DialogTitle>Add New User</DialogTitle>
                                    <DialogDescription className="text-zinc-400">
                                        Create a new account and assign roles.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">Full Name</Label>
                                        <Input id="name" placeholder="Enter name" className="bg-zinc-800 border-zinc-700" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="email">Email Address</Label>
                                        <Input id="email" type="email" placeholder="email@agisa.com" className="bg-zinc-800 border-zinc-700" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label>Role</Label>
                                            <Select>
                                                <SelectTrigger className="bg-zinc-800 border-zinc-700 font-bold">
                                                    <SelectValue placeholder="Select role" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                                    <SelectItem value="pdg">PDG</SelectItem>
                                                    <SelectItem value="finance">Finance</SelectItem>
                                                    <SelectItem value="accounting">Accounting</SelectItem>
                                                    <SelectItem value="litigation">Litigation</SelectItem>
                                                    <SelectItem value="agent">Agent</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Department</Label>
                                            <Input placeholder="e.g. Finance" className="bg-zinc-800 border-zinc-700" />
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleAction("User creation", "new user")}>
                                        Create Account
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                            <Input
                                placeholder="Search by name, email or ID..."
                                className="pl-10 bg-white/5 border-white/10 text-white focus-visible:ring-emerald-500/50"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value)
                                    setCurrentPage(1)
                                }}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Select value={roleFilter} onValueChange={(val) => { setRoleFilter(val); setCurrentPage(1); }}>
                                <SelectTrigger className="w-[150px] bg-white/5 border-white/10 text-white font-bold">
                                    <div className="flex items-center gap-2">
                                        <Filter className="h-3 w-3" />
                                        <SelectValue placeholder="Role" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                    <SelectItem value="all">All Roles</SelectItem>
                                    <SelectItem value="pdg">PDG</SelectItem>
                                    <SelectItem value="finance">Finance</SelectItem>
                                    <SelectItem value="accounting">Accounting</SelectItem>
                                    <SelectItem value="litigation">Litigation</SelectItem>
                                    <SelectItem value="agent">Agent</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}>
                                <SelectTrigger className="w-[150px] bg-white/5 border-white/10 text-white font-bold">
                                    <div className="flex items-center gap-2">
                                        <Filter className="h-3 w-3" />
                                        <SelectValue placeholder="Status" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                    <SelectItem value="suspended">Suspended</SelectItem>
                                </SelectContent>
                            </Select>

                            {(searchTerm !== "" || roleFilter !== "all" || statusFilter !== "all") && (
                                <Button
                                    variant="ghost"
                                    onClick={handleResetFilters}
                                    className="text-zinc-400 hover:text-white"
                                >
                                    <X className="h-4 w-4 mr-2" />
                                    Reset
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="rounded-md border border-white/10">
                        <Table>
                            <TableHeader className="bg-white/5">
                                <TableRow className="border-white/10 hover:bg-transparent">
                                    <TableHead className="text-zinc-400 font-semibold">User</TableHead>
                                    <TableHead className="text-zinc-400 font-semibold text-center">Role</TableHead>
                                    <TableHead className="text-zinc-400 font-semibold text-center">Department</TableHead>
                                    <TableHead className="text-zinc-400 font-semibold text-center">Status</TableHead>
                                    <TableHead className="text-zinc-400 font-semibold text-center">Last Login</TableHead>
                                    <TableHead className="text-right text-zinc-400 font-semibold">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {currentItems.length > 0 ? (
                                    currentItems.map((user) => (
                                        <TableRow key={user.id} className="border-white/10 hover:bg-white/5 transition-colors">
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                                        <UserIcon className="h-5 w-5 text-emerald-500" />
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-white">{user.name}</div>
                                                        <div className="text-xs text-zinc-500 font-bold uppercase tracking-tight">{user.email}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">{getRoleBadge(user.role)}</TableCell>
                                            <TableCell className="text-zinc-300 text-center">{user.department}</TableCell>
                                            <TableCell className="text-center">{getStatusBadge(user.status)}</TableCell>
                                            <TableCell className="text-zinc-400 text-center text-sm">{user.lastLogin}</TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0 text-zinc-400 hover:text-white hover:bg-white/10">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-white">
                                                        <DropdownMenuLabel>User Actions</DropdownMenuLabel>
                                                        <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => handleAction("Edit", user.name)}>
                                                            <Edit className="h-4 w-4" /> Edit Details
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => handleAction("Password reset", user.name)}>
                                                            <Key className="h-4 w-4" /> Reset Password
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator className="bg-zinc-800" />
                                                        <DropdownMenuItem className="text-red-400 hover:text-red-300 cursor-pointer gap-2" onClick={() => handleAction("Suspension", user.name)}>
                                                            <Ban className="h-4 w-4" /> Suspend Account
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center text-zinc-500 font-bold">
                                            No users found matching your search.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="mt-4">
                            <Pagination>
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationPrevious
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault()
                                                if (currentPage > 1) setCurrentPage(currentPage - 1)
                                            }}
                                            className={currentPage === 1 ? "pointer-events-none opacity-50" : "text-white hover:bg-white/10"}
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
                                                className={currentPage === i + 1 ? "bg-emerald-600 text-white hover:bg-emerald-700 border-none" : "text-white hover:bg-white/10"}
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
                                            className={currentPage === totalPages ? "pointer-events-none opacity-50" : "text-white hover:bg-white/10"}
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

export default Users