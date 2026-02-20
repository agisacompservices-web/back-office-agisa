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
    Cell,
} from 'recharts';
import {
    DollarSign,
    Activity,
    CreditCard,
    TrendingUp,
    Filter,
    Loader2,
    PieChart as PieChartIcon,
    BarChart3
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

const FinanceReport: React.FC = () => {
    const { t } = useTranslation();
    const [requests, setRequests] = useState<Request[]>([]);
    const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
    const [selectedEnterpriseId, setSelectedEnterpriseId] = useState<string>("all");
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            const data = await requestApi.getAll({
                enterpriseId: selectedEnterpriseId === "all" ? undefined : selectedEnterpriseId
            });
            // Filter finance-related statuses
            const financeRequests = data.data.filter(r =>
                r.status === RequestStatus.IN_FINANCE ||
                r.status === RequestStatus.AUDITED ||
                r.status === RequestStatus.COMPLETED ||
                r.status === RequestStatus.REJECTED
            );
            setRequests(financeRequests);
        } catch (error) {
            console.error("Failed to fetch finance reports:", error);
            toast.error(t('financeReport.toasts.loadFailed'));
        } finally {
            setIsLoading(false);
        }
    }, [selectedEnterpriseId, t]);

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
    const totalTransactions = requests.length;
    const totalVolume = requests.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const successTransactions = requests.filter(r => r.status === RequestStatus.COMPLETED || r.status === RequestStatus.AUDITED);
    const successRate = totalTransactions > 0 ? (successTransactions.length / totalTransactions) * 100 : 0;
    const pendingAmount = requests
        .filter(r => r.status === RequestStatus.IN_FINANCE)
        .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

    // Status Distribution
    const statusCounts = requests.reduce((acc, curr) => {
        const status = curr.status;
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const statusData = Object.keys(statusCounts).map(status => ({
        name: status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' '),
        value: statusCounts[status]
    }));

    const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#EF4444', '#F59E0B'];

    // Enterprise Volume Table (Top 10)
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
                <h2 className="text-3xl font-bold tracking-tight text-white uppercase">{t('financeReport.title')}</h2>
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-slate-500" />
                    <Select value={selectedEnterpriseId} onValueChange={(val) => {
                        setSelectedEnterpriseId(val);
                        setIsLoading(true);
                    }}>
                        <SelectTrigger className="w-[200px] bg-white/5 border-white/10 text-white focus:ring-blue-500/20">
                            <SelectValue placeholder={t('financeReport.allEnterprises')} />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-white/10 text-white backdrop-blur-xl">
                            <SelectItem value="all">{t('financeReport.allEnterprises')}</SelectItem>
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
                        <CardTitle className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('financeReport.stats.totalVolume')}</CardTitle>
                        <DollarSign className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black">${totalVolume.toLocaleString('en-US')}</div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">{t('financeReport.stats.volumeDesc')}</p>
                    </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10 text-white backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('financeReport.stats.efficiency')}</CardTitle>
                        <Activity className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black">{successRate.toFixed(1)}%</div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">{t('financeReport.stats.efficiencyDesc')}</p>
                    </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10 text-white backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('financeReport.stats.pending')}</CardTitle>
                        <CreditCard className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black">${pendingAmount.toLocaleString('en-US')}</div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">{t('financeReport.stats.pendingDesc')}</p>
                    </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10 text-white backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('financeReport.stats.transactions')}</CardTitle>
                        <TrendingUp className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black">{totalTransactions}</div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">{t('financeReport.stats.transactionsDesc')}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 bg-white/5 border-white/10 text-white backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                            <BarChart3 className="h-4 w-4 text-emerald-400" />
                            {t('financeReport.charts.volumeTitle')}
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
                                    formatter={(value: any) => [`$${Number(value).toLocaleString('en-US')}`, 'Amount']}
                                />
                                <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} opacity={0.8} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card className="col-span-3 bg-white/5 border-white/10 text-white backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                            <PieChartIcon className="h-4 w-4 text-blue-400" />
                            {t('financeReport.charts.breakdownTitle')}
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

export default FinanceReport;