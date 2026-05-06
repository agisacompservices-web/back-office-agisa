import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import {
    ArrowDownCircle,
    ArrowUpCircle,
    Users,
    Loader2,
    Calendar,
    RefreshCw,
    CircleDollarSign,
    Banknote,
    TrendingUp,
    ChevronRight,
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "../../../../components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../../../../components/ui/table";
import felcashApi from '../../../../context/api/felcash';
import { toast } from 'sonner';
import { cn } from '../../../../lib/utils';

const FelcashReport: React.FC = () => {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const [stats, setStats] = useState({
        totalDeposits: 0,
        totalWithdrawals: 0,
        totalUsers: 0,
        totalHTG: 0,
        totalUSD: 0,
        totalProfits: 0,
        profitsCount: 0,
    });

    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [profitDetails, setProfitDetails] = useState<any[]>([]);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);

    const fetchStats = useCallback(async (isManual = false) => {
        if (isManual) setIsRefreshing(true);
        else setIsLoading(true);

        const query = {
            startDate: startDate || undefined,
            endDate: endDate || undefined,
        };

        try {
            const [deposits, withdrawals, users, money, profits] = await Promise.allSettled([
                felcashApi.getTotalDeposits(query),
                felcashApi.getTotalWithdrawals(query),
                felcashApi.getTotalUsers(query),
                felcashApi.getTotalMoney(query),
                felcashApi.getTotalProfits(query),
            ]);

            // total-money can be an array [{currency, total}] or {totalHTG, totalUSD}
            let totalHTG = 0;
            let totalUSD = 0;
            if (money.status === 'fulfilled') {
                const m = money.value;
                if (Array.isArray(m)) {
                    m.forEach((item: any) => {
                        if (item.currency === 'HTG') totalHTG = item.total ?? 0;
                        if (item.currency === 'USD') totalUSD = item.total ?? 0;
                    });
                } else {
                    totalHTG = m?.totalHTG ?? m?.HTG ?? 0;
                    totalUSD = m?.totalUSD ?? m?.USD ?? 0;
                }
            }

            setStats({
                totalDeposits: deposits.status === 'fulfilled' ? (deposits.value?.total ?? 0) : 0,
                totalWithdrawals: withdrawals.status === 'fulfilled' ? (withdrawals.value?.total ?? 0) : 0,
                totalUsers: users.status === 'fulfilled' ? (users.value?.totalUsers ?? users.value?.total ?? 0) : 0,
                totalHTG,
                totalUSD,
                totalProfits: profits.status === 'fulfilled' ? (profits.value?.total ?? 0) : 0,
                profitsCount: profits.status === 'fulfilled' ? (profits.value?.count ?? 0) : 0,
            });

            if (isManual) toast.success(t('felcashReport.toasts.refreshed') || 'Rapports mis à jour');
        } catch {
            toast.error(t('felcashReport.errors.fetchFailed') || 'Échec du chargement des rapports');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [startDate, endDate, t]);

    const fetchProfitDetails = async () => {
        setIsLoadingDetails(true);
        setIsDetailsOpen(true);
        try {
            const res = await felcashApi.getProfitDetails({
                startDate: startDate || undefined,
                endDate: endDate || undefined,
                limit: 100
            });
            setProfitDetails(res.items || []);
        } catch (err) {
            toast.error("Impossible de charger les détails des bénéfices");
        } finally {
            setIsLoadingDetails(false);
        }
    };

    useEffect(() => { fetchStats(); }, [fetchStats]);

    const handleFilter = (e: React.FormEvent) => { e.preventDefault(); fetchStats(); };
    const clearFilters = () => { setStartDate(''); setEndDate(''); };

    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-black tracking-tight text-black uppercase">
                        {t('felcashReport.title') || 'Zone Cash — Rapports'}
                    </h2>
                    <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">
                        {t('felcashReport.description') || 'Statistiques en temps réel — intégration Zone Cash'}
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchStats(true)}
                    disabled={isRefreshing}
                    className="bg-slate-50 border-slate-200 text-black hover:bg-slate-100 font-bold uppercase text-[10px] tracking-widest"
                >
                    <RefreshCw className={cn('mr-2 h-3 w-3', isRefreshing && 'animate-spin')} />
                    {t('common.refresh') || 'Rafraîchir'}
                </Button>
            </div>

            {/* Filters */}
            <Card className="bg-slate-50 border-slate-200 text-black shadow-sm">
                <CardHeader className="py-4 border-b border-slate-200/50">
                    <CardTitle className="text-[10px] font-black text-black uppercase tracking-widest flex items-center">
                        <Calendar className="mr-2 h-3 w-3 text-emerald-500" />
                        {t('common.filters') || 'Filtres'}
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <form onSubmit={handleFilter} className="flex flex-col md:flex-row items-end gap-4">
                        <div className="grid w-full max-w-sm items-center gap-1.5">
                            <Label htmlFor="startDate" className="text-[10px] uppercase font-black text-black/70 tracking-widest">
                                {t('common.startDate') || 'Date début'}
                            </Label>
                            <Input
                                type="date" id="startDate" value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                className="bg-white border-slate-200 text-black text-xs h-9"
                            />
                        </div>
                        <div className="grid w-full max-w-sm items-center gap-1.5">
                            <Label htmlFor="endDate" className="text-[10px] uppercase font-black text-black/70 tracking-widest">
                                {t('common.endDate') || 'Date fin'}
                            </Label>
                            <Input
                                type="date" id="endDate" value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                                className="bg-white border-slate-200 text-black text-xs h-9"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-black font-black uppercase text-[10px] tracking-widest h-9 px-6 active:scale-95">
                                {t('common.apply') || 'Appliquer'}
                            </Button>
                            <Button type="button" variant="outline" onClick={clearFilters}
                                className="bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200 font-black uppercase text-[10px] tracking-widest h-9">
                                {t('common.clear') || 'Effacer'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <Card className="bg-slate-50 border-slate-200 border-t-2 border-t-emerald-500 transition-all hover:shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-black text-black uppercase tracking-widest">
                            {t('felcashReport.stats.totalDeposits') || 'Total Dépôts'}
                        </CardTitle>
                        <ArrowDownCircle className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black">{stats.totalDeposits.toLocaleString()} HTG</div>
                        <p className="text-[10px] text-emerald-500 font-bold uppercase mt-1">
                            {t('felcashReport.stats.totalDepositsDesc') || 'Cash-in par les Sellers'}
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-slate-50 border-slate-200 border-t-2 border-t-red-500 transition-all hover:shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-black text-black uppercase tracking-widest">
                            {t('felcashReport.stats.totalWithdrawals') || 'Total Retraits'}
                        </CardTitle>
                        <ArrowUpCircle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black">{stats.totalWithdrawals.toLocaleString()} HTG</div>
                        <p className="text-[10px] text-red-500 font-bold uppercase mt-1">
                            {t('felcashReport.stats.totalWithdrawalsDesc') || 'Cash-out demandés par clients'}
                        </p>
                    </CardContent>
                </Card>

                <Card
                    className="bg-white border-emerald-200 border-t-2 border-t-emerald-600 transition-all hover:shadow-lg cursor-pointer group"
                    onClick={fetchProfitDetails}
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">
                            {t('felcashReport.stats.totalProfits') || 'Bénéfices (Basket)'}
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-emerald-600">
                            {stats.totalProfits.toLocaleString()} HTG
                        </div>
                        <div className="flex items-center justify-between mt-1">
                            <p className="text-[10px] text-emerald-500 font-bold uppercase">
                                {stats.profitsCount} {t('felcashReport.stats.profitsCount') || 'Tranzaksyon'}
                            </p>
                            <ChevronRight className="h-3 w-3 text-emerald-400 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-50 border-slate-200 border-t-2 border-t-purple-500 transition-all hover:shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-black text-black uppercase tracking-widest">
                            {t('felcashReport.stats.totalUsers') || 'Clients Felcash'}
                        </CardTitle>
                        <Users className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black">{stats.totalUsers.toLocaleString()}</div>
                        <p className="text-[10px] text-purple-500 font-bold uppercase mt-1">
                            {t('felcashReport.stats.totalUsersDesc') || 'Comptes actifs'}
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-slate-50 border-slate-200 border-t-2 border-t-blue-500 transition-all hover:shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-black text-black uppercase tracking-widest">
                            {t('felcashReport.stats.totalMoney') || 'Argent en Circulation'}
                        </CardTitle>
                        <CircleDollarSign className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-black">{stats.totalHTG.toLocaleString()} HTG</div>
                        <div className="flex items-center gap-1 mt-1">
                            <Banknote className="h-3 w-3 text-green-500" />
                            <span className="text-sm font-black text-green-600">{stats.totalUSD.toLocaleString()} USD</span>
                        </div>
                        <p className="text-[10px] text-blue-500 font-bold uppercase mt-1">
                            {t('felcashReport.stats.totalMoneyDesc') || 'Soldes totaux par devise'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Profit Details Modal */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-emerald-600" />
                            Détails des Bénéfices
                        </DialogTitle>
                        <DialogDescription className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                            Liste des profits générés par les transactions de change
                        </DialogDescription>
                    </DialogHeader>

                    {isLoadingDetails ? (
                        <div className="flex py-20 items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                        </div>
                    ) : (
                        <div className="rounded-md border border-slate-200 bg-white">
                            <Table>
                                <TableHeader className="bg-slate-50">
                                    <TableRow>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Date</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Client</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Tranzaksyon</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Montan Profit</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-right">Détails</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {profitDetails.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center text-slate-500 font-bold uppercase text-[10px]">
                                                Aucun profit trouvé pour cette période
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        profitDetails.map((profit) => (
                                            <TableRow key={profit.id} className="hover:bg-slate-50 transition-colors">
                                                <TableCell className="text-xs font-medium">
                                                    {new Date(profit.createdAt).toLocaleDateString()}
                                                    <div className="text-[9px] text-slate-400">
                                                        {new Date(profit.createdAt).toLocaleTimeString()}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-xs font-bold text-slate-900">
                                                    {profit.transaction?.account?.user?.fullName || "Inconnu"}
                                                    <div className="text-[9px] text-slate-400 font-bold uppercase">
                                                        {profit.transaction?.account?.accountNumber}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-xs">
                                                    <div className="flex items-center gap-1 font-bold text-slate-600">
                                                        {profit.transaction?.amount > 0 ? "+" : ""}
                                                        {profit.transaction?.amount} {profit.transaction?.account?.currency}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm font-black text-emerald-600">
                                                        +{profit.amount} HTG
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <p className="text-[9px] text-slate-500 font-medium leading-tight max-w-[200px] ml-auto">
                                                        {profit.description}
                                                    </p>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default FelcashReport;
