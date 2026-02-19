import React, { useState, useEffect, useCallback } from "react";
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
import { Calculator, CheckCircle2, XCircle, Send, PieChart as PieChartIcon, TrendingUp, Loader2, Filter } from "lucide-react";
import requestApi, { Request, RequestStatus, RequestType } from "../../context/api/request";
import enterpriseApi, { Enterprise } from "../../context/api/enterprise";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";

const AccountingReport: React.FC = () => {
    const [requests, setRequests] = useState<Request[]>([]);
    const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
    const [selectedEnterpriseId, setSelectedEnterpriseId] = useState<string>("all");
    const [isLoading, setIsLoading] = useState(true);

    const fetchRequests = useCallback(async () => {
        try {
            const res = await requestApi.getAll({
                enterpriseId: selectedEnterpriseId === "all" ? undefined : selectedEnterpriseId
            });
            // Filter for only financial requests
            const financialRequests = (res.data || []).filter(r =>
                r.type === RequestType.DEPOSIT || r.type === RequestType.WITHDRAWAL
            );
            setRequests(financialRequests);
        } catch (error) {
            console.error("Failed to fetch reports data:", error);
            toast.error("Error", { description: "Failed to load report data" });
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
        fetchRequests();
        const interval = setInterval(fetchRequests, 60000); // Poll every 60s
        return () => clearInterval(interval);
    }, [fetchRequests]);

    // Summary Statistics
    const totalRequests = requests.length;
    const processedRequests = requests.filter(r => r.status === RequestStatus.COMPLETED).length;
    const rejectedRequests = requests.filter(r => r.status === RequestStatus.REJECTED).length;
    const inLitigation = requests.filter(r => r.status === RequestStatus.IN_LITIGATION).length;

    const totalVolume = requests.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

    // Status Distribution for Pie Chart
    const statusCounts = requests.reduce((acc, curr) => {
        acc[curr.status] = (acc[curr.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const statusData = Object.keys(statusCounts).map(status => ({
        name: status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' '),
        value: statusCounts[status]
    }));

    const COLORS = ['#3B82F6', '#10B981', '#F97316', '#EF4444', '#8B5CF6', '#F59E0B'];

    // Volume by Type for Bar Chart
    const typeVolume = requests.reduce((acc, curr) => {
        acc[curr.type] = (acc[curr.type] || 0) + (Number(curr.amount) || 0);
        return acc;
    }, {} as Record<string, number>);

    const typeData = Object.keys(typeVolume).map(type => ({
        name: type.charAt(0).toUpperCase() + type.slice(1).toLowerCase(),
        amount: typeVolume[type]
    }));

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
                <h2 className="text-3xl font-bold tracking-tight text-white uppercase">Accounting Analytics</h2>
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-zinc-500" />
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
                        <CardTitle className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Total Requests</CardTitle>
                        <Calculator className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black">{totalRequests}</div>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase mt-1">Volume: ${totalVolume.toLocaleString()}</p>
                    </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10 text-white backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Processed</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black">{processedRequests}</div>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase mt-1">Completed operations</p>
                    </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10 text-white backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Sent to Litigation</CardTitle>
                        <Send className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black">{inLitigation}</div>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase mt-1">Escalated for review</p>
                    </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10 text-white backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Rejected</CardTitle>
                        <XCircle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black">{rejectedRequests}</div>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase mt-1">Compliance failures</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 bg-white/5 border-white/10 text-white backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-400">
                            <TrendingUp className="h-4 w-4 text-emerald-400" />
                            Financial Volume by Request Type
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={typeData}>
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
                                <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} opacity={0.8} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card className="col-span-3 bg-white/5 border-white/10 text-white backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-400">
                            <PieChartIcon className="h-4 w-4 text-blue-400" />
                            Request Status Distribution
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
                                    formatter={(value) => <span className="text-[10px] font-bold uppercase text-zinc-400">{value}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default AccountingReport;