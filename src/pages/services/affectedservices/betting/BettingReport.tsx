import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import {
    Timer,
    TrendingDown,
    Trophy,
    CircleDollarSign,
    Wallet,
    ArrowDownCircle,
    ArrowUpCircle,
    Users,
    Loader2,
    Calendar,
    RefreshCw
} from "lucide-react";
import bettingApi from "../../../../context/api/betting";
import { toast } from "sonner";
import { cn } from "../../../../lib/utils";

const BettingReport: React.FC = () => {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Date Filters
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    // Stats State
    const [stats, setStats] = useState({
        ongoingBets: 0,
        losingBets: 0,
        winningBets: 0,
        winningStakesSum: 0,
        stakesSum: 0,
        totalDeposits: 0,
        totalWithdrawals: 0,
        totalUsers: 0
    });

    const fetchStats = useCallback(async (isManual = false) => {
        if (isManual) setIsRefreshing(true);
        else setIsLoading(true);

        const query = {
            startDate: startDate || undefined,
            endDate: endDate || undefined
        };

        try {
            const [
                ongoing,
                losing,
                winning,
                aPayer,
                money,
                deposits,
                withdrawals,
                users
            ] = await Promise.allSettled([
                bettingApi.getOngoingBetsTotal(query),
                bettingApi.getLosingBetsTotal(query),
                bettingApi.getWinningBetsTotal(query),
                bettingApi.getWinningStakesSum(query),
                bettingApi.getStakesSum(query),
                bettingApi.getTotalDeposits(query),
                bettingApi.getTotalWithdrawals(query),
                bettingApi.getTotalUsers(query)
            ]);

            setStats({
                ongoingBets: ongoing.status === 'fulfilled' ? ongoing.value.totalOngoingBets : 0,
                losingBets: losing.status === 'fulfilled' ? losing.value.totalLoosingBets : 0,
                winningBets: winning.status === 'fulfilled' ? winning.value.totalWinningBets : 0,
                winningStakesSum: aPayer.status === 'fulfilled' ? aPayer.value.total : 0,
                stakesSum: money.status === 'fulfilled' ? money.value.total : 0,
                totalDeposits: deposits.status === 'fulfilled' ? deposits.value.total : 0,
                totalWithdrawals: withdrawals.status === 'fulfilled' ? withdrawals.value.total : 0,
                totalUsers: users.status === 'fulfilled' ? users.value.totalUsers : 0
            });

            if (isManual) toast.success(t('bettingReport.toasts.refreshed') || "Reports updated successfully");
        } catch (error) {
            console.error("Failed to fetch betting stats:", error);
            toast.error(t('bettingReport.errors.fetchFailed') || "Failed to load betting reports");
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [startDate, endDate, t]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        fetchStats();
    };

    const clearFilters = () => {
        setStartDate("");
        setEndDate("");
    };

    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-black tracking-tight text-black uppercase">
                        {t('bettingReport.title') || "Betting Reports"}
                    </h2>
                    <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">
                        {t('bettingReport.description') || "Real-time insights for your betting enterprise"}
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchStats(true)}
                        disabled={isRefreshing}
                        className="bg-slate-50 border-slate-200 text-black hover:bg-slate-100 font-bold uppercase text-[10px] tracking-widest"
                    >
                        <RefreshCw className={cn("mr-2 h-3 w-3", isRefreshing && "animate-spin")} />
                        {t('common.refresh') || "Refresh"}
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card className="bg-slate-50 border-slate-200 text-black backdrop-blur-sm shadow-sm">
                <CardHeader className="py-4 border-b border-slate-200/50">
                    <CardTitle className="text-[10px] font-black text-black uppercase tracking-widest flex items-center">
                        <Calendar className="mr-2 h-3 w-3 text-blue-500" />
                        {t('common.filters') || "Filters"}
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <form onSubmit={handleFilter} className="flex flex-col md:flex-row items-end gap-4">
                        <div className="grid w-full max-w-sm items-center gap-1.5">
                            <Label htmlFor="startDate" className="text-[10px] uppercase font-black text-black/70 tracking-widest">
                                {t('common.startDate') || "Start Date"}
                            </Label>
                            <Input
                                type="date"
                                id="startDate"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="bg-white border-slate-200 text-black text-xs h-9 focus:ring-blue-500"
                            />
                        </div>
                        <div className="grid w-full max-w-sm items-center gap-1.5">
                            <Label htmlFor="endDate" className="text-[10px] uppercase font-black text-black/70 tracking-widest">
                                {t('common.endDate') || "End Date"}
                            </Label>
                            <Input
                                type="date"
                                id="endDate"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="bg-white border-slate-200 text-black text-xs h-9 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[10px] tracking-widest h-9 px-6 transition-all shadow-md active:scale-95">
                                {t('common.apply') || "Apply"}
                            </Button>
                            <Button type="button" variant="outline" onClick={clearFilters} className="bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200 font-black uppercase text-[10px] tracking-widest h-9 transition-all">
                                {t('common.clear') || "Clear"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* 1. Total Stakes */}
                <Card className="bg-slate-50 border-slate-200 text-black backdrop-blur-sm border-t-2 border-t-blue-500 transition-all hover:shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-black text-black uppercase tracking-widest">
                            {t('bettingReport.stats.totalMoney') || "Total Money"}
                        </CardTitle>
                        <CircleDollarSign className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black">{stats.stakesSum.toLocaleString()} HTG</div>
                        <p className="text-[10px] text-blue-500 font-bold uppercase mt-1">
                            {t('bettingReport.stats.totalMoneyDesc') || "Total stamps/stakes sum"}
                        </p>
                    </CardContent>
                </Card>

                {/* 2. Total A Payer */}
                <Card className="bg-slate-50 border-slate-200 text-black backdrop-blur-sm border-t-2 border-t-orange-500 transition-all hover:shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-black text-black uppercase tracking-widest">
                            {t('bettingReport.stats.payoutsPending') || "Total A Payer"}
                        </CardTitle>
                        <Wallet className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black">{stats.winningStakesSum.toLocaleString()} HTG</div>
                        <p className="text-[10px] text-orange-500 font-bold uppercase mt-1">
                            {t('bettingReport.stats.payoutsPendingDesc') || "Total winning stakes sum"}
                        </p>
                    </CardContent>
                </Card>

                {/* 3. Deposits */}
                <Card className="bg-slate-50 border-slate-200 text-black backdrop-blur-sm border-t-2 border-t-emerald-500 transition-all hover:shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-black text-black uppercase tracking-widest">
                            {t('bettingReport.stats.deposits') || "Total Dépôts"}
                        </CardTitle>
                        <ArrowDownCircle className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black">{stats.totalDeposits.toLocaleString()} HTG</div>
                        <p className="text-[10px] text-emerald-500 font-bold uppercase mt-1">
                            {t('bettingReport.stats.depositsDesc') || "Player reloads sum"}
                        </p>
                    </CardContent>
                </Card>

                {/* 4. Withdrawals */}
                <Card className="bg-slate-50 border-slate-200 text-black backdrop-blur-sm border-t-2 border-t-red-500 transition-all hover:shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-black text-black uppercase tracking-widest">
                            {t('bettingReport.stats.withdrawals') || "Total Retraits"}
                        </CardTitle>
                        <ArrowUpCircle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black">{stats.totalWithdrawals.toLocaleString()} HTG</div>
                        <p className="text-[10px] text-red-500 font-bold uppercase mt-1">
                            {t('bettingReport.stats.withdrawalsDesc') || "Player withdrawals sum"}
                        </p>
                    </CardContent>
                </Card>

                {/* 5. Ongoing Bets */}
                <Card className="bg-slate-50 border-slate-200 text-black backdrop-blur-sm border-t-2 border-t-indigo-500 transition-all hover:shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-black text-black uppercase tracking-widest">
                            {t('bettingReport.stats.ongoing') || "Ongoing Bets"}
                        </CardTitle>
                        <Timer className="h-4 w-4 text-indigo-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black">{stats.ongoingBets}</div>
                        <p className="text-[10px] text-indigo-500 font-bold uppercase mt-1">
                            {t('bettingReport.stats.ongoingDesc') || "Currently active receipts"}
                        </p>
                    </CardContent>
                </Card>

                {/* 6. Winning Bets */}
                <Card className="bg-slate-50 border-slate-200 text-black backdrop-blur-sm border-t-2 border-t-yellow-500 transition-all hover:shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-black text-black uppercase tracking-widest">
                            {t('bettingReport.stats.winning') || "Winning Bets"}
                        </CardTitle>
                        <Trophy className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black">{stats.winningBets}</div>
                        <p className="text-[10px] text-yellow-500 font-bold uppercase mt-1">
                            {t('bettingReport.stats.winningDesc') || "Total won receipts"}
                        </p>
                    </CardContent>
                </Card>

                {/* 7. Losing Bets */}
                <Card className="bg-slate-50 border-slate-200 text-black backdrop-blur-sm border-t-2 border-t-zinc-400 transition-all hover:shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-black text-black uppercase tracking-widest">
                            {t('bettingReport.stats.losing') || "Losing Bets"}
                        </CardTitle>
                        <TrendingDown className="h-4 w-4 text-zinc-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black">{stats.losingBets}</div>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase mt-1">
                            {t('bettingReport.stats.losingDesc') || "Total lost receipts"}
                        </p>
                    </CardContent>
                </Card>

                {/* 8. Active Users */}
                <Card className="bg-slate-50 border-slate-200 text-black backdrop-blur-sm border-t-2 border-t-purple-500 transition-all hover:shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-[10px] font-black text-black uppercase tracking-widest">
                            {t('bettingReport.stats.users') || "Active Players"}
                        </CardTitle>
                        <Users className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black">{stats.totalUsers}</div>
                        <p className="text-[10px] text-purple-500 font-bold uppercase mt-1">
                            {t('bettingReport.stats.usersDesc') || "Players with activity"}
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default BettingReport;
