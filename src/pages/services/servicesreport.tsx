import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    CartesianGrid,
} from 'recharts';
import { Building2, TrendingUp, PieChart as PieChartIcon, Activity, Globe, Loader2, RefreshCw, History } from "lucide-react";
import enterpriseApi, { Enterprise } from "../../context/api/enterprise";
import transactionApi, { Transaction, TransactionType } from "../../context/api/transaction";
import { toast } from "sonner";
import { cn } from "../../lib/utils";

const ServicesReport: React.FC = () => {
    const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [entRes, txRes] = await Promise.all([
                enterpriseApi.getAll({ limit: 100 }),
                transactionApi.getAll()
            ]);
            setEnterprises(entRes.data);
            setTransactions(txRes);
        } catch (error) {
            toast.error("Failed to load conglomerate data");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const metrics = useMemo(() => {
        const totalServices = enterprises.length;
        const activeServices = enterprises.filter(s => s.isActive).length;
        const totalInflow = transactions
            .filter(t => t.type === TransactionType.DEPOSIT)
            .reduce((acc, curr) => acc + Number(curr.amount), 0);

        const totalOutflow = transactions
            .filter(t => t.type === TransactionType.WITHDRAWAL)
            .reduce((acc, curr) => acc + Number(curr.amount), 0);

        return {
            totalServices,
            activeServices,
            totalInflow,
            totalActivity: totalInflow + totalOutflow,
            operationalRate: totalServices > 0 ? (activeServices / totalServices) * 100 : 0
        };
    }, [enterprises, transactions]);

    // Volume by Service (Top 5)
    const volumeData = useMemo(() => {
        const volumeMap: Record<string, number> = {};
        transactions
            .filter(t => t.type === TransactionType.DEPOSIT)
            .forEach(tx => {
                volumeMap[tx.enterpriseId] = (volumeMap[tx.enterpriseId] || 0) + Number(tx.amount);
            });

        return Object.entries(volumeMap)
            .map(([id, volume]) => ({
                name: enterprises.find(e => e.id === id)?.name || id.substring(0, 8),
                volume
            }))
            .sort((a, b) => b.volume - a.volume)
            .slice(0, 8);
    }, [transactions, enterprises]);

    // Categories Breakdown
    const categoryData = useMemo(() => {
        const counts: Record<string, number> = {};
        enterprises.forEach(ent => {
            const cat = ent.category?.name || "Uncategorized";
            counts[cat] = (counts[cat] || 0) + 1;
        });

        return Object.entries(counts).map(([name, count]) => ({
            name,
            count
        }));
    }, [enterprises]);

    // Status Distribution
    const statusData = useMemo(() => {
        return [
            { name: "Active Units", value: enterprises.filter(e => e.isActive && !e.isMaintenance).length, color: "#10B981" },
            { name: "Maintenance", value: enterprises.filter(e => e.isMaintenance).length, color: "#F59E0B" },
            { name: "Inactive", value: enterprises.filter(e => !e.isActive).length, color: "#EF4444" }
        ];
    }, [enterprises]);

    const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8b5cf6', '#ec4899'];

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('fr-HT', { style: 'currency', currency: 'HTG', maximumFractionDigits: 0 }).format(val);
    };

    if (isLoading && enterprises.length === 0) {
        return (
            <div className="h-[70vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
                <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest animate-pulse">
                    Aggregating Conglomerate Data...
                </p>
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-8 p-4 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black tracking-tighter text-white uppercase flex items-center gap-3">
                        <Globe className="h-8 w-8 text-indigo-500" />
                        Conglomerate Analytics
                    </h2>
                    <p className="text-zinc-500 uppercase text-[10px] font-black tracking-[0.2em] mt-1">
                        Consolidated performance across all group entities
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-9 border-white/10 bg-white/5 text-white font-bold uppercase text-[10px] tracking-widest gap-2"
                    onClick={fetchData}
                >
                    <RefreshCw className={cn("h-3 w-3", isLoading && "animate-spin")} />
                    Refresh Intelligence
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-white/5 border-white/10 text-white backdrop-blur-md relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Building2 className="h-16 w-16 text-indigo-500" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[9px] font-black uppercase text-zinc-500 tracking-widest">Total Services</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black">{metrics.totalServices}</div>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase mt-1">Global Business Units</p>
                    </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10 text-white backdrop-blur-md relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Activity className="h-16 w-16 text-emerald-500" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[9px] font-black uppercase text-zinc-500 tracking-widest">Operational Output</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-emerald-400">{metrics.activeServices}</div>
                        <p className="text-[10px] text-emerald-500/70 font-bold uppercase mt-1">{metrics.operationalRate.toFixed(1)}% Active Rate</p>
                    </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10 text-white backdrop-blur-md relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingUp className="h-16 w-16 text-emerald-400" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[9px] font-black uppercase text-zinc-500 tracking-widest">Funding Volume (Inflow)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-emerald-400">{formatCurrency(metrics.totalInflow)}</div>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase mt-1">Consolidated In-Flow</p>
                    </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10 text-white backdrop-blur-md relative overflow-hidden group border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.1)]">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <History className="h-16 w-16 text-indigo-400" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[9px] font-black uppercase text-indigo-400 tracking-widest">Total Group Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-indigo-100">{formatCurrency(metrics.totalActivity)}</div>
                        <p className="text-[10px] text-indigo-500/70 font-bold uppercase mt-1">Inflow + Outflow Intelligence</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 bg-white/5 border-white/10 text-white backdrop-blur-md relative">
                    <CardHeader className="border-b border-white/5 py-4">
                        <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-emerald-400" />
                            Revenue Contribution by Service
                        </CardTitle>
                        <CardDescription className="text-[9px] font-bold text-zinc-500 uppercase">Top performers by transaction volume</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-8">
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={volumeData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" vertical={false} />
                                    <XAxis
                                        dataKey="name"
                                        stroke="#71717a"
                                        fontSize={9}
                                        fontWeight="bold"
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(val) => val.length > 10 ? val.substring(0, 8) + '...' : val}
                                    />
                                    <YAxis
                                        stroke="#71717a"
                                        fontSize={9}
                                        fontWeight="bold"
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `${value / 1000}k`}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#18181b', border: '1px solid #ffffff14', borderRadius: '8px', fontSize: '10px' }}
                                        itemStyle={{ fontWeight: '800' }}
                                        cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                                    />
                                    <Bar dataKey="volume" fill="#6366f1" radius={[6, 6, 2, 2]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-3 bg-white/5 border-white/10 text-white backdrop-blur-md">
                    <CardHeader className="border-b border-white/5 py-4">
                        <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                            <PieChartIcon className="h-4 w-4 text-indigo-400" />
                            Sector Distribution
                        </CardTitle>
                        <CardDescription className="text-[9px] font-bold text-zinc-500 uppercase">Classification of Business Units</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={85}
                                        paddingAngle={5}
                                        dataKey="count"
                                    >
                                        {categoryData.map((_entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#18181b', border: '1px solid #ffffff14', borderRadius: '8px', fontSize: '10px' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-6 grid grid-cols-2 gap-4">
                            {categoryData.map((item, i) => (
                                <div key={item.name} className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-tighter truncate max-w-[80px]">{item.name}</span>
                                        <span className="text-[11px] font-black text-white leading-none">{item.count}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-white/5 border-white/10 text-white backdrop-blur-md">
                <CardHeader className="border-b border-white/5 py-4">
                    <CardTitle className="text-xs font-black uppercase tracking-widest">Group Operational Health</CardTitle>
                    <CardDescription className="text-[9px] font-bold text-zinc-500 uppercase">Live monitoring of entity statuses</CardDescription>
                </CardHeader>
                <CardContent className="pt-8 pb-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {statusData.map((status) => (
                            <div key={status.name} className="flex flex-col items-center justify-center p-8 bg-black/20 rounded-2xl border border-white/5 hover:border-white/10 transition-all hover:bg-black/30 group">
                                <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] mb-2">{status.name}</p>
                                <p className="text-5xl font-black group-hover:scale-110 transition-transform" style={{ color: status.color }}>{status.value}</p>
                                <div className="h-1.5 w-12 rounded-full mt-4" style={{ backgroundColor: status.color + '20' }} />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default ServicesReport;