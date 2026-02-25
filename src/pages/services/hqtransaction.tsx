/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import headquartersApi, { Headquarter } from "../../context/api/headquarters";
import transactionApi, { Transaction, TransactionType } from "../../context/api/transaction";
import usersApi from "../../context/api/users";
import enterpriseApi from "../../context/api/enterprise";
// import { Popover, PopoverContent, PopoverTrigger } from "../../components/ui/popover";
// import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "../../components/ui/command";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
// import { Input } from "../../components/ui/input";
// import { Label } from "../../components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import {
    //  Check, ChevronsUpDown, Loader2, 
    History,
    // PlusCircle, 
    TrendingUp, Building, ArrowUpRight, MapPin, Layers, TrendingDown
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useTranslation } from "react-i18next";

const HQTransaction: React.FC = () => {
    const { t } = useTranslation();
    const { enterpriseCode } = useParams<{ enterpriseCode: string }>();
    const [amount, setAmount] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, _setIsLoading] = [isLoading, setIsLoading];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hqs, setHqs] = useState<Headquarter[]>([]);
    const [totalHqs, setTotalHqs] = useState(0);
    const [totalActiveHqs, setTotalActiveHqs] = useState(0);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [selectedHqId, setSelectedHqId] = useState<string>("");
    const [enterpriseId, setEnterpriseId] = useState<string>("");
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [isHqSelectOpen, setIsHqSelectOpen] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [txType, setTxType] = useState<TransactionType>(TransactionType.DEPOSIT);

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 10;

    const fetchTransactions = React.useCallback(async (pageToFetch = 1, entIdOverride?: string) => {
        const entId = entIdOverride || enterpriseId;
        if (!entId) return;

        setIsLoading(true);
        try {
            // Fetch Transactions with scope='headquarter' to only get HQ-related transactions
            const txsRes = await transactionApi.getAll(entId, undefined, undefined, pageToFetch, limit, 'headquarter');
            setTransactions(txsRes.data || []);
            setTotalPages(txsRes.meta?.lastPage || 1);
            setPage(txsRes.meta?.page || pageToFetch);
        } catch (error) {
            console.error("Failed to fetch transactions", error);
        } finally {
            setIsLoading(false);
        }
    }, [enterpriseId]);

    // Fetch HQs and Enterprise Info (One-time or when enterpriseCode changes)
    const fetchEnterpriseData = React.useCallback(async () => {
        try {
            const user = await usersApi.getMe();
            const isAdmin = user.role?.level === 'SUPER_ADMIN' || user.role?.level === 'ADMIN';
            let membership = user.memberships?.find(m => m.enterprise?.enterpriseCode === enterpriseCode);
            let entId: string | undefined;

            if (!membership && isAdmin) {
                // If global admin and no explicit membership, fetch enterprise by code
                const entRes = await enterpriseApi.getAll({ search: enterpriseCode });
                const matchedEnt = entRes.data.find(e => e.enterpriseCode === enterpriseCode);
                if (matchedEnt) {
                    entId = matchedEnt.id;
                } else {
                    toast.error(t('hqtx.toasts.entNotFound'));
                    return;
                }
            } else if (!membership) {
                toast.error(t('hqtx.toasts.notAuth'));
                return;
            } else {
                entId = membership.enterprise?.id;
            }

            setEnterpriseId(entId || "");

            // Fetch HQs
            const hqsRes = await headquartersApi.getAll({ enterpriseId: entId });
            setHqs(hqsRes.data);
            setTotalHqs(hqsRes.meta?.total || hqsRes.data.length);
            setTotalActiveHqs(hqsRes.data.filter((h: any) => h.isActive).length);

            // Fetch initial transactions
            fetchTransactions(1, entId);

        } catch (error) {
            toast.error(t('hqtx.toasts.fetchFail'));
        }
    }, [enterpriseCode, fetchTransactions, t]);

    React.useEffect(() => {
        fetchEnterpriseData();
    }, [fetchEnterpriseData]);


    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handleFunding = async () => {
        if (!selectedHqId || !amount || Number(amount) <= 0) {
            toast.error(t('hqtx.toasts.reqAmountHq'));
            return;
        }

        if (txType === TransactionType.WITHDRAWAL && Number(amount) > (selectedHq?.withdrawalBalance || 0)) {
            toast.error(`${t('hqtx.toasts.insuffFunds')} ${formatCurrency(selectedHq?.withdrawalBalance || 0)}`);
            return;
        }

        if (txType === TransactionType.DEPOSIT) {
            const currentBalance = selectedHq?.balance || 0;
            const startedBalance = selectedHq?.startedBalance || 0;
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
                headquarterId: selectedHqId,
                description: txType === TransactionType.DEPOSIT
                    ? t('hqtx.desc.deposit')
                    : t('hqtx.desc.withdraw')
            });
            toast.success(t('hqtx.toasts.success'));
            setAmount("");
            setSelectedHqId("");
            fetchTransactions(1); // Refresh history and balances
        } catch (error) {
            toast.error(t('hqtx.toasts.failed'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectedHq = hqs.find(h => h.id === selectedHqId);

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
        if (!tx) return t('hqtx.desc.noActivity');
        return `${t('hqtx.desc.lastActivity')} ${formatDistanceToNow(new Date(tx.createdAt), { addSuffix: true })}`;
    };


    return (
        <div className="p-4 sm:p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tighter text-black uppercase flex items-center gap-3">
                        <Layers className="h-8 w-8 text-emerald-500" />
                        {t('hqtx.ui.title')}
                    </h1>
                    <p className="text-zinc-500 uppercase text-[10px] font-black tracking-[0.2em] mt-1">
                        {t('hqtx.ui.subtitle')}
                    </p>
                </div>
                <Badge variant="outline" className="w-fit bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px] font-black uppercase tracking-widest px-3 py-1 whitespace-nowrap">
                    {t('hqtx.ui.entLevelBadge')}
                </Badge>
            </div>

            {/* Global Indices Section */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="bg-slate-50 border-slate-200 backdrop-blur-md relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Building className="h-20 w-20 text-black" />
                    </div>
                    <CardHeader className="pb-2 space-y-0">
                        <CardDescription className="text-[9px] uppercase font-black text-zinc-500 tracking-[0.15em]">{t('hqtx.ui.totalHqs')}</CardDescription>
                        <CardTitle className="text-2xl font-black text-black">{totalHqs}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-[10px] text-emerald-400 font-bold uppercase tracking-widest">
                            {totalActiveHqs} {t('hqtx.ui.activeUnits')}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-50 border-slate-200 backdrop-blur-md relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <ArrowUpRight className="h-20 w-20 text-black" />
                    </div>
                    <CardHeader className="pb-2 space-y-0">
                        <CardDescription className="text-[9px] uppercase font-black text-zinc-500 tracking-[0.15em]">{t('hqtx.ui.totalDispatched')}</CardDescription>
                        <CardTitle className="text-2xl font-black text-black">
                            {formatCurrency(enterpriseTransactions.reduce((acc: number, tx: Transaction) => acc + (tx.type === TransactionType.DEPOSIT ? Number(tx.amount) : 0), 0))}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-[10px] text-blue-400 font-bold uppercase tracking-widest">
                            {t('hqtx.ui.acrossHqs')} {totalHqs} HQs
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-50 border-slate-200 backdrop-blur-md relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingUp className="h-20 w-20 text-black" />
                    </div>
                    <CardHeader className="pb-2 space-y-0">
                        <CardDescription className="text-[9px] uppercase font-black text-zinc-500 tracking-[0.15em]">{t('hqtx.ui.todayDist')}</CardDescription>
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
                        <CardDescription className="text-[9px] uppercase font-black text-zinc-500 tracking-[0.15em]">{t('hqtx.ui.todayWith')}</CardDescription>
                        <CardTitle className="text-2xl font-black text-rose-400">
                            {formatCurrency(todayWithdrawal)}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-[10px] text-blue-400 font-bold uppercase tracking-widest">
                            {formatLastActivity(lastWithTx)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
                {/* Distribution Form */}
                {/* <Card className="lg:col-span-4 bg-slate-50 border-slate-200 backdrop-blur-xl h-fit">
                    <CardHeader className="border-b border-slate-200">
                        <CardTitle className="text-sm font-black text-black uppercase tracking-widest flex items-center gap-2">
                            <PlusCircle className="h-4 w-4 text-emerald-500" />
                            {t('hqtx.form.title')}
                        </CardTitle>
                        <CardDescription className="text-[10px] font-bold text-zinc-500">
                            {txType === TransactionType.DEPOSIT
                                ? t('hqtx.form.descDep')
                                : t('hqtx.form.descWith')}
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
                                {t('hqtx.form.btnFunding')}
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
                                {t('hqtx.form.btnWithdrawal')}
                            </button>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">{t('hqtx.form.selectHqLabel')}</Label>
                            <Popover open={isHqSelectOpen} onOpenChange={setIsHqSelectOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={isHqSelectOpen}
                                        className="w-full justify-between bg-slate-50 border-slate-200 text-black h-11 hover:bg-slate-100"
                                    >
                                        {selectedHq ? selectedHq.name : t('hqtx.form.selectHqPlaceholder')}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-white border-slate-200 shadow-xl">
                                    <Command className="bg-transparent">
                                        <CommandInput placeholder={t("hqtx.form.searchHq")} className="h-9 text-slate-800" />
                                        <CommandEmpty>{t('hqtx.form.noHqFound')}</CommandEmpty>
                                        <CommandGroup className="max-h-64 overflow-y-auto">
                                            {hqs.map((hq: Headquarter) => (
                                                <CommandItem
                                                    key={hq.id}
                                                    value={`${hq.name} ${hq.code || ""} ${hq.manager?.fullName || ""}`}
                                                    onSelect={() => {
                                                        setSelectedHqId(hq.id || "");
                                                        setIsHqSelectOpen(false);
                                                    }}
                                                    className="hover:bg-slate-50 cursor-pointer text-slate-700 aria-selected:bg-emerald-50 aria-selected:text-emerald-700 font-medium"
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            selectedHqId === hq.id ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold">{hq.name}</span>
                                                            {hq.code && (
                                                                <Badge variant="outline" className="text-[8px] h-4 px-1 bg-slate-50 border-slate-200 text-zinc-500 font-mono rounded-md">
                                                                    {hq.code}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-[10px] text-zinc-500 uppercase tracking-tighter">
                                                            
                                                            <span>{hq.manager?.fullName || t('hqtx.form.noManager')}</span>
                                                            <span className="text-zinc-700">•</span>
                                                            <span className="text-emerald-500/70 font-bold">{formatCurrency(hq.balance || 0)}</span>
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
                            <Label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">{t('hqtx.form.amountLabel')}</Label>
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
                                    {txType === TransactionType.DEPOSIT ? t('hqtx.form.allocLabel') : t('hqtx.form.withdrawLabel')}
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
                            disabled={isSubmitting || !selectedHqId || !amount || (txType === TransactionType.WITHDRAWAL && Number(amount) > (selectedHq?.balance || 0)) || (txType === TransactionType.DEPOSIT && (selectedHq?.balance || 0) + Number(amount) > (selectedHq?.startedBalance || 0))}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {t('hqtx.form.processing')}
                                </>
                            ) : (
                                txType === TransactionType.WITHDRAWAL && Number(amount) > (selectedHq?.balance || 0)
                                    ? t('hqtx.form.insuffFundsBtn')
                                    : (txType === TransactionType.DEPOSIT && selectedHq && ((selectedHq.balance || 0) + Number(amount) > (selectedHq.startedBalance || 0))
                                        ? `${t('sellerTx.toasts.exceedsStarted')} ${formatCurrency(Math.max(0, (selectedHq.startedBalance || 0) - (selectedHq.balance || 0)))}`
                                        : (txType === TransactionType.DEPOSIT ? t('hqtx.form.execFundBtn') : t('hqtx.form.execWithBtn'))
                                    )
                            )}
                        </Button>
                    </CardContent>
                </Card> */}

                {/* Global HQ Log */}
                <Card className="lg:col-span-6 bg-slate-50 border-slate-200 backdrop-blur-xl">
                    <CardHeader className="border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <CardTitle className="text-sm font-black text-black uppercase tracking-widest flex items-center gap-2">
                            <History className="h-4 w-4 text-zinc-500" />
                            {t('hqtx.log.title')}
                        </CardTitle>
                        <div className="flex items-center gap-3">
                            <Button variant="outline" size="sm" className="h-7 border-slate-200 bg-slate-50 text-[9px] font-black uppercase tracking-widest hover:bg-slate-100" onClick={() => fetchTransactions(1)}>
                                <History className="h-3 w-3 mr-2" />
                                {t('hqtx.log.refreshBtn')}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="max-h-[600px] overflow-y-auto">
                            <Table>
                                <TableHeader className="sticky top-0 bg-slate-100/80 backdrop-blur-md z-10">
                                    <TableRow className="border-slate-200 hover:bg-transparent">
                                        <TableHead className="text-[9px] uppercase font-black text-zinc-500 tracking-widest w-[120px]">{t('hqtx.log.colRef')}</TableHead>
                                        <TableHead className="text-[9px] uppercase font-black text-zinc-500 tracking-widest">{t('hqtx.log.colTarget')}</TableHead>
                                        <TableHead className="text-[9px] uppercase font-black text-zinc-500 tracking-widest text-right">{t('hqtx.log.colAmount')}</TableHead>
                                        <TableHead className="text-[9px] uppercase font-black text-zinc-500 tracking-widest text-right">{t('hqtx.log.colStatus')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transactions.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-32 text-center text-zinc-500 text-[10px] font-black uppercase tracking-widest">
                                                {t('hqtx.log.noTx')}
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
                                                            <MapPin className="h-4 w-4 text-emerald-500" />
                                                        </div>
                                                        <div>
                                                            <div className="text-[11px] font-black text-slate-800 leading-tight">
                                                                {tx.headquarter?.name || t('hqtx.log.systemUnknown')}
                                                            </div>
                                                            <div className="text-[8px] font-black uppercase tracking-[0.1em] mt-0.5 text-blue-400">
                                                                {tx.type}
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
                                    {t('hqtx.log.pageLabel')} {page} {t('hqtx.log.ofLabel')} {totalPages}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => fetchTransactions(page - 1)}
                                        disabled={page <= 1 || isLoading}
                                        className="h-7 border-slate-200 bg-slate-50 text-zinc-500 hover:text-black hover:bg-slate-100 text-[9px] font-bold uppercase tracking-widest"
                                    >
                                        {t('hqtx.log.prevBtn')}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => fetchTransactions(page + 1)}
                                        disabled={page >= totalPages || isLoading}
                                        className="h-7 border-slate-200 bg-slate-50 text-zinc-500 hover:text-black hover:bg-slate-100 text-[9px] font-bold uppercase tracking-widest"
                                    >
                                        {t('hqtx.log.nextBtn')}
                                    </Button>
                                </div>
                            </div>
                        )}

                        <div className="p-4 border-t border-slate-200 bg-slate-50">
                            <Button variant="ghost" className="w-full text-zinc-500 hover:text-black hover:bg-slate-100 text-[10px] font-black uppercase tracking-widest h-8" onClick={() => fetchTransactions(1)}>
                                {t('hqtx.log.refreshHistBtn')}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div >
    );
};

export default HQTransaction;