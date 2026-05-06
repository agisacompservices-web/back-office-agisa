import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import sellerApi, { Seller } from "../../../context/api/seller";
import transactionApi, { Transaction, TransactionType } from "../../../context/api/transaction";
import bettingApi from "../../../context/api/betting";
import felcashApi from "../../../context/api/felcash";
import usersApi from "../../../context/api/users";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../../../components/ui/table";
import {
    History,
    PlusCircle,
    Search,
    Wallet,
    TrendingUp,
    CheckCircle2,
    Filter,
    ArrowDownLeft,
    Loader2,
    CreditCard,
    Gamepad2
} from "lucide-react";
import { cn } from "../../../lib/utils";
import { useTranslation } from "react-i18next";

const SellerLocalTransaction: React.FC = () => {
    const { t } = useTranslation();
    const { enterpriseCode } = useParams<{ enterpriseCode: string }>();
    const [amount, setAmount] = useState("");
    const [searchUser, setSearchUser] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [seller, setSeller] = useState<Seller | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [enterpriseId, setEnterpriseId] = useState<string>("");

    // Betting Bridge specific state
    const [bettingPlayerId, setBettingPlayerId] = useState("");
    const [bettingPhone, setBettingPhone] = useState("");
    const [bettingAmount, setBettingAmount] = useState("");
    const [foundPlayer, setFoundPlayer] = useState<{ fullName: string; playerId: string } | null>(null);
    const [isLookingUp, setIsLookingUp] = useState(false);

    // Felcash Bridge specific state
    const [felcashAccountNumber, setFelcashAccountNumber] = useState("");
    const [felcashAmount, setFelcashAmount] = useState("");
    const [felcashCurrency, setFelcashCurrency] = useState<'HTG' | 'USD'>('HTG');
    const [felcashAccountInfo, setFelcashAccountInfo] = useState<{ accountNumber: string; balance: number; currency: string; ownerName: string } | null>(null);
    const [isFelcashLooking, setIsFelcashLooking] = useState(false);

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 10;

    const fetchTransactions = useCallback(async (pageToFetch = 1) => {
        if (!enterpriseId || !seller?.id) return;
        try {
            const txsRes = await transactionApi.getAll(enterpriseId, undefined, seller.id, pageToFetch, limit);
            setTransactions(txsRes.data || []);
            setTotalPages(txsRes.meta?.lastPage || 1);
            setPage(txsRes.meta?.page || pageToFetch);
        } catch (error) {
            console.error("Failed to fetch transactions:", error);
        }
    }, [enterpriseId, seller?.id]);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const user = await usersApi.getMe();
            const membership = user.memberships?.find(m => m.enterprise?.enterpriseCode === enterpriseCode);
            if (!membership || !membership.sellerId) {
                toast.error(t('sellerLocalTx.toasts.notAuthorized'));
                return;
            }
            const entId = membership.enterprise?.id;
            setEnterpriseId(entId || "");

            const sellerRes = await sellerApi.getById(membership.sellerId);
            setSeller(sellerRes);

            // Initial transaction fetch handled by effect when seller is set
        } catch (error) {
            toast.error(t('sellerLocalTx.toasts.fetchDataFailed'));
        } finally {
            setIsLoading(false);
        }
    }, [enterpriseCode, t]);

    useEffect(() => {
        if (seller?.id && enterpriseId) {
            fetchTransactions(1);
        }
    }, [seller?.id, enterpriseId, fetchTransactions]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleLookupPlayer = async () => {
        if (!seller?.isActive) {
            toast.error(t('sellerLocalTx.toasts.sellerSuspendedOps'));
            return;
        }

        if (!bettingPhone || bettingPhone.length < 8) {
            toast.error(t('sellerLocalTx.toasts.validPhone'));
            return;
        }

        setIsLookingUp(true);
        try {
            const player = await bettingApi.getPlayerByPhone(bettingPhone, enterpriseId);
            setFoundPlayer(player);
            setBettingPlayerId(player.playerId);
            toast.success(t('sellerLocalTx.toasts.playerFound') + player.fullName);
        } catch (error) {
            toast.error(t('sellerLocalTx.toasts.playerNotFound'));
            setFoundPlayer(null);
            setBettingPlayerId("");
        } finally {
            setIsLookingUp(false);
        }
    };

    const handleDeposit = async () => {
        if (!seller?.isActive) {
            toast.error(t('sellerLocalTx.toasts.sellerSuspendedTxs'));
            return;
        }

        if (!amount || Number(amount) <= 0) {
            toast.error(t('sellerLocalTx.toasts.validAmount'));
            return;
        }

        if (Number(amount) > (seller?.balance || 0)) {
            toast.error(`${t('sellerLocalTx.toasts.insufficientFunds')}${formatCurrency(seller?.balance || 0)}`);
            return;
        }

        setIsSubmitting(true);
        try {
            await transactionApi.create({
                type: TransactionType.WITHDRAWAL,
                amount: Number(amount),
                enterpriseId,
                sellerId: seller?.id,
                description: t('sellerLocalTx.descriptions.clientDeposit', { name: seller?.name, user: searchUser || t('sellerLocalTx.descriptions.generalUser') })
            });
            toast.success(t('sellerLocalTx.toasts.depositSuccess'));
            setAmount("");
            setSearchUser("");

            try {
                await fetchData();
            } catch (refreshError) {
                console.error("Refresh failed after success:", refreshError);
                toast.warning(t('sellerLocalTx.toasts.refreshFailed'));
            }
        } catch (error) {
            console.error("Deposit failure:", error);
            toast.error(t('sellerLocalTx.toasts.depositFailed'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleExternalBettingDeposit = async () => {
        if (!seller?.isActive) {
            toast.error(t('sellerLocalTx.toasts.sellerSuspendedBlocked'));
            return;
        }

        if (!bettingPlayerId || !bettingAmount || Number(bettingAmount) <= 0) {
            toast.error(t('sellerLocalTx.toasts.playerIdAmountRequired'));
            return;
        }

        if (Number(bettingAmount) > (seller?.balance || 0)) {
            toast.error(t('sellerLocalTx.toasts.insufficientBalanceBetting'));
            return;
        }

        setIsSubmitting(true);
        try {
            await bettingApi.deposit({
                playerId: bettingPlayerId,
                amount: Number(bettingAmount),
                enterpriseId,
                description: t('sellerLocalTx.descriptions.externalBettingDeposit', { name: foundPlayer?.fullName || bettingPlayerId })
            });
            toast.success(t('sellerLocalTx.toasts.bettingSyncSuccess'));
            setBettingAmount("");
            setBettingPlayerId("");
            setBettingPhone("");
            setFoundPlayer(null);

            try {
                await fetchData();
            } catch (refreshError) {
                console.error("Refresh failed after betting success:", refreshError);
                toast.warning(t('sellerLocalTx.toasts.bettingSyncRefreshFailed'));
            }
        } catch (error) {
            console.error("Betting deposit failure:", error);
            toast.error(t('sellerLocalTx.toasts.bettingSyncFailed'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatAccountNumber = (raw: string) => {
        const digits = raw.replace(/\D/g, '').slice(0, 9);
        if (digits.length <= 3) return digits;
        if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
        return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
    };

    const handleFelcashLookup = async () => {
        if (!felcashAccountNumber.trim()) return;
        setIsFelcashLooking(true);
        setFelcashAccountInfo(null);
        try {
            const data = await felcashApi.lookupAccount(felcashAccountNumber.trim());
            const ownerName = [
                data.owner?.firstName ?? data.user?.firstName,
                data.owner?.lastName ?? data.user?.lastName,
            ].filter(Boolean).join(' ') || data.owner?.email || data.user?.email || '—';
            setFelcashAccountInfo({ accountNumber: data.accountNumber, balance: data.balance ?? 0, currency: data.currency, ownerName });
            toast.success(t('sellerLocalTx.toasts.playerFound') + ownerName);
        } catch {
            toast.error(t('sellerLocalTx.toasts.playerNotFound'));
        } finally {
            setIsFelcashLooking(false);
        }
    };

    const handleFelcashDeposit = async () => {
        if (!seller?.isActive) { toast.error(t('sellerLocalTx.toasts.sellerSuspendedBlocked')); return; }
        if (!felcashAccountInfo || !felcashAmount || Number(felcashAmount) <= 0) {
            toast.error(t('sellerLocalTx.toasts.playerIdAmountRequired'));
            return;
        }
        if (Number(felcashAmount) > (seller?.balance || 0)) {
            toast.error(t('sellerLocalTx.toasts.insufficientBalanceBetting'));
            return;
        }
        setIsSubmitting(true);
        try {
            await felcashApi.initiateDeposit({
                accountNumber: felcashAccountInfo.accountNumber,
                amount: Number(felcashAmount),
                currency: felcashCurrency,
                enterpriseId,
            });
            toast.success(t('sellerLocalTx.toasts.bettingSyncSuccess'));
            setFelcashAmount('');
            setFelcashAccountNumber('');
            setFelcashAccountInfo(null);
            try { await fetchData(); } catch { /* ignore */ }
        } catch (error: any) {
            toast.error(error?.response?.data?.message || t('sellerLocalTx.toasts.bettingSyncFailed'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleWithdrawCommission = async () => {
        if (!seller?.isActive) {
            toast.error(t('sellerLocalTx.toasts.sellerSuspendedTxs'));
            return;
        }

        const currentCommission = Number(seller?.commission || 0);

        if (currentCommission <= 0) {
            toast.error(t('sellerLocalTx.toasts.noCommissionToWithdraw'));
            return;
        }

        setIsSubmitting(true);
        try {
            await transactionApi.create({
                type: TransactionType.WITHDRAW_COMMISSION,
                amount: currentCommission,
                enterpriseId,
                sellerId: seller?.id,
                description: t('sellerLocalTx.descriptions.withdrawCommission')
            });
            toast.success(t('sellerLocalTx.toasts.withdrawCommSuccess'));

            try {
                await fetchData();
                fetchTransactions(1);
            } catch (refreshError) {
                console.error("Refresh failed after commission withdrawal:", refreshError);
            }
        } catch (error: any) {
            console.error("Commission withdrawal failure:", error);
            const msg = error.response?.data?.message || t('sellerLocalTx.toasts.withdrawCommFailed');
            toast.error(Array.isArray(msg) ? msg[0] : msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'HTG' }).format(val);
    };

    const todayStr = new Date().toISOString().split('T')[0];
    const todaySales = transactions
        .filter(tx => (tx.type === TransactionType.WITHDRAWAL || tx.type === TransactionType.EXTERNAL_DEPOSIT) && tx.createdAt.startsWith(todayStr))
        .reduce((acc, tx) => acc + Number(tx.amount), 0);

    const commissionRate = seller?.commission || 0;


    const isBettingEnterprise = seller?.enterprise?.category?.name?.toLowerCase() === 'betting';
    const isFintechEnterprise = seller?.enterprise?.category?.name?.toLowerCase() === 'fintech';

    if (isLoading && !seller) {
        return (
            <div className="h-[60vh] flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tighter text-black uppercase flex flex-wrap items-center gap-2 sm:gap-3">
                        <ArrowDownLeft className="h-6 w-6 sm:h-8 sm:w-8 text-emerald-500 shrink-0" />
                        {t('sellerLocalTx.header.title')}
                    </h1>
                    <p className="text-zinc-500 uppercase text-[10px] font-black tracking-[0.2em] mt-1">
                        {t('sellerLocalTx.header.subtitle')}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                        <div className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">{seller?.name}</div>
                        <div className="text-[8px] font-bold text-emerald-500 uppercase tracking-tighter">{seller?.code}</div>
                    </div>
                    <Badge variant="outline" className={cn(
                        "w-fit text-[10px] font-black uppercase tracking-widest px-3 py-1 whitespace-nowrap rounded-md",
                        seller?.isActive
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                            : "bg-red-500/10 text-red-500 border-red-500/20"
                    )}>
                        {seller?.isActive ? t('sellerLocalTx.header.pointActive') : t('sellerLocalTx.header.pointSuspended')}
                    </Badge>
                </div>
            </div>

            {!seller?.isActive && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-4 animate-pulse">
                    <div className="h-10 w-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                        <ArrowDownLeft className="h-5 w-5 text-red-500" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-red-400 uppercase tracking-widest leading-none">{t('sellerLocalTx.header.pointSuspendedTitle')}</h3>
                        <p className="text-[11px] text-red-500/70 font-bold mt-1">
                            {t('sellerLocalTx.header.pointSuspendedDesc')}
                        </p>
                    </div>
                </div>
            )}

            {/* Local Stats Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <Card className="bg-slate-50 border-slate-200 backdrop-blur-md relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Wallet className="h-16 w-16 sm:h-20 sm:w-20 text-black" />
                    </div>
                    <CardHeader className="pb-2 space-y-0">
                        <CardDescription className="text-[9px] uppercase font-black text-zinc-500 tracking-[0.15em]">{t('sellerLocalTx.stats.myBalance')}</CardDescription>
                        <CardTitle className="text-xl sm:text-2xl font-black text-black">{formatCurrency(Number(seller?.balance || 0))}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-[10px] text-emerald-400 font-bold uppercase tracking-widest">
                            {t('sellerLocalTx.stats.operatingCapital')}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-50 border-slate-200 backdrop-blur-md relative overflow-hidden group" style={{ borderLeft: '3px solid #f97316' }}>
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingUp className="h-16 w-16 sm:h-20 sm:w-20 text-black" />
                    </div>
                    <CardHeader className="pb-2 space-y-0">
                        <CardDescription className="text-[9px] uppercase font-black text-zinc-500 tracking-[0.15em]">{t('sellerLocalTx.stats.withdrawalBalance')}</CardDescription>
                        <CardTitle className="text-xl sm:text-2xl font-black text-orange-400">{formatCurrency(Number(seller?.withdrawalBalance || 0))}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-[10px] text-orange-400 font-bold uppercase tracking-widest">
                            {t('sellerLocalTx.stats.playerPayoutsHistory')}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-50 border-slate-200 backdrop-blur-md relative overflow-hidden group" style={{ borderLeft: '3px solid #f87171' }}>
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingUp className="h-16 w-16 sm:h-20 sm:w-20 text-black" />
                    </div>
                    <CardHeader className="pb-2 space-y-0">
                        <CardDescription className="text-[9px] uppercase font-black text-zinc-500 tracking-[0.15em]">{t('sellerLocalTx.stats.todaysSales')}</CardDescription>
                        <CardTitle className="text-xl sm:text-2xl font-black text-rose-400">{formatCurrency(todaySales)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-[10px] text-blue-400 font-bold uppercase tracking-widest">
                            {transactions.filter(tx => tx.createdAt.startsWith(todayStr)).length} {t('sellerLocalTx.stats.operations')}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-50 border-slate-200 backdrop-blur-md relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <CheckCircle2 className="h-16 w-16 sm:h-20 sm:w-20 text-black" />
                    </div>
                    <CardHeader className="pb-2 space-y-0">
                        <CardDescription className="text-[9px] uppercase font-black text-zinc-500 tracking-[0.15em]">{t('sellerLocalTx.stats.totalCommission')}</CardDescription>
                        <CardTitle className="text-xl sm:text-2xl font-black text-black">{formatCurrency(commissionRate)}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3">
                        <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                            {t('sellerLocalTx.stats.accumulatedCommission')}
                        </div>
                        <Button
                            variant="default"
                            size="sm"
                            className="w-full text-[10px] font-black uppercase tracking-widest bg-black text-white hover:bg-zinc-800 transition-colors"
                            onClick={handleWithdrawCommission}
                            disabled={isSubmitting || commissionRate <= 0 || !seller?.isActive}
                        >
                            {isSubmitting ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : null}
                            {t('sellerLocalTx.stats.withdrawCommissionBtn')}
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* Deposit Forms Column */}
                <div className="space-y-8">
                    {/* Standard Deposit - Hidden for Betting and Fintech */}
                    {!isBettingEnterprise && !isFintechEnterprise && (
                        <Card className="bg-slate-50 border-slate-200 backdrop-blur-xl h-fit border-t-2 border-t-emerald-500">
                            <CardHeader className="border-b border-white/5">
                                <CardTitle className="text-sm font-black text-black uppercase tracking-widest flex items-center gap-2">
                                    <PlusCircle className="h-4 w-4 text-emerald-500" />
                                    {t('sellerLocalTx.forms.standardDeposit.title')}
                                </CardTitle>
                                <CardDescription className="text-[10px] font-bold text-zinc-500">
                                    {t('sellerLocalTx.forms.standardDeposit.description')}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">{t('sellerLocalTx.forms.standardDeposit.clientRef')}</Label>
                                        <Input
                                            className="bg-slate-50 border-slate-200 text-black h-11 focus:border-emerald-500/50 transition-all font-medium"
                                            placeholder={t('sellerLocalTx.forms.standardDeposit.referencePlaceholder')}
                                            value={searchUser}
                                            onChange={(e) => setSearchUser(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">{t('sellerLocalTx.forms.standardDeposit.amountHtg')}</Label>
                                        <Input
                                            type="number"
                                            className="bg-slate-50 border-slate-200 text-black h-11 focus:border-emerald-500/50 transition-all font-black text-lg"
                                            placeholder={t('sellerLocalTx.forms.standardDeposit.amountPlaceholder')}
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <Button
                                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-black h-11 font-black uppercase tracking-widest transition-all"
                                    onClick={handleDeposit}
                                    disabled={isSubmitting || !seller?.isActive || !amount}
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : !seller?.isActive ? (
                                        t('sellerLocalTx.forms.standardDeposit.pointLocked')
                                    ) : (
                                        t('sellerLocalTx.forms.standardDeposit.confirmButton')
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {/* Felcash Deposit Form - Only if Fintech */}
                    {isFintechEnterprise && (
                        <Card className="bg-emerald-600/5 border-emerald-500/20 backdrop-blur-xl border-t-2 border-t-emerald-500">
                            <CardHeader className="border-b border-emerald-500/10">
                                <CardTitle className="text-sm font-black text-black uppercase tracking-widest flex items-center gap-2">
                                    <CreditCard className="h-4 w-4 text-emerald-500" />
                                    {t('sellerLocalTx.forms.felcashDeposit.title') || 'Dépôt Felcash'}
                                </CardTitle>
                                <CardDescription className="text-[10px] font-bold text-zinc-500">
                                    {t('sellerLocalTx.forms.felcashDeposit.description') || 'Créditer un compte client Felcash'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4">
                                <div className="flex gap-2">
                                    <Input
                                        className="bg-white border-slate-200 text-black h-11 font-bold uppercase tracking-widest focus:border-emerald-500/50"
                                        placeholder={t('sellerLocalTx.forms.felcashDeposit.accountPlaceholder') || 'Numéro de compte (ex: 123-45-6789)'}
                                        value={felcashAccountNumber}
                                        onChange={(e) => setFelcashAccountNumber(formatAccountNumber(e.target.value))}
                                        maxLength={11}
                                    />
                                    <Button
                                        variant="outline"
                                        className="h-11 px-3 border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-600"
                                        onClick={handleFelcashLookup}
                                        disabled={isFelcashLooking || !felcashAccountNumber}
                                    >
                                        {isFelcashLooking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                    </Button>
                                </div>

                                {felcashAccountInfo && (
                                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 flex items-center justify-between animate-in fade-in zoom-in duration-300">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-black text-black uppercase">{felcashAccountInfo.ownerName}</div>
                                                <div className="text-[8px] font-mono text-zinc-500 uppercase tracking-tighter">
                                                    {felcashAccountInfo.accountNumber} — {felcashAccountInfo.balance.toLocaleString()} {felcashAccountInfo.currency}
                                                </div>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="text-[8px] font-black bg-emerald-500/10 text-emerald-600 border-none">
                                            {t('sellerLocalTx.forms.bettingDeposit.verified') || 'Vérifié'}
                                        </Badge>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-3">
                                    <Input
                                        type="number"
                                        className="bg-white border-slate-200 text-black h-11 font-black text-lg focus:border-emerald-500/50"
                                        placeholder="0.00"
                                        value={felcashAmount}
                                        onChange={(e) => setFelcashAmount(e.target.value)}
                                    />
                                    <select
                                        className="h-11 rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-black focus:outline-none focus:border-emerald-500/50"
                                        value={felcashCurrency}
                                        onChange={(e) => setFelcashCurrency(e.target.value as 'HTG' | 'USD')}
                                    >
                                        <option value="HTG">HTG</option>
                                        <option value="USD">USD</option>
                                    </select>
                                </div>

                                <Button
                                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-black h-11 font-black uppercase tracking-widest transition-all"
                                    onClick={handleFelcashDeposit}
                                    disabled={isSubmitting || !seller?.isActive || !felcashAmount || !felcashAccountInfo}
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : !seller?.isActive ? (
                                        t('sellerLocalTx.forms.standardDeposit.pointLocked')
                                    ) : (
                                        t('sellerLocalTx.forms.felcashDeposit.confirmButton') || 'Confirmer le Dépôt'
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {/* Betting Deposit Form - Only if Betting */}
                    {isBettingEnterprise && (
                        <Card className="bg-[#1e1b4b]/40 border-indigo-500/20 backdrop-blur-xl border-t-2 border-t-indigo-500">
                            <CardHeader className="border-b border-white/5">
                                <CardTitle className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                                    <Gamepad2 className="h-4 w-4 text-white" />
                                    {t('sellerLocalTx.forms.bettingDeposit.title')}
                                </CardTitle>
                                <CardDescription className="text-[10px] font-bold text-white/70">
                                    {t('sellerLocalTx.forms.bettingDeposit.description')}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase font-black text-white/90 tracking-widest">{t('sellerLocalTx.forms.bettingDeposit.playerPhone')}</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                className="bg-white/10 placeholder:text-white/50 border-white/20 text-white h-11 focus:border-white transition-all font-medium"
                                                placeholder={t('sellerLocalTx.forms.bettingDeposit.phonePlaceholder')}
                                                value={bettingPhone}
                                                onChange={(e) => setBettingPhone(e.target.value)}
                                            />
                                            <Button
                                                variant="outline"
                                                className="h-11 px-3 border-white/20 hover:bg-white/10 text-white"
                                                onClick={handleLookupPlayer}
                                                disabled={isLookingUp || !bettingPhone}
                                            >
                                                {isLookingUp ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase font-black text-white/90 tracking-widest">{t('sellerLocalTx.forms.standardDeposit.amountHtg')}</Label>
                                        <Input
                                            type="number"
                                            className="bg-white/10 border-white/20 text-white placeholder:text-white/50 h-11 focus:border-white transition-all font-black text-lg"
                                            placeholder={t('sellerLocalTx.forms.standardDeposit.amountPlaceholder')}
                                            value={bettingAmount}
                                            onChange={(e) => setBettingAmount(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {foundPlayer && (
                                    <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-3 flex items-center justify-between animate-in fade-in zoom-in duration-300">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center">
                                                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-black text-white uppercase">{foundPlayer.fullName}</div>
                                                <div className="text-[8px] font-mono text-white/50 uppercase tracking-tighter">ID: {foundPlayer.playerId}</div>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="text-[8px] font-black bg-emerald-500/20 text-emerald-400 border-none">{t('sellerLocalTx.forms.bettingDeposit.verified')}</Badge>
                                    </div>
                                )}

                                <Button
                                    className="w-full bg-white text-indigo-600 hover:bg-slate-200 h-11 font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                                    onClick={handleExternalBettingDeposit}
                                    disabled={isSubmitting || !seller?.isActive || !bettingAmount || !bettingPlayerId}
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : !seller?.isActive ? (
                                        t('sellerLocalTx.forms.standardDeposit.pointLocked')
                                    ) : (
                                        t('sellerLocalTx.forms.bettingDeposit.syncButton')
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right Column: {t('sellerLocalTx.activityLog.title')} */}
                <div className="h-full">
                    <Card className="bg-slate-50 border-slate-200 backdrop-blur-xl h-full flex flex-col">
                        <CardHeader className="border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
                            <CardTitle className="text-sm font-black text-black uppercase tracking-widest flex items-center gap-2">
                                <History className="h-4 w-4 text-zinc-500" />
                                {t('sellerLocalTx.activityLog.title')}
                            </CardTitle>
                            <div className="flex items-center gap-3">
                                <Button variant="outline" size="sm" className="h-7 border-slate-200 bg-slate-50 text-[10px] font-black uppercase tracking-widest px-2" onClick={() => fetchTransactions(1)}>
                                    <Filter className="h-3 w-3 mr-1" />
                                    Sync
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 flex-1 flex flex-col min-h-0">
                            <div className="flex-1 overflow-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-white/5 hover:bg-transparent">
                                            <TableHead className="text-[9px] uppercase font-black text-zinc-500 tracking-widest">{t('sellerLocalTx.activityLog.type')}</TableHead>
                                            <TableHead className="text-[9px] uppercase font-black text-zinc-500 tracking-widest text-right">{t('sellerLocalTx.activityLog.amount')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {transactions.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={2} className="h-32 text-center text-zinc-500 text-[10px] font-black uppercase tracking-widest">
                                                    {t('sellerLocalTx.activityLog.noHistory')}
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            transactions.map((tx) => (
                                                <TableRow key={tx.id} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-7 w-7 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                                                                <CreditCard className={cn(
                                                                    "h-3 w-3",
                                                                    [TransactionType.DEPOSIT, TransactionType.EXTERNAL_WITHDRAWAL].includes(tx.type) ? "text-emerald-500" : "text-blue-500"
                                                                )} />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="text-[10px] font-black text-black leading-tight truncate">
                                                                    {tx.type === TransactionType.EXTERNAL_DEPOSIT ? t('sellerLocalTx.activityLog.refill') :
                                                                        tx.type === TransactionType.EXTERNAL_WITHDRAWAL ? t('sellerLocalTx.activityLog.payout') :
                                                                            tx.type === TransactionType.WITHDRAW_COMMISSION ? t('sellerLocalTx.activityLog.commWithdrawal') :
                                                                                tx.type === TransactionType.DEPOSIT ? t('sellerLocalTx.activityLog.capital') : t('sellerLocalTx.activityLog.deposit')}
                                                                </div>
                                                                <div className="text-[7px] font-black uppercase text-zinc-500 tracking-tighter truncate">
                                                                    {tx.description}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className={cn(
                                                            "text-[10px] font-black font-mono tracking-tighter",
                                                            [TransactionType.DEPOSIT, TransactionType.EXTERNAL_WITHDRAWAL].includes(tx.type) ? "text-emerald-400" : "text-rose-400"
                                                        )}>
                                                            {[TransactionType.DEPOSIT, TransactionType.EXTERNAL_WITHDRAWAL].includes(tx.type) ? "+" : "-"}{formatCurrency(Number(tx.amount))}
                                                        </div>
                                                        <div className="text-[7px] font-medium text-zinc-600 truncate">{new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Simple Pagination Controls */}
                            <div className="p-2 border-t border-white/5 flex items-center justify-between shrink-0">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    disabled={page <= 1 || isLoading}
                                    onClick={() => fetchTransactions(page - 1)}
                                    className="h-6 w-6 p-0 hover:bg-slate-100"
                                >
                                    <ArrowDownLeft className="h-3 w-3 rotate-90 text-zinc-500" />
                                </Button>
                                <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">
                                    {t('sellerLocalTx.activityLog.page', { page, totalPages })}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    disabled={page >= totalPages || isLoading}
                                    onClick={() => fetchTransactions(page + 1)}
                                    className="h-6 w-6 p-0 hover:bg-slate-100"
                                >
                                    <ArrowDownLeft className="h-3 w-3 -rotate-90 text-zinc-500" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default SellerLocalTransaction;