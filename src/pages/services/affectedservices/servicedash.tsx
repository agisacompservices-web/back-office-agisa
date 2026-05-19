import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useService } from "../../../context/ServiceContext";
import { useServSidebar } from "../../../context/ServSidebarContext";
import {
    ShieldAlert,
    LogOut,
    Timer,
    TrendingDown,
    Trophy,
    CircleDollarSign,
    Wallet,
    ArrowDownCircle,
    ArrowUpCircle,
    Users,
    Loader2,
    RefreshCw,
    ArrowRight,
    // Banknote,
} from 'lucide-react';
import { Button } from "../../../components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "../../../components/ui/card";
import { useTranslation } from "react-i18next";
import bettingApi from "../../../context/api/betting";
import zonecashApi from "../../../context/api/zonecash";
import { toast } from "sonner";
import { cn } from "../../../lib/utils";

const ServiceDash: React.FC = () => {
    const { t } = useTranslation();
    const { enterpriseCode } = useParams();
    const { currentService } = useService();
    const navigate = useNavigate();

    const { hasHqAccess, isHqLoading } = useServSidebar();

    // Service type flags
    const isBetting = currentService?.category?.name?.toLowerCase() === 'betting';
    const isFintech = currentService?.category?.name?.toLowerCase() === 'fintech';
    const [bettingLoading, setBettingLoading] = useState(false);
    const [bettingRefreshing, setBettingRefreshing] = useState(false);
    const [bettingStats, setBettingStats] = useState({
        ongoingBets: 0,
        losingBets: 0,
        winningBets: 0,
        winningStakesSum: 0,
        stakesSum: 0,
        totalDeposits: 0,
        totalWithdrawals: 0,
        totalUsers: 0
    });

    // ZoneCash stats
    const [zonecashLoading, setZoneCashLoading] = useState(false);
    const [zonecashRefreshing, setZoneCashRefreshing] = useState(false);
    const [zonecashStats, setZoneCashStats] = useState({
        totalDeposits: 0,
        totalWithdrawals: 0,
        totalUsers: 0,
    });

    const fetchZoneCashStats = useCallback(async (isManual = false) => {
        if (!isFintech) return;
        if (isManual) setZoneCashRefreshing(true);
        else setZoneCashLoading(true);
        try {
            const [deposits, withdrawals, users] = await Promise.allSettled([
                zonecashApi.getTotalDeposits({}),
                zonecashApi.getTotalWithdrawals({}),
                zonecashApi.getTotalUsers({}),
            ]);
            setZoneCashStats({
                totalDeposits: deposits.status === 'fulfilled' ? (deposits.value?.total ?? 0) : 0,
                totalWithdrawals: withdrawals.status === 'fulfilled' ? (withdrawals.value?.total ?? 0) : 0,
                totalUsers: users.status === 'fulfilled' ? (users.value?.totalUsers ?? users.value?.total ?? 0) : 0,
            });
            if (isManual) toast.success(t('zonecashReport.toasts.refreshed') || 'ZoneCash mis à jour');
        } catch {
            toast.error(t('zonecashReport.errors.fetchFailed') || 'Erreur chargement ZoneCash');
        } finally {
            setZoneCashLoading(false);
            setZoneCashRefreshing(false);
        }
    }, [isFintech, t]);

    const fetchBettingStats = useCallback(async (isManual = false) => {
        if (!isBetting) return;
        if (isManual) setBettingRefreshing(true);
        else setBettingLoading(true);

        try {
            const [ongoing, losing, winning, aPayer, money, deposits, withdrawals, users] =
                await Promise.allSettled([
                    bettingApi.getOngoingBetsTotal({}),
                    bettingApi.getLosingBetsTotal({}),
                    bettingApi.getWinningBetsTotal({}),
                    bettingApi.getWinningStakesSum({}),
                    bettingApi.getStakesSum({}),
                    bettingApi.getTotalDeposits({}),
                    bettingApi.getTotalWithdrawals({}),
                    bettingApi.getTotalUsers({})
                ]);

            setBettingStats({
                ongoingBets: ongoing.status === 'fulfilled' ? ongoing.value.totalOngoingBets : 0,
                losingBets: losing.status === 'fulfilled' ? losing.value.totalLoosingBets : 0,
                winningBets: winning.status === 'fulfilled' ? winning.value.totalWinningBets : 0,
                winningStakesSum: aPayer.status === 'fulfilled' ? aPayer.value.total : 0,
                stakesSum: money.status === 'fulfilled' ? money.value.total : 0,
                totalDeposits: deposits.status === 'fulfilled' ? deposits.value.total : 0,
                totalWithdrawals: withdrawals.status === 'fulfilled' ? withdrawals.value.total : 0,
                totalUsers: users.status === 'fulfilled' ? users.value.totalUsers : 0
            });

            if (isManual) toast.success(t('bettingReport.toasts.refreshed'));
        } catch {
            toast.error(t('bettingReport.errors.fetchFailed'));
        } finally {
            setBettingLoading(false);
            setBettingRefreshing(false);
        }
    }, [isBetting, t]);

    useEffect(() => {
        if (isHqLoading) return; // Wait for access check

        const storedUser = localStorage.getItem('agisa_user');
        if (storedUser && hasHqAccess) {
            const user = JSON.parse(storedUser);
            if (user.role?.level?.toUpperCase() === 'MANAGER_HEADQUARTER_LOCAL') {
                navigate(`/${enterpriseCode}/headquaterlocal`, { replace: true });
            }
        }
    }, [enterpriseCode, navigate, isHqLoading, hasHqAccess]);

    useEffect(() => {
        if (isBetting && !isHqLoading) fetchBettingStats();
    }, [isBetting, isHqLoading, fetchBettingStats]);

    useEffect(() => {
        if (isFintech && !isHqLoading) fetchZoneCashStats();
    }, [isFintech, isHqLoading, fetchZoneCashStats]);

    const handleLogout = () => {
        localStorage.removeItem('agisa_token');
        localStorage.removeItem('agisa_refresh_token');
        localStorage.removeItem('agisa_user');
        localStorage.removeItem('agisa_current_service');
        navigate('/login', { replace: true });
    };

    if (isHqLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    if (!hasHqAccess) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-6 animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/20">
                    <ShieldAlert className="h-10 w-10 text-red-500" />
                </div>
                <h1 className="text-3xl font-black text-black uppercase tracking-tighter mb-2">{t('serviceDash.auth.restrained')}</h1>
                <p className="text-zinc-500 max-w-md mb-8 font-medium">
                    {t('serviceDash.auth.noHqMsg')}
                </p>
                <div className="flex gap-4">
                    <Button
                        variant="outline"
                        className="border-slate-200 bg-slate-50 hover:bg-slate-100 text-black font-bold"
                        onClick={() => window.location.reload()}
                    >
                        {t('serviceDash.auth.tryRefresh')}
                    </Button>
                    <Button
                        variant="ghost"
                        className="text-zinc-500 hover:text-black"
                        onClick={handleLogout}
                    >
                        <LogOut className="h-4 w-4 mr-2" />
                        {t('serviceDash.auth.logout')}
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-500">
            {/* Enterprise Header */}
            <h1 className="text-2xl font-bold text-black uppercase tracking-widest">
                {currentService?.name || enterpriseCode || t('serviceDash.ui.title')}
            </h1>

            {/* Basic Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-xl border border-slate-200 bg-slate-50 backdrop-blur-xl">
                    <h3 className="text-xs font-semibold text-emerald-500 uppercase tracking-widest mb-1">{t('serviceDash.ui.status')}</h3>
                    <p className="text-2xl font-bold text-black">{t('serviceDash.ui.active')}</p>
                </div>
                <div className="p-6 rounded-xl border border-slate-200 bg-slate-50 backdrop-blur-xl">
                    <h3 className="text-xs font-semibold text-emerald-500 uppercase tracking-widest mb-1">{t('serviceDash.ui.srvCode')}</h3>
                    <p className="text-2xl font-bold text-black">{enterpriseCode}</p>
                </div>
                <div className="p-6 rounded-xl border border-slate-200 bg-slate-50 backdrop-blur-xl">
                    <h3 className="text-xs font-semibold text-emerald-500 uppercase tracking-widest mb-1">{t('serviceDash.ui.entId')}</h3>
                    <p className="text-sm font-mono text-gray-400 truncate">{currentService?.id || t('serviceDash.ui.na')}</p>
                </div>
            </div>

            {/* Betting Section — only visible for betting enterprises */}
            {isBetting && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Section Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-black text-black uppercase tracking-wider">
                                {t('serviceDash.betting.title')}
                            </h2>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                                {t('serviceDash.betting.subtitle')}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => fetchBettingStats(true)}
                                disabled={bettingRefreshing}
                                className="bg-slate-50 border-slate-200 text-black hover:bg-slate-100 font-bold uppercase text-[10px] tracking-widest"
                            >
                                <RefreshCw className={cn("mr-2 h-3 w-3", bettingRefreshing && "animate-spin")} />
                                {t('common.refresh')}
                            </Button>
                            <Link to={`/${enterpriseCode}/betting-reports`}>
                                <Button
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase text-[10px] tracking-widest shadow-md"
                                >
                                    {t('serviceDash.betting.viewReports')}
                                    <ArrowRight className="ml-2 h-3 w-3" />
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Betting Stats Grid */}
                    {bettingLoading ? (
                        <div className="flex h-[100px] items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            {/* Total Stakes */}
                            <Card className="bg-slate-50 border-slate-200 text-black border-t-2 border-t-blue-500 transition-all hover:shadow-md">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-[10px] font-black text-black uppercase tracking-widest">
                                        {t('bettingReport.stats.totalMoney')}
                                    </CardTitle>
                                    <CircleDollarSign className="h-4 w-4 text-blue-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-black">{bettingStats.stakesSum.toLocaleString()} HTG</div>
                                    <p className="text-[10px] text-blue-500 font-bold uppercase mt-1">
                                        {t('bettingReport.stats.totalMoneyDesc')}
                                    </p>
                                </CardContent>
                            </Card>

                            {/* Total Payouts */}
                            <Card className="bg-slate-50 border-slate-200 text-black border-t-2 border-t-orange-500 transition-all hover:shadow-md">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-[10px] font-black text-black uppercase tracking-widest">
                                        {t('bettingReport.stats.payoutsPending')}
                                    </CardTitle>
                                    <Wallet className="h-4 w-4 text-orange-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-black">{bettingStats.winningStakesSum.toLocaleString()} HTG</div>
                                    <p className="text-[10px] text-orange-500 font-bold uppercase mt-1">
                                        {t('bettingReport.stats.payoutsPendingDesc')}
                                    </p>
                                </CardContent>
                            </Card>

                            {/* Deposits */}
                            <Card className="bg-slate-50 border-slate-200 text-black border-t-2 border-t-emerald-500 transition-all hover:shadow-md">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-[10px] font-black text-black uppercase tracking-widest">
                                        {t('bettingReport.stats.deposits')}
                                    </CardTitle>
                                    <ArrowDownCircle className="h-4 w-4 text-emerald-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-black">{bettingStats.totalDeposits.toLocaleString()} HTG</div>
                                    <p className="text-[10px] text-emerald-500 font-bold uppercase mt-1">
                                        {t('bettingReport.stats.depositsDesc')}
                                    </p>
                                </CardContent>
                            </Card>

                            {/* Withdrawals */}
                            <Card className="bg-slate-50 border-slate-200 text-black border-t-2 border-t-red-500 transition-all hover:shadow-md">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-[10px] font-black text-black uppercase tracking-widest">
                                        {t('bettingReport.stats.withdrawals')}
                                    </CardTitle>
                                    <ArrowUpCircle className="h-4 w-4 text-red-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-black">{bettingStats.totalWithdrawals.toLocaleString()} HTG</div>
                                    <p className="text-[10px] text-red-500 font-bold uppercase mt-1">
                                        {t('bettingReport.stats.withdrawalsDesc')}
                                    </p>
                                </CardContent>
                            </Card>

                            {/* Ongoing Bets */}
                            <Card className="bg-slate-50 border-slate-200 text-black border-t-2 border-t-indigo-500 transition-all hover:shadow-md">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-[10px] font-black text-black uppercase tracking-widest">
                                        {t('bettingReport.stats.ongoing')}
                                    </CardTitle>
                                    <Timer className="h-4 w-4 text-indigo-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-black">{bettingStats.ongoingBets.toLocaleString()}</div>
                                    <p className="text-[10px] text-indigo-500 font-bold uppercase mt-1">
                                        {t('bettingReport.stats.ongoingDesc')}
                                    </p>
                                </CardContent>
                            </Card>

                            {/* Winning Bets */}
                            <Card className="bg-slate-50 border-slate-200 text-black border-t-2 border-t-yellow-500 transition-all hover:shadow-md">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-[10px] font-black text-black uppercase tracking-widest">
                                        {t('bettingReport.stats.winning')}
                                    </CardTitle>
                                    <Trophy className="h-4 w-4 text-yellow-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-black">{bettingStats.winningBets.toLocaleString()}</div>
                                    <p className="text-[10px] text-yellow-500 font-bold uppercase mt-1">
                                        {t('bettingReport.stats.winningDesc')}
                                    </p>
                                </CardContent>
                            </Card>

                            {/* Losing Bets */}
                            <Card className="bg-slate-50 border-slate-200 text-black border-t-2 border-t-zinc-400 transition-all hover:shadow-md">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-[10px] font-black text-black uppercase tracking-widest">
                                        {t('bettingReport.stats.losing')}
                                    </CardTitle>
                                    <TrendingDown className="h-4 w-4 text-zinc-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-black">{bettingStats.losingBets.toLocaleString()}</div>
                                    <p className="text-[10px] text-zinc-500 font-bold uppercase mt-1">
                                        {t('bettingReport.stats.losingDesc')}
                                    </p>
                                </CardContent>
                            </Card>

                            {/* Active Users */}
                            <Card className="bg-slate-50 border-slate-200 text-black border-t-2 border-t-purple-500 transition-all hover:shadow-md">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-[10px] font-black text-black uppercase tracking-widest">
                                        {t('bettingReport.stats.users')}
                                    </CardTitle>
                                    <Users className="h-4 w-4 text-purple-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-black">{bettingStats.totalUsers.toLocaleString()}</div>
                                    <p className="text-[10px] text-purple-500 font-bold uppercase mt-1">
                                        {t('bettingReport.stats.usersDesc')}
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            )}

            {/* ZoneCash Section — only visible for fintech enterprises */}
            {isFintech && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-black text-black uppercase tracking-wider">
                                {t('serviceDash.zonecash.title') || 'ZoneCash — Intégration'}
                            </h2>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                                {t('serviceDash.zonecash.subtitle') || 'Dépôts & retraits clients ZoneCash'}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => fetchZoneCashStats(true)}
                                disabled={zonecashRefreshing}
                                className="bg-slate-50 border-slate-200 text-black hover:bg-slate-100 font-bold uppercase text-[10px] tracking-widest"
                            >
                                <RefreshCw className={cn('mr-2 h-3 w-3', zonecashRefreshing && 'animate-spin')} />
                                {t('common.refresh') || 'Rafraîchir'}
                            </Button>
                            <Link to={`/${enterpriseCode}/zonecash-deposit`}>
                                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-black font-bold uppercase text-[10px] tracking-widest shadow-md">
                                    {t('serviceDash.zonecash.deposit') || 'Nouveau Dépôt'}
                                    <ArrowRight className="ml-2 h-3 w-3" />
                                </Button>
                            </Link>
                            <Link to={`/${enterpriseCode}/zonecash-reports`}>
                                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase text-[10px] tracking-widest shadow-md">
                                    {t('serviceDash.zonecash.reports') || 'Rapports'}
                                    <ArrowRight className="ml-2 h-3 w-3" />
                                </Button>
                            </Link>
                            <Link to={`/${enterpriseCode}/zonecash-users`}>
                                <Button size="sm" variant="outline" className="bg-slate-50 border-slate-200 text-black font-bold uppercase text-[10px] tracking-widest">
                                    {t('serviceDash.zonecash.users') || 'Clients'}
                                    <ArrowRight className="ml-2 h-3 w-3" />
                                </Button>
                            </Link>
                            <Link to={`/${enterpriseCode}/zonecash-business-validation`}>
                                <Button size="sm" variant="outline" className="bg-slate-50 border-slate-200 text-black font-bold uppercase text-[10px] tracking-widest border-[#10b981] text-[#10b981] hover:bg-[#ecfdf5] transition-colors">
                                    {t('serviceDash.zonecash.businessValidation') || 'Validation Business'}
                                    <ArrowRight className="ml-2 h-3 w-3" />
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {zonecashLoading ? (
                        <div className="flex h-[100px] items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-3">
                            <Card className="bg-slate-50 border-slate-200 border-t-2 border-t-emerald-500 transition-all hover:shadow-md">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-[10px] font-black text-black uppercase tracking-widest">
                                        {t('zonecashReport.stats.totalDeposits') || 'Total Dépôts'}
                                    </CardTitle>
                                    <ArrowDownCircle className="h-4 w-4 text-emerald-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-black">{zonecashStats.totalDeposits.toLocaleString()} HTG</div>
                                    <p className="text-[10px] text-emerald-500 font-bold uppercase mt-1">
                                        {t('zonecashReport.stats.totalDepositsDesc') || 'Cash-in Sellers'}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-50 border-slate-200 border-t-2 border-t-red-500 transition-all hover:shadow-md">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-[10px] font-black text-black uppercase tracking-widest">
                                        {t('zonecashReport.stats.totalWithdrawals') || 'Total Retraits'}
                                    </CardTitle>
                                    <ArrowUpCircle className="h-4 w-4 text-red-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-black">{zonecashStats.totalWithdrawals.toLocaleString()} HTG</div>
                                    <p className="text-[10px] text-red-500 font-bold uppercase mt-1">
                                        {t('zonecashReport.stats.totalWithdrawalsDesc') || 'Cash-out clients'}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-50 border-slate-200 border-t-2 border-t-purple-500 transition-all hover:shadow-md">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-[10px] font-black text-black uppercase tracking-widest">
                                        {t('zonecashReport.stats.totalUsers') || 'Clients ZoneCash'}
                                    </CardTitle>
                                    <Users className="h-4 w-4 text-purple-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-black">{zonecashStats.totalUsers.toLocaleString()}</div>
                                    <p className="text-[10px] text-purple-500 font-bold uppercase mt-1">
                                        {t('zonecashReport.stats.totalUsersDesc') || 'Comptes actifs'}
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            )}

            {/* Welcome message for non-specialized enterprises */}
            {!isBetting && !isFintech && (
                <p className="text-gray-400 mt-2">
                    {t('serviceDash.ui.welcome')}
                </p>
            )}
        </div>
    );
};

export default ServiceDash;