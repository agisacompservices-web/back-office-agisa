import React, { useEffect, useState, useCallback } from "react";
import requestApi, { Request, RequestStatus } from "../../context/api/request";
import enterpriseApi, { Enterprise } from "../../context/api/enterprise";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import {
    ShieldAlert,
    CheckCircle2,
    XCircle,
    Clock,
    Loader2,
    Filter,
    TrendingUp,
    PieChart as PieChartIcon
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { toast } from "sonner";

const LitigationReport: React.FC = () => {
    const [requests, setRequests] = useState<Request[]>([]);
    const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
    const [selectedEnterpriseId, setSelectedEnterpriseId] = useState<string>("all");
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            const data = await requestApi.getAll({
                enterpriseId: selectedEnterpriseId === "all" ? undefined : selectedEnterpriseId
            });
            // Filter litigation-related statuses
            const litigationRequests = data.filter(r =>
                r.status === RequestStatus.IN_LITIGATION ||
                r.status === RequestStatus.IN_FINANCE ||
                r.status === RequestStatus.AUDITED ||
                r.status === RequestStatus.REJECTED ||
                r.status === RequestStatus.COMPLETED
            );
            setRequests(litigationRequests);
        } catch (error) {
            console.error("Failed to fetch litigation reports:", error);
            toast.error("Failed to load analytics data");
        } finally {
            setIsLoading(false);
        }
    }, [selectedEnterpriseId]);

    const fetchEnterprises = useCallback(async () => {
        try {
            const res = await enterpriseApi.getAll({});
            setEnterprises(res.data || []);
        } catch (error) {
            console.error("Failed to fetch enterprises:", error);
        }
    }, []);

    useEffect(() => {
        fetchEnterprises();
    }, [fetchEnterprises]);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 60000);
        return () => clearInterval(interval);
    }, [fetchData]);

    // Summary Statistics
    const totalCases = requests.length;
    const validatedCases = requests.filter(c => c.status === RequestStatus.COMPLETED || c.status === RequestStatus.AUDITED).length;
    const rejectedCases = requests.filter(c => c.status === RequestStatus.REJECTED).length;
    const pendingCases = requests.filter(c => c.status === RequestStatus.IN_LITIGATION || c.status === RequestStatus.IN_FINANCE).length;

    const totalAmount = requests.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

    // Status Distribution for Pie Chart
    const statusCounts = requests.reduce((acc, curr) => {
        const status = curr.status;
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const statusData = Object.keys(statusCounts).map(status => ({
        name: status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' '),
        value: statusCounts[status]
    }));

    const COLORS = ['#EF4444', '#3B82F6', '#8B5CF6', '#F97316', '#10B981'];

    // Volume by Enterprise for Bar Chart (Only helpful if "All" is selected)
    const enterpriseVolume = requests.reduce((acc, curr) => {
        const entName = curr.enterprise?.name || "Other";
        acc[entName] = (acc[entName] || 0) + (Number(curr.amount) || 0);
        return acc;
    }, {} as Record<string, number>);

    const chartData = Object.keys(enterpriseVolume).map(ent => ({
        name: ent,
        amount: enterpriseVolume[ent]
    })).sort((a, b) => b.amount - a.amount).slice(0, 10);

    if (isLoading && requests.length === 0) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-4 pt-6">
            <div className="flex items-center justify-between gap-4 mb-4">
                <h2 className="text-3xl font-bold tracking-tight text-white uppercase">Litigation Analytics</h2>
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-slate-500" />
                    <Select value={selectedEnterpriseId} onValueChange={(val) => {
                        setSelectedEnterpriseId(val);
                        setIsLoading(true);
                    }}>
                        <SelectTrigger className="w-[200px] bg-white/5 border-white/10 text-white focus:ring-emerald-500/20">
                            <SelectValue placeholder="All Enterprises" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-white/10 text-white backdrop-blur-xl">
                            <SelectItem value="all">All Enterprises</SelectItem>
                            {enterprises.map((ent) => (
                                <SelectItem key={ent.id} value={ent.id}>{ent.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-white/5 border-white/10 text-white backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Cases</CardTitle>
                        <ShieldAlert className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black">{totalCases}</div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Impact: ${totalAmount.toLocaleString()}</p>
                    </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10 text-white backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Resolved</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black">{validatedCases}</div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Audit/Completion success</p>
                    </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10 text-white backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Rejected</CardTitle>
                        <XCircle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black">{rejectedCases}</div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Compliance blocking</p>
                    </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10 text-white backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">In Pipeline</CardTitle>
                        <Clock className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black">{pendingCases}</div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Awaiting assessment</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 bg-white/5 border-white/10 text-white backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                            <TrendingUp className="h-4 w-4 text-red-400" />
                            Financial Impact by Enterprise
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={chartData}>
                                <XAxis
                                    dataKey="name"
                                    stroke="#52525b"
                                    fontSize={10}
                                    fontWeight="bold"
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#52525b"
                                    fontSize={10}
                                    fontWeight="bold"
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `$${value}`}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px' }}
                                    itemStyle={{ color: '#f4f4f5', fontSize: '12px', fontWeight: 'bold' }}
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Amount']}
                                />
                                <Bar dataKey="amount" fill="#ef4444" radius={[4, 4, 0, 0]} opacity={0.8} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card className="col-span-3 bg-white/5 border-white/10 text-white backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                            <PieChartIcon className="h-4 w-4 text-blue-400" />
                            Case Status Distribution
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={350}>
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="40%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={8}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px' }}
                                    itemStyle={{ color: '#f4f4f5', fontSize: '12px', fontWeight: 'bold' }}
                                />
                                <Legend
                                    verticalAlign="bottom"
                                    iconType="circle"
                                    formatter={(value) => <span className="text-[10px] font-bold uppercase text-slate-400">{value}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default LitigationReport;