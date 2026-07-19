import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import sellerApi, { Seller } from "../../../context/api/seller";
import transactionApi, { Transaction, TransactionType } from "../../../context/api/transaction";
import bettingApi from "../../../context/api/betting";
import zonecashApi from "../../../context/api/zonecash";
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
    const [submittingAction, setSubmittingAction] = useState<'deposit' | 'commission' | 'betting' | null>(null);
    const [seller, setSeller] = useState<Seller | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [enterpriseId, setEnterpriseId] = useState<string>("");

    // Betting Bridge specific state
    const [bettingPlayerId, setBettingPlayerId] = useState("");
    const [bettingPhone, setBettingPhone] = useState("");
    const [bettingAmount, setBettingAmount] = useState("");
    const [foundPlayer, setFoundPlayer] = useState<{ fullName: string; playerId: string } | null>(null);
    const [isLookingUp, setIsLookingUp] = useState(false);

    // ZoneCash Bridge specific state
    const [zonecashAccountNumber, setZoneCashAccountNumber] = useState("");
    const [zonecashAmount, setZoneCashAmount] = useState("");
    const [zonecashCurrency, setZoneCashCurrency] = useState<'HTG' | 'USD'>('HTG');
    const [zonecashAccountInfo, setZoneCashAccountInfo] = useState<{ accountNumber: string; balance: number; currency: string; ownerName: string } | null>(null);
    const [isZoneCashLooking, setIsZoneCashLooking] = useState(false);
    const [isRemote, setIsRemote] = useState<boolean>(false);
    const [otpCode, setOtpCode] = useState("");
    const [isRequestingOtp, setIsRequestingOtp] = useState(false);
    const [otpRequested, setOtpRequested] = useState(false);
    const [otpTimer, setOtpTimer] = useState(0);
    const [otpRequestCount, setOtpRequestCount] = useState(0); // inkremente chak voye/reenvwa

    // Relanse timer chak fwa yon nouvo OTP voye
    useEffect(() => {
        if (!otpRequested || otpRequestCount === 0) return;
        setOtpTimer(120);
        const interval = setInterval(() => {
            setOtpTimer(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [otpRequested, otpRequestCount]);

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

        setSubmittingAction('deposit');
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
            setSubmittingAction(null);
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

        setSubmittingAction('betting');
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
            setSubmittingAction(null);
        }
    };

    const formatAccountNumber = (raw: string) => {
        const digits = raw.replace(/\D/g, '').slice(0, 9);
        if (digits.length <= 3) return digits;
        if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
        return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
    };

    const handleZoneCashLookup = async () => {
        if (!zonecashAccountNumber.trim()) return;
        setIsZoneCashLooking(true);
        setZoneCashAccountInfo(null);
        try {
            const data = await zonecashApi.lookupAccount(zonecashAccountNumber.trim());
            console.log("LOOKUP DATA:", data);
            const ownerName = data.ownerName || [
                data.owner?.firstName ?? data.user?.firstName,
                data.owner?.lastName ?? data.user?.lastName,
            ].filter(Boolean).join(' ') || data.owner?.email || data.user?.email || 'UNKNOWN_NAME';
            setZoneCashAccountInfo({ accountNumber: data.accountNumber, balance: data.balance ?? 0, currency: data.currency, ownerName });
            toast.success(t('sellerLocalTx.toasts.clientFound') + ownerName);
        } catch {
            toast.error(t('sellerLocalTx.toasts.clientNotFound'));
        } finally {
            setIsZoneCashLooking(false);
        }
    };

    const handleCancelZoneCash = async () => {
        // Si nou te deja voye OTP, nou rele backend la pou anile PENDING tx la
        if (otpRequested && zonecashAccountInfo && zonecashAmount) {
            try {
                await zonecashApi.cancelDepositOtp({
                    accountNumber: zonecashAccountInfo.accountNumber,
                    amount: Number(zonecashAmount),
                    sellerCode: seller?.code
                });
                toast.info(t('sellerLocalTx.toasts.depositCancelled') || 'Dépôt annulé.');
            } catch (err) {
                console.error("Failed to cancel deposit on backend:", err);
            }
        }

        setZoneCashAccountNumber('');
        setZoneCashAmount('');
        setZoneCashAccountInfo(null);
        setIsRemote(false);
        setOtpCode('');
        setOtpRequested(false);
        setIsRequestingOtp(false);
        setOtpTimer(0);
        setOtpRequestCount(0);
    };

    const handleRequestOtp = async () => {
        if (!zonecashAccountInfo || !zonecashAmount || Number(zonecashAmount) <= 0) {
            toast.error(t('sellerLocalTx.toasts.playerIdAmountRequired') || 'Veuillez entrer le montant et vérifier le compte.');
            return;
        }
        setIsRequestingOtp(true);
        try {
            await zonecashApi.requestDepositOtp({
                accountNumber: zonecashAccountInfo.accountNumber,
                amount: Number(zonecashAmount),
                currency: zonecashAccountInfo.currency,
                sellerCode: seller?.code
            });
            toast.success(t('sellerLocalTx.toasts.otpSent'));
            setOtpRequested(true);
            setOtpRequestCount(c => c + 1); // relanse timer
        } catch (error: any) {
            toast.error(error?.response?.data?.message || t('sellerLocalTx.toasts.otpFailed'));
        } finally {
            setIsRequestingOtp(false);
        }
    };

    const handleZoneCashDeposit = async () => {
        if (!seller?.isActive) { toast.error(t('sellerLocalTx.toasts.sellerSuspendedBlocked')); return; }
        if (!zonecashAccountInfo || !zonecashAmount || Number(zonecashAmount) <= 0) {
            toast.error(t('sellerLocalTx.toasts.playerIdAmountRequired'));
            return;
        }
        if (Number(zonecashAmount) > (seller?.balance || 0)) {
            toast.error(t('sellerLocalTx.toasts.insufficientBalanceBetting'));
            return;
        }
        setSubmittingAction('deposit');
        try {
            await zonecashApi.initiateDeposit({
                accountNumber: zonecashAccountInfo.accountNumber,
                amount: Number(zonecashAmount),
                currency: zonecashCurrency,
                enterpriseId,
                isRemote,
                otpCode: isRemote ? undefined : otpCode,
            });
            toast.success(t('sellerLocalTx.toasts.depositSuccess') || 'Dépôt réussi.');
            setZoneCashAmount('');
            setZoneCashAccountNumber('');
            setZoneCashAccountInfo(null);
            setOtpCode('');
            setOtpRequested(false);
            try { await fetchData(); } catch { /* ignore */ }
        } catch (error: any) {
            toast.error(error?.response?.data?.message || t('sellerLocalTx.toasts.depositFailed'));
        } finally {
            setSubmittingAction(null);
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

        setSubmittingAction('commission');
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
            setSubmittingAction(null);
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

    const entCategory = seller?.enterprise?.category?.name?.toLowerCase() || '';
    const entName = seller?.enterprise?.name?.toLowerCase() || '';
    const isBettingEnterprise = entCategory === 'betting' || entName.includes('paryaj');
    const isFintechEnterprise = entCategory === 'fintech' || entName.includes('zone cash');
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
                            disabled={submittingAction === 'commission' || commissionRate <= 0 || !seller?.isActive}
                        >
                            {submittingAction === 'commission' ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : null}
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
                                    disabled={submittingAction === 'deposit' || !seller?.isActive || !amount}
                                >
                                    {submittingAction === 'deposit' ? (
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

                    {/* ZoneCash Deposit Form - Only if Fintech */}
                    {isFintechEnterprise && (
                        <Card className="bg-emerald-600/5 border-emerald-500/20 backdrop-blur-xl border-t-2 border-t-emerald-500">
                            <CardHeader className="border-b border-emerald-500/10">
                                <CardTitle className="text-sm font-black text-black uppercase tracking-widest flex items-center gap-2">
                                    <CreditCard className="h-4 w-4 text-emerald-500" />
                                    {t('sellerLocalTx.forms.zonecashDeposit.title') || 'Dépôt ZoneCash'}
                                </CardTitle>
                                <CardDescription className="text-[10px] font-bold text-zinc-500">
                                    {t('sellerLocalTx.forms.zonecashDeposit.description') || 'Créditer un compte client ZoneCash'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4">
                                <div className="flex gap-2">
                                    <Input
                                        className="bg-white border-slate-200 text-black h-11 font-bold uppercase tracking-widest focus:border-emerald-500/50"
                                        placeholder={t('sellerLocalTx.forms.zonecashDeposit.accountPlaceholder') || 'Numéro de compte (ex: 123-45-6789)'}
                                        value={zonecashAccountNumber}
                                        onChange={(e) => setZoneCashAccountNumber(formatAccountNumber(e.target.value))}
                                        maxLength={11}
                                    />
                                    <Button
                                        variant="outline"
                                        className="h-11 px-3 border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-600"
                                        onClick={handleZoneCashLookup}
                                        disabled={isZoneCashLooking || !zonecashAccountNumber}
                                    >
                                        {isZoneCashLooking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                    </Button>
                                </div>

                                {zonecashAccountInfo && (
                                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 flex items-center justify-between animate-in fade-in zoom-in duration-300">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-black text-black uppercase">{zonecashAccountInfo.ownerName}</div>
                                                <div className="text-[8px] font-mono text-zinc-500 uppercase tracking-tighter">
                                                    {zonecashAccountInfo.accountNumber} — {zonecashAccountInfo.balance.toLocaleString()} {zonecashAccountInfo.currency}
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
                                        value={zonecashAmount}
                                        onChange={(e) => setZoneCashAmount(e.target.value)}
                                    />
                                    <select
                                        className="h-11 rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-black focus:outline-none focus:border-emerald-500/50"
                                        value={zonecashCurrency}
                                        onChange={(e) => setZoneCashCurrency(e.target.value as 'HTG' | 'USD')}
                                    >
                                        <option value="HTG">HTG</option>
                                        <option value="USD">USD</option>
                                    </select>
                                </div>

                                <div className="space-y-3 pt-2">
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            id="remoteDeposit"
                                            checked={isRemote}
                                            onChange={(e) => {
                                                setIsRemote(e.target.checked);
                                                if (e.target.checked) {
                                                    setOtpRequested(false);
                                                    setOtpCode("");
                                                }
                                            }}
                                            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                        />
                                        <label
                                            htmlFor="remoteDeposit"
                                            className="text-xs font-bold text-slate-700 uppercase tracking-wider"
                                        >
                                            {t('sellerLocalTx.forms.zonecashDeposit.remoteLabel')}
                                        </label>
                                    </div>
                                    
                                    {isRemote ? (
                                        <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg flex items-start gap-2">
                                            <Badge className="bg-amber-500 text-white border-none mt-0.5">{t('sellerLocalTx.forms.zonecashDeposit.noteBadge')}</Badge>
                                            <p className="text-xs text-amber-700 font-medium">
                                                {t('sellerLocalTx.forms.zonecashDeposit.remoteNote')}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {!otpRequested ? (
                                                <Button
                                                    variant="outline"
                                                    className="w-full border-emerald-500/30 text-emerald-600 font-bold text-xs h-10 hover:bg-emerald-500/10"
                                                    onClick={handleRequestOtp}
                                                    disabled={isRequestingOtp || !zonecashAmount || !zonecashAccountInfo}
                                                >
                                                    {isRequestingOtp ? (
                                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                    ) : null}
                                                    {t('sellerLocalTx.forms.zonecashDeposit.sendOtp')}
                                                </Button>
                                            ) : (
                                                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                                    <Label className="text-[10px] font-black uppercase text-slate-500">
                                                        {t('sellerLocalTx.forms.zonecashDeposit.enterOtp')}
                                                    </Label>
                                                    <Input
                                                        className="bg-white border-emerald-200 text-emerald-900 font-mono tracking-[0.5em] text-center h-11 text-lg placeholder:text-slate-300"
                                                        placeholder="------"
                                                        maxLength={6}
                                                        value={otpCode}
                                                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                                                    />

                                                    {/* Timer + Resend */}
                                                    <div className="flex items-center justify-between">
                                                        {otpTimer > 0 ? (
                                                            <div className="flex items-center gap-1.5">
                                                                <div className={`h-2 w-2 rounded-full animate-pulse ${otpTimer <= 30 ? 'bg-red-500' : 'bg-emerald-500'}`} />
                                                                <span className={`text-xs font-black tabular-nums ${otpTimer <= 30 ? 'text-red-500' : 'text-emerald-600'}`}>
                                                                    {String(Math.floor(otpTimer / 60)).padStart(2, '0')}:{String(otpTimer % 60).padStart(2, '0')}
                                                                </span>
                                                                <span className="text-[10px] text-slate-400">
                                                                    {t('sellerLocalTx.forms.zonecashDeposit.otpExpires')}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-red-500 font-bold">
                                                                ⚠️ {t('sellerLocalTx.forms.zonecashDeposit.otpExpired')}
                                                            </span>
                                                        )}
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 font-bold h-7 px-2"
                                                            onClick={handleRequestOtp}
                                                            disabled={isRequestingOtp || otpTimer > 0}
                                                        >
                                                            {isRequestingOtp ? (
                                                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                                            ) : null}
                                                            {t('sellerLocalTx.forms.zonecashDeposit.resendOtp')}
                                                        </Button>
                                                    </div>

                                                    <p className="text-[10px] text-center text-slate-400">
                                                        {t('sellerLocalTx.forms.zonecashDeposit.otpSentMessage')}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-2 pt-1">
                                    {zonecashAccountInfo && (
                                        <Button
                                            variant="outline"
                                            className="w-full border-red-400/40 text-red-500 h-11 font-black uppercase tracking-widest hover:bg-red-500/10 transition-all"
                                            onClick={handleCancelZoneCash}
                                            disabled={submittingAction === 'deposit'}
                                        >
                                            {t('sellerLocalTx.forms.zonecashDeposit.cancelButton')}
                                        </Button>
                                    )}
                                    <Button
                                        className={`${zonecashAccountInfo ? '' : 'col-span-2'} w-full bg-emerald-600 hover:bg-emerald-500 text-black h-11 font-black uppercase tracking-widest transition-all`}
                                        onClick={handleZoneCashDeposit}
                                        disabled={submittingAction === 'deposit' || !seller?.isActive || !zonecashAmount || !zonecashAccountInfo || (!isRemote && (!otpRequested || otpCode.length !== 6))}
                                    >
                                        {submittingAction === 'deposit' ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : !seller?.isActive ? (
                                            t('sellerLocalTx.forms.standardDeposit.pointLocked')
                                        ) : (
                                            t('sellerLocalTx.forms.zonecashDeposit.confirmButton') || 'Konfime Depo a'
                                        )}
                                    </Button>
                                </div>
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
                                    disabled={submittingAction === 'betting' || !seller?.isActive || !bettingAmount || !bettingPlayerId}
                                >
                                    {submittingAction === 'betting' ? (
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