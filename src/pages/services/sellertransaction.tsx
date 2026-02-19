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

const SellerTransaction: React.FC = () => {
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
                    toast.error("Enterprise not found");
                    return;
                }
            } else if (!membership) {
                toast.error("Not authorized");
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
            toast.error("Failed to fetch data");
        }
    }, [enterpriseCode, fetchTransactions]);

    useEffect(() => {
        fetchEnterpriseData();
    }, [fetchEnterpriseData]);


    const handleFunding = async () => {
        const selectedSeller = sellers.find(s => s.id === selectedSellerId);

        if (!selectedSellerId || !amount || Number(amount) <= 0) {
            toast.error("Please select a seller and enter a valid amount");
            return;
        }

        if (txType === TransactionType.WITHDRAWAL && Number(amount) > (selectedSeller?.balance || 0)) {
            toast.error(`Insufficient funds. Available: ${formatCurrency(selectedSeller?.balance || 0)}`);
            return;
        }

        setIsSubmitting(true);
        try {
            await transactionApi.create({
                type: txType,
                amount: Number(amount),
                enterpriseId,
                sellerId: selectedSellerId,
                description: txType === TransactionType.DEPOSIT
                    ? "Seller Point Funding (Manual Allocation)"
                    : "Seller Point Capital Withdrawal"
            });
            toast.success(txType === TransactionType.DEPOSIT ? "Funding successful" : "Withdrawal successful");
            setAmount("");
            setSelectedSellerId("");
            fetchTransactions(1);
        } catch (error) {
            toast.error(txType === TransactionType.DEPOSIT ? "Funding failed" : "Withdrawal failed");
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectedSeller = sellers.find(s => s.id === selectedSellerId);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('fr-HT', { style: 'currency', currency: 'HTG' }).format(val);
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
        if (!tx) return "No activity yet";
        return `Last activity ${formatDistanceToNow(new Date(tx.createdAt), { addSuffix: true })}`;
    };


    return (
        <div className="p-4 sm:p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tighter text-white uppercase flex items-center gap-3">
                        <MonitorCheck className="h-8 w-8 text-emerald-500" />
                        Seller Funding & Oversight
                    </h1>
                    <p className="text-zinc-500 uppercase text-[10px] font-black tracking-[0.2em] mt-1">
                        Manage credit allocations and track performance for all assigned sellers
                    </p>
                </div>
                <Badge variant="outline" className="w-fit bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px] font-black uppercase tracking-widest px-3 py-1 whitespace-nowrap">
                    Point of Sale Level
                </Badge>
            </div>

            {/* Global Indices Section */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="bg-white/5 border-white/10 backdrop-blur-md relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Building className="h-20 w-20 text-white" />
                    </div>
                    <CardHeader className="pb-2 space-y-0">
                        <CardDescription className="text-[9px] uppercase font-black text-zinc-500 tracking-[0.15em]">Active Seller Points</CardDescription>
                        <CardTitle className="text-2xl font-black text-white">{totalSellers}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-[10px] text-emerald-400 font-bold uppercase tracking-widest">
                            {totalActiveSellers} Operational Groups
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10 backdrop-blur-md relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Wallet className="h-20 w-20 text-white" />
                    </div>
                    <CardHeader className="pb-2 space-y-0">
                        <CardDescription className="text-[9px] uppercase font-black text-zinc-500 tracking-[0.15em]">Total Seller Balance</CardDescription>
                        <CardTitle className="text-2xl font-black text-white">
                            {formatCurrency(sellers.reduce((acc, s) => acc + Number(s.balance || 0), 0))}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                            Aggregate Liquidity
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10 backdrop-blur-md relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingUp className="h-20 w-20 text-white" />
                    </div>
                    <CardHeader className="pb-2 space-y-0">
                        <CardDescription className="text-[9px] uppercase font-black text-zinc-500 tracking-[0.15em]">Today Distributed</CardDescription>
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
                <Card className="bg-white/5 border-white/10 backdrop-blur-md relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingDown className="h-20 w-20 text-white" />
                    </div>
                    <CardHeader className="pb-2 space-y-0">
                        <CardDescription className="text-[9px] uppercase font-black text-zinc-500 tracking-[0.15em]">Today Withdrawal</CardDescription>
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
                <Card className="lg:col-span-4 bg-white/5 border-white/10 backdrop-blur-xl h-fit">
                    <CardHeader className="border-b border-white/5">
                        <CardTitle className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                            <PlusCircle className="h-4 w-4 text-emerald-500" />
                            Seller Capital Assignment
                        </CardTitle>
                        <CardDescription className="text-[10px] font-bold text-zinc-500">
                            {txType === TransactionType.DEPOSIT
                                ? "Transfer operating credits to a managed seller"
                                : "Perform capital withdrawal from a managed seller"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        <div className="flex p-1 bg-black/40 rounded-lg border border-white/5">
                            <button
                                onClick={() => setTxType(TransactionType.DEPOSIT)}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-[10px] font-black uppercase tracking-widest transition-all",
                                    txType === TransactionType.DEPOSIT
                                        ? "bg-emerald-600 text-white shadow-lg"
                                        : "text-zinc-500 hover:text-zinc-300"
                                )}
                            >
                                <TrendingUp className="h-3 w-3" />
                                Funding
                            </button>
                            <button
                                onClick={() => setTxType(TransactionType.WITHDRAWAL)}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-[10px] font-black uppercase tracking-widest transition-all",
                                    txType === TransactionType.WITHDRAWAL
                                        ? "bg-rose-600 text-white shadow-lg"
                                        : "text-zinc-500 hover:text-zinc-300"
                                )}
                            >
                                <TrendingDown className="h-3 w-3" />
                                Withdrawal
                            </button>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">Target Seller Point</Label>
                            <Popover open={isSellerSelectOpen} onOpenChange={setIsSellerSelectOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={isSellerSelectOpen}
                                        className="w-full justify-between bg-black/40 border-white/10 text-white h-11 hover:bg-black/60 hover:text-white"
                                    >
                                        {selectedSeller ? selectedSeller.name : "Select a seller point..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-zinc-900 border-white/10">
                                    <Command className="bg-transparent">
                                        <CommandInput placeholder="Search seller..." className="h-9 text-white" />
                                        <CommandEmpty>No seller found.</CommandEmpty>
                                        <CommandGroup className="max-h-64 overflow-y-auto">
                                            {sellers.map((seller: Seller) => (
                                                <CommandItem
                                                    key={seller.id}
                                                    value={`${seller.name} ${seller.code || ""} ${seller.seller?.fullName || ""}`}
                                                    onSelect={() => {
                                                        setSelectedSellerId(seller.id || "");
                                                        setIsSellerSelectOpen(false);
                                                    }}
                                                    className="hover:bg-white/5 cursor-pointer text-zinc-300 aria-selected:bg-emerald-500/20 aria-selected:text-white"
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
                                                                <Badge variant="outline" className="text-[8px] h-4 px-1 bg-white/5 border-white/10 text-zinc-500 font-mono rounded-md">
                                                                    {seller.code}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-[10px] text-zinc-500 uppercase tracking-tighter">
                                                            <span>{seller.seller?.fullName || "No Assigned User"}</span>
                                                            <span className="text-zinc-700">•</span>
                                                            <span className="text-emerald-500/70 font-bold">{formatCurrency(seller.balance || 0)}</span>
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
                            <Label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">Transaction Amount (HTG)</Label>
                            <div className="relative group">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 h-4 text-zinc-500 font-bold text-xs group-focus-within:text-emerald-500 transition-colors uppercase">HTG</span>
                                <Input
                                    type="number"
                                    className="bg-black/40 border-white/10 text-white pl-12 h-11 focus:border-emerald-500/50 transition-all font-black text-lg"
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
                                <span className="text-xs font-black text-white uppercase tracking-widest">
                                    {txType === TransactionType.DEPOSIT ? "Amount to Allocate" : "Amount to Withdraw"}
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
                                "w-full text-white h-12 font-black uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed",
                                txType === TransactionType.DEPOSIT
                                    ? "bg-emerald-600 hover:bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                                    : "bg-rose-600 hover:bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.2)]"
                            )}
                            onClick={handleFunding}
                            disabled={isSubmitting || !selectedSellerId || !amount || (txType === TransactionType.WITHDRAWAL && Number(amount) > (selectedSeller?.balance || 0))}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                txType === TransactionType.WITHDRAWAL && Number(amount) > (selectedSeller?.balance || 0)
                                    ? "Insufficient Funds"
                                    : (txType === TransactionType.DEPOSIT ? "Fund Seller Account" : "Record Withdrawal")
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* Seller Funding History Table */}
                <Card className="lg:col-span-6 bg-white/5 border-white/10 backdrop-blur-xl">
                    <CardHeader className="border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <CardTitle className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                            <History className="h-4 w-4 text-zinc-500" />
                            Funding & Activity Log
                        </CardTitle>
                        <div className="flex items-center gap-3">
                            <Button variant="outline" size="sm" className="h-7 border-white/10 bg-white/5 text-[9px] font-black uppercase tracking-widest" onClick={() => fetchTransactions(1)}>
                                <History className="h-3 w-3 mr-2" />
                                Refresh
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="max-h-[600px] overflow-y-auto">
                            <Table>
                                <TableHeader className="sticky top-0 bg-zinc-900/50 backdrop-blur-md z-10">
                                    <TableRow className="border-white/5 hover:bg-transparent">
                                        <TableHead className="text-[9px] uppercase font-black text-zinc-500 tracking-widest w-[120px]">Reference</TableHead>
                                        <TableHead className="text-[9px] uppercase font-black text-zinc-500 tracking-widest">Seller / Point</TableHead>
                                        <TableHead className="text-[9px] uppercase font-black text-zinc-500 tracking-widest text-right">Amount</TableHead>
                                        <TableHead className="text-[9px] uppercase font-black text-zinc-500 tracking-widest text-right">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transactions.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-32 text-center text-zinc-500 text-[10px] font-black uppercase tracking-widest">
                                                No transactions found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        transactions.map((tx) => (
                                            <TableRow key={tx.id} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                                                <TableCell className="font-mono text-[10px] font-bold text-zinc-400 group-hover:text-zinc-200 uppercase tracking-tighter">
                                                    {tx.id.substring(0, 8)}...
                                                    <div className="text-[8px] font-medium text-zinc-600 mt-1">
                                                        {new Date(tx.createdAt).toLocaleString()}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                                                            <CreditCard className="h-4 w-4 text-emerald-500" />
                                                        </div>
                                                        <div>
                                                            <div className="text-[11px] font-black text-zinc-200 leading-tight">
                                                                {tx.seller?.name || "System/Unknown"}
                                                            </div>
                                                            <div className="text-[8px] font-black uppercase tracking-[0.1em] mt-0.5 text-blue-400">
                                                                {tx.type === TransactionType.DEPOSIT ? "Capital Funding" : "Funds Withdrawal"}
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
                            <div className="p-4 border-t border-white/5 bg-white/[0.01] flex items-center justify-between">
                                <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                                    Page {page} of {totalPages}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => fetchTransactions(page - 1)}
                                        disabled={page <= 1 || isLoading}
                                        className="h-7 border-white/10 bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 text-[9px] font-bold uppercase tracking-widest"
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => fetchTransactions(page + 1)}
                                        disabled={page >= totalPages || isLoading}
                                        className="h-7 border-white/10 bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 text-[9px] font-bold uppercase tracking-widest"
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}

                        <div className="p-4 border-t border-white/5 bg-white/[0.01]">
                            <Button variant="ghost" className="w-full text-zinc-500 hover:text-white text-[10px] font-black uppercase tracking-widest h-8" onClick={() => fetchTransactions(1)}>
                                Refresh Seller Activity History
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default SellerTransaction;