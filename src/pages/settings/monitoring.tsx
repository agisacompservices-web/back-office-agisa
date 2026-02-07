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

const Monitoring: React.FC = () => {
    const [metrics, setMetrics] = React.useState<SystemMetric[]>(mockSystemMetrics)
    const [status, setStatus] = React.useState<ServiceStatus[]>(mockServicesStatus)
    const [history, setHistory] = React.useState<PerformanceData[]>(mockPerformanceHistory)
    const [isLoading, setIsLoading] = React.useState(false)

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
                toast.success("System Status Updated", {
                    description: "Live monitoring metrics have been refreshed."
                })
            }
        } catch (error) {
            console.error("Failed to fetch monitoring data:", error)
            if (!silent) {
                toast.error("Fetch Error", {
                    description: "Could not retrieve live system metrics."
                })
            }
        } finally {
            if (!silent) setIsLoading(false)
        }
    }, [])

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
            case "healthy": return "text-emerald-500"
            case "warning": return "text-amber-500"
            case "critical": return "text-red-500"
            default: return "text-white"
        }
    }

    return (
        <div className="space-y-6 pt-6">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                        <Activity className="h-6 w-6 text-emerald-500" />
                        Infrastructure Monitoring
                    </h2>
                    <p className="text-zinc-400 text-sm">
                        Real-time system health, service uptime, and performance analytics.
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                    onClick={handleRefresh}
                    disabled={isLoading}
                >
                    <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                    {isLoading ? "Refreshing..." : "Refresh"}
                </Button>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {metrics.map((metric) => (
                    <Card key={metric.name} className="border-white/10 bg-black/40 backdrop-blur-xl">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                                {metric.name}
                            </CardTitle>
                            {getStatusIcon(metric.status)}
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-baseline gap-1">
                                <div className={`text-2xl font-black ${getMetricColor(metric.status)}`}>
                                    {metric.value}{metric.unit}
                                </div>
                                <div className={`text-[10px] font-bold ${metric.trend > 0 ? "text-emerald-500" : "text-red-500"}`}>
                                    {metric.trend > 0 ? "+" : ""}{metric.trend}%
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Performance Chart */}
                <Card className="lg:col-span-8 border-white/10 bg-black/40 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-indigo-500" />
                            System Load & Performance
                        </CardTitle>
                        <CardDescription className="text-zinc-400">
                            Request frequency and API response times (last 24h)
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
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                    <XAxis
                                        dataKey="timestamp"
                                        stroke="#71717a"
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="#71717a"
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `${value}`}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: "#09090b", border: "1px solid #27272a", borderRadius: "8px" }}
                                        labelStyle={{ color: "#fff", fontWeight: "bold" }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="requestCount"
                                        stroke="#10b981"
                                        fillOpacity={1}
                                        fill="url(#colorReq)"
                                        name="Requests"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="responseTime"
                                        stroke="#6366f1"
                                        fillOpacity={1}
                                        fill="url(#colorRes)"
                                        name="Latency (ms)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Service Status */}
                <Card className="lg:col-span-4 border-white/10 bg-black/40 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <Server className="h-5 w-5 text-emerald-500" />
                            Backend Services
                        </CardTitle>
                        <CardDescription className="text-zinc-400 font-bold uppercase text-[10px]">
                            Connection status & health
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="flex flex-col border-t border-white/5">
                            {status.map((service) => (
                                <div
                                    key={service.name}
                                    className="px-6 py-4 flex items-center justify-between border-b border-white/5 hover:bg-white/5 transition-colors"
                                >
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold text-white">{service.name}</span>
                                            <span className={`h-1.5 w-1.5 rounded-full ${service.status === "up" ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" :
                                                service.status === "degraded" ? "bg-amber-500" : "bg-red-500"
                                                }`} />
                                        </div>
                                        <div className="flex items-center gap-3 text-[10px] text-zinc-500 uppercase font-black">
                                            <span className="flex items-center gap-1">
                                                <Zap className="h-3 w-3" /> {service.latency}ms
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" /> {service.uptime}
                                            </span>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className={`text-[10px] border-none font-black uppercase ${service.status === "up" ? "text-emerald-500" :
                                        service.status === "degraded" ? "text-amber-500" : "text-red-500"
                                        }`}>
                                        {service.status}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions / System Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-white/10 bg-black/40 backdrop-blur-xl">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                            <Database className="h-4 w-4 text-emerald-500" />
                            Database Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-zinc-400 mb-4 font-medium">
                            PostgreSQL Instance: <span className="text-emerald-500">Connected</span>
                        </p>
                        <div className="space-y-2">
                            <div className="flex justify-between text-[10px] uppercase font-bold">
                                <span className="text-zinc-500">Connections</span>
                                <span className="text-white">45 / 100</span>
                            </div>
                            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 w-[45%]" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-white/10 bg-black/40 backdrop-blur-xl">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                            <Cpu className="h-4 w-4 text-emerald-500" />
                            Container Runtime
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-zinc-400 mb-4 font-medium">
                            Docker Engine: <span className="text-emerald-500">v24.0.7 (Stable)</span>
                        </p>
                        <div className="flex gap-2">
                            <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[9px]">8 Containers Running</Badge>
                            <Badge className="bg-zinc-500/10 text-zinc-500 border-zinc-500/20 text-[9px]">0 Errors</Badge>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-white/10 bg-black/40 backdrop-blur-xl">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                            <Activity className="h-4 w-4 text-emerald-500" />
                            Worker Nodes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between font-bold">
                            <div className="text-xs text-zinc-400 font-medium">Auto-scaling</div>
                            <Badge className="bg-emerald-500 text-black border-none text-[10px]">Active</Badge>
                        </div>
                        <p className="text-[10px] text-zinc-600 mt-2 italic font-medium">
                            Current cluster load allows for scale-down in 15 mins.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default Monitoring
