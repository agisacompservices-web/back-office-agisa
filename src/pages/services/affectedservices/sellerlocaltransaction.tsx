import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import sellerApi, { Seller } from "../../../context/api/seller";
import transactionApi, { Transaction, TransactionType } from "../../../context/api/transaction";
import bettingApi from "../../../context/api/betting";
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

const SellerLocalTransaction: React.FC = () => {
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

    const handleLookupPlayer = async () => {
        if (!bettingPhone || bettingPhone.length < 8) {
            toast.error("Please enter a valid phone number");
            return;
        }

        setIsLookingUp(true);
        try {
            const player = await bettingApi.getPlayerByPhone(bettingPhone, enterpriseId);
            setFoundPlayer(player);
            setBettingPlayerId(player.playerId);
            toast.success("Player found: " + player.fullName);
        } catch (error) {
            toast.error("Player not found in betting system");
            setFoundPlayer(null);
            setBettingPlayerId("");
        } finally {
            setIsLookingUp(false);
        }
    };

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

    const handleExternalBettingDeposit = async () => {
        if (!bettingPlayerId || !bettingAmount || Number(bettingAmount) <= 0) {
            toast.error("Player ID and valid amount are required");
            return;
        }

        if (Number(bettingAmount) > (seller?.balance || 0)) {
            toast.error("Insufficient balance for this betting deposit");
            return;
        }

        setIsSubmitting(true);
        try {
            await bettingApi.deposit({
                playerId: bettingPlayerId,
                amount: Number(bettingAmount),
                enterpriseId,
                description: `External Betting Deposit - Player: ${foundPlayer?.fullName || bettingPlayerId}`
            });
            toast.success("Betting deposit successfully synced");
            setBettingAmount("");
            setBettingPlayerId("");
            setBettingPhone("");
            setFoundPlayer(null);
            fetchData();
        } catch (error) {
            toast.error("Failed to sync betting deposit");
        } finally {
            setIsSubmitting(false);
        }
    };


    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('fr-HT', { style: 'currency', currency: 'HTG' }).format(val);
    };

    const todayStr = new Date().toISOString().split('T')[0];
    const todaySales = transactions
        .filter(tx => (tx.type === TransactionType.WITHDRAWAL || tx.type === TransactionType.EXTERNAL_DEPOSIT) && tx.createdAt.startsWith(todayStr))
        .reduce((acc, tx) => acc + Number(tx.amount), 0);

    const commissionRate = seller?.commission || 0;
    const todayCommission = todaySales * (commissionRate / 100);


    const isBettingEnterprise = seller?.enterprise?.category?.name?.toLowerCase() === 'betting';

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
                        Manage local deposits and External Betting Bridge
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                        <div className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">{seller?.name}</div>
                        <div className="text-[8px] font-bold text-emerald-500 uppercase tracking-tighter">{seller?.code}</div>
                    </div>
                    <Badge variant="outline" className="w-fit bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] font-black uppercase tracking-widest px-3 py-1 whitespace-nowrap">
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
                <Card className="bg-white/5 border-white/10 backdrop-blur-md relative overflow-hidden group" style={{ borderLeft: '3px solid #f87171' }}>
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* Deposit Forms Column */}
                <div className="space-y-8">
                    {/* Standard Client Deposit Card - Hidden if Betting */}
                    {!isBettingEnterprise && (
                        <Card className="bg-white/5 border-white/10 backdrop-blur-xl h-fit border-t-2 border-t-emerald-500">
                            <CardHeader className="border-b border-white/5">
                                <CardTitle className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                                    <PlusCircle className="h-4 w-4 text-emerald-500" />
                                    Standard Client Deposit
                                </CardTitle>
                                <CardDescription className="text-[10px] font-bold text-zinc-500">
                                    Direct wallet refill for Agisa players
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">Client Ref</Label>
                                        <Input
                                            className="bg-black/40 border-white/10 text-white h-11 focus:border-emerald-500/50 transition-all font-medium"
                                            placeholder="Reference..."
                                            value={searchUser}
                                            onChange={(e) => setSearchUser(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">Amount (HTG)</Label>
                                        <Input
                                            type="number"
                                            className="bg-black/40 border-white/10 text-white h-11 focus:border-emerald-500/50 transition-all font-black text-lg"
                                            placeholder="0.00"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <Button
                                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white h-11 font-black uppercase tracking-widest transition-all"
                                    onClick={handleDeposit}
                                    disabled={isSubmitting || !amount}
                                >
                                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Local Deposit"}
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {/* Betting Deposit Form - Only if Betting */}
                    {isBettingEnterprise && (
                        <Card className="bg-[#1e1b4b]/40 border-indigo-500/20 backdrop-blur-xl border-t-2 border-t-indigo-500">
                            <CardHeader className="border-b border-white/5">
                                <CardTitle className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                                    <Gamepad2 className="h-4 w-4 text-indigo-400" />
                                    Betting Deposit (Refill)
                                </CardTitle>
                                <CardDescription className="text-[10px] font-bold text-indigo-300/60">
                                    Send credits to an external betting account
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase font-black text-indigo-300/60 tracking-widest">Player Phone Number</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                className="bg-black/40 border-indigo-500/10 text-white h-11 focus:border-indigo-500/50 transition-all font-medium"
                                                placeholder="e.g. 509..."
                                                value={bettingPhone}
                                                onChange={(e) => setBettingPhone(e.target.value)}
                                            />
                                            <Button
                                                variant="outline"
                                                className="h-11 px-3 border-indigo-500/20 hover:bg-indigo-500/10 text-indigo-400"
                                                onClick={handleLookupPlayer}
                                                disabled={isLookingUp || !bettingPhone}
                                            >
                                                {isLookingUp ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase font-black text-indigo-300/60 tracking-widest">Amount (HTG)</Label>
                                        <Input
                                            type="number"
                                            className="bg-black/40 border-indigo-500/10 text-white h-11 focus:border-indigo-500/50 transition-all font-black text-lg"
                                            placeholder="0.00"
                                            value={bettingAmount}
                                            onChange={(e) => setBettingAmount(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {foundPlayer && (
                                    <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-3 flex items-center justify-between animate-in fade-in zoom-in duration-300">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-indigo-500/10 flex items-center justify-center">
                                                <CheckCircle2 className="h-4 w-4 text-indigo-400" />
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-black text-white uppercase">{foundPlayer.fullName}</div>
                                                <div className="text-[8px] font-mono text-indigo-300/50 uppercase tracking-tighter">ID: {foundPlayer.playerId}</div>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="text-[8px] font-black bg-indigo-500/10 text-indigo-300 border-indigo-500/20">VERIFIED</Badge>
                                    </div>
                                )}

                                <Button
                                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white h-11 font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(99,102,241,0.2)]"
                                    onClick={handleExternalBettingDeposit}
                                    disabled={isSubmitting || !bettingAmount || !bettingPlayerId}
                                >
                                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sync Refill"}
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right Column: Activity Log */}
                <div className="h-full">
                    <Card className="bg-white/5 border-white/10 backdrop-blur-xl h-full">
                        <CardHeader className="border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <CardTitle className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                                <History className="h-4 w-4 text-zinc-500" />
                                Activity Log
                            </CardTitle>
                            <div className="flex items-center gap-3">
                                <Button variant="outline" size="sm" className="h-7 border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-widest px-2" onClick={fetchData}>
                                    <Filter className="h-3 w-3 mr-1" />
                                    Sync
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="max-h-[600px] overflow-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-white/5 hover:bg-transparent">
                                            <TableHead className="text-[9px] uppercase font-black text-zinc-500 tracking-widest">Type</TableHead>
                                            <TableHead className="text-[9px] uppercase font-black text-zinc-500 tracking-widest text-right">Amount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {transactions.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={2} className="h-32 text-center text-zinc-500 text-[10px] font-black uppercase tracking-widest">
                                                    No history
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            transactions.map((tx) => (
                                                <TableRow key={tx.id} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-7 w-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                                                <CreditCard className={cn(
                                                                    "h-3 w-3",
                                                                    [TransactionType.DEPOSIT, TransactionType.EXTERNAL_WITHDRAWAL].includes(tx.type) ? "text-emerald-500" : "text-blue-500"
                                                                )} />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="text-[10px] font-black text-zinc-200 leading-tight truncate">
                                                                    {tx.type === TransactionType.EXTERNAL_DEPOSIT ? "REFILL" :
                                                                        tx.type === TransactionType.EXTERNAL_WITHDRAWAL ? "PAYOUT" :
                                                                            tx.type === TransactionType.DEPOSIT ? "CAPITAL" : "DEPOSIT"}
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
                                                            {[TransactionType.DEPOSIT, TransactionType.EXTERNAL_WITHDRAWAL].includes(tx.type) ? "+" : "-"}{formatCurrency(tx.amount)}
                                                        </div>
                                                        <div className="text-[7px] font-medium text-zinc-600 truncate">{new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default SellerLocalTransaction;