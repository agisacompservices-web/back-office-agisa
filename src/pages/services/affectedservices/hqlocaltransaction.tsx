import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { format, isSameDay, parseISO } from "date-fns";
import { toast } from "sonner";
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../../../components/ui/dialog";
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from "../../../components/ui/input-otp";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "../../../components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "../../../components/ui/command";
import {
    History,
    PlusCircle,
    Search,
    Wallet,
    Check,
    ChevronsUpDown,
    Loader2,
    TrendingUp,
    TrendingDown,
    Building2,
    Filter,
    MapPin,
    CreditCard,
    Coins
} from "lucide-react";
import { cn } from "../../../lib/utils";
import { useTranslation } from "react-i18next";
import headquartersApi, { Headquarter } from "../../../context/api/headquarters";
import sellerApi, { Seller } from "../../../context/api/seller";
import transactionApi, { Transaction, TransactionType } from "../../../context/api/transaction";
import usersApi from "../../../context/api/users";

const HQLocalTransaction: React.FC = () => {
    const { t } = useTranslation();
    const { enterpriseCode } = useParams<{ enterpriseCode: string }>();
    const [amount, setAmount] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hq, setHq] = useState<Headquarter | null>(null);
    const [sellers, setSellers] = useState<Seller[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [selectedSellerId, setSelectedSellerId] = useState("");
    const [isSellerSelectOpen, setIsSellerSelectOpen] = useState(false);
    const [logSearch, setLogSearch] = useState("");
    const [txType, setTxType] = useState<TransactionType>(TransactionType.DEPOSIT);
    const [enterpriseId, setEnterpriseId] = useState("");
    const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
    const [otpCode, setOtpCode] = useState("");
    const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
    const [otpStatus, setOtpStatus] = useState<"idle" | "success" | "error">("idle");

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const user = await usersApi.getMe();
            const membership = user.memberships?.find(m => m.enterprise?.enterpriseCode === enterpriseCode);

            if (!membership || !membership.headquarter?.id) {
                toast.error(t('hqLocalTx.toasts.notAuth'));
                return;
            }

            const entId = membership.enterprise?.id;
            setEnterpriseId(entId || "");

            const [hqRes, sellersRes, txsRes] = await Promise.all([
                headquartersApi.getById(membership.headquarter.id),
                sellerApi.getAll({ enterpriseId: entId }),
                transactionApi.getAll(entId, membership.headquarter.id)
            ]);

            setHq(hqRes);
            setSellers(sellersRes.data);
            setTransactions(txsRes.data);
        } catch (error) {
            toast.error(t('hqLocalTx.toasts.fetchFail'));
        } finally {
            setIsLoading(false);
        }
    }, [enterpriseCode, t]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleFunding = async () => {
        if (!hq?.isActive) {
            toast.error(t('hqLocalTx.toasts.hqInactiveTx'));
            return;
        }

        if (!selectedSellerId || !amount || Number(amount) <= 0) {
            toast.error(t('hqLocalTx.toasts.reqAmount'));
            return;
        }

        const selectedSeller = sellers.find(s => s.id === selectedSellerId);
        if (txType === TransactionType.WITHDRAWAL && Number(amount) > (selectedSeller?.balance || 0)) {
            toast.error(`${t('hqLocalTx.toasts.insuffFunds')}${formatCurrency(selectedSeller?.balance || 0)}`);
            return;
        }

        if (txType === TransactionType.WITHDRAWAL) {
            if (!selectedSeller?.seller) {
                toast.error(t('hqLocalTx.toasts.noMgr'));
                return;
            }

            if (!selectedSeller.seller.twoFactorEnabled) {
                toast.error(t('hqLocalTx.toasts.no2FA'));
                return;
            }

            setOtpCode("");
            setOtpStatus("idle");
            setIsOtpModalOpen(true);
            return;
        }

        await processTransaction();
    };

    const processTransaction = async (otp?: string) => {
        setIsSubmitting(true);
        if (otp) {
            setIsVerifyingOtp(true);
            setOtpStatus("idle"); // reset status before verifying
        }
        try {
            await transactionApi.create({
                type: txType,
                amount: Number(amount),
                enterpriseId,
                headquarterId: hq?.id,
                sellerId: selectedSellerId,
                description: txType === TransactionType.DEPOSIT
                    ? `${t('hqLocalTx.desc.fundDesc')}${hq?.name}`
                    : `${t('hqLocalTx.desc.withdrawDesc')}${hq?.name}`,
                otp
            });

            if (otp) {
                setOtpStatus("success");
                // Wait briefly so the user sees the green success state
                await new Promise(resolve => setTimeout(resolve, 800));
            }

            toast.success(txType === TransactionType.DEPOSIT ? t('hqLocalTx.toasts.fundScs') : t('hqLocalTx.toasts.withdrawScs'));
            setAmount("");
            setSelectedSellerId("");
            if (isOtpModalOpen) setIsOtpModalOpen(false);

            // Try to refresh data, but don't treat refresh failure as transaction failure
            try {
                await fetchData();
            } catch (refreshError) {
                console.error("Refresh failed after success:", refreshError);
                toast.warning(t('hqLocalTx.toasts.refreshFail'));
            }
        } catch (error: any) {
            console.error("Transaction failed:", error);
            if (otp) {
                setOtpStatus("error");
                setOtpCode(""); // Auto-clear input on error
            }
            const errMsg = error.response?.data?.message || t('hqLocalTx.toasts.txFailMsg');
            toast.error(typeof errMsg === 'string' ? errMsg : errMsg[0] || t('hqLocalTx.toasts.txFail'));
        } finally {
            setIsSubmitting(false);
            setIsVerifyingOtp(false);
        }
    };

    const handleOtpChange = (value: string) => {
        setOtpCode(value);
        if (otpStatus === "error") {
            setOtpStatus("idle");
        }
        // Auto-submit when exactly 6 digits are entered
        if (value.length === 6) {
            processTransaction(value);
        }
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('fr-HT', { style: 'currency', currency: 'HTG' }).format(val);
    };

    const now = new Date();
    const todayFunding = transactions
        .filter(tx => tx.type === TransactionType.DEPOSIT && isSameDay(parseISO(tx.createdAt), now))
        .reduce((acc, tx) => acc + Number(tx.amount), 0);

    const todayWithdrawal = transactions
        .filter(tx => tx.type === TransactionType.WITHDRAWAL && isSameDay(parseISO(tx.createdAt), now))
        .reduce((acc, tx) => acc + Number(tx.amount), 0);

    const filteredTransactions = transactions.filter(tx => {
        const search = logSearch.toLowerCase();
        return (
            tx.seller?.name?.toLowerCase().includes(search) ||
            tx.id.toLowerCase().includes(search) ||
            tx.status.toLowerCase().includes(search)
        );
    });

    const selectedSeller = sellers.find(s => s.id === selectedSellerId);

    if (isLoading && !hq) {
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
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tighter text-black uppercase flex items-center gap-3">
                        <Building2 className="h-8 w-8 text-emerald-500" />
                        {t('hqLocalTx.ui.title')}
                    </h1>
                    <p className="text-zinc-500 uppercase text-[10px] font-black tracking-[0.2em] mt-1">
                        {t('hqLocalTx.ui.subtitle')}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block whitespace-nowrap">
                        <div className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">{hq?.name}</div>
                        <div className="text-[8px] font-bold text-emerald-500 uppercase tracking-tighter">{hq?.code}</div>
                    </div>
                    <Badge variant="outline" className={cn(
                        "w-fit text-[10px] font-black uppercase tracking-widest px-3 py-1 whitespace-nowrap rounded-md",
                        hq?.isActive
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                            : "bg-red-500/10 text-red-500 border-red-500/20"
                    )}>
                        {hq?.isActive ? t('hqLocalTx.ui.hqActive') : t('hqLocalTx.ui.hqSuspendedBtn')}
                    </Badge>
                </div>
            </div>

            {!hq?.isActive && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-4 animate-pulse">
                    <div className="h-10 w-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                        <Building2 className="h-5 w-5 text-red-500" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-red-400 uppercase tracking-widest leading-none">{t('hqLocalTx.ui.hqSuspendedTitle')}</h3>
                        <p className="text-[11px] text-red-500/70 font-bold mt-1">
                            {t('hqLocalTx.ui.hqSuspendedDesc')}
                        </p>
                    </div>
                </div>
            )}

            {/* HQ Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="bg-slate-50 border-slate-200 backdrop-blur-md relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Wallet className="h-20 w-20 text-black" />
                    </div>
                    <CardHeader className="pb-2 space-y-0">
                        <CardDescription className="text-[9px] uppercase font-black text-zinc-500 tracking-[0.15em]">{t('hqLocalTx.stats.opBal')}</CardDescription>
                        <CardTitle className="text-2xl font-black text-black">{formatCurrency(Number(hq?.balance || 0))}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-[10px] text-emerald-400 font-bold uppercase tracking-widest">
                            {t('hqLocalTx.stats.readyDist')}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-50 border-slate-200 backdrop-blur-md relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Coins className="h-20 w-20 text-black" />
                    </div>
                    <CardHeader className="pb-2 space-y-0">
                        <CardDescription className="text-[9px] uppercase font-black text-zinc-500 tracking-[0.15em]">{t('hqLocalTx.stats.ttlComm')}</CardDescription>
                        <CardTitle className="text-2xl font-black text-black">{formatCurrency(Number(hq?.commission || 0))}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-[10px] text-amber-400 font-bold uppercase tracking-widest">
                            {t('hqLocalTx.stats.earnedOp')}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-50 border-slate-200 backdrop-blur-md relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingUp className="h-20 w-20 text-black" />
                    </div>
                    <CardHeader className="pb-2 space-y-0">
                        <CardDescription className="text-[9px] uppercase font-black text-zinc-500 tracking-[0.15em]">{t('hqLocalTx.stats.dailyDist')}</CardDescription>
                        <CardTitle className="text-2xl font-black text-emerald-400">{formatCurrency(todayFunding)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                            {t('hqLocalTx.stats.refillsSellers')}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-50 border-slate-200 backdrop-blur-md relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingDown className="h-20 w-20 text-black" />
                    </div>
                    <CardHeader className="pb-2 space-y-0">
                        <CardDescription className="text-[9px] uppercase font-black text-zinc-500 tracking-[0.15em]">{t('hqLocalTx.stats.dailyRecov')}</CardDescription>
                        <CardTitle className="text-2xl font-black text-rose-400">{formatCurrency(todayWithdrawal)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                            {t('hqLocalTx.stats.withDrawSellers')}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
                {/* Funding Form */}
                <Card className="lg:col-span-4 bg-slate-50 border-slate-200 backdrop-blur-xl h-fit">
                    <CardHeader className="border-b border-white/5">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-sm font-black text-black uppercase tracking-widest flex items-center gap-2">
                                    <PlusCircle className="h-4 w-4 text-emerald-500" />
                                    {t('hqLocalTx.form.title')}
                                </CardTitle>
                                <CardDescription className="text-[10px] font-bold text-zinc-500">
                                    {t('hqLocalTx.form.desc')}
                                </CardDescription>
                            </div>
                            <div className="flex rounded-lg bg-slate-50 p-1 border border-slate-200">
                                <button
                                    onClick={() => setTxType(TransactionType.DEPOSIT)}
                                    className={cn(
                                        "px-3 py-1 text-[9px] font-black uppercase tracking-tighter rounded-md transition-all",
                                        txType === TransactionType.DEPOSIT ? "bg-emerald-500 text-black shadow-lg" : "text-zinc-500 hover:text-zinc-300"
                                    )}
                                >
                                    {t('hqLocalTx.form.btnRefill')}
                                </button>
                                <button
                                    onClick={() => setTxType(TransactionType.WITHDRAWAL)}
                                    className={cn(
                                        "px-3 py-1 text-[9px] font-black uppercase tracking-tighter rounded-md transition-all",
                                        txType === TransactionType.WITHDRAWAL ? "bg-rose-500 text-black shadow-lg" : "text-zinc-500 hover:text-zinc-300"
                                    )}
                                >
                                    {t('hqLocalTx.form.btnWithdraw')}
                                </button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">{t('hqLocalTx.form.selTarget')}</Label>
                            <Popover open={isSellerSelectOpen} onOpenChange={setIsSellerSelectOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={isSellerSelectOpen}
                                        className="w-full justify-between bg-slate-50 border-slate-200 text-black h-11 hover:bg-slate-100 hover:text-black"
                                    >
                                        {selectedSellerId ? (
                                            <div className="flex items-center justify-between w-full">
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="h-4 w-4 text-emerald-500" />
                                                    {/* <span className="font-bold">{sellers.find(s => s.id === selectedSellerId)?.name}</span> */}
                                                    <Badge variant="outline" className="text-[8px] h-4 bg-slate-50 border-slate-200 text-zinc-400 uppercase">
                                                        {sellers.find(s => s.id === selectedSellerId)?.code}
                                                    </Badge>
                                                </div>
                                                {/* <div className="text-[10px] font-mono font-black text-emerald-500">
                                                    {formatCurrency(Number(sellers.find(s => s.id === selectedSellerId)?.withdrawalBalance || 0))}
                                                </div> */}
                                            </div>
                                        ) : (
                                            <span className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">{t('hqLocalTx.form.selPointPH')}</span>
                                        )}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-full p-0 bg-white border-slate-200" align="start">
                                    <Command className="bg-transparent">
                                        <CommandInput placeholder={t('hqLocalTx.form.searchSeller')} className="h-9 text-black" />
                                        <CommandList>
                                            <CommandEmpty className="py-6 text-center text-xs text-zinc-500 font-bold uppercase">{t('hqLocalTx.form.noSeller')}</CommandEmpty>
                                            <CommandGroup>
                                                {sellers.map((seller) => (
                                                    <CommandItem
                                                        key={seller.id}
                                                        value={seller.name + " " + seller.code}
                                                        onSelect={() => {
                                                            setSelectedSellerId(seller.id);
                                                            setIsSellerSelectOpen(false);
                                                        }}
                                                        className="text-black hover:bg-slate-50 cursor-pointer py-3"
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4 text-emerald-500",
                                                                selectedSellerId === seller.id ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        <div className="flex flex-col">
                                                            {/* <span className="font-bold text-xs uppercase">{seller.name}</span> */}
                                                            <span className="font-bold text-xs uppercase">{seller.code}</span>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                {/* <span className="text-[9px] text-zinc-500 font-black">{seller.code}</span>
                                                                <span className="text-[9px] text-emerald-500/80 font-mono font-bold leading-none">
                                                                    {formatCurrency(Number(seller.withdrawalBalance || 0))}
                                                                </span> */}
                                                            </div>
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">{t('hqLocalTx.form.amountLabel')}</Label>
                            <div className="relative group">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 h-4 text-zinc-500 font-bold text-xs group-focus-within:text-emerald-500 transition-colors uppercase">HTG</span>
                                <Input
                                    type="number"
                                    className="bg-slate-50 border-slate-200 text-black pl-12 h-11 focus:border-emerald-500/50 transition-all font-black text-lg"
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* <div className={cn(
                            "rounded-xl border p-4 transition-all space-y-3",
                            txType === TransactionType.WITHDRAWAL && Number(amount) > (selectedSeller?.withdrawalBalance || 0)
                                ? "bg-rose-500/5 border-rose-500/10"
                                : "bg-emerald-500/5 border-emerald-500/10"
                        )}>
                            <div className="flex justify-between items-center text-[10px] font-bold">
                                <span className="text-zinc-500 uppercase tracking-widest">
                                    {txType === TransactionType.WITHDRAWAL ? "Seller Withdrawal Balance" : "Seller Current Balance"}
                                </span>
                                <span className="text-black font-mono">
                                    {formatCurrency(Number(txType === TransactionType.WITHDRAWAL ? selectedSeller?.withdrawalBalance : selectedSeller?.balance || 0))}
                                </span>
                            </div>

                            <div className="flex justify-between items-center text-[10px] font-bold border-t border-white/5 pt-3">
                                <span className="text-zinc-500 uppercase tracking-widest">
                                    {txType === TransactionType.DEPOSIT ? "Funding Increment" : "Capital Recovery"}
                                </span>
                                <span className={cn(
                                    "text-lg font-black font-mono",
                                    txType === TransactionType.WITHDRAWAL && Number(amount) > (selectedSeller?.withdrawalBalance || 0)
                                        ? "text-rose-400"
                                        : "text-emerald-400"
                                )}>
                                    {txType === TransactionType.DEPOSIT ? "+" : "-"}{formatCurrency(Number(amount) || 0)}
                                </span>
                            </div>

                            {amount && Number(amount) > 0 && (
                                <div className="flex justify-between items-center text-[9px] font-black border-t border-white/5 pt-3 uppercase tracking-tighter">
                                    <span className="text-zinc-500">Projected Final Balance</span>
                                    <span className="text-blue-400">
                                        {formatCurrency(
                                            txType === TransactionType.DEPOSIT
                                                ? (Number(selectedSeller?.balance || 0) + Number(amount))
                                                : (Number(selectedSeller?.withdrawalBalance || 0) - Number(amount))
                                        )}
                                    </span>
                                </div>
                            )}
                        </div> */}

                        <Button
                            className={cn(
                                "w-full text-black h-12 font-black uppercase tracking-widest transition-all",
                                txType === TransactionType.DEPOSIT
                                    ? "bg-emerald-600 hover:bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                                    : "bg-rose-600 hover:bg-rose-500 border-rose-500/20"
                            )}
                            onClick={handleFunding}
                            disabled={isSubmitting || !hq?.isActive || !selectedSellerId || !amount || Number(amount) <= 0 || (txType === TransactionType.WITHDRAWAL && Number(amount) > (selectedSeller?.withdrawalBalance || 0))}
                        >
                            {isSubmitting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : !hq?.isActive ? (
                                t('hqLocalTx.form.btnLocked')
                            ) : (
                                txType === TransactionType.DEPOSIT
                                    ? t('hqLocalTx.form.btnProcess')
                                    : (Number(amount) > (selectedSeller?.withdrawalBalance || 0) ? t('hqLocalTx.form.btnInsuff') : t('hqLocalTx.form.btnConfirm'))
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* HQ History Table */}
                <Card className="lg:col-span-6 bg-slate-50 border-slate-200 backdrop-blur-xl">
                    <CardHeader className="border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <CardTitle className="text-sm font-black text-black uppercase tracking-widest flex items-center gap-2">
                            <History className="h-4 w-4 text-zinc-500" />
                            {t('hqLocalTx.history.title')}
                        </CardTitle>
                        <div className="flex items-center gap-3">
                            <div className="relative group">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" />
                                <Input
                                    placeholder={t('hqLocalTx.history.searchPH')}
                                    className="h-7 pl-8 text-[9px] bg-slate-50 border-slate-200 text-black w-40 placeholder:text-zinc-600 focus:border-emerald-500/50"
                                    value={logSearch}
                                    onChange={(e) => setLogSearch(e.target.value)}
                                />
                            </div>
                            <Button variant="outline" size="sm" className="h-7 border-slate-200 bg-slate-50 text-[10px] font-black uppercase tracking-widest" onClick={fetchData}>
                                <Filter className="h-3 w-3 mr-2" />
                                {t('hqLocalTx.history.refresh')}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-white/5 hover:bg-transparent">
                                    <TableHead className="text-[9px] uppercase font-black text-zinc-500 tracking-widest w-[100px]">{t('hqLocalTx.history.colRef')}</TableHead>
                                    <TableHead className="text-[9px] uppercase font-black text-zinc-500 tracking-widest">{t('hqLocalTx.history.colTarget')}</TableHead>
                                    <TableHead className="text-[9px] uppercase font-black text-zinc-500 tracking-widest text-right">{t('hqLocalTx.history.colAmount')}</TableHead>
                                    <TableHead className="text-[9px] uppercase font-black text-zinc-500 tracking-widest text-right">{t('hqLocalTx.history.colStatus')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredTransactions.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-32 text-center text-zinc-500 text-[10px] font-black uppercase tracking-widest">
                                            {t('hqLocalTx.history.noHist')}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredTransactions.map((tx) => (
                                        <TableRow key={tx.id} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                                            <TableCell className="font-mono text-[10px] font-bold text-zinc-400 group-hover:text-zinc-200 uppercase tracking-tighter">
                                                #{tx.id.substring(0, 6)}
                                                <div className="text-[8px] font-medium text-zinc-600 mt-1 uppercase">
                                                    {format(parseISO(tx.createdAt), 'MMM dd, yyyy')}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center">
                                                        <CreditCard className={cn(
                                                            "h-4 w-4",
                                                            tx.type === TransactionType.DEPOSIT ? "text-emerald-500" : "text-rose-500"
                                                        )} />
                                                    </div>
                                                    <div>
                                                        <div className={cn(
                                                            "text-[11px] font-black leading-tight uppercase",
                                                            tx.type === TransactionType.DEPOSIT ? 'text-black' : 'text-black'
                                                        )}>
                                                            {tx.type === TransactionType.DEPOSIT ? t('hqLocalTx.history.capDist') : t('hqLocalTx.history.capRecov')}
                                                        </div>
                                                        <div className={cn(
                                                            "text-[8px] font-black uppercase tracking-[0.1em] mt-0.5",
                                                            tx.type === TransactionType.DEPOSIT ? 'text-emerald-500' : 'text-rose-500'
                                                        )}>
                                                            {tx.description || tx.seller?.name || t('hqLocalTx.history.refillRecv')}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className={cn(
                                                    "text-xs font-black font-mono tracking-tighter",
                                                    tx.type === TransactionType.DEPOSIT ? "text-emerald-400" : "text-rose-400"
                                                )}>
                                                    {tx.type === TransactionType.DEPOSIT ? "-" : "+"}{formatCurrency(Math.abs(tx.amount))}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Badge variant="outline" className={cn(
                                                    "text-[8px] font-black uppercase tracking-widest py-0 h-5 rounded-md",
                                                    tx.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-orange-500/10 text-orange-500 border-orange-500/20'
                                                )}>
                                                    {t(`hqLocalTx.history.statusNames.${tx.status}`)}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                        <div className="p-4 border-t border-white/5 bg-white/[0.01]">
                            <Button
                                variant="ghost"
                                className="w-full text-zinc-500 hover:text-black text-[10px] font-black uppercase tracking-widest h-8"
                                onClick={fetchData}
                            >
                                {t('hqLocalTx.history.reloadLog')}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* OTP Modal for Withdrawals */}
            <Dialog open={isOtpModalOpen} onOpenChange={setIsOtpModalOpen}>
                <DialogContent className="bg-white border-slate-200 text-black sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black uppercase tracking-tight text-black flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-emerald-500" />
                            {t('hqLocalTx.otp.title')}
                        </DialogTitle>
                        <DialogDescription className="text-zinc-500-400 text-sm mt-2 font-medium">
                            {t('hqLocalTx.otp.desc1')}<span className="text-black font-bold">{selectedSeller?.name}</span>{t('hqLocalTx.otp.desc2')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col items-center justify-center py-6">
                        <InputOTP
                            maxLength={6}
                            value={otpCode}
                            onChange={handleOtpChange}
                            disabled={isVerifyingOtp || otpStatus === "success"}
                        >
                            <InputOTPGroup>
                                <InputOTPSlot index={0} className={cn(
                                    "text-lg font-black h-12 w-12 transition-colors",
                                    otpStatus === "error" ? "bg-rose-500/10 border-rose-500 text-rose-500 ring-rose-500" :
                                        otpStatus === "success" ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 ring-emerald-500" :
                                            "bg-slate-50 border-slate-200 focus:ring-emerald-500"
                                )} />
                                <InputOTPSlot index={1} className={cn(
                                    "text-lg font-black h-12 w-12 transition-colors",
                                    otpStatus === "error" ? "bg-rose-500/10 border-rose-500 text-rose-500 ring-rose-500" :
                                        otpStatus === "success" ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 ring-emerald-500" :
                                            "bg-slate-50 border-slate-200 focus:ring-emerald-500"
                                )} />
                                <InputOTPSlot index={2} className={cn(
                                    "text-lg font-black h-12 w-12 transition-colors",
                                    otpStatus === "error" ? "bg-rose-500/10 border-rose-500 text-rose-500 ring-rose-500" :
                                        otpStatus === "success" ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 ring-emerald-500" :
                                            "bg-slate-50 border-slate-200 focus:ring-emerald-500"
                                )} />
                            </InputOTPGroup>
                            <div className="w-4" /> {/* Visual separator space */}
                            <InputOTPGroup>
                                <InputOTPSlot index={3} className={cn(
                                    "text-lg font-black h-12 w-12 transition-colors",
                                    otpStatus === "error" ? "bg-rose-500/10 border-rose-500 text-rose-500 ring-rose-500" :
                                        otpStatus === "success" ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 ring-emerald-500" :
                                            "bg-slate-50 border-slate-200 focus:ring-emerald-500"
                                )} />
                                <InputOTPSlot index={4} className={cn(
                                    "text-lg font-black h-12 w-12 transition-colors",
                                    otpStatus === "error" ? "bg-rose-500/10 border-rose-500 text-rose-500 ring-rose-500" :
                                        otpStatus === "success" ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 ring-emerald-500" :
                                            "bg-slate-50 border-slate-200 focus:ring-emerald-500"
                                )} />
                                <InputOTPSlot index={5} className={cn(
                                    "text-lg font-black h-12 w-12 transition-colors",
                                    otpStatus === "error" ? "bg-rose-500/10 border-rose-500 text-rose-500 ring-rose-500" :
                                        otpStatus === "success" ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 ring-emerald-500" :
                                            "bg-slate-50 border-slate-200 focus:ring-emerald-500"
                                )} />
                            </InputOTPGroup>
                        </InputOTP>
                        {isVerifyingOtp && (
                            <div className="flex items-center gap-2 mt-4 text-emerald-500 text-xs font-bold tracking-widest uppercase">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                {t('hqLocalTx.otp.verifying')}
                            </div>
                        )}
                        {otpStatus === "error" && (
                            <div className="mt-4 text-rose-400 text-xs font-bold tracking-widest uppercase">
                                {t('hqLocalTx.otp.invalidOTP')}
                            </div>
                        )}
                        {otpStatus === "success" && (
                            <div className="mt-4 text-emerald-400 text-xs font-bold tracking-widest uppercase">
                                {t('hqLocalTx.otp.successOTP')}
                            </div>
                        )}
                    </div>
                    <DialogFooter className="sm:justify-between flex-row gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setIsOtpModalOpen(false)}
                            disabled={isVerifyingOtp || otpStatus === "success"}
                            className="bg-transparent border-slate-200 text-black hover:bg-slate-50 w-full uppercase text-xs font-black tracking-widest"
                        >
                            {t('hqLocalTx.otp.cancelBtn')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default HQLocalTransaction;