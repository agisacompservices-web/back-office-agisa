import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { isSameDay, parseISO } from "date-fns";
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
import headquartersApi, { Headquarter } from "../../../context/api/headquarters";
import sellerApi, { Seller } from "../../../context/api/seller";
import transactionApi, { Transaction, TransactionType } from "../../../context/api/transaction";
import usersApi from "../../../context/api/users";

const HQLocalTransaction: React.FC = () => {
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

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const user = await usersApi.getMe();
            const membership = user.memberships?.find(m => m.enterprise?.enterpriseCode === enterpriseCode);

            if (!membership || !membership.headquarter?.id) {
                toast.error("Not authorized or no assigned Headquarter");
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
            setTransactions(txsRes);
        } catch (error) {
            toast.error("Failed to fetch data");
        } finally {
            setIsLoading(false);
        }
    }, [enterpriseCode]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleFunding = async () => {
        if (!selectedSellerId || !amount || Number(amount) <= 0) {
            toast.error("Please select a seller and enter a valid amount");
            return;
        }

        const selectedSeller = sellers.find(s => s.id === selectedSellerId);
        if (txType === TransactionType.WITHDRAWAL && Number(amount) > (selectedSeller?.balance || 0)) {
            toast.error(`Insufficient funds in seller balance. Available: ${formatCurrency(selectedSeller?.balance || 0)}`);
            return;
        }

        setIsSubmitting(true);
        try {
            await transactionApi.create({
                type: txType,
                amount: Number(amount),
                enterpriseId,
                headquarterId: hq?.id,
                sellerId: selectedSellerId,
                description: txType === TransactionType.DEPOSIT
                    ? `Seller Funding from HQ: ${hq?.name}`
                    : `Seller Capital Withdrawal to HQ: ${hq?.name}`
            });

            toast.success(txType === TransactionType.DEPOSIT ? "Funding successful" : "Withdrawal successful");
            setAmount("");
            setSelectedSellerId("");

            // Try to refresh data, but don't treat refresh failure as transaction failure
            try {
                await fetchData();
            } catch (refreshError) {
                console.error("Refresh failed after success:", refreshError);
                toast.warning("Transaction recorded, but data refresh failed. Check your connectivity.");
            }
        } catch (error) {
            console.error("Transaction failed:", error);
            toast.error("Transaction failed. Check your internet and try again.");
        } finally {
            setIsSubmitting(false);
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
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tighter text-white uppercase flex items-center gap-3">
                        <Building2 className="h-8 w-8 text-emerald-500" />
                        HQ Operations
                    </h1>
                    <p className="text-zinc-500 uppercase text-[10px] font-black tracking-[0.2em] mt-1">
                        Manage local HQ capital and seller distributions
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                        <div className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">{hq?.name}</div>
                        <div className="text-[8px] font-bold text-emerald-500 uppercase tracking-tighter">{hq?.code}</div>
                    </div>
                    <Badge variant="outline" className="w-fit bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] font-black uppercase tracking-widest px-3 py-1">
                        HQ Control Active
                    </Badge>
                </div>
            </div>

            {/* HQ Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="bg-white/5 border-white/10 backdrop-blur-md relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Wallet className="h-20 w-20 text-white" />
                    </div>
                    <CardHeader className="pb-2 space-y-0">
                        <CardDescription className="text-[9px] uppercase font-black text-zinc-500 tracking-[0.15em]">HQ Operating Balance</CardDescription>
                        <CardTitle className="text-2xl font-black text-white">{formatCurrency(Number(hq?.balance || 0))}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-[10px] text-emerald-400 font-bold uppercase tracking-widest">
                            Ready for distribution
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10 backdrop-blur-md relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Coins className="h-20 w-20 text-white" />
                    </div>
                    <CardHeader className="pb-2 space-y-0">
                        <CardDescription className="text-[9px] uppercase font-black text-zinc-500 tracking-[0.15em]">Total Commission</CardDescription>
                        <CardTitle className="text-2xl font-black text-white">{formatCurrency(Number(hq?.commission || 0))}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-[10px] text-amber-400 font-bold uppercase tracking-widest">
                            Earned from operations
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10 backdrop-blur-md relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingUp className="h-20 w-20 text-white" />
                    </div>
                    <CardHeader className="pb-2 space-y-0">
                        <CardDescription className="text-[9px] uppercase font-black text-zinc-500 tracking-[0.15em]">Daily Distributions</CardDescription>
                        <CardTitle className="text-2xl font-black text-emerald-400">{formatCurrency(todayFunding)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                            Refills to sellers
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10 backdrop-blur-md relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingDown className="h-20 w-20 text-white" />
                    </div>
                    <CardHeader className="pb-2 space-y-0">
                        <CardDescription className="text-[9px] uppercase font-black text-zinc-500 tracking-[0.15em]">Daily Recoveries</CardDescription>
                        <CardTitle className="text-2xl font-black text-rose-400">{formatCurrency(todayWithdrawal)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                            Withdrawals from sellers
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
                {/* Funding Form */}
                <Card className="lg:col-span-4 bg-white/5 border-white/10 backdrop-blur-xl h-fit">
                    <CardHeader className="border-b border-white/5">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                                    <PlusCircle className="h-4 w-4 text-emerald-500" />
                                    Seller Funding
                                </CardTitle>
                                <CardDescription className="text-[10px] font-bold text-zinc-500">
                                    Transfer operating credits to a seller point
                                </CardDescription>
                            </div>
                            <div className="flex rounded-lg bg-black/40 p-1 border border-white/5">
                                <button
                                    onClick={() => setTxType(TransactionType.DEPOSIT)}
                                    className={cn(
                                        "px-3 py-1 text-[9px] font-black uppercase tracking-tighter rounded-md transition-all",
                                        txType === TransactionType.DEPOSIT ? "bg-emerald-500 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"
                                    )}
                                >
                                    Refill
                                </button>
                                <button
                                    onClick={() => setTxType(TransactionType.WITHDRAWAL)}
                                    className={cn(
                                        "px-3 py-1 text-[9px] font-black uppercase tracking-tighter rounded-md transition-all",
                                        txType === TransactionType.WITHDRAWAL ? "bg-rose-500 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"
                                    )}
                                >
                                    Withdraw
                                </button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">Select Target Seller</Label>
                            <Popover open={isSellerSelectOpen} onOpenChange={setIsSellerSelectOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={isSellerSelectOpen}
                                        className="w-full justify-between bg-black/40 border-white/10 text-white h-11 hover:bg-black/60 hover:text-white"
                                    >
                                        {selectedSellerId ? (
                                            <div className="flex items-center justify-between w-full">
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="h-4 w-4 text-emerald-500" />
                                                    <span className="font-bold">{sellers.find(s => s.id === selectedSellerId)?.name}</span>
                                                    <Badge variant="outline" className="text-[8px] h-4 bg-white/5 border-white/10 text-zinc-400 uppercase">
                                                        {sellers.find(s => s.id === selectedSellerId)?.code}
                                                    </Badge>
                                                </div>
                                                <div className="text-[10px] font-mono font-black text-emerald-500">
                                                    {formatCurrency(Number(sellers.find(s => s.id === selectedSellerId)?.withdrawalBalance || 0))}
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">Select target point...</span>
                                        )}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-full p-0 bg-zinc-900 border-white/10" align="start">
                                    <Command className="bg-transparent">
                                        <CommandInput placeholder="Search seller..." className="h-9 text-white" />
                                        <CommandList>
                                            <CommandEmpty className="py-6 text-center text-xs text-zinc-500 font-bold uppercase">No seller found.</CommandEmpty>
                                            <CommandGroup>
                                                {sellers.map((seller) => (
                                                    <CommandItem
                                                        key={seller.id}
                                                        value={seller.name + " " + seller.code}
                                                        onSelect={() => {
                                                            setSelectedSellerId(seller.id);
                                                            setIsSellerSelectOpen(false);
                                                        }}
                                                        className="text-white hover:bg-white/5 cursor-pointer py-3"
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4 text-emerald-500",
                                                                selectedSellerId === seller.id ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-xs uppercase">{seller.name}</span>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <span className="text-[9px] text-zinc-500 font-black">{seller.code}</span>
                                                                <span className="text-[9px] text-emerald-500/80 font-mono font-bold leading-none">
                                                                    {formatCurrency(Number(seller.withdrawalBalance || 0))}
                                                                </span>
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
                            <Label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">Amount (HTG)</Label>
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
                            "rounded-xl border p-4 transition-all space-y-3",
                            txType === TransactionType.WITHDRAWAL && Number(amount) > (selectedSeller?.withdrawalBalance || 0)
                                ? "bg-rose-500/5 border-rose-500/10"
                                : "bg-emerald-500/5 border-emerald-500/10"
                        )}>
                            <div className="flex justify-between items-center text-[10px] font-bold">
                                <span className="text-zinc-500 uppercase tracking-widest">
                                    {txType === TransactionType.WITHDRAWAL ? "Seller Withdrawal Balance" : "Seller Current Balance"}
                                </span>
                                <span className="text-white font-mono">
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
                        </div>

                        <Button
                            className={cn(
                                "w-full text-white h-12 font-black uppercase tracking-widest transition-all",
                                txType === TransactionType.DEPOSIT
                                    ? "bg-emerald-600 hover:bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                                    : "bg-rose-600 hover:bg-rose-500 border-rose-500/20"
                            )}
                            onClick={handleFunding}
                            disabled={isSubmitting || !selectedSellerId || !amount || Number(amount) <= 0 || (txType === TransactionType.WITHDRAWAL && Number(amount) > (selectedSeller?.withdrawalBalance || 0))}
                        >
                            {isSubmitting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                txType === TransactionType.DEPOSIT
                                    ? "Process Funding"
                                    : (Number(amount) > (selectedSeller?.withdrawalBalance || 0) ? "Insufficient Withdrawal Balance" : "Confirm Settlement")
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* HQ History Table */}
                <Card className="lg:col-span-6 bg-white/5 border-white/10 backdrop-blur-xl">
                    <CardHeader className="border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <CardTitle className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                            <History className="h-4 w-4 text-zinc-500" />
                            Funding History
                        </CardTitle>
                        <div className="flex items-center gap-3">
                            <div className="relative group">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" />
                                <Input
                                    placeholder="Search history..."
                                    className="h-7 pl-8 text-[9px] bg-black/40 border-white/10 text-white w-40 placeholder:text-zinc-600 focus:border-emerald-500/50"
                                    value={logSearch}
                                    onChange={(e) => setLogSearch(e.target.value)}
                                />
                            </div>
                            <Button variant="outline" size="sm" className="h-7 border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-widest" onClick={fetchData}>
                                <Filter className="h-3 w-3 mr-2" />
                                Refresh
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-white/5 hover:bg-transparent">
                                    <TableHead className="text-[9px] uppercase font-black text-zinc-500 tracking-widest w-[100px]">Reference</TableHead>
                                    <TableHead className="text-[9px] uppercase font-black text-zinc-500 tracking-widest">Target Seller</TableHead>
                                    <TableHead className="text-[9px] uppercase font-black text-zinc-500 tracking-widest text-right">Amount</TableHead>
                                    <TableHead className="text-[9px] uppercase font-black text-zinc-500 tracking-widest text-right">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredTransactions.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-32 text-center text-zinc-500 text-[10px] font-black uppercase tracking-widest">
                                            No local funding history found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredTransactions.map((tx) => (
                                        <TableRow key={tx.id} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                                            <TableCell className="font-mono text-[10px] font-bold text-zinc-400 group-hover:text-zinc-200 uppercase tracking-tighter">
                                                #{tx.id.substring(0, 6)}
                                                <div className="text-[8px] font-medium text-zinc-600 mt-1">
                                                    {new Date(tx.createdAt).toLocaleDateString()}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                                                        <CreditCard className={cn(
                                                            "h-4 w-4",
                                                            tx.type === TransactionType.DEPOSIT ? "text-emerald-500" : "text-rose-500"
                                                        )} />
                                                    </div>
                                                    <div>
                                                        <div className="text-[11px] font-black text-zinc-200 leading-tight">
                                                            {tx.seller?.name || "Refill Received"}
                                                        </div>
                                                        <div className={cn(
                                                            "text-[8px] font-black uppercase tracking-[0.1em] mt-0.5",
                                                            tx.type === TransactionType.DEPOSIT ? 'text-emerald-500' : 'text-rose-500'
                                                        )}>
                                                            {tx.type === TransactionType.DEPOSIT ? 'Capital Distribution' : 'Capital Recovery'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className={cn(
                                                    "text-xs font-black font-mono tracking-tighter",
                                                    tx.type === TransactionType.DEPOSIT ? "text-emerald-400" : "text-rose-400"
                                                )}>
                                                    {tx.type === TransactionType.DEPOSIT ? "-" : "+"}{formatCurrency(tx.amount)}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Badge variant="outline" className={cn(
                                                    "text-[8px] font-black uppercase tracking-widest py-0 h-5",
                                                    tx.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-orange-500/10 text-orange-500 border-orange-500/20'
                                                )}>
                                                    {tx.status}
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
                                className="w-full text-zinc-500 hover:text-white text-[10px] font-black uppercase tracking-widest h-8"
                                onClick={fetchData}
                            >
                                Reload Local Activity Log
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default HQLocalTransaction;