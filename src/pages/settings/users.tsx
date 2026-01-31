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
    Edit,
    Ban,
    Key,
    User as UserIcon,
    Filter,
    X,
    Loader2
} from "lucide-react"
import usersApi, { UserProfile, CreateUserRequest } from "../../context/api/users"
import { toast } from "sonner"

const Users: React.FC = () => {
    // API State
    const [users, setUsers] = useState<UserProfile[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    // Filter State
    const [searchTerm, setSearchTerm] = useState("")
    const [roleFilter, setRoleFilter] = useState<string>("all")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10

    // Form State for new user
    const [newUser, setNewUser] = useState<CreateUserRequest>({
        fullName: "",
        email: "",
        role: "AGENT", // Default role matching dropdown
        phone: ""
    })

    // Fetch Users
    const loadUsers = useCallback(async () => {
        setIsLoading(true)
        try {
            const response = await usersApi.getAll()
            // Backend might return { data: UserProfile[], total: number } or just UserProfile[]
            // Based on my implemented API, it's { data, total }
            setUsers(Array.isArray(response) ? response : response.data || [])
        } catch (error: any) {
            toast.error("Impossible de charger les utilisateurs", {
                description: error.response?.data?.message || "Erreur de connexion au serveur"
            })
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        loadUsers()
    }, [loadUsers])

    // Handling User Creation
    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newUser.fullName || !newUser.email || !newUser.role) {
            toast.error("Veuillez remplir tous les champs obligatoires")
            return
        }

        setIsSubmitting(true)
        try {
            await usersApi.addUser(newUser)
            toast.success("Utilisateur créé avec succès")
            setIsDialogOpen(false)
            setNewUser({ fullName: "", email: "", role: "AGENT", phone: "" })
            loadUsers() // Reload list
        } catch (error: any) {
            toast.error("Échec de la création", {
                description: error.response?.data?.message || "Une erreur est survenue"
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    // Filtering logic (Client-side)
    const filteredUsers = users.filter(user => {
        const matchesSearch =
            user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.userCode.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesRole = roleFilter === "all" || user.role.name === roleFilter
        const matchesStatus = statusFilter === "all" ||
            (statusFilter === "active" ? user.isActive : !user.isActive)

        return matchesSearch && matchesRole && matchesStatus
    })

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage
    const indexOfFirstItem = indexOfLastItem - itemsPerPage
    const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem)
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)

    const getRoleBadge = (roleName: string) => {
        switch (roleName.toUpperCase()) {
            case "SUPER_ADMIN": return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50 text-[10px]">SUPER ADMIN</Badge>
            case "ADMIN": return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50 text-[10px]">ADMIN</Badge>
            case "FINANCE": return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50 text-[10px]">FINANCE</Badge>
            case "AGENT": return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/50 text-[10px]">AGENT</Badge>
            default: return <Badge className="text-[10px] uppercase font-bold">{roleName}</Badge>
        }
    }

    const getStatusBadge = (user: UserProfile) => {
        if (!user.isActive) return <Badge className="bg-red-500/20 text-red-400 border-red-500/50 text-[10px]">SUSPENDED</Badge>
        if (!user.isVerified) return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/50 text-[10px]">PENDING</Badge>
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50 text-[10px]">ACTIVE</Badge>
    }

    const handleResetFilters = () => {
        setSearchTerm("")
        setRoleFilter("all")
        setStatusFilter("all")
        setCurrentPage(1)
    }

    const handleAction = (action: string, userName: string) => {
        toast.info(`${action} pour ${userName} - Bientôt disponible`)
    }

    return (
        <div className="space-y-6">
            <Card className="border-white/10 bg-black/40 backdrop-blur-xl">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-xl font-semibold text-white uppercase tracking-wider">Gestion des Utilisateurs</CardTitle>
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-bold uppercase text-xs">
                                    <UserPlus className="h-4 w-4" />
                                    Ajouter un Utilisateur
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px] bg-[#0c0c0c] border-white/10 text-white">
                                <form onSubmit={handleAddUser}>
                                    <DialogHeader>
                                        <DialogTitle className="uppercase tracking-widest text-emerald-500">Nouveau Compte</DialogTitle>
                                        <DialogDescription className="text-zinc-500 font-bold">
                                            Créez un nouvel utilisateur et désignez ses accès. Un email d'activation lui sera envoyé.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-6">
                                        <div className="grid gap-2">
                                            <Label htmlFor="fullName" className="text-xs uppercase font-bold text-zinc-400">Nom Complet</Label>
                                            <Input
                                                id="fullName"
                                                placeholder="ex: Jean Pierre"
                                                className="bg-white/5 border-white/10 focus-visible:ring-emerald-500/50 h-11"
                                                value={newUser.fullName}
                                                onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="email" className="text-xs uppercase font-bold text-zinc-400">Adresse Email</Label>
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
                                                <Label className="text-xs uppercase font-bold text-zinc-400">Rôle Système</Label>
                                                <Select value={newUser.role} onValueChange={(val) => setNewUser({ ...newUser, role: val })}>
                                                    <SelectTrigger className="bg-white/5 border-white/10 focus:ring-emerald-500/50 h-11 font-bold">
                                                        <SelectValue placeholder="Choisir" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-zinc-900 border-white/10 text-white">
                                                        <SelectItem value="SUPER_ADMIN">SUPER ADMIN</SelectItem>
                                                        <SelectItem value="ADMIN">ADMIN</SelectItem>
                                                        <SelectItem value="FINANCE">FINANCE</SelectItem>
                                                        <SelectItem value="AGENT">AGENT</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="phone" className="text-xs uppercase font-bold text-zinc-400">Téléphone</Label>
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
                                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Créer le compte"}
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
                                placeholder="Rechercher par nom, email ou code..."
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
                                    <div className="flex items-center gap-2">
                                        <Filter className="h-3 w-3 text-emerald-500" />
                                        <SelectValue placeholder="Role" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-white/10 text-white">
                                    <SelectItem value="all">Tous les rôles</SelectItem>
                                    <SelectItem value="SUPER_ADMIN">SUPER ADMIN</SelectItem>
                                    <SelectItem value="ADMIN">ADMIN</SelectItem>
                                    <SelectItem value="FINANCE">FINANCE</SelectItem>
                                    <SelectItem value="AGENT">AGENT</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}>
                                <SelectTrigger className="w-[150px] bg-white/5 border-white/20 text-white font-black text-[10px] uppercase tracking-tighter">
                                    <div className="flex items-center gap-2">
                                        <Filter className="h-3 w-3 text-emerald-500" />
                                        <SelectValue placeholder="Status" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-white/10 text-white">
                                    <SelectItem value="all">Tous les Statuts</SelectItem>
                                    <SelectItem value="active">Actif</SelectItem>
                                    <SelectItem value="inactive">Inactif</SelectItem>
                                    <SelectItem value="suspended">Suspendu</SelectItem>
                                </SelectContent>
                            </Select>

                            {(searchTerm !== "" || roleFilter !== "all" || statusFilter !== "all") && (
                                <Button
                                    variant="ghost"
                                    onClick={handleResetFilters}
                                    className="text-zinc-500 hover:text-white font-bold text-xs uppercase"
                                >
                                    <X className="h-4 w-4 mr-1" />
                                    Reset
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="rounded-lg border border-white/10 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-white/5">
                                <TableRow className="border-white/10 hover:bg-transparent">
                                    <TableHead className="text-zinc-500 font-black uppercase text-[10px] tracking-widest">Utilisateur</TableHead>
                                    <TableHead className="text-zinc-500 font-black uppercase text-[10px] tracking-widest text-center">Rôle</TableHead>
                                    <TableHead className="text-zinc-500 font-black uppercase text-[10px] tracking-widest text-center">Code Système</TableHead>
                                    <TableHead className="text-zinc-500 font-black uppercase text-[10px] tracking-widest text-center">Statut</TableHead>
                                    <TableHead className="text-zinc-500 font-black uppercase text-[10px] tracking-widest text-center">Créé le</TableHead>
                                    <TableHead className="text-right text-zinc-500 font-black uppercase text-[10px] tracking-widest">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-48 text-center">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <Loader2 className="h-10 w-10 animate-spin text-emerald-500/50" />
                                                <span className="text-zinc-500 font-black text-xs uppercase tracking-widest">Chargement...</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : currentItems.length > 0 ? (
                                    currentItems.map((user) => (
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
                                            <TableCell className="text-center">{getRoleBadge(user.role.name)}</TableCell>
                                            <TableCell className="text-zinc-400 text-center font-mono text-xs font-bold">{user.userCode}</TableCell>
                                            <TableCell className="text-center">{getStatusBadge(user)}</TableCell>
                                            <TableCell className="text-zinc-500 text-center text-[10px] font-black uppercase">
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0 text-zinc-500 hover:text-white hover:bg-white/10 rounded-full">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="bg-zinc-900 border-white/10 text-white min-w-[160px]">
                                                        <DropdownMenuLabel className="text-[10px] uppercase font-black text-zinc-500 tracking-widest px-2 py-1.5">Action Dossier</DropdownMenuLabel>
                                                        <DropdownMenuItem className="cursor-pointer gap-2 font-bold text-xs py-2" onClick={() => handleAction("Modifier", user.fullName)}>
                                                            <Edit className="h-3.5 w-3.5 text-blue-400" /> Modifier Profil
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="cursor-pointer gap-2 font-bold text-xs py-2" onClick={() => handleAction("Mot de passe", user.fullName)}>
                                                            <Key className="h-3.5 w-3.5 text-amber-400" /> Reset Password
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator className="bg-white/5" />
                                                        <DropdownMenuItem
                                                            className="text-red-400 hover:text-red-300 cursor-pointer gap-2 font-bold text-xs py-2"
                                                            onClick={() => handleAction("Suspension", user.fullName)}
                                                        >
                                                            <Ban className="h-3.5 w-3.5" /> Suspendre Compte
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-32 text-center text-zinc-600 font-black uppercase text-[10px] tracking-widest">
                                            Aucun utilisateur trouvé.
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
        </div>
    )
}

export default Users