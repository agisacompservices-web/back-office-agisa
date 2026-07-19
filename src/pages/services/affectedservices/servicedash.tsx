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
    ArrowLeftRight,
    Activity,
    ShoppingBag,
    Plus,
    Trash2,
    Save,
    Banknote,
} from 'lucide-react';
import { Input } from "../../../components/ui/input";
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
        basketCount: 0,
        basketProfit: 0,
    });

    // Withdrawal fee tiers
    type FeeTier = { id?: string; minAmount: number; maxAmount: number | null; fee: number };
    const [tiers, setTiers] = useState<FeeTier[]>([]);
    const [tiersLoading, setTiersLoading] = useState(false);
    const [tiersSaving, setTiersSaving] = useState(false);

    // Deposit fee tiers
    const [depositTiers, setDepositTiers] = useState<FeeTier[]>([]);
    const [depositTiersLoading, setDepositTiersLoading] = useState(false);
    const [depositTiersSaving, setDepositTiersSaving] = useState(false);

    // Transfer (P2P) fee tiers
    const [transferTiers, setTransferTiers] = useState<FeeTier[]>([]);
    const [transferTiersLoading, setTransferTiersLoading] = useState(false);
    const [transferTiersSaving, setTransferTiersSaving] = useState(false);

    const fetchFeeTiers = useCallback(async () => {
        if (!isFintech) return;
        setTiersLoading(true);
        try {
            const data = await zonecashApi.getWithdrawalFeeTiers();
            setTiers(Array.isArray(data) ? data : []);
        } catch {
            toast.error(t('serviceDash.withdrawalFees.toasts.loadFailed'));
        } finally {
            setTiersLoading(false);
        }
    }, [isFintech, t]);

    const saveFeeTiers = async () => {
        setTiersSaving(true);
        try {
            await zonecashApi.updateWithdrawalFeeTiers(
                tiers.map(({ minAmount, maxAmount, fee }) => ({ minAmount, maxAmount, fee }))
            );
            toast.success(t('serviceDash.withdrawalFees.toasts.saved'));
        } catch {
            toast.error(t('serviceDash.withdrawalFees.toasts.saveFailed'));
        } finally {
            setTiersSaving(false);
        }
    };

    const addTier = () => {
        const last = tiers[tiers.length - 1];
        const newMin = last ? (last.maxAmount !== null ? last.maxAmount + 1 : 0) : 0;
        setTiers([...tiers, { minAmount: newMin, maxAmount: null, fee: 0 }]);
    };

    const removeTier = (idx: number) => setTiers(tiers.filter((_, i) => i !== idx));

    const updateTier = (idx: number, field: keyof FeeTier, value: number | null) => {
        setTiers(tiers.map((t, i) => i === idx ? { ...t, [field]: value } : t));
    };

    const fetchTransferFeeTiers = useCallback(async () => {
        if (!isFintech) return;
        setTransferTiersLoading(true);
        try {
            const data = await zonecashApi.getTransferFeeTiers();
            setTransferTiers(Array.isArray(data) ? data : []);
        } catch {
            toast.error(t('serviceDash.transferFees.toasts.loadFailed'));
        } finally {
            setTransferTiersLoading(false);
        }
    }, [isFintech, t]);

    const saveTransferFeeTiers = async () => {
        setTransferTiersSaving(true);
        try {
            await zonecashApi.updateTransferFeeTiers(
                transferTiers.map(({ minAmount, maxAmount, fee }) => ({ minAmount, maxAmount, fee }))
            );
            toast.success(t('serviceDash.transferFees.toasts.saved'));
        } catch {
            toast.error(t('serviceDash.transferFees.toasts.saveFailed'));
        } finally {
            setTransferTiersSaving(false);
        }
    };

    const addTransferTier = () => {
        const last = transferTiers[transferTiers.length - 1];
        const newMin = last ? (last.maxAmount !== null ? last.maxAmount + 1 : 0) : 0;
        setTransferTiers([...transferTiers, { minAmount: newMin, maxAmount: null, fee: 0 }]);
    };

    const removeTransferTier = (idx: number) => setTransferTiers(transferTiers.filter((_, i) => i !== idx));

    const updateTransferTier = (idx: number, field: keyof FeeTier, value: number | null) => {
        setTransferTiers(transferTiers.map((t, i) => i === idx ? { ...t, [field]: value } : t));
    };

    const fetchDepositFeeTiers = useCallback(async () => {
        if (!isFintech) return;
        setDepositTiersLoading(true);
        try {
            const data = await zonecashApi.getDepositFeeTiers();
            setDepositTiers(Array.isArray(data) ? data : []);
        } catch {
            toast.error(t('serviceDash.depositFees.toasts.loadFailed'));
        } finally {
            setDepositTiersLoading(false);
        }
    }, [isFintech, t]);

    const saveDepositFeeTiers = async () => {
        setDepositTiersSaving(true);
        try {
            await zonecashApi.updateDepositFeeTiers(
                depositTiers.map(({ minAmount, maxAmount, fee }) => ({ minAmount, maxAmount, fee }))
            );
            toast.success(t('serviceDash.depositFees.toasts.saved'));
        } catch {
            toast.error(t('serviceDash.depositFees.toasts.saveFailed'));
        } finally {
            setDepositTiersSaving(false);
        }
    };

    const addDepositTier = () => {
        const last = depositTiers[depositTiers.length - 1];
        const newMin = last ? (last.maxAmount !== null ? last.maxAmount + 1 : 0) : 0;
        setDepositTiers([...depositTiers, { minAmount: newMin, maxAmount: null, fee: 0 }]);
    };

    const removeDepositTier = (idx: number) => setDepositTiers(depositTiers.filter((_, i) => i !== idx));

    const updateDepositTier = (idx: number, field: keyof FeeTier, value: number | null) => {
        setDepositTiers(depositTiers.map((t, i) => i === idx ? { ...t, [field]: value } : t));
    };

    const fetchZoneCashStats = useCallback(async (type: 'initial' | 'manual' | 'silent' = 'silent') => {
        if (!isFintech) return;
        if (type === 'manual') setZoneCashRefreshing(true);
        else if (type === 'initial') setZoneCashLoading(true);
        try {
            const [deposits, withdrawals, users, basket] = await Promise.allSettled([
                zonecashApi.getTotalDeposits({}),
                zonecashApi.getTotalWithdrawals({}),
                zonecashApi.getTotalUsers({}),
                zonecashApi.getGlobalChangeBasket(),
            ]);

            const basketData = basket.status === 'fulfilled' ? (basket.value ?? []) : [];
            const basketCount = basketData.length;
            const basketProfit = basketData.reduce((acc: number, r: any) => acc + Number(r.amount || 0), 0);

            setZoneCashStats({
                totalDeposits: deposits.status === 'fulfilled' ? (deposits.value?.total ?? 0) : 0,
                totalWithdrawals: withdrawals.status === 'fulfilled' ? (withdrawals.value?.total ?? 0) : 0,
                totalUsers: users.status === 'fulfilled' ? (users.value?.totalUsers ?? users.value?.total ?? 0) : 0,
                basketCount,
                basketProfit,
            });
            if (type === 'manual') toast.success(t('zonecashReport.toasts.refreshed') || 'ZoneCash mis à jour');
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
        if (!isFintech || isHqLoading) return;
        fetchFeeTiers();
        fetchDepositFeeTiers();
        fetchTransferFeeTiers();
    }, [isFintech, isHqLoading, fetchFeeTiers, fetchDepositFeeTiers, fetchTransferFeeTiers]);

    useEffect(() => {
        if (!isFintech || isHqLoading) return;

        fetchZoneCashStats('initial');

        const interval = setInterval(() => {
            fetchZoneCashStats('silent');
        }, 5000);

        return () => clearInterval(interval);
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
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg font-black text-black uppercase tracking-wider">
                                    {t('serviceDash.zonecash.title') || 'ZoneCash — Intégration'}
                                </h2>
                                <span className="flex h-2 w-2 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest animate-pulse">Live</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                                {t('serviceDash.zonecash.subtitle') || 'Dépôts & retraits clients ZoneCash'}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => fetchZoneCashStats('manual')}
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
                        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
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

                            {/* Transactions Basket */}
                            <Card className="bg-slate-50 border-slate-200 border-t-2 border-t-blue-500 transition-all hover:shadow-md">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-[10px] font-black text-black uppercase tracking-widest">
                                        Transactions Basket
                                    </CardTitle>
                                    <Activity className="h-4 w-4 text-blue-500 animate-pulse" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-black">{zonecashStats.basketCount.toLocaleString()}</div>
                                    <p className="text-[10px] text-blue-500 font-bold uppercase mt-1">
                                        Tranzaksyon nan basket
                                    </p>
                                </CardContent>
                            </Card>

                            {/* Bénéfice Basket */}
                            <Card className="bg-slate-50 border-slate-200 border-t-2 border-t-amber-500 transition-all hover:shadow-md">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-[10px] font-black text-black uppercase tracking-widest">
                                        Bénéfice Basket
                                    </CardTitle>
                                    <ShoppingBag className="h-4 w-4 text-amber-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-black">{zonecashStats.basketProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })} HTG</div>
                                    <p className="text-[10px] text-amber-500 font-bold uppercase mt-1">
                                        Benefis nan basket
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            )}

            {/* Withdrawal Fee Tiers — ZoneCash only */}
            {isFintech && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-black text-black uppercase tracking-wider flex items-center gap-2">
                                <Banknote className="h-5 w-5 text-orange-500" />
                                {t('serviceDash.withdrawalFees.title')}
                            </h2>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                                {t('serviceDash.withdrawalFees.subtitle')}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={addTier}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-black font-bold text-[10px] uppercase tracking-widest transition-colors border border-slate-200"
                            >
                                <Plus className="h-3 w-3" />
                                {t('serviceDash.withdrawalFees.addTier')}
                            </button>
                            <button
                                onClick={saveFeeTiers}
                                disabled={tiersSaving}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold text-[10px] uppercase tracking-widest transition-colors disabled:opacity-60"
                            >
                                {tiersSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                                {tiersSaving ? t('serviceDash.withdrawalFees.saving') : t('serviceDash.withdrawalFees.save')}
                            </button>
                        </div>
                    </div>

                    {tiersLoading ? (
                        <div className="flex h-[80px] items-center justify-center">
                            <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
                        </div>
                    ) : (
                        <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
                            {/* Table header */}
                            <div className="grid grid-cols-[1fr_1fr_1fr_40px] gap-3 px-4 py-2 bg-slate-50 border-b border-slate-200">
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{t('serviceDash.withdrawalFees.colMin')}</span>
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{t('serviceDash.withdrawalFees.colMax')}</span>
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{t('serviceDash.withdrawalFees.colFee')}</span>
                                <span></span>
                            </div>

                            {tiers.length === 0 && (
                                <div className="px-4 py-6 text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                    {t('serviceDash.withdrawalFees.empty')}
                                </div>
                            )}

                            {tiers.map((tier, idx) => (
                                <div key={idx} className="grid grid-cols-[1fr_1fr_1fr_40px] gap-3 px-4 py-3 border-b border-slate-100 last:border-0 items-center hover:bg-slate-50 transition-colors">
                                    <Input
                                        type="number"
                                        min={0}
                                        value={tier.minAmount}
                                        onChange={e => updateTier(idx, 'minAmount', parseFloat(e.target.value) || 0)}
                                        className="h-9 font-black text-sm bg-white border-slate-200 focus-visible:ring-orange-500/50"
                                        placeholder="0"
                                    />
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            min={0}
                                            value={tier.maxAmount ?? ''}
                                            onChange={e => updateTier(idx, 'maxAmount', e.target.value === '' ? null : parseFloat(e.target.value) || 0)}
                                            className="h-9 font-black text-sm bg-white border-slate-200 focus-visible:ring-orange-500/50 pr-16"
                                            placeholder="∞ (illimite)"
                                        />
                                        {tier.maxAmount === null && (
                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400 uppercase">∞</span>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            min={0}
                                            value={tier.fee}
                                            onChange={e => updateTier(idx, 'fee', parseFloat(e.target.value) || 0)}
                                            className="h-9 font-black text-sm bg-white border-slate-200 focus-visible:ring-orange-500/50 pr-12"
                                            placeholder="0.00"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400">HTG</span>
                                    </div>
                                    <button
                                        onClick={() => removeTier(idx)}
                                        className="flex items-center justify-center h-9 w-9 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}

                            {tiers.length > 0 && (
                                <div className="px-4 py-3 bg-orange-50 border-t border-orange-100">
                                    <p className="text-[10px] font-bold text-orange-700">
                                        💡 {t('serviceDash.withdrawalFees.hint')}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Deposit Fee Tiers — ZoneCash only */}
            {isFintech && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 mt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-black text-black uppercase tracking-wider flex items-center gap-2">
                                <Banknote className="h-5 w-5 text-emerald-500" />
                                {t('serviceDash.depositFees.title')}
                            </h2>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                                {t('serviceDash.depositFees.subtitle')}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={addDepositTier}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-black font-bold text-[10px] uppercase tracking-widest transition-colors border border-slate-200"
                            >
                                <Plus className="h-3 w-3" />
                                {t('serviceDash.depositFees.addTier')}
                            </button>
                            <button
                                onClick={saveDepositFeeTiers}
                                disabled={depositTiersSaving}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[10px] uppercase tracking-widest transition-colors disabled:opacity-60"
                            >
                                {depositTiersSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                                {depositTiersSaving ? t('serviceDash.depositFees.saving') : t('serviceDash.depositFees.save')}
                            </button>
                        </div>
                    </div>

                    {depositTiersLoading ? (
                        <div className="flex h-[80px] items-center justify-center">
                            <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
                        </div>
                    ) : (
                        <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
                            {/* Table header */}
                            <div className="grid grid-cols-[1fr_1fr_1fr_40px] gap-3 px-4 py-2 bg-slate-50 border-b border-slate-200">
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{t('serviceDash.depositFees.colMin')}</span>
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{t('serviceDash.depositFees.colMax')}</span>
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{t('serviceDash.depositFees.colFee')}</span>
                                <span></span>
                            </div>

                            {depositTiers.length === 0 && (
                                <div className="px-4 py-6 text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                    {t('serviceDash.depositFees.empty')}
                                </div>
                            )}

                            {depositTiers.map((tier, idx) => (
                                <div key={idx} className="grid grid-cols-[1fr_1fr_1fr_40px] gap-3 px-4 py-3 border-b border-slate-100 last:border-0 items-center hover:bg-slate-50 transition-colors">
                                    <Input
                                        type="number"
                                        min={0}
                                        value={tier.minAmount}
                                        onChange={e => updateDepositTier(idx, 'minAmount', parseFloat(e.target.value) || 0)}
                                        className="h-9 font-black text-sm bg-white border-slate-200 focus-visible:ring-emerald-500/50"
                                        placeholder="0"
                                    />
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            min={0}
                                            value={tier.maxAmount ?? ''}
                                            onChange={e => updateDepositTier(idx, 'maxAmount', e.target.value === '' ? null : parseFloat(e.target.value) || 0)}
                                            className="h-9 font-black text-sm bg-white border-slate-200 focus-visible:ring-emerald-500/50 pr-16"
                                            placeholder="∞ (illimite)"
                                        />
                                        {tier.maxAmount === null && (
                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400 uppercase">∞</span>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            min={0}
                                            value={tier.fee}
                                            onChange={e => updateDepositTier(idx, 'fee', parseFloat(e.target.value) || 0)}
                                            className="h-9 font-black text-sm bg-white border-slate-200 focus-visible:ring-emerald-500/50 pr-12"
                                            placeholder="0.00"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400">HTG</span>
                                    </div>
                                    <button
                                        onClick={() => removeDepositTier(idx)}
                                        className="flex items-center justify-center h-9 w-9 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}

                            {depositTiers.length > 0 && (
                                <div className="px-4 py-3 bg-emerald-50 border-t border-emerald-100">
                                    <p className="text-[10px] font-bold text-emerald-700">
                                        💡 {t('serviceDash.depositFees.hint')}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Transfer (P2P) Fee Tiers — ZoneCash only */}
            {isFintech && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 mt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-black text-black uppercase tracking-wider flex items-center gap-2">
                                <ArrowLeftRight className="h-5 w-5 text-blue-500" />
                                {t('serviceDash.transferFees.title')}
                            </h2>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                                {t('serviceDash.transferFees.subtitle')}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={addTransferTier}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-black font-bold text-[10px] uppercase tracking-widest transition-colors border border-slate-200"
                            >
                                <Plus className="h-3 w-3" />
                                {t('serviceDash.transferFees.addTier')}
                            </button>
                            <button
                                onClick={saveTransferFeeTiers}
                                disabled={transferTiersSaving}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-bold text-[10px] uppercase tracking-widest transition-colors disabled:opacity-60"
                            >
                                {transferTiersSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                                {transferTiersSaving ? t('serviceDash.transferFees.saving') : t('serviceDash.transferFees.save')}
                            </button>
                        </div>
                    </div>

                    {transferTiersLoading ? (
                        <div className="flex h-[80px] items-center justify-center">
                            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                        </div>
                    ) : (
                        <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
                            <div className="grid grid-cols-[1fr_1fr_1fr_40px] gap-3 px-4 py-2 bg-slate-50 border-b border-slate-200">
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{t('serviceDash.transferFees.colMin')}</span>
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{t('serviceDash.transferFees.colMax')}</span>
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{t('serviceDash.transferFees.colFee')}</span>
                                <span></span>
                            </div>

                            {transferTiers.length === 0 && (
                                <div className="px-4 py-6 text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                    {t('serviceDash.transferFees.empty')}
                                </div>
                            )}

                            {transferTiers.map((tier, idx) => (
                                <div key={idx} className="grid grid-cols-[1fr_1fr_1fr_40px] gap-3 px-4 py-3 border-b border-slate-100 last:border-0 items-center hover:bg-slate-50 transition-colors">
                                    <Input
                                        type="number"
                                        min={0}
                                        value={tier.minAmount}
                                        onChange={e => updateTransferTier(idx, 'minAmount', parseFloat(e.target.value) || 0)}
                                        className="h-9 font-black text-sm bg-white border-slate-200 focus-visible:ring-blue-500/50"
                                        placeholder="0"
                                    />
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            min={0}
                                            value={tier.maxAmount ?? ''}
                                            onChange={e => updateTransferTier(idx, 'maxAmount', e.target.value === '' ? null : parseFloat(e.target.value) || 0)}
                                            className="h-9 font-black text-sm bg-white border-slate-200 focus-visible:ring-blue-500/50 pr-16"
                                            placeholder="∞ (illimite)"
                                        />
                                        {tier.maxAmount === null && (
                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400 uppercase">∞</span>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            min={0}
                                            value={tier.fee}
                                            onChange={e => updateTransferTier(idx, 'fee', parseFloat(e.target.value) || 0)}
                                            className="h-9 font-black text-sm bg-white border-slate-200 focus-visible:ring-blue-500/50 pr-12"
                                            placeholder="0.00"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400">HTG</span>
                                    </div>
                                    <button
                                        onClick={() => removeTransferTier(idx)}
                                        className="flex items-center justify-center h-9 w-9 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}

                            {transferTiers.length > 0 && (
                                <div className="px-4 py-3 bg-blue-50 border-t border-blue-100">
                                    <p className="text-[10px] font-bold text-blue-700">
                                        💡 {t('serviceDash.transferFees.hint')}
                                    </p>
                                </div>
                            )}
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