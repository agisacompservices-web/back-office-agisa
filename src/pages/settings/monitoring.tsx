import React from "react"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import {
    Activity,
    Server,
    Cpu,
    Database,
    Clock,
    Zap,
    RefreshCw,
    AlertCircle,
    CheckCircle2,
    BarChart3
} from "lucide-react"
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts"
import { systemMetrics as mockSystemMetrics, servicesStatus as mockServicesStatus, performanceHistory as mockPerformanceHistory, SystemMetric, ServiceStatus, PerformanceData } from "../../context/data/dataMonitoring"
import { toast } from "sonner"
import systemApi from "../../context/api/system"
import { cn } from "../../lib/utils"
import { useTranslation } from "react-i18next"

const Monitoring: React.FC = () => {
    const { t } = useTranslation();
    const [metrics, setMetrics] = React.useState<SystemMetric[]>(mockSystemMetrics)
    const [status, setStatus] = React.useState<ServiceStatus[]>(mockServicesStatus)
    const [history, setHistory] = React.useState<PerformanceData[]>(mockPerformanceHistory)
    const [isLoading, setIsLoading] = React.useState(false)

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const fetchMonitoringData = React.useCallback(async (silent = false) => {
        if (!silent) setIsLoading(true)
        try {
            const data = await systemApi.getMonitoring()
            setMetrics(data.systemMetrics)
            setStatus(data.servicesStatus)
            if (data.performanceHistory && data.performanceHistory.length > 0) {
                setHistory(data.performanceHistory)
            }
            if (!silent) {
                toast.success(t('settings.monitoring.toast.updateTitle'), {
                    description: t('settings.monitoring.toast.updateDesc')
                })
            }
        } catch (error) {
            console.error("Failed to fetch monitoring data:", error)
            if (!silent) {
                toast.error(t('settings.monitoring.toast.errorTitle'), {
                    description: t('settings.monitoring.toast.errorDesc')
                })
            }
        } finally {
            if (!silent) setIsLoading(false)
        }
    }, [t])

    React.useEffect(() => {
        fetchMonitoringData()

        // Polling every 30 seconds
        const interval = setInterval(() => {
            fetchMonitoringData(true)
        }, 30000)

        return () => clearInterval(interval)
    }, [fetchMonitoringData])

    const handleRefresh = () => {
        fetchMonitoringData()
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "healthy":
            case "up":
                return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            case "warning":
            case "degraded":
                return <AlertCircle className="h-4 w-4 text-amber-500" />
            case "critical":
            case "down":
                return <AlertCircle className="h-4 w-4 text-red-500" />
            default:
                return null
        }
    }

    const getMetricColor = (status: string) => {
        switch (status) {
            case "healthy": return "text-emerald-600"
            case "warning": return "text-amber-600"
            case "critical": return "text-red-600"
            default: return "text-slate-800"
        }
    }

    return (
        <div className="space-y-6 pt-6 mb-10">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-3">
                        <Activity className="h-6 w-6 text-indigo-600" />{t('settings.monitoring.title')}
                    </h2>
                    <p className="text-slate-500 text-sm font-medium">{t('settings.monitoring.description')}
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    className="bg-transparent border-slate-100 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-100 font-bold h-9 transition-all rounded-lg"
                    onClick={handleRefresh}
                    disabled={isLoading}
                >
                    <RefreshCw className={cn("h-3.5 w-3.5 mr-2", isLoading && "animate-spin")} />
                    {isLoading ? t('settings.monitoring.refreshing') : t('settings.monitoring.refresh')}
                </Button>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {metrics.map((metric) => (
                    <Card key={metric.name} className="border-slate-200 bg-white shadow-xl shadow-slate-200/50 rounded-xl overflow-hidden cursor-default border-none">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-slate-50 mb-4">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                {metric.name}
                            </CardTitle>
                            {getStatusIcon(metric.status)}
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline gap-2">
                                <div className={`text-2xl font-black tracking-tighter ${getMetricColor(metric.status)}`}>
                                    {metric.value}{metric.unit}
                                </div>
                                <div className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded-md border ${metric.trend > 0 ? "text-emerald-600 bg-emerald-50 border-emerald-100" : "text-red-600 bg-red-50 border-red-100"}`}>
                                    {metric.trend > 0 ? "↑" : "↓"} {Math.abs(metric.trend)}%
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Performance Chart */}
                <Card className="lg:col-span-8 border-slate-200 bg-white shadow-xl shadow-slate-200/50 rounded-xl overflow-hidden border-none cursor-default">
                    <CardHeader className="border-b border-slate-50 mb-4">
                        <CardTitle className="text-slate-800 font-bold flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-indigo-600" />{t('settings.monitoring.performance.title')}
                        </CardTitle>
                        <CardDescription className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">{t('settings.monitoring.performance.description')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={history}>
                                    <defs>
                                        <linearGradient id="colorReq" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorRes" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis
                                        dataKey="timestamp"
                                        stroke="#94a3b8"
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                        tick={{ fontWeight: 700 }}
                                    />
                                    <YAxis
                                        stroke="#94a3b8"
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `${value}`}
                                        tick={{ fontWeight: 700 }}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
                                        labelStyle={{ color: "#1e293b", fontWeight: "bold" }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="requestCount"
                                        stroke="#10b981"
                                        fillOpacity={1}
                                        fill="url(#colorReq)"
                                        name={t('settings.monitoring.performance.requests')}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="responseTime"
                                        stroke="#6366f1"
                                        fillOpacity={1}
                                        fill="url(#colorRes)"
                                        name={t('settings.monitoring.performance.latency')}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Service Status */}
                <Card className="lg:col-span-4 border-slate-200 bg-white shadow-xl shadow-slate-200/50 rounded-xl overflow-hidden border-none cursor-default">
                    <CardHeader className="border-b border-slate-50 mb-0">
                        <CardTitle className="text-slate-800 font-bold flex items-center gap-2">
                            <Server className="h-5 w-5 text-emerald-600" />{t('settings.monitoring.services.title')}
                        </CardTitle>
                        <CardDescription className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">{t('settings.monitoring.services.description')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="flex flex-col border-t border-white/5">
                            {status.map((service) => (
                                <div
                                    key={service.name}
                                    className="px-6 py-4 flex items-center justify-between border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                                >
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-slate-800 tracking-tight">{service.name}</span>
                                            <span className={`h-1.5 w-1.5 rounded-full ${service.status === "up" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" :
                                                service.status === "degraded" ? "bg-amber-500" : "bg-red-500"
                                                }`} />
                                        </div>
                                        <div className="flex items-center gap-3 text-[10px] text-slate-400 uppercase font-black tracking-widest">
                                            <span className="flex items-center gap-1">
                                                <Zap className="h-3 w-3" /> {service.latency}ms
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" /> {service.uptime}
                                            </span>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className={`text-[9px] font-black uppercase tracking-wider py-0 px-2 rounded-md ${service.status === "up" ? "border-emerald-100 bg-emerald-50 text-emerald-600" :
                                        service.status === "degraded" ? "border-amber-100 bg-amber-50 text-amber-600" : "border-red-100 bg-red-50 text-red-600"
                                        }`}>
                                        {t(`settings.monitoring.status.${service.status}`)}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions / System Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-slate-200 bg-white shadow-xl shadow-slate-200/50 rounded-xl overflow-hidden border-none cursor-default">
                    <CardHeader className="pb-3 border-b border-slate-50 mb-4">
                        <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <Database className="h-4 w-4 text-emerald-600" />{t('settings.monitoring.database.title')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-slate-500 mb-4 font-bold">
                            {t('settings.monitoring.database.instance')} <span className="text-emerald-600 font-black">CONNECTED</span>
                        </p>
                        <div className="space-y-3">
                            <div className="flex justify-between text-[10px] uppercase font-black tracking-widest">
                                <span className="text-slate-400">{t('settings.monitoring.database.connections')}</span>
                                <span className="text-slate-800">45 / 100</span>
                            </div>
                            <div className="h-1.5 bg-slate-50 rounded-full overflow-hidden shadow-inner border border-slate-100">
                                <div className="h-full bg-emerald-500 w-[45%] rounded-full shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-slate-200 bg-white shadow-xl shadow-slate-200/50 rounded-xl overflow-hidden border-none cursor-default">
                    <CardHeader className="pb-3 border-b border-slate-50 mb-4">
                        <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <Cpu className="h-4 w-4 text-indigo-600" />{t('settings.monitoring.runtime.title')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-slate-500 mb-4 font-bold">
                            {t('settings.monitoring.runtime.engine')} <span className="text-indigo-600 font-black px-1.5 py-0.5 bg-indigo-50 rounded border border-indigo-100 uppercase tracking-tighter ml-1">v20.10.0</span>
                        </p>
                        <div className="flex gap-2">
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[9px] font-black uppercase tracking-widest">RUNNING</Badge>
                            <Badge variant="outline" className="bg-slate-50 text-slate-400 border-slate-100 text-[9px] font-black uppercase tracking-widest">0 ERRORS</Badge>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-slate-200 bg-white shadow-xl shadow-slate-200/50 rounded-xl overflow-hidden border-none cursor-default">
                    <CardHeader className="pb-3 border-b border-slate-50 mb-4">
                        <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <Activity className="h-4 w-4 text-emerald-600" />{t('settings.monitoring.workers.title')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between font-black uppercase tracking-widest mb-4">
                            <div className="text-[10px] text-slate-400 font-black">{t('settings.monitoring.workers.autoscaling')}</div>
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md">ACTIVE</Badge>
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold italic leading-relaxed">
                            {t('settings.monitoring.workers.desc')}
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default Monitoring
