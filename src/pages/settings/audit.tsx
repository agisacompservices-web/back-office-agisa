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
import { Input } from "../../components/ui/input"
import { Button } from "../../components/ui/button"
import { Badge } from "../../components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu"
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
    Filter,
    X,
    Download,
    History,
    AlertCircle,
    Info,
    AlertTriangle,
} from "lucide-react"
import { auditLogsData, AuditAction, AuditSeverity } from "../../context/data/dataAudit"
import { toast } from "sonner"

const Audit: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState("")
    const [severityFilter, setSeverityFilter] = useState<AuditSeverity | "all">("all")
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10

    const filteredLogs = auditLogsData.filter(log => {
        const matchesSearch =
            log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.id.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesSeverity = severityFilter === "all" || log.severity === severityFilter

        return matchesSearch && matchesSeverity
    })

    const totalPages = Math.ceil(filteredLogs.length / itemsPerPage)
    const indexOfLastItem = currentPage * itemsPerPage
    const indexOfFirstItem = indexOfLastItem - itemsPerPage
    const currentLogs = filteredLogs.slice(indexOfFirstItem, indexOfLastItem)

    const getSeverityBadge = (severity: AuditSeverity) => {
        switch (severity) {
            case "info":
                return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 gap-1"><Info className="h-3 w-3" /> Info</Badge>
            case "warning":
                return <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 gap-1"><AlertTriangle className="h-3 w-3" /> Warning</Badge>
            case "critical":
                return <Badge className="bg-red-500/10 text-red-400 border-red-500/20 gap-1"><AlertCircle className="h-3 w-3" /> Critical</Badge>
            default:
                return <Badge>{severity}</Badge>
        }
    }

    const getActionBadge = (action: AuditAction) => {
        const baseClass = "text-[10px] font-bold uppercase tracking-tight py-0.5"
        switch (action) {
            case "login": return <Badge variant="outline" className={`${baseClass} border-emerald-500/30 text-emerald-500`}>Login</Badge>
            case "logout": return <Badge variant="outline" className={`${baseClass} border-zinc-500/30 text-zinc-500`}>Logout</Badge>
            case "create": return <Badge variant="outline" className={`${baseClass} border-blue-500/30 text-blue-500`}>Create</Badge>
            case "update": return <Badge variant="outline" className={`${baseClass} border-amber-500/30 text-amber-500`}>Update</Badge>
            case "delete": return <Badge variant="outline" className={`${baseClass} border-red-500/30 text-red-500`}>Delete</Badge>
            case "permission_change": return <Badge variant="outline" className={`${baseClass} border-purple-500/30 text-purple-500`}>Security</Badge>
            case "system_config": return <Badge variant="outline" className={`${baseClass} border-indigo-500/30 text-indigo-500`}>System</Badge>
            default: return <Badge variant="outline">{action}</Badge>
        }
    }

    const handleExport = () => {
        toast.promise(new Promise(resolve => setTimeout(resolve, 1500)), {
            loading: "Preparing audit report...",
            success: "Audit report exported successfully to PDF.",
            error: "Failed to export report."
        })
    }

    return (
        <div className="space-y-6 pt-6">
            <Card className="border-white/10 bg-black/40 backdrop-blur-xl">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle className="text-xl font-bold text-white flex items-center gap-2 uppercase tracking-tight">
                                <History className="h-5 w-5 text-emerald-500" />
                                System Audit Logs
                            </CardTitle>
                            <CardDescription className="text-zinc-400">
                                Trace and monitor all administrative and user activities within Agisa.
                            </CardDescription>
                        </div>
                        <Button variant="outline" size="sm" className="bg-white/5 border-white/10 text-white hover:bg-white/10" onClick={handleExport}>
                            <Download className="h-4 w-4 mr-2" />
                            Export logs
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                            <Input
                                placeholder="Search by user, action, ID or details..."
                                className="pl-10 bg-white/5 border-white/10 text-white focus-visible:ring-emerald-500/50"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value)
                                    setCurrentPage(1)
                                }}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-white/10">
                                        <Filter className="mr-2 h-4 w-4" />
                                        Severity: {severityFilter === "all" ? "All" : severityFilter.toUpperCase()}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-white">
                                    <DropdownMenuLabel>Filter Severity</DropdownMenuLabel>
                                    <DropdownMenuSeparator className="bg-zinc-800" />
                                    <DropdownMenuCheckboxItem checked={severityFilter === "all"} onCheckedChange={() => setSeverityFilter("all")}>All</DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem checked={severityFilter === "info"} onCheckedChange={() => setSeverityFilter("info")}>Info</DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem checked={severityFilter === "warning"} onCheckedChange={() => setSeverityFilter("warning")}>Warning</DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem checked={severityFilter === "critical"} onCheckedChange={() => setSeverityFilter("critical")}>Critical</DropdownMenuCheckboxItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {(searchTerm !== "" || severityFilter !== "all") && (
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setSearchTerm("")
                                        setSeverityFilter("all")
                                        setCurrentPage(1)
                                    }}
                                    className="text-zinc-500 hover:text-white"
                                >
                                    <X className="h-4 w-4 mr-2" />
                                    Clear
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="rounded-lg border border-white/10 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-white/5">
                                <TableRow className="border-white/10 hover:bg-transparent px-2">
                                    <TableHead className="text-zinc-500 font-bold uppercase text-[10px] w-[180px]">Timestamp</TableHead>
                                    <TableHead className="text-zinc-500 font-bold uppercase text-[10px]">User</TableHead>
                                    <TableHead className="text-zinc-500 font-bold uppercase text-[10px]">Action</TableHead>
                                    <TableHead className="text-zinc-500 font-bold uppercase text-[10px]">Details</TableHead>
                                    <TableHead className="text-zinc-500 font-bold uppercase text-[10px]">Severity</TableHead>
                                    <TableHead className="text-zinc-500 font-bold uppercase text-[10px] text-right px-4">Origin</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {currentLogs.length > 0 ? (
                                    currentLogs.map((log) => (
                                        <TableRow key={log.id} className="border-white/10 hover:bg-white/5 transition-colors group">
                                            <TableCell className="text-zinc-400 font-mono text-[11px] whitespace-nowrap">
                                                {log.timestamp}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-semibold text-white">{log.user}</span>
                                                    <span className="text-[10px] text-zinc-600 font-mono">{log.userId}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {getActionBadge(log.action)}
                                            </TableCell>
                                            <TableCell className="max-w-[300px]">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-xs text-zinc-300 line-clamp-1">{log.details}</span>
                                                    <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider">{log.entity}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {getSeverityBadge(log.severity)}
                                            </TableCell>
                                            <TableCell className="text-right px-4">
                                                <span className="text-[10px] font-mono text-zinc-500">{log.ipAddress}</span>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center text-zinc-600 font-bold italic">
                                            No logs found matching your criteria.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {totalPages > 1 && (
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

export default Audit