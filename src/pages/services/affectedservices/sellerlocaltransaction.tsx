import React, { useState } from "react";
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
    User,
    CheckCircle2,
    Filter,
    ArrowDownLeft
} from "lucide-react";
import { cn } from "../../../lib/utils";

// Mock data for initial design validation
const MOCK_TRANSACTIONS = [
    { id: "TX-9982", date: "2026-02-11 15:45", user: "Marc Antoine", type: "DEPOSIT", amount: 1200, status: "COMPLETED" },
    { id: "TX-9981", date: "2026-02-11 13:20", user: "Clara Desrosiers", type: "DEPOSIT", amount: 3500, status: "COMPLETED" },
    { id: "TX-9980", date: "2026-02-11 10:05", user: "Samuel Noel", type: "DEPOSIT", amount: 500, status: "PENDING" },
    { id: "TX-9979", date: "2026-02-10 17:30", user: "Main Branch", type: "CREDIT", amount: 20000, status: "COMPLETED" },
];

const SellerLocalTransaction: React.FC = () => {
    const [amount, setAmount] = useState("");
    const [searchUser, setSearchUser] = useState("");

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('fr-HT', { style: 'currency', currency: 'HTG' }).format(val);
    };

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
                <Badge variant="outline" className="w-fit bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] font-black uppercase tracking-widest px-3 py-1">
                    Point Active
                </Badge>
            </div>

            {/* Local Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-white/5 border-white/10 backdrop-blur-md relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Wallet className="h-20 w-20 text-white" />
                    </div>
                    <CardHeader className="pb-2 space-y-0">
                        <CardDescription className="text-[9px] uppercase font-black text-zinc-500 tracking-[0.15em]">My Balance</CardDescription>
                        <CardTitle className="text-2xl font-black text-white">{formatCurrency(12450.50)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-[10px] text-emerald-400 font-bold uppercase tracking-widest">
                            Available for deposits
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10 backdrop-blur-md relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingUp className="h-20 w-20 text-white" />
                    </div>
                    <CardHeader className="pb-2 space-y-0">
                        <CardDescription className="text-[9px] uppercase font-black text-zinc-500 tracking-[0.15em]">Today's Sales</CardDescription>
                        <CardTitle className="text-2xl font-black text-white">{formatCurrency(5200.00)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-[10px] text-blue-400 font-bold uppercase tracking-widest">
                            2 Operations performed
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10 backdrop-blur-md relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <CheckCircle2 className="h-20 w-20 text-white" />
                    </div>
                    <CardHeader className="pb-2 space-y-0">
                        <CardDescription className="text-[9px] uppercase font-black text-zinc-500 tracking-[0.15em]">Total Commission</CardDescription>
                        <CardTitle className="text-2xl font-black text-white">{formatCurrency(260.00)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                            Accumulated today (5%)
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
                            <Label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">Search Client</Label>
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

                        <div className="bg-emerald-500/5 rounded-xl border border-emerald-500/10 p-4">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-black text-white uppercase tracking-widest">Total Deposit</span>
                                <span className="text-lg font-black text-white font-mono">
                                    {formatCurrency(Number(amount) || 0)}
                                </span>
                            </div>
                        </div>

                        <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white h-12 font-black uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all">
                            Confirm Deposit
                        </Button>
                    </CardContent>
                </Card>

                {/* Local History Table */}
                <Card className="lg:col-span-6 bg-white/5 border-white/10 backdrop-blur-xl">
                    <CardHeader className="border-b border-white/5 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                                <History className="h-4 w-4 text-zinc-500" />
                                Activity Log
                            </CardTitle>
                        </div>
                        <Button variant="outline" size="sm" className="h-8 border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-widest">
                            <Filter className="h-3 w-3 mr-2" />
                            Filter
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-white/5 hover:bg-transparent">
                                    <TableHead className="text-[9px] uppercase font-black text-zinc-500 tracking-widest w-[100px]">Reference</TableHead>
                                    <TableHead className="text-[9px] uppercase font-black text-zinc-500 tracking-widest">Client</TableHead>
                                    <TableHead className="text-[9px] uppercase font-black text-zinc-500 tracking-widest text-right">Amount</TableHead>
                                    <TableHead className="text-[9px] uppercase font-black text-zinc-500 tracking-widest text-right">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {MOCK_TRANSACTIONS.map((tx) => (
                                    <TableRow key={tx.id} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                                        <TableCell className="font-mono text-[10px] font-bold text-zinc-400 group-hover:text-zinc-200 uppercase tracking-tighter">
                                            {tx.id}
                                            <div className="text-[8px] font-medium text-zinc-600 mt-1">{tx.date}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                                                    <User className="h-4 w-4 text-zinc-500" />
                                                </div>
                                                <div>
                                                    <div className="text-[11px] font-black text-zinc-200 leading-tight">{tx.user}</div>
                                                    <div className={cn(
                                                        "text-[8px] font-black uppercase tracking-[0.1em] mt-0.5",
                                                        tx.type === 'DEPOSIT' ? 'text-emerald-500' : 'text-blue-500'
                                                    )}>
                                                        {tx.type}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className={cn(
                                                "text-xs font-black font-mono tracking-tighter",
                                                tx.type === 'DEPOSIT' ? 'text-white' : 'text-blue-400'
                                            )}>
                                                {tx.type === 'DEPOSIT' ? '-' : '+'}{formatCurrency(tx.amount)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Badge variant="outline" className={cn(
                                                "text-[8px] font-black uppercase tracking-widest py-0 h-5",
                                                tx.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-orange-500/10 text-orange-500 border-orange-500/20'
                                            )}>
                                                {tx.status}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <div className="p-4 border-t border-white/5 bg-white/[0.01]">
                            <Button variant="ghost" className="w-full text-zinc-500 hover:text-white text-[10px] font-black uppercase tracking-widest h-8">
                                View All Transactions
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default SellerLocalTransaction;