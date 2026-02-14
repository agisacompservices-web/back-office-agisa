import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import sellerApi, { Seller } from "../../../context/api/seller";
import transactionApi, { Transaction, TransactionType } from "../../../context/api/transaction";
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
    CreditCard
} from "lucide-react";
import { cn } from "../../../lib/utils";

const SellerLocalTransaction: React.FC = () => {
    const { enterpriseCode } = useParams<{ enterpriseCode: string }>();
    const [amount, setAmount] = useState("");
    const [searchUser, setSearchUser] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [seller, setSeller] = useState<Seller | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [enterpriseId, setEnterpriseId] = useState<string>("");
    const [logSearch, setLogSearch] = useState("");

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const user = await usersApi.getMe();
            const membership = user.memberships?.find(m => m.enterprise?.enterpriseCode === enterpriseCode);
            if (!membership || !membership.sellerId) {
                toast.error("Not authorized or no assigned seller point");
                return;
            }
            const entId = membership.enterprise?.id;
            setEnterpriseId(entId || "");

            const [sellerRes, txsRes] = await Promise.all([
                sellerApi.getById(membership.sellerId),
                transactionApi.getAll(entId, undefined, membership.sellerId)
            ]);

            setSeller(sellerRes);
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

    const handleDeposit = async () => {
        if (!amount || Number(amount) <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }

        if (Number(amount) > (seller?.balance || 0)) {
            toast.error(`Insufficient funds. Available: ${formatCurrency(seller?.balance || 0)}`);
            return;
        }

        setIsSubmitting(true);
        try {
            // A client deposit by a cashier is a WITHDRAWAL from the point's balance
            await transactionApi.create({
                type: TransactionType.WITHDRAWAL,
                amount: Number(amount),
                enterpriseId,
                sellerId: seller?.id,
                description: `Client Deposit - Point: ${seller?.name}. Targeted to user: ${searchUser || 'General User'}`
            });
            toast.success("Deposit recorded successfully");
            setAmount("");
            setSearchUser("");
            fetchData();
        } catch (error) {
            toast.error("Failed to record deposit");
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('fr-HT', { style: 'currency', currency: 'HTG' }).format(val);
    };

    const todayStr = new Date().toISOString().split('T')[0];
    const todaySales = transactions
        .filter(tx => tx.type === TransactionType.WITHDRAWAL && tx.createdAt.startsWith(todayStr))
        .reduce((acc, tx) => acc + Number(tx.amount), 0);

    // Example commission calculation (placeholder - real logic should be in backend)
    const commissionRate = seller?.commission || 0;
    const todayCommission = todaySales * (commissionRate / 100);

    const filteredTransactions = transactions.filter(tx => {
        const search = logSearch.toLowerCase();
        return (
            tx.id.toLowerCase().includes(search) ||
            tx.description?.toLowerCase().includes(search) ||
            tx.status.toLowerCase().includes(search)
        );
    });

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
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tighter text-white uppercase flex items-center gap-3">
                        <ArrowDownLeft className="h-8 w-8 text-emerald-500" />
                        Cashier Operations
                    </h1>
                    <p className="text-zinc-500 uppercase text-[10px] font-black tracking-[0.2em] mt-1">
                        Manage your point-of-sale deposits and activity
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                        <div className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">{seller?.name}</div>
                        <div className="text-[8px] font-bold text-emerald-500 uppercase tracking-tighter">{seller?.code}</div>
                    </div>
                    <Badge variant="outline" className="w-fit bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] font-black uppercase tracking-widest px-3 py-1">
                        Point Active
                    </Badge>
                </div>
            </div>

            {/* Local Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-white/5 border-white/10 backdrop-blur-md relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Wallet className="h-20 w-20 text-white" />
                    </div>
                    <CardHeader className="pb-2 space-y-0">
                        <CardDescription className="text-[9px] uppercase font-black text-zinc-500 tracking-[0.15em]">My Balance</CardDescription>
                        <CardTitle className="text-2xl font-black text-white">{formatCurrency(Number(seller?.balance || 0))}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-[10px] text-emerald-400 font-bold uppercase tracking-widest">
                            Available for client deposits
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10 backdrop-blur-md relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingUp className="h-20 w-20 text-white" />
                    </div>
                    <CardHeader className="pb-2 space-y-0">
                        <CardDescription className="text-[9px] uppercase font-black text-zinc-500 tracking-[0.15em]">Today's Sales</CardDescription>
                        <CardTitle className="text-2xl font-black text-rose-400">{formatCurrency(todaySales)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-[10px] text-blue-400 font-bold uppercase tracking-widest">
                            {transactions.filter(tx => tx.createdAt.startsWith(todayStr)).length} Operations performed
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10 backdrop-blur-md relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <CheckCircle2 className="h-20 w-20 text-white" />
                    </div>
                    <CardHeader className="pb-2 space-y-0">
                        <CardDescription className="text-[9px] uppercase font-black text-zinc-500 tracking-[0.15em]">Total Commission</CardDescription>
                        <CardTitle className="text-2xl font-black text-white">{formatCurrency(todayCommission)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                            Accumulated today ({commissionRate}%)
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
                {/* Local Deposit Form */}
                <Card className="lg:col-span-4 bg-white/5 border-white/10 backdrop-blur-xl h-fit">
                    <CardHeader className="border-b border-white/5">
                        <CardTitle className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                            <PlusCircle className="h-4 w-4 text-emerald-500" />
                            Client Deposit
                        </CardTitle>
                        <CardDescription className="text-[10px] font-bold text-zinc-500">
                            Credits will be applied instantly to the user
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">Target Client (Optional/Reference)</Label>
                            <div className="relative group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" />
                                <Input
                                    className="bg-black/40 border-white/10 text-white pl-10 h-11 focus:border-emerald-500/50 transition-all font-medium"
                                    placeholder="Client name or code..."
                                    value={searchUser}
                                    onChange={(e) => setSearchUser(e.target.value)}
                                />
                            </div>
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
                            "rounded-xl border p-4 transition-colors",
                            Number(amount) > (seller?.balance || 0) ? "bg-rose-500/5 border-rose-500/10" : "bg-emerald-500/5 border-emerald-500/10"
                        )}>
                            <div className="flex justify-between items-center text-[10px] font-bold">
                                <span className="text-zinc-500 uppercase tracking-widest">Total to Transfer</span>
                                <span className={cn(
                                    "text-lg font-black font-mono",
                                    Number(amount) > (seller?.balance || 0) ? "text-rose-400" : "text-emerald-400"
                                )}>
                                    {formatCurrency(Number(amount) || 0)}
                                </span>
                            </div>
                        </div>

                        <Button
                            className={cn(
                                "w-full text-white h-12 font-black uppercase tracking-widest transition-all",
                                Number(amount) > (seller?.balance || 0)
                                    ? "bg-rose-600 hover:bg-rose-500"
                                    : "bg-emerald-600 hover:bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                            )}
                            onClick={handleDeposit}
                            disabled={isSubmitting || !amount || Number(amount) <= 0 || Number(amount) > (seller?.balance || 0)}
                        >
                            {isSubmitting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                Number(amount) > (seller?.balance || 0) ? "Insufficient Balance" : "Confirm Deposit"
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* Local History Table */}
                <Card className="lg:col-span-6 bg-white/5 border-white/10 backdrop-blur-xl">
                    <CardHeader className="border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <CardTitle className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                            <History className="h-4 w-4 text-zinc-500" />
                            Activity Log
                        </CardTitle>
                        <div className="flex items-center gap-3">
                            <div className="relative group">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" />
                                <Input
                                    placeholder="Search log..."
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
                                    <TableHead className="text-[9px] uppercase font-black text-zinc-500 tracking-widest">Type / Context</TableHead>
                                    <TableHead className="text-[9px] uppercase font-black text-zinc-500 tracking-widest text-right">Amount</TableHead>
                                    <TableHead className="text-[9px] uppercase font-black text-zinc-500 tracking-widest text-right">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredTransactions.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-32 text-center text-zinc-500 text-[10px] font-black uppercase tracking-widest">
                                            No local transactions found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredTransactions.map((tx) => (
                                        <TableRow key={tx.id} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                                            <TableCell className="font-mono text-[10px] font-bold text-zinc-400 group-hover:text-zinc-200 uppercase tracking-tighter">
                                                #{tx.id.substring(0, 6)}
                                                <div className="text-[8px] font-medium text-zinc-600 mt-1">{new Date(tx.createdAt).toLocaleDateString()}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                                                        <CreditCard className={cn(
                                                            "h-4 w-4",
                                                            tx.type === TransactionType.DEPOSIT ? "text-emerald-500" : "text-blue-500"
                                                        )} />
                                                    </div>
                                                    <div>
                                                        <div className="text-[11px] font-black text-zinc-200 leading-tight">
                                                            {tx.type === TransactionType.DEPOSIT
                                                                ? "REFILL RECEIVED"
                                                                : (tx.description?.includes("Capital") ? "CAPITAL WITHDRAWAL" : "CLIENT DEPOSIT")}
                                                        </div>
                                                        <div className="text-[8px] font-black uppercase tracking-[0.1em] mt-0.5 text-zinc-500 max-w-[150px] truncate">
                                                            {tx.description || "Point Transaction"}
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
                            <Button variant="ghost" className="w-full text-zinc-500 hover:text-white text-[10px] font-black uppercase tracking-widest h-8" onClick={fetchData}>
                                Reload Transactions
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default SellerLocalTransaction;