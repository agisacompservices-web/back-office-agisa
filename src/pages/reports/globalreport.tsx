import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "../../components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from "../../components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList
} from "../../components/ui/command";
import {
    LayoutDashboard,
    ArrowUpRight,
    ArrowDownLeft,
    TrendingUp,
    TrendingDown,
    Building,
    History,
    Check,
    ChevronsUpDown,
    Loader2,
    Wallet,
    Search,
    Download
} from "lucide-react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { format, parseISO, subDays } from "date-fns";
import enterpriseApi, { Enterprise } from "../../context/api/enterprise";
import transactionApi, { Transaction, TransactionType } from "../../context/api/transaction";
import { cn } from "../../lib/utils";
import { toast } from "sonner";
import { Input } from "../../components/ui/input";
import { useTranslation } from "react-i18next";

const GlobalReport: React.FC = () => {
    const { t } = useTranslation();
    const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [selectedEnterpriseId, setSelectedEnterpriseId] = useState<string>("all");
    const [isEnterpriseSelectOpen, setIsEnterpriseSelectOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [entRes, txRes] = await Promise.all([
                enterpriseApi.getAll({ limit: 100 }),
                transactionApi.getAll(selectedEnterpriseId === "all" ? undefined : selectedEnterpriseId)
            ]);
            setEnterprises(entRes.data);
            setTransactions(txRes.data);
        } catch (error) {
            toast.error(t('globalReport.toasts.loadFailed'));
        } finally {
            setIsLoading(false);
        }
    }, [selectedEnterpriseId, t]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'HTG' }).format(val);
    };

    // Calculate Metrics
    const metrics = useMemo(() => {
        const inflow = transactions
            .filter(t => t.type === TransactionType.DEPOSIT)
            .reduce((acc, t) => acc + Number(t.amount), 0);

        const outflow = transactions
            .filter(t => t.type === TransactionType.WITHDRAWAL)
            .reduce((acc, t) => acc + Number(t.amount), 0);

        return {
            inflow,
            outflow,
            net: inflow - outflow,
            count: transactions.length,
            enterpriseCount: selectedEnterpriseId === "all"
                ? new Set(transactions.map(t => t.enterpriseId)).size
                : 1
        };
    }, [transactions, selectedEnterpriseId]);

    // Prepare Chart Data (Last 7 Days)
    const chartData = useMemo(() => {
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const date = subDays(new Date(), i);
            return format(date, 'yyyy-MM-dd');
        }).reverse();

        return last7Days.map(dateStr => {
            const dayTxs = transactions.filter(t => t.createdAt.startsWith(dateStr));
            const inAmt = dayTxs
                .filter(t => t.type === TransactionType.DEPOSIT)
                .reduce((acc, t) => acc + Number(t.amount), 0);
            const outAmt = dayTxs
                .filter(t => t.type === TransactionType.WITHDRAWAL)
                .reduce((acc, t) => acc + Number(t.amount), 0);

            return {
                name: format(parseISO(dateStr), 'MMM dd'),
                inflow: inAmt,
                outflow: outAmt,
                net: inAmt - outAmt
            };
        });
    }, [transactions]);

    // Prepare Enterprise Distribution
    const enterpriseDistData = useMemo(() => {
        if (selectedEnterpriseId !== "all") return [];

        const dist: Record<string, number> = {};
        transactions.forEach(t => {
            const entName = t.enterpriseId; // Ideally we match with name
            dist[entName] = (dist[entName] || 0) + Number(t.amount);
        });

        return Object.entries(dist).map(([id, value]) => ({
            name: enterprises.find(e => e.id === id)?.name || id.substring(0, 8),
            value
        })).sort((a, b) => b.value - a.value);
    }, [transactions, enterprises, selectedEnterpriseId]);

    const filteredActivity = useMemo(() => {
        return transactions
            .filter(t =>
                t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.seller?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.headquarter?.name?.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .slice(0, 10);
    }, [transactions, searchQuery]);

    const handleExportCSV = () => {
        if (transactions.length === 0) {
            toast.error(t('globalReport.toasts.noDataExport'));
            return;
        }

        const headers = [t('globalReport.csv.headers.0'), t('globalReport.csv.headers.1'), t('globalReport.csv.headers.2'), t('globalReport.csv.headers.3'), t('globalReport.csv.headers.4'), t('globalReport.csv.headers.5'), t('globalReport.csv.headers.6'), t('globalReport.csv.headers.7')];
        const rows = transactions.map(tx => [
            tx.id,
            tx.type,
            tx.amount,
            enterprises.find(e => e.id === tx.enterpriseId)?.name || t('globalReport.csv.na'),
            tx.seller?.name || tx.headquarter?.name || t('globalReport.csv.system'),
            tx.status,
            format(parseISO(tx.createdAt), 'yyyy-MM-dd'),
            format(parseISO(tx.createdAt), 'HH:mm:ss')
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `agisa_global_report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(t('globalReport.toasts.exportSuccess'));
    };

    const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

    if (isLoading && transactions.length === 0) {
        return (
            <div className="h-[70vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-10 w-10 text-emerald-500 animate-spin" />
                <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest animate-pulse">
                    {t('globalReport.state.synthesizing')}
                </p>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter text-black uppercase flex items-center gap-3">
                        <LayoutDashboard className="h-8 w-8 text-emerald-500" />
                        {t('globalReport.header.title')}
                    </h1>
                    <p className="text-zinc-500 uppercase text-[10px] font-black tracking-[0.2em] mt-1">
                        {t('globalReport.header.subtitle')}
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <Popover open={isEnterpriseSelectOpen} onOpenChange={setIsEnterpriseSelectOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                className="w-[240px] justify-between bg-slate-50 border-slate-200 text-black h-11 hover:bg-slate-100 transition-all font-bold"
                            >
                                <div className="flex items-center gap-2">
                                    <Building className="h-4 w-4 text-emerald-500" />
                                    {selectedEnterpriseId === "all"
                                        ? t('globalReport.header.allEnterprises')
                                        : enterprises.find(e => e.id === selectedEnterpriseId)?.name}
                                </div>
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[240px] p-0 bg-zinc-900 border-slate-200" align="end">
                            <Command className="bg-transparent">
                                <CommandInput placeholder={t('globalReport.header.searchPlaceholder')} className="h-9 text-black" />
                                <CommandList>
                                    <CommandEmpty className="py-6 text-center text-[10px] text-zinc-500 font-bold uppercase">{t('globalReport.header.noEnterprise')}</CommandEmpty>
                                    <CommandGroup>
                                        <CommandItem
                                            onSelect={() => {
                                                setSelectedEnterpriseId("all");
                                                setIsEnterpriseSelectOpen(false);
                                            }}
                                            className="text-black hover:bg-slate-50 cursor-pointer py-3"
                                        >
                                            <Check className={cn("mr-2 h-4 w-4 text-emerald-500", selectedEnterpriseId === "all" ? "opacity-100" : "opacity-0")} />
                                            <span className="font-bold text-xs uppercase text-emerald-500">All Enterprises</span>
                                        </CommandItem>
                                        {enterprises.map((ent) => (
                                            <CommandItem
                                                key={ent.id}
                                                onSelect={() => {
                                                    setSelectedEnterpriseId(ent.id);
                                                    setIsEnterpriseSelectOpen(false);
                                                }}
                                                className="text-black hover:bg-slate-50 cursor-pointer py-3"
                                            >
                                                <Check className={cn("mr-2 h-4 w-4 text-emerald-500", selectedEnterpriseId === ent.id ? "opacity-100" : "opacity-0")} />
                                                <span className="font-bold text-xs uppercase">{ent.name}</span>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                    <Button variant="outline" size="icon" className="h-11 w-11 border-slate-200 bg-slate-50 text-black" onClick={fetchData}>
                        <Loader2 className={cn("h-4 w-4", isLoading && "animate-spin")} />
                    </Button>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-slate-50 border-slate-200 backdrop-blur-md relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingUp className="h-16 w-16 text-emerald-500" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardDescription className="text-[9px] uppercase font-black text-zinc-500 tracking-widest">{t('globalReport.metrics.inflow')}</CardDescription>
                        <CardTitle className="text-2xl font-black text-black">{formatCurrency(metrics.inflow)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold uppercase italic">
                            <TrendingUp className="h-3 w-3" />
                            {t('globalReport.metrics.activeLiquidity')}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-50 border-slate-200 backdrop-blur-md relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingDown className="h-16 w-16 text-rose-500" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardDescription className="text-[9px] uppercase font-black text-zinc-500 tracking-widest whitespace-nowrap">{t('globalReport.metrics.outflow')}</CardDescription>
                        <CardTitle className="text-2xl font-black text-black">{formatCurrency(metrics.outflow)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-1.5 text-[10px] text-rose-400 font-bold uppercase italic">
                            <TrendingDown className="h-3 w-3" />
                            {t('globalReport.metrics.capitalRecovery')}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-50 border-slate-200 backdrop-blur-md relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Wallet className="h-16 w-16 text-blue-500" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardDescription className="text-[9px] uppercase font-black text-zinc-500 tracking-widest">{t('globalReport.metrics.netFlow')}</CardDescription>
                        <CardTitle className={cn("text-2xl font-black", metrics.net >= 0 ? "text-emerald-400" : "text-rose-400")}>
                            {formatCurrency(metrics.net)}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                            {t('globalReport.metrics.surplusDeficit')}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-50 border-slate-200 backdrop-blur-md relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Building className="h-16 w-16 text-black" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardDescription className="text-[9px] uppercase font-black text-zinc-500 tracking-widest">{t('globalReport.metrics.coverage')}</CardDescription>
                        <CardTitle className="text-2xl font-black text-black">
                            {selectedEnterpriseId === "all" ? metrics.enterpriseCount : t('globalReport.metrics.unit')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold uppercase tracking-widest">
                            {t('globalReport.metrics.activeEntities')}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Trend Chart */}
                <Card className="lg:col-span-8 bg-slate-50 border-slate-200 backdrop-blur-xl">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 py-4">
                        <div>
                            <CardTitle className="text-xs font-black text-black uppercase tracking-widest flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-emerald-500" />
                                {t('globalReport.charts.trendsTitle')}
                            </CardTitle>
                            <CardDescription className="text-[9px] font-bold text-zinc-500 uppercase">{t('globalReport.charts.trendsDesc')}</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-8 pl-0">
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" />
                                    <XAxis
                                        dataKey="name"
                                        stroke="#71717a"
                                        fontSize={10}
                                        fontWeight="bold"
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        stroke="#71717a"
                                        fontSize={10}
                                        fontWeight="bold"
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={(val) => `HTG ${val / 1000}k`}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#18181b', border: '1px solid #ffffff14', borderRadius: '8px', fontSize: '10px' }}
                                        itemStyle={{ fontWeight: '800' }}
                                    />
                                    <Area type="monotone" dataKey="inflow" stroke="#10b981" fillOpacity={1} fill="url(#colorIn)" strokeWidth={3} />
                                    <Area type="monotone" dataKey="outflow" stroke="#ef4444" fillOpacity={1} fill="url(#colorOut)" strokeWidth={3} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Distribution Chart or Stats Breakdown */}
                <Card className="lg:col-span-4 bg-slate-50 border-slate-200 backdrop-blur-xl">
                    <CardHeader className="border-b border-white/5 py-4">
                        <CardTitle className="text-xs font-black text-black uppercase tracking-widest flex items-center gap-2">
                            <PieChart className="h-4 w-4 text-emerald-500" />
                            {selectedEnterpriseId === "all" ? t('globalReport.charts.distTitleAll') : t('globalReport.charts.distTitleOne')}
                        </CardTitle>
                        <CardDescription className="text-[9px] font-bold text-zinc-500 uppercase">{t('globalReport.charts.distDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="h-[200px] w-full flex items-center justify-center">
                            {selectedEnterpriseId === "all" && enterpriseDistData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={enterpriseDistData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {enterpriseDistData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#18181b', border: '1px solid #ffffff14', borderRadius: '8px', fontSize: '10px' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="text-center space-y-2">
                                    <div className="h-20 w-20 mx-auto rounded-full border-4 border-dashed border-slate-200 flex items-center justify-center animate-spin-slow">
                                        <Building className="h-8 w-8 text-zinc-700" />
                                    </div>
                                    <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">
                                        {selectedEnterpriseId === "all" ? t('globalReport.charts.insufficientData') : t('globalReport.charts.focusMode')}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 space-y-3">
                            {selectedEnterpriseId === "all" ? (
                                enterpriseDistData.slice(0, 3).map((item, idx) => (
                                    <div key={item.name} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                                            <span className="text-[10px] font-black text-zinc-300 uppercase truncate max-w-[120px]">{item.name}</span>
                                        </div>
                                        <span className="text-[10px] font-mono font-bold text-black">{formatCurrency(item.value)}</span>
                                    </div>
                                ))
                            ) : (
                                <>
                                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-white/5">
                                        <div className="flex items-center gap-2">
                                            <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                                            <span className="text-[10px] font-black text-black uppercase">{t('globalReport.charts.fundingOps')}</span>
                                        </div>
                                        <span className="text-[10px] font-mono font-black text-black">x{transactions.filter(t => t.type === TransactionType.DEPOSIT).length}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-white/5">
                                        <div className="flex items-center gap-2">
                                            <ArrowDownLeft className="h-4 w-4 text-rose-500" />
                                            <span className="text-[10px] font-black text-black uppercase">{t('globalReport.charts.withdrawalOps')}</span>
                                        </div>
                                        <span className="text-[10px] font-mono font-black text-black">x{transactions.filter(t => t.type === TransactionType.WITHDRAWAL).length}</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Activity Table */}
            <Card className="bg-slate-50 border-slate-200 backdrop-blur-xl">
                <CardHeader className="border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-xs font-black text-black uppercase tracking-widest flex items-center gap-2">
                            <History className="h-4 w-4 text-zinc-500" />
                            {t('globalReport.activity.title')}
                        </CardTitle>
                        <CardDescription className="text-[9px] font-bold text-zinc-500 uppercase">{t('globalReport.activity.desc')}</CardDescription>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative group">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" />
                            <Input
                                placeholder={t('globalReport.activity.filterPlaceholder')}
                                className="h-8 pl-8 text-[10px] bg-slate-50 border-slate-200 text-black w-48 placeholder:text-zinc-600 focus:border-emerald-500/50"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 border-slate-200 bg-slate-50 text-[9px] font-black uppercase tracking-widest gap-2"
                            onClick={handleExportCSV}
                        >
                            <Download className="h-3 w-3" />
                            {t('globalReport.activity.exportCsv')}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-white/5 hover:bg-transparent px-2">
                                <TableHead className="text-[9px] uppercase font-black text-zinc-500 tracking-widest pl-6">{t('globalReport.activity.entityInvolved')}</TableHead>
                                <TableHead className="text-[9px] uppercase font-black text-zinc-500 tracking-widest">{t('globalReport.activity.enterpriseContext')}</TableHead>
                                <TableHead className="text-[9px] uppercase font-black text-zinc-500 tracking-widest text-right">{t('globalReport.activity.amountHtg')}</TableHead>
                                <TableHead className="text-[9px] uppercase font-black text-zinc-500 tracking-widest text-right">{t('globalReport.activity.executionDate')}</TableHead>
                                <TableHead className="text-[9px] uppercase font-black text-zinc-500 tracking-widest text-right pr-6">{t('globalReport.activity.status')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredActivity.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-48 text-center text-zinc-500 text-[10px] font-black uppercase tracking-widest">
                                        {t('globalReport.activity.noActivity')}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredActivity.map((tx) => (
                                    <TableRow key={tx.id} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                                        <TableCell className="pl-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "h-8 w-8 rounded-lg flex items-center justify-center border",
                                                    tx.type === TransactionType.DEPOSIT
                                                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                                                        : "bg-rose-500/10 border-rose-500/20 text-rose-500"
                                                )}>
                                                    {tx.type === TransactionType.DEPOSIT ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
                                                </div>
                                                <div>
                                                    <div className="text-[11px] font-black text-black leading-none uppercase">
                                                        {tx.seller?.name || tx.headquarter?.name || t('globalReport.activity.systemRecord')}
                                                    </div>
                                                    <div className="text-[8px] font-bold text-zinc-500 mt-1 uppercase tracking-tighter">
                                                        Ref: {tx.id.substring(0, 8)}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="bg-slate-50 border-slate-200 text-black text-[9px] font-black uppercase h-5 tracking-tighter">
                                                {enterprises.find(e => e.id === tx.enterpriseId)?.name || t('globalReport.activity.unknownContext')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className={cn(
                                                "text-xs font-black font-mono",
                                                tx.type === TransactionType.DEPOSIT ? "text-emerald-400" : "text-rose-400"
                                            )}>
                                                {tx.type === TransactionType.DEPOSIT ? "+" : "-"}{formatCurrency(tx.amount)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="text-[10px] font-bold text-zinc-400">
                                                {format(parseISO(tx.createdAt), 'MMM dd, yyyy')}
                                            </div>
                                            <div className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest mt-0.5">
                                                {format(parseISO(tx.createdAt), 'HH:mm:ss')}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <Badge className={cn(
                                                "text-[9px] font-black uppercase py-0 h-5 px-3 pointer-events-none shadow-lg",
                                                tx.status === 'completed'
                                                    ? 'bg-emerald-500 text-black'
                                                    : 'bg-zinc-800 text-zinc-500'
                                            )}>
                                                {tx.status}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                    {transactions.length > 10 && (
                        <div className="p-4 border-t border-white/5 bg-white/[0.01]">
                            <Button
                                variant="ghost"
                                className="w-full text-zinc-500 hover:text-black text-[10px] font-black uppercase tracking-widest h-8"
                            >
                                {t('globalReport.activity.viewAll')}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default GlobalReport;
