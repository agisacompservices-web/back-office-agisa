import React, { useState, useEffect, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import sellerApi, { Seller } from "../../context/api/seller";
import transactionApi, { Transaction, TransactionType } from "../../context/api/transaction";
import usersApi from "../../context/api/users";
import enterpriseApi from "../../context/api/enterprise";
import { Popover, PopoverContent, PopoverTrigger } from "../../components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "../../components/ui/command";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Check, ChevronsUpDown, Loader2, History, PlusCircle, TrendingUp, Building, TrendingDown, CreditCard, Wallet, MonitorCheck } from "lucide-react";
import { cn } from "../../lib/utils";
import { useTranslation } from "react-i18next";

const SellerTransaction: React.FC = () => {
    const { t } = useTranslation();
    const { enterpriseCode } = useParams<{ enterpriseCode: string }>();
    const [amount, setAmount] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, _setIsLoading] = [isLoading, setIsLoading];
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [sellers, setSellers] = useState<Seller[]>([]);
    const [totalSellers, setTotalSellers] = useState(0);
    const [totalActiveSellers, setTotalActiveSellers] = useState(0);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [selectedSellerId, setSelectedSellerId] = useState<string>("");
    const [enterpriseId, setEnterpriseId] = useState<string>("");
    const [isSellerSelectOpen, setIsSellerSelectOpen] = useState(false);
    const [txType, setTxType] = useState<TransactionType>(TransactionType.DEPOSIT);

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 10;

    const fetchTransactions = useCallback(async (pageToFetch = 1, entIdOverride?: string) => {
        const entId = entIdOverride || enterpriseId;
        if (!entId) return;

        setIsLoading(true);
        try {
            // Fetch Transactions with scope='seller' to only get Seller-related transactions
            const txsRes = await transactionApi.getAll(entId, undefined, undefined, pageToFetch, limit, 'seller');
            setTransactions(txsRes.data || []);
            setTotalPages(txsRes.meta?.lastPage || 1);
            setPage(txsRes.meta?.page || pageToFetch);
        } catch (error) {
            console.error("Failed to fetch transactions", error);
        } finally {
            setIsLoading(false);
        }
    }, [enterpriseId]);

    const fetchEnterpriseData = useCallback(async () => {
        try {
            const user = await usersApi.getMe();
            const isAdmin = user.role?.level === 'SUPER_ADMIN' || user.role?.level === 'ADMIN';
            let membership = user.memberships?.find(m => m.enterprise?.enterpriseCode === enterpriseCode);
            let entId: string | undefined;

            if (!membership && isAdmin) {
                const entRes = await enterpriseApi.getAll({ search: enterpriseCode });
                const matchedEnt = entRes.data.find(e => e.enterpriseCode === enterpriseCode);
                if (matchedEnt) {
                    entId = matchedEnt.id;
                } else {
                    toast.error(t('sellerTx.toasts.entNotFound'));
                    return;
                }
            } else if (!membership) {
                toast.error(t('sellerTx.toasts.notAuth'));
                return;
            } else {
                entId = membership.enterprise?.id;
            }

            setEnterpriseId(entId || "");

            const sellersRes = await sellerApi.getAll({ enterpriseId: entId });
            setSellers(sellersRes.data);
            setTotalSellers(sellersRes.meta?.total || sellersRes.data.length);
            setTotalActiveSellers(sellersRes.data.filter((s: Seller) => s.isActive).length);

            fetchTransactions(1, entId);

        } catch (error) {
            toast.error(t('sellerTx.toasts.fetchFail'));
        }
    }, [enterpriseCode, fetchTransactions, t]);

    useEffect(() => {
        fetchEnterpriseData();
    }, [fetchEnterpriseData]);


    const handleFunding = async () => {
        const selectedSeller = sellers.find(s => s.id === selectedSellerId);

        if (!selectedSellerId || !amount || Number(amount) <= 0) {
            toast.error(t('sellerTx.toasts.reqAmount'));
            return;
        }

        if (txType === TransactionType.WITHDRAWAL && Number(amount) > (selectedSeller?.balance || 0)) {
            toast.error(`${t('sellerTx.toasts.insuffFunds')} ${formatCurrency(selectedSeller?.balance || 0)}`);
            return;
        }

        if (txType === TransactionType.DEPOSIT) {
            const currentBalance = selectedSeller?.balance || 0;
            const startedBalance = selectedSeller?.startedBalance || 0;
            if (currentBalance + Number(amount) > startedBalance) {
                toast.error(`${t('sellerTx.toasts.exceedsStarted')} ${formatCurrency(Math.max(0, startedBalance - currentBalance))}`);
                return;
            }
        }

        setIsSubmitting(true);
        try {
            await transactionApi.create({
                type: txType,
                amount: Number(amount),
                enterpriseId,
                sellerId: selectedSellerId,
                description: txType === TransactionType.DEPOSIT
                    ? t('sellerTx.desc.deposit')
                    : t('sellerTx.desc.withdraw')
            });
            toast.success(txType === TransactionType.DEPOSIT ? t('sellerTx.toasts.successFund') : t('sellerTx.toasts.successWith'));
            setAmount("");
            setSelectedSellerId("");
            fetchTransactions(1);
        } catch (error) {
            toast.error(txType === TransactionType.DEPOSIT ? t('sellerTx.toasts.failedFund') : t('sellerTx.toasts.failedWith'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectedSeller = sellers.find(s => s.id === selectedSellerId);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'HTG' }).format(val);
    };

    const todayStr = new Date().toISOString().split('T')[0];
    const enterpriseTransactions = transactions.filter((tx: Transaction) => tx.enterpriseId === enterpriseId);

    const todayDistributed = enterpriseTransactions
        .filter((tx: Transaction) => tx.type === TransactionType.DEPOSIT && tx.createdAt.startsWith(todayStr))
        .reduce((acc: number, tx: Transaction) => acc + Number(tx.amount), 0);
    const todayWithdrawal = enterpriseTransactions
        .filter((tx: Transaction) => tx.type === TransactionType.WITHDRAWAL && tx.createdAt.startsWith(todayStr))
        .reduce((acc: number, tx: Transaction) => acc + Number(tx.amount), 0);

    const lastDistTx = enterpriseTransactions.find((tx: Transaction) => tx.type === TransactionType.DEPOSIT);
    const lastWithTx = enterpriseTransactions.find((tx: Transaction) => tx.type === TransactionType.WITHDRAWAL);

    const formatLastActivity = (tx?: Transaction) => {
        if (!tx) return t('sellerTx.desc.noActivity');
        return `${t('sellerTx.desc.lastActivity')} ${formatDistanceToNow(new Date(tx.createdAt), { addSuffix: true })}`;
    };


    return (
        <div className="p-4 sm:p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tighter text-black uppercase flex items-center gap-3">
                        <MonitorCheck className="h-8 w-8 text-emerald-500" />
                        {t('sellerTx.ui.title')}
                    </h1>
                    <p className="text-zinc-500 uppercase text-[10px] font-black tracking-[0.2em] mt-1">
                        {t('sellerTx.ui.subtitle')}
                    </p>
                </div>
                <Badge variant="outline" className="w-fit bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px] font-black uppercase tracking-widest px-3 py-1 whitespace-nowrap">
                    {t('sellerTx.ui.levelBadge')}
                </Badge>
            </div>

            {/* Global Indices Section */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="bg-slate-50 border-slate-200 backdrop-blur-md relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Building className="h-20 w-20 text-black" />
                    </div>
                    <CardHeader className="pb-2 space-y-0">
                        <CardDescription className="text-[9px] uppercase font-black text-zinc-500 tracking-[0.15em]">{t('sellerTx.ui.activePoints')}</CardDescription>
                        <CardTitle className="text-2xl font-black text-black">{totalSellers}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-[10px] text-emerald-400 font-bold uppercase tracking-widest">
                            {totalActiveSellers} {t('sellerTx.ui.opGroups')}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-50 border-slate-200 backdrop-blur-md relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Wallet className="h-20 w-20 text-black" />
                    </div>
                    <CardHeader className="pb-2 space-y-0">
                        <CardDescription className="text-[9px] uppercase font-black text-zinc-500 tracking-[0.15em]">{t('sellerTx.ui.totalBal')}</CardDescription>
                        <CardTitle className="text-2xl font-black text-black">
                            {formatCurrency(sellers.reduce((acc, s) => acc + Number(s.balance || 0), 0))}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                            {t('sellerTx.ui.aggLiq')}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-50 border-slate-200 backdrop-blur-md relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingUp className="h-20 w-20 text-black" />
                    </div>
                    <CardHeader className="pb-2 space-y-0">
                        <CardDescription className="text-[9px] uppercase font-black text-zinc-500 tracking-[0.15em]">{t('sellerTx.ui.todayDist')}</CardDescription>
                        <CardTitle className="text-2xl font-black text-emerald-400">
                            {formatCurrency(todayDistributed)}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-[10px] text-blue-400 font-bold uppercase tracking-widest">
                            {formatLastActivity(lastDistTx)}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-50 border-slate-200 backdrop-blur-md relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingDown className="h-20 w-20 text-black" />
                    </div>
                    <CardHeader className="pb-2 space-y-0">
                        <CardDescription className="text-[9px] uppercase font-black text-zinc-500 tracking-[0.15em]">{t('sellerTx.ui.todayWith')}</CardDescription>
                        <CardTitle className="text-2xl font-black text-rose-400">
                            {formatCurrency(todayWithdrawal)}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-[10px] text-rose-400 font-bold uppercase tracking-widest">
                            {formatLastActivity(lastWithTx)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
                {/* Distribution Form */}
                <Card className="lg:col-span-4 bg-slate-50 border-slate-200 backdrop-blur-xl h-fit">
                    <CardHeader className="border-b border-slate-200">
                        <CardTitle className="text-sm font-black text-black uppercase tracking-widest flex items-center gap-2">
                            <PlusCircle className="h-4 w-4 text-emerald-500" />
                            {t('sellerTx.form.title')}
                        </CardTitle>
                        <CardDescription className="text-[10px] font-bold text-zinc-500">
                            {txType === TransactionType.DEPOSIT
                                ? t('sellerTx.form.descDep')
                                : t('sellerTx.form.descWith')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        <div className="flex p-1 bg-slate-50 rounded-lg border border-slate-200">
                            <button
                                onClick={() => setTxType(TransactionType.DEPOSIT)}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-[10px] font-black uppercase tracking-widest transition-all",
                                    txType === TransactionType.DEPOSIT
                                        ? "bg-emerald-600 text-black shadow-lg"
                                        : "text-zinc-500 hover:text-black hover:bg-slate-200"
                                )}
                            >
                                <TrendingUp className="h-3 w-3" />
                                {t('sellerTx.form.btnFunding')}
                            </button>
                            <button
                                onClick={() => setTxType(TransactionType.WITHDRAWAL)}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-[10px] font-black uppercase tracking-widest transition-all",
                                    txType === TransactionType.WITHDRAWAL
                                        ? "bg-rose-600 text-black shadow-lg"
                                        : "text-zinc-500 hover:text-black hover:bg-slate-200"
                                )}
                            >
                                <TrendingDown className="h-3 w-3" />
                                {t('sellerTx.form.btnWithdrawal')}
                            </button>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">{t('sellerTx.form.targetSeller')}</Label>
                            <Popover open={isSellerSelectOpen} onOpenChange={setIsSellerSelectOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={isSellerSelectOpen}
                                        className="w-full justify-between bg-slate-50 border-slate-200 text-black h-11 hover:bg-slate-100"
                                    >
                                        {selectedSeller ? selectedSeller.name : t('sellerTx.form.selSeller')}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-white border-slate-200 shadow-xl">
                                    <Command className="bg-transparent">
                                        <CommandInput placeholder={t("sellerTx.form.searchSeller")} className="h-9 text-slate-800" />
                                        <CommandEmpty>{t('sellerTx.form.noSeller')}</CommandEmpty>
                                        <CommandGroup className="max-h-64 overflow-y-auto">
                                            {sellers.map((seller: Seller) => (
                                                <CommandItem
                                                    key={seller.id}
                                                    value={`${seller.name} ${seller.code || ""} ${seller.seller?.fullName || ""}`}
                                                    onSelect={() => {
                                                        setSelectedSellerId(seller.id || "");
                                                        setIsSellerSelectOpen(false);
                                                    }}
                                                    className="hover:bg-slate-50 cursor-pointer text-slate-700 aria-selected:bg-emerald-50 aria-selected:text-emerald-700 font-medium"
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            selectedSellerId === seller.id ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold">{seller.name}</span>
                                                            {seller.code && (
                                                                <Badge variant="outline" className="text-[8px] h-4 px-1 bg-slate-50 border-slate-200 text-zinc-500 font-mono rounded-md">
                                                                    {seller.code}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-[10px] text-zinc-500 uppercase tracking-tighter">
                                                            {/* <span>{seller.seller?.fullName || t('sellerTx.form.noUser')}</span> */}
                                                            {/* <span className="text-zinc-700">•</span>
                                                            <span className="text-emerald-500/70 font-bold">{formatCurrency(seller.balance || 0)}</span> */}
                                                        </div>
                                                    </div>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">{t('sellerTx.form.amountLabel')}</Label>
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

                        <div className={cn(
                            "rounded-xl border p-4 transition-colors",
                            txType === TransactionType.DEPOSIT
                                ? "bg-emerald-500/5 border-emerald-500/10"
                                : "bg-rose-500/5 border-rose-500/10"
                        )}>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-black text-black uppercase tracking-widest">
                                    {txType === TransactionType.DEPOSIT ? t('sellerTx.form.allocLabel') : t('sellerTx.form.withdrawLabel')}
                                </span>
                                <span className={cn(
                                    "text-lg font-black font-mono",
                                    txType === TransactionType.DEPOSIT ? "text-emerald-400" : "text-rose-400"
                                )}>
                                    {txType === TransactionType.DEPOSIT ? "+" : "-"}{formatCurrency(Number(amount) || 0)}
                                </span>
                            </div>
                        </div>

                        <Button
                            className={cn(
                                "w-full text-black h-auto min-h-[48px] py-3 text-[10px] sm:text-xs whitespace-normal leading-tight text-center font-black uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed",
                                txType === TransactionType.DEPOSIT
                                    ? "bg-emerald-600 hover:bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                                    : "bg-rose-600 hover:bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.2)]"
                            )}
                            onClick={handleFunding}
                            disabled={isSubmitting || !selectedSellerId || !amount || (txType === TransactionType.WITHDRAWAL && Number(amount) > (selectedSeller?.balance || 0)) || (txType === TransactionType.DEPOSIT && (selectedSeller?.balance || 0) + Number(amount) > (selectedSeller?.startedBalance || 0))}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {t('sellerTx.form.processing')}
                                </>
                            ) : (
                                txType === TransactionType.WITHDRAWAL && Number(amount) > (selectedSeller?.balance || 0)
                                    ? t('sellerTx.form.insuffFunds')
                                    : (txType === TransactionType.DEPOSIT && selectedSeller && ((selectedSeller.balance || 0) + Number(amount) > (selectedSeller.startedBalance || 0))
                                        ? `${t('sellerTx.toasts.exceedsStarted')} ${formatCurrency(Math.max(0, (selectedSeller.startedBalance || 0) - (selectedSeller.balance || 0)))}`
                                        : (txType === TransactionType.DEPOSIT ? t('sellerTx.form.btnFundSeller') : t('sellerTx.form.btnRecordWith'))
                                    )
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* Seller Funding History Table */}
                <Card className="lg:col-span-6 bg-slate-50 border-slate-200 backdrop-blur-xl">
                    <CardHeader className="border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <CardTitle className="text-sm font-black text-black uppercase tracking-widest flex items-center gap-2">
                            <History className="h-4 w-4 text-zinc-500" />
                            {t('sellerTx.log.title')}
                        </CardTitle>
                        <div className="flex items-center gap-3">
                            <Button variant="outline" size="sm" className="h-7 border-slate-200 bg-slate-50 text-[9px] font-black uppercase tracking-widest hover:bg-slate-100" onClick={() => fetchTransactions(1)}>
                                <History className="h-3 w-3 mr-2" />
                                {t('sellerTx.log.refresh')}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="max-h-[600px] overflow-y-auto">
                            <Table>
                                <TableHeader className="sticky top-0 bg-slate-100/80 backdrop-blur-md z-10">
                                    <TableRow className="border-slate-200 hover:bg-transparent">
                                        <TableHead className="text-[9px] uppercase font-black text-zinc-500 tracking-widest w-[120px]">{t('sellerTx.log.colRef')}</TableHead>
                                        <TableHead className="text-[9px] uppercase font-black text-zinc-500 tracking-widest">{t('sellerTx.log.colSeller')}</TableHead>
                                        <TableHead className="text-[9px] uppercase font-black text-zinc-500 tracking-widest text-right">{t('sellerTx.log.colAmount')}</TableHead>
                                        <TableHead className="text-[9px] uppercase font-black text-zinc-500 tracking-widest text-right">{t('sellerTx.log.colStatus')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transactions.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-32 text-center text-zinc-500 text-[10px] font-black uppercase tracking-widest">
                                                {t('sellerTx.log.noTx')}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        transactions.map((tx) => (
                                            <TableRow key={tx.id} className="border-slate-200 hover:bg-slate-50 transition-colors group">
                                                <TableCell className="font-mono text-[10px] font-bold text-slate-600 group-hover:text-slate-900 uppercase tracking-tighter">
                                                    {tx.id.substring(0, 8)}...
                                                    <div className="text-[8px] font-medium text-slate-500 mt-1">
                                                        {new Date(tx.createdAt).toLocaleString('en-US')}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center group-hover:bg-white group-hover:border-slate-300 transition-colors">
                                                            <CreditCard className="h-4 w-4 text-emerald-500" />
                                                        </div>
                                                        <div>
                                                            <div className="text-[11px] font-black text-slate-800 leading-tight">
                                                                {tx.seller?.name || t('sellerTx.log.systemUnknown')}
                                                            </div>
                                                            <div className="text-[8px] font-black uppercase tracking-[0.1em] mt-0.5 text-blue-400">
                                                                {tx.type === TransactionType.DEPOSIT ? t('sellerTx.log.capFunding') : t('sellerTx.log.fundsWith')}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className={cn(
                                                        "text-xs font-black font-mono tracking-tighter",
                                                        tx.type === TransactionType.DEPOSIT ? "text-emerald-400" : "text-rose-400"
                                                    )}>
                                                        {tx.type === TransactionType.DEPOSIT ? "+" : "-"}{formatCurrency(tx.amount)}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Badge variant="outline" className={cn(
                                                        "text-[8px] font-black uppercase tracking-widest py-0 h-5",
                                                        tx.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                            tx.status === 'pending' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                                                                'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                                    )}>
                                                        {tx.status}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination Controls */}
                        {transactions.length > 0 && (
                            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                                <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                                    {t('sellerTx.log.pageLabel')} {page} {t('sellerTx.log.ofLabel')} {totalPages}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => fetchTransactions(page - 1)}
                                        disabled={page <= 1 || isLoading}
                                        className="h-7 border-slate-200 bg-slate-50 text-zinc-500 hover:text-black hover:bg-slate-100 text-[9px] font-bold uppercase tracking-widest"
                                    >
                                        {t('sellerTx.log.prevBtn')}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => fetchTransactions(page + 1)}
                                        disabled={page >= totalPages || isLoading}
                                        className="h-7 border-slate-200 bg-slate-50 text-zinc-500 hover:text-black hover:bg-slate-100 text-[9px] font-bold uppercase tracking-widest"
                                    >
                                        {t('sellerTx.log.nextBtn')}
                                    </Button>
                                </div>
                            </div>
                        )}

                        <div className="p-4 border-t border-slate-200 bg-slate-50">
                            <Button variant="ghost" className="w-full text-zinc-500 hover:text-black hover:bg-slate-100 text-[10px] font-black uppercase tracking-widest h-8" onClick={() => fetchTransactions(1)}>
                                {t('sellerTx.log.refreshHist')}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default SellerTransaction;