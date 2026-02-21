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
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "../../components/ui/pagination"
import { getPaginationRange } from "../../lib/pagination-utils"
import {
    Search,
    Filter,
    X,
    Download,
    History,
    AlertCircle,
    Info,
    AlertTriangle,
    RefreshCw,
    Eye,
} from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "../../components/ui/dialog"
import auditApi, { AuditLog } from "../../context/api/audit"
import { toast } from "sonner"
import { format } from "date-fns"
import { useTranslation } from "react-i18next"

const Audit: React.FC = () => {
    const { t } = useTranslation()
    const [searchTerm, setSearchTerm] = useState("")
    const [severityFilter, setSeverityFilter] = useState<string>("all")
    const [currentPage, setCurrentPage] = useState(1)
    const [logs, setLogs] = useState<AuditLog[]>([])
    const [totalPage, setTotalPage] = useState(1)
    const [isLoading, setIsLoading] = useState(false)
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
    const [isDetailOpen, setIsDetailOpen] = useState(false)
    const itemsPerPage = 10

    const fetchLogs = React.useCallback(async (page = 1) => {
        setIsLoading(true)
        try {
            const resp = await auditApi.getAll({
                page,
                limit: itemsPerPage,
                searchTerm: searchTerm || undefined,
                severity: severityFilter === "all" ? undefined : severityFilter,
            })
            setLogs(resp.data)
            setTotalPage(resp.meta.lastPage)
            setCurrentPage(resp.meta.page)
        } catch (error) {
            toast.error(t('settings.audit.toasts.failLoad'))
        } finally {
            setIsLoading(false)
        }
    }, [searchTerm, severityFilter, itemsPerPage, t])

    React.useEffect(() => {
        fetchLogs(1)
    }, [severityFilter, fetchLogs])

    // Debounced search
    React.useEffect(() => {
        const timeout = setTimeout(() => {
            fetchLogs(1)
        }, 500)
        return () => clearTimeout(timeout)
    }, [searchTerm, fetchLogs])

    const getSeverityBadge = (severity: string) => {
        switch (severity) {
            case "info":
                return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 gap-1"><Info className="h-3 w-3" /> {t('settings.audit.info')}</Badge>
            case "warning":
                return <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 gap-1"><AlertTriangle className="h-3 w-3" /> {t('settings.audit.warning')}</Badge>
            case "critical":
                return <Badge className="bg-red-500/10 text-red-400 border-red-500/20 gap-1"><AlertCircle className="h-3 w-3" /> {t('settings.audit.critical')}</Badge>
            default:
                return <Badge>{severity}</Badge>
        }
    }

    const getActionBadge = (action: string) => {
        const baseClass = "text-[10px] font-bold uppercase tracking-tight py-0.5"
        const act = action.toLowerCase()
        if (act.includes("login")) return <Badge variant="outline" className={`${baseClass} border-emerald-500/30 text-emerald-500`}>Login</Badge>
        if (act.includes("logout")) return <Badge variant="outline" className={`${baseClass} border-zinc-500/30 text-zinc-500`}>Logout</Badge>
        if (act.includes("create")) return <Badge variant="outline" className={`${baseClass} border-blue-500/30 text-blue-500`}>Create</Badge>
        if (act.includes("update") || act.includes("edit")) return <Badge variant="outline" className={`${baseClass} border-amber-500/30 text-amber-500`}>Update</Badge>
        if (act.includes("delete") || act.includes("remove")) return <Badge variant="outline" className={`${baseClass} border-red-500/30 text-red-500`}>Delete</Badge>
        if (act.includes("permission") || act.includes("role")) return <Badge variant="outline" className={`${baseClass} border-purple-500/30 text-purple-500`}>Security</Badge>
        if (act.includes("config") || act.includes("system")) return <Badge variant="outline" className={`${baseClass} border-indigo-500/30 text-indigo-500`}>System</Badge>
        return <Badge variant="outline" className={`${baseClass} border-zinc-500/30 text-zinc-300`}>{action}</Badge>
    }

    const handleViewDetail = (log: AuditLog) => {
        setSelectedLog(log)
        setIsDetailOpen(true)
    }

    const convertToCSV = (data: AuditLog[]) => {
        const headers = ["Timestamp", "User", "User ID", "Action", "Module", "Details", "Severity", "IP Address", "Location"]
        const rows = data.map(log => [
            format(new Date(log.timestamp + (log.timestamp.endsWith('Z') ? '' : 'Z')), "yyyy-MM-dd HH:mm:ss"),
            log.userName || "System",
            log.userId || "N/A",
            log.action,
            log.module,
            `"${log.details?.replace(/"/g, '""')}"`, // Escape quotes
            log.severity,
            log.ipAddress,
            log.location || ""
        ])

        return [headers.join(","), ...rows.map(r => r.join(","))].join("\n")
    }

    const handleExport = async () => {
        toast.loading(t('settings.audit.toasts.exportLoading'), { id: "export-toast" })
        try {
            // Fetch with a large limit to get filtered results (standardizing on 1000 for now)
            const resp = await auditApi.getAll({
                page: 1,
                limit: 100,
                searchTerm: searchTerm || undefined,
                severity: severityFilter === "all" ? undefined : severityFilter,
            })

            if (!resp.data || resp.data.length === 0) {
                toast.error(t('settings.audit.toasts.noExportData'), { id: "export-toast" })
                return
            }

            const csvContent = convertToCSV(resp.data)
            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
            const url = URL.createObjectURL(blob)
            const link = document.createElement("a")
            const dateStr = format(new Date(), "yyyy-MM-dd_HH-mm")

            link.setAttribute("href", url)
            link.setAttribute("download", `audit_logs_${dateStr}.csv`)
            link.style.visibility = "hidden"
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)

            toast.success(t('settings.audit.toasts.exportSuccess'), { id: "export-toast" })
        } catch (error) {
            console.error("Export failed:", error)
            toast.error(t('settings.audit.toasts.exportFail'), { id: "export-toast" })
        }
    }

    return (
        <div className="space-y-6 pt-6">
            <Card className="border-white/10 bg-black/40 backdrop-blur-xl">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle className="text-xl font-bold text-white flex items-center gap-2 uppercase tracking-tight">
                                <History className="h-5 w-5 text-emerald-500" />
                                {t('settings.audit.title')}
                            </CardTitle>
                            <CardDescription className="text-zinc-400">{t('settings.audit.description')}</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                                onClick={() => fetchLogs(currentPage)}
                                disabled={isLoading}
                            >
                                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                                {t('settings.audit.refresh')}
                            </Button>
                            <Button variant="outline" size="sm" className="bg-white/5 border-white/10 text-white hover:bg-white/10" onClick={handleExport}>
                                <Download className="h-4 w-4 mr-2" />
                                {t('settings.audit.exportLogs')}
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                            <Input
                                placeholder={t('settings.audit.search')}
                                className="pl-10 bg-white/5 border-white/10 text-white focus-visible:ring-emerald-500/50"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value)
                                    setCurrentPage(1)
                                }}
                            />
                            {isLoading && (
                                <RefreshCw className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500 animate-spin" />
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-white/10">
                                        <Filter className="mr-2 h-4 w-4" />
                                        {t('settings.audit.severity')}: {severityFilter === "all" ? t('settings.audit.all') : severityFilter.toUpperCase()}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-white">
                                    <DropdownMenuLabel>{t('settings.audit.filterSeverity')}</DropdownMenuLabel>
                                    <DropdownMenuSeparator className="bg-zinc-800" />
                                    <DropdownMenuCheckboxItem checked={severityFilter === "all"} onCheckedChange={() => setSeverityFilter("all")}>{t('settings.audit.all')}</DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem checked={severityFilter === "info"} onCheckedChange={() => setSeverityFilter("info")}>{t('settings.audit.info')}</DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem checked={severityFilter === "warning"} onCheckedChange={() => setSeverityFilter("warning")}>{t('settings.audit.warning')}</DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem checked={severityFilter === "critical"} onCheckedChange={() => setSeverityFilter("critical")}>{t('settings.audit.critical')}</DropdownMenuCheckboxItem>
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
                                    {t('settings.audit.clear')}
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="rounded-lg border border-white/10 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-white/5">
                                <TableRow className="border-white/10 hover:bg-transparent px-2">
                                    <TableHead className="text-zinc-500 font-bold uppercase text-[10px] w-[180px]">{t('settings.audit.table.timestamp')}</TableHead>
                                    <TableHead className="text-zinc-500 font-bold uppercase text-[10px]">{t('settings.audit.table.user')}</TableHead>
                                    <TableHead className="text-zinc-500 font-bold uppercase text-[10px]">{t('settings.audit.table.action')}</TableHead>
                                    <TableHead className="text-zinc-500 font-bold uppercase text-[10px]">{t('settings.audit.table.details')}</TableHead>
                                    <TableHead className="text-zinc-500 font-bold uppercase text-[10px]">{t('settings.audit.table.severity')}</TableHead>
                                    <TableHead className="text-zinc-500 font-bold uppercase text-[10px] text-right px-4">{t('settings.audit.table.origin')}</TableHead>
                                    <TableHead className="text-zinc-500 font-bold uppercase text-[10px] text-right w-[80px]">{t('settings.audit.table.action')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center">
                                            <div className="flex items-center justify-center gap-2 text-emerald-500">
                                                <RefreshCw className="h-4 w-4 animate-spin" />
                                                {t('settings.audit.table.loading')}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : logs.length > 0 ? (
                                    logs.map((log) => (
                                        <TableRow key={log.id} className="border-white/10 hover:bg-white/5 transition-colors group">
                                            <TableCell className="text-zinc-400 font-mono text-[11px] whitespace-nowrap">
                                                {format(new Date(log.timestamp + (log.timestamp.endsWith('Z') ? '' : 'Z')), "yyyy-MM-dd HH:mm:ss")}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-semibold text-white">{log.userName || t('settings.audit.table.system')}</span>
                                                    <span className="text-[10px] text-zinc-600 font-mono">{log.userId}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {getActionBadge(log.action)}
                                            </TableCell>
                                            <TableCell className="max-w-[300px]">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-xs text-zinc-300 line-clamp-1">{log.details}</span>
                                                    <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider">{log.module}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {getSeverityBadge(log.severity)}
                                            </TableCell>
                                            <TableCell className="text-right px-4">
                                                <span className="text-[10px] font-mono text-zinc-500">{log.ipAddress}</span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-zinc-500 hover:text-white hover:bg-white/10"
                                                    onClick={() => handleViewDetail(log)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center text-zinc-600 font-bold italic">{t('settings.audit.table.noLogs')}</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {totalPage > 1 && (
                        <div className="mt-6">
                            <Pagination>
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationPrevious
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault()
                                                if (currentPage > 1) fetchLogs(currentPage - 1)
                                            }}
                                            className={currentPage === 1 ? "pointer-events-none opacity-50" : "text-white hover:bg-white/10"}
                                        />
                                    </PaginationItem>
                                    {getPaginationRange(currentPage, totalPage).map((page, i) => (
                                        <PaginationItem key={i}>
                                            {page === '...' ? (
                                                <PaginationEllipsis className="text-zinc-500" />
                                            ) : (
                                                <PaginationLink
                                                    href="#"
                                                    onClick={(e) => {
                                                        e.preventDefault()
                                                        fetchLogs(Number(page))
                                                    }}
                                                    isActive={currentPage === page}
                                                    className={currentPage === page ? "bg-emerald-600 text-white hover:bg-emerald-700 border-none" : "text-white hover:bg-white/10"}
                                                >
                                                    {page}
                                                </PaginationLink>
                                            )}
                                        </PaginationItem>
                                    ))}
                                    <PaginationItem>
                                        <PaginationNext
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault()
                                                if (currentPage < totalPage) fetchLogs(currentPage + 1)
                                            }}
                                            className={currentPage === totalPage ? "pointer-events-none opacity-50" : "text-white hover:bg-white/10"}
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="max-w-2xl border-white/5 bg-zinc-950 text-zinc-100 overflow-hidden">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-emerald-500 uppercase tracking-tighter italic">
                            <History className="h-5 w-5" />{t('settings.audit.detailDialog.title')}</DialogTitle>
                        <DialogDescription className="text-zinc-500">{t('settings.audit.detailDialog.description')}</DialogDescription>
                    </DialogHeader>

                    {selectedLog && (
                        <div className="space-y-6 pt-4">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase text-zinc-600">{t('settings.audit.table.timestamp')}</label>
                                    <p className="text-sm font-mono text-zinc-300">
                                        {selectedLog && format(new Date(selectedLog.timestamp + (selectedLog.timestamp.endsWith('Z') ? '' : 'Z')), "yyyy-MM-dd HH:mm:ss")}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase text-zinc-600">{t('settings.audit.detailDialog.id')}</label>
                                    <p className="text-xs font-mono text-zinc-500">{selectedLog.id}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase text-zinc-600">{t('settings.audit.detailDialog.userInvolved')}</label>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-white">{selectedLog.userName || t('settings.audit.table.system')}</span>
                                        <span className="text-[10px] font-mono text-zinc-500">{selectedLog.userId || "N/A"}</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase text-zinc-600">{t('settings.audit.detailDialog.actionSeverity')}</label>
                                    <div className="flex items-center gap-2">
                                        {getActionBadge(selectedLog.action)}
                                        {getSeverityBadge(selectedLog.severity)}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase text-zinc-600">{t('settings.audit.detailDialog.module')}</label>
                                    <p className="text-sm font-bold text-zinc-300">{selectedLog.module}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase text-zinc-600">{t('settings.audit.detailDialog.ipAddressOrigin')}</label>
                                    <p className="text-sm font-mono text-zinc-300">
                                        {selectedLog.ipAddress}
                                        {selectedLog.location && <span className="text-zinc-500 text-xs ml-2">({selectedLog.location})</span>}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-zinc-600">{t('settings.audit.detailDialog.activityDetails')}</label>
                                <div className="rounded-md bg-white/5 p-3 border border-white/5">
                                    <p className="text-sm text-zinc-300 leading-relaxed italic">
                                        "{selectedLog.details}"
                                    </p>
                                </div>
                            </div>

                            {selectedLog.userAgent && (
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase text-zinc-600">{t('settings.audit.detailDialog.userAgent')}</label>
                                    <p className="text-[10px] font-mono text-zinc-500 leading-tight bg-black/40 p-2 rounded border border-white/5">
                                        {selectedLog.userAgent}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default Audit