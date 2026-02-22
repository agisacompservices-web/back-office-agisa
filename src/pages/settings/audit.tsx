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
                return <Badge variant="outline" className="border-blue-100 bg-blue-50 text-blue-600 gap-1 font-bold text-[10px] uppercase tracking-wider"><Info className="h-3 w-3" /> {t('settings.audit.info')}</Badge>
            case "warning":
                return <Badge variant="outline" className="border-amber-100 bg-amber-50 text-amber-600 gap-1 font-bold text-[10px] uppercase tracking-wider"><AlertTriangle className="h-3 w-3" /> {t('settings.audit.warning')}</Badge>
            case "critical":
                return <Badge variant="outline" className="border-red-100 bg-red-50 text-red-600 gap-1 font-bold text-[10px] uppercase tracking-wider"><AlertCircle className="h-3 w-3" /> {t('settings.audit.critical')}</Badge>
            default:
                return <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600 font-bold text-[10px] uppercase tracking-wider">{severity}</Badge>
        }
    }

    const getActionBadge = (action: string) => {
        const baseClass = "text-[9px] font-bold uppercase tracking-widest py-0 px-2 rounded-md transition-all"
        const act = action.toLowerCase()
        if (act.includes("login")) return <Badge variant="outline" className={`${baseClass} border-emerald-100 bg-emerald-50 text-emerald-600`}>Login</Badge>
        if (act.includes("logout")) return <Badge variant="outline" className={`${baseClass} border-slate-200 bg-slate-50 text-slate-500`}>Logout</Badge>
        if (act.includes("create")) return <Badge variant="outline" className={`${baseClass} border-blue-100 bg-blue-50 text-blue-600`}>Create</Badge>
        if (act.includes("update") || act.includes("edit")) return <Badge variant="outline" className={`${baseClass} border-indigo-100 bg-indigo-50 text-indigo-600`}>Update</Badge>
        if (act.includes("delete") || act.includes("remove")) return <Badge variant="outline" className={`${baseClass} border-red-100 bg-red-50 text-red-600`}>Delete</Badge>
        if (act.includes("permission") || act.includes("role")) return <Badge variant="outline" className={`${baseClass} border-purple-100 bg-purple-50 text-purple-600`}>Security</Badge>
        if (act.includes("config") || act.includes("system")) return <Badge variant="outline" className={`${baseClass} border-amber-100 bg-amber-50 text-amber-600`}>System</Badge>
        return <Badge variant="outline" className={`${baseClass} border-slate-200 bg-slate-50 text-slate-500`}>{action}</Badge>
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
        <div className="space-y-6 pt-6 mb-10">
            <Card className="border-slate-200 bg-white shadow-xl shadow-slate-200/50 rounded-xl overflow-hidden cursor-default border-none">
                <CardHeader className="pb-4 border-b border-slate-50">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-3 uppercase tracking-tight">
                                <History className="h-5 w-5 text-indigo-600" />
                                {t('settings.audit.title')}
                            </CardTitle>
                            <CardDescription className="text-slate-500 font-medium">{t('settings.audit.description')}</CardDescription>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                size="sm"
                                className="bg-transparent border-slate-100 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-100 font-bold h-9 transition-all rounded-lg"
                                onClick={() => fetchLogs(currentPage)}
                                disabled={isLoading}
                            >
                                <RefreshCw className={`h-3.5 w-3.5 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                                {t('settings.audit.refresh')}
                            </Button>
                            <Button
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 shadow-lg shadow-emerald-500/20 transition-all rounded-lg border-none"
                                onClick={handleExport}
                            >
                                <Download className="h-3.5 w-3.5 mr-2" />
                                {t('settings.audit.exportLogs')}
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                            <Input
                                placeholder={t('settings.audit.search')}
                                className="pl-10 bg-slate-50 border-slate-100 text-slate-800 focus-visible:ring-indigo-500/30 h-10 font-medium rounded-lg"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value)
                                    setCurrentPage(1)
                                }}
                            />
                            {isLoading && (
                                <RefreshCw className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-500 animate-spin" />
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="bg-slate-50 border-slate-100 text-slate-600 font-bold text-[10px] uppercase tracking-wider h-10 rounded-lg hover:bg-slate-100">
                                        <Filter className="mr-2 h-3.5 w-3.5 text-indigo-500" />
                                        {t('settings.audit.severity')}: {severityFilter === "all" ? t('settings.audit.all') : severityFilter.toUpperCase()}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-white border-slate-200 text-slate-800 shadow-2xl rounded-xl">
                                    <DropdownMenuLabel className="text-xs font-bold uppercase text-slate-400 tracking-widest">{t('settings.audit.filterSeverity')}</DropdownMenuLabel>
                                    <DropdownMenuSeparator className="bg-slate-100" />
                                    <DropdownMenuCheckboxItem checked={severityFilter === "all"} onCheckedChange={() => setSeverityFilter("all")} className="font-medium text-xs">{t('settings.audit.all')}</DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem checked={severityFilter === "info"} onCheckedChange={() => setSeverityFilter("info")} className="font-medium text-xs text-blue-600 focus:text-blue-700">{t('settings.audit.info')}</DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem checked={severityFilter === "warning"} onCheckedChange={() => setSeverityFilter("warning")} className="font-medium text-xs text-amber-600 focus:text-amber-700">{t('settings.audit.warning')}</DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem checked={severityFilter === "critical"} onCheckedChange={() => setSeverityFilter("critical")} className="font-medium text-xs text-red-600 focus:text-red-700">{t('settings.audit.critical')}</DropdownMenuCheckboxItem>
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
                                    className="text-slate-400 hover:text-red-500 font-bold text-[10px] uppercase tracking-widest hover:bg-red-50"
                                >
                                    <X className="h-3.5 w-3.5 mr-1" />
                                    {t('settings.audit.clear')}
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow className="border-slate-100 hover:bg-transparent px-2">
                                    <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-wider w-[180px]">{t('settings.audit.table.timestamp')}</TableHead>
                                    <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-wider">{t('settings.audit.table.user')}</TableHead>
                                    <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-wider">{t('settings.audit.table.action')}</TableHead>
                                    <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-wider">{t('settings.audit.table.details')}</TableHead>
                                    <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-wider">{t('settings.audit.table.severity')}</TableHead>
                                    <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-wider text-right px-4">{t('settings.audit.table.origin')}</TableHead>
                                    <TableHead className="text-slate-500 font-bold uppercase text-[10px] tracking-wider text-right w-[80px]">{t('settings.audit.table.action')}</TableHead>
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
                                        <TableRow key={log.id} className="border-slate-100 hover:bg-slate-50/50 transition-colors group">
                                            <TableCell className="text-slate-400 font-mono text-[10px] font-bold whitespace-nowrap tracking-tight">
                                                {format(new Date(log.timestamp + (log.timestamp.endsWith('Z') ? '' : 'Z')), "yyyy-MM-dd HH:mm:ss")}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-800 tracking-tight">{log.userName || t('settings.audit.table.system')}</span>
                                                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{log.userId}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {getActionBadge(log.action)}
                                            </TableCell>
                                            <TableCell className="max-w-[300px]">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-xs text-slate-600 line-clamp-1 font-medium italic">"{log.details}"</span>
                                                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{log.module}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {getSeverityBadge(log.severity)}
                                            </TableCell>
                                            <TableCell className="text-right px-4">
                                                <span className="text-[10px] font-bold font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">{log.ipAddress}</span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-zinc-500 hover:text-black hover:bg-slate-100"
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
                                            className={currentPage === 1 ? "pointer-events-none opacity-50" : "text-slate-600 hover:bg-slate-50 border-slate-100 font-bold"}
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
                                                    className={currentPage === page ? "bg-indigo-600 text-white hover:bg-indigo-700 border-none shadow-md shadow-indigo-500/20 rounded-md" : "text-slate-600 hover:bg-slate-50 border-slate-100 rounded-md font-medium"}
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
                                            className={currentPage === totalPage ? "pointer-events-none opacity-50" : "text-slate-600 hover:bg-slate-50 border-slate-100 font-bold"}
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="max-w-2xl border-slate-200 bg-white text-slate-800 shadow-2xl rounded-xl overflow-hidden p-0">
                    <DialogHeader className="p-6 border-b border-slate-50 bg-slate-50/50">
                        <DialogTitle className="flex items-center gap-3 text-indigo-600 uppercase tracking-tight text-xl font-bold">
                            <History className="h-6 w-6" />{t('settings.audit.detailDialog.title')}</DialogTitle>
                        <DialogDescription className="text-slate-500 font-medium">{t('settings.audit.detailDialog.description')}</DialogDescription>
                    </DialogHeader>

                    {selectedLog && (
                        <div className="p-6 space-y-8 bg-white">
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('settings.audit.table.timestamp')}</label>
                                    <p className="text-sm font-bold font-mono text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100 shadow-inner">
                                        {selectedLog && format(new Date(selectedLog.timestamp + (selectedLog.timestamp.endsWith('Z') ? '' : 'Z')), "yyyy-MM-dd HH:mm:ss")}
                                    </p>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('settings.audit.detailDialog.id')}</label>
                                    <p className="text-[11px] font-mono text-slate-400 bg-slate-50/50 p-2 rounded-lg border border-dotted border-slate-200">{selectedLog.id}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('settings.audit.detailDialog.userInvolved')}</label>
                                    <div className="flex flex-col p-3 bg-slate-50 rounded-xl border border-slate-100">
                                        <span className="text-sm font-bold text-slate-800">{selectedLog.userName || t('settings.audit.table.system')}</span>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{selectedLog.userId || "N/A"}</span>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('settings.audit.detailDialog.actionSeverity')}</label>
                                    <div className="flex items-center gap-3 h-full">
                                        {getActionBadge(selectedLog.action)}
                                        {getSeverityBadge(selectedLog.severity)}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('settings.audit.detailDialog.module')}</label>
                                    <div className="flex items-center gap-2 text-indigo-600 bg-indigo-50 px-3 py-2 rounded-lg border border-indigo-100 w-fit">
                                        <History className="h-4 w-4" />
                                        <span className="text-xs font-bold uppercase tracking-widest">{selectedLog.module}</span>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('settings.audit.detailDialog.ipAddressOrigin')}</label>
                                    <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                        <span className="text-sm font-bold font-mono text-slate-700">{selectedLog.ipAddress}</span>
                                        {selectedLog.location && <Badge variant="secondary" className="bg-slate-200 text-slate-600 font-bold text-[9px] ml-auto uppercase tracking-tighter">{selectedLog.location}</Badge>}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('settings.audit.detailDialog.activityDetails')}</label>
                                <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 shadow-inner">
                                    <p className="text-sm text-slate-700 leading-relaxed font-medium italic">
                                        "{selectedLog.details}"
                                    </p>
                                </div>
                            </div>

                            {selectedLog.userAgent && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('settings.audit.detailDialog.userAgent')}</label>
                                    <p className="text-[9px] font-mono text-slate-400 leading-tight bg-slate-50/50 p-3 rounded-lg border border-slate-100 break-all">
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