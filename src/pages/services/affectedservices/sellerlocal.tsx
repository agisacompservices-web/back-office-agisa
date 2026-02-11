import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import {
    Building2,
    DollarSign,
    TrendingUp,
    Wallet,
    ArrowUpRight,
    MapPin,
    ShieldCheck,
    AlertCircle,
    Eye
} from "lucide-react";
import { toast } from "sonner";
import sellerApi, { Seller, SellerType } from "../../../context/api/seller";
import usersApi from "../../../context/api/users";
import { cn } from "../../../lib/utils";
import { Label } from "../../../components/ui/label";

const SellerLocal: React.FC = () => {
    const { enterpriseCode } = useParams<{ enterpriseCode: string }>();
    const [seller, setSeller] = useState<Seller | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchSellerData = useCallback(async () => {
        setIsLoading(true);
        try {
            // 1. Get current user's membership for this enterprise
            const user = await usersApi.getMe();
            const membership = user.memberships?.find(
                (m: any) => m.enterprise?.enterpriseCode === enterpriseCode
            );

            if (!membership) {
                toast.error("Error", { description: "You are not a member of this enterprise." });
                setIsLoading(false);
                return;
            }

            let targetSellerId = membership.sellerId;

            // 1b. Fallback: If no sellerId in membership, try finding seller point managed by user
            if (!targetSellerId) {
                const managedSellers = await sellerApi.getAll({
                    sellerId: user.id,
                    enterpriseId: membership.enterprise?.id,
                    limit: 1
                });

                if (managedSellers.data && managedSellers.data.length > 0) {
                    targetSellerId = managedSellers.data[0].id;
                }
            }

            if (!targetSellerId) {
                toast.error("Assignment Required", { description: "You are not yet linked to a specific sales point." });
                setIsLoading(false);
                return;
            }

            // 2. Fetch specific Seller point details
            const data = await sellerApi.getById(targetSellerId);
            setSeller(data);

        } catch (error: any) {
            console.error("Failed to fetch local seller details:", error);
            toast.error("Error", { description: "Could not load sales point data." });
        } finally {
            setIsLoading(false);
        }
    }, [enterpriseCode]);

    useEffect(() => {
        fetchSellerData();
    }, [fetchSellerData]);

    const getSellerTypeColor = (type: string) => {
        switch (type) {
            case SellerType.PLATINUM: return "border-blue-500/30 text-blue-400 bg-blue-500/5";
            case SellerType.GOLD: return "border-yellow-500/30 text-yellow-400 bg-yellow-500/5";
            case SellerType.SILVER: return "border-zinc-500/30 text-zinc-400 bg-zinc-500/5";
            default: return "border-emerald-500/30 text-emerald-400 bg-emerald-500/5";
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
                    <span className="text-[10px] uppercase font-black text-zinc-500 tracking-widest animate-pulse">Syncing Sales Point...</span>
                </div>
            </div>
        );
    }

    if (!seller) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-zinc-600">
                <AlertCircle className="h-12 w-12 mb-4 opacity-20" />
                <p className="font-bold text-sm uppercase tracking-widest">No assigned sales point found.</p>
                <p className="text-[10px] mt-1">Please contact your administrator for assignment.</p>
            </div>
        );
    }

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('fr-HT', { style: 'currency', currency: 'HTG' }).format(val);
    };

    return (
        <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                            <Building2 className="h-6 w-6 text-emerald-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-black tracking-tighter text-white uppercase">
                                {seller.name}
                            </h1>
                            <p className="text-zinc-500 uppercase text-[10px] font-black tracking-[0.2em] flex items-center gap-2">
                                Sales Point Operations <ShieldCheck className="h-3 w-3 text-emerald-500/50" />
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Badge className={cn(
                        "px-4 py-1.5 font-black text-[10px] uppercase tracking-widest rounded-lg border",
                        seller.isActive
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                            : "bg-red-500/10 text-red-400 border-red-500/20"
                    )}>
                        {seller.isActive ? "Online & Active" : "Suspended"}
                    </Badge>
                </div>
            </div>

            {/* Financial Overview Cards */}
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {/* Current Balance */}
                <Card className="bg-white/5 border-white/10 overflow-hidden relative group hover:border-emerald-500/30 transition-all duration-500 h-full backdrop-blur-sm">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Wallet className="h-20 w-20 text-emerald-500" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardDescription className="text-[9px] uppercase font-black text-zinc-500 tracking-[0.15em]">
                            Active Funds
                        </CardDescription>
                        <CardTitle className="text-2xl font-black text-white flex items-center gap-2">
                            {formatCurrency(seller.balance)}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-[10px] text-emerald-400 font-bold uppercase tracking-widest">
                            <TrendingUp className="h-3 w-3" />
                            Live Portfolio Balance
                        </div>
                    </CardContent>
                </Card>

                {/* Starting Balance */}
                <Card className="bg-white/5 border-white/10 overflow-hidden relative group hover:border-blue-500/30 transition-all duration-500 h-full backdrop-blur-sm">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <DollarSign className="h-20 w-20 text-blue-500" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardDescription className="text-[9px] uppercase font-black text-zinc-500 tracking-[0.15em]">
                            Allocation Rate
                        </CardDescription>
                        <CardTitle className="text-2xl font-black text-white flex items-center gap-2">
                            {formatCurrency(seller.startedBalance)}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-[10px] text-blue-400 font-bold uppercase tracking-widest">
                            <ArrowUpRight className="h-3 w-3" />
                            Initial Funding
                        </div>
                    </CardContent>
                </Card>

                {/* Commission Rate */}
                <Card className="bg-white/5 border-white/10 overflow-hidden relative group hover:border-orange-500/30 transition-all duration-500 h-full backdrop-blur-sm">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <ShieldCheck className="h-20 w-20 text-orange-500" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardDescription className="text-[9px] uppercase font-black text-zinc-500 tracking-[0.15em]">
                            Service Fee
                        </CardDescription>
                        <CardTitle className="text-4xl font-black text-white flex items-center gap-1">
                            {seller.commission}
                            <span className="text-sm font-medium text-zinc-500">%</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-[10px] text-orange-400 font-bold uppercase tracking-widest">
                            <ShieldCheck className="h-3 w-3" />
                            Revenue Commission
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Bottom Section: Location & Details */}
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
                <Card className="lg:col-span-2 bg-white/5 border-white/10 backdrop-blur-sm">
                    <CardHeader className="border-b border-white/5 pb-4">
                        <CardTitle className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-widest">
                            <MapPin className="h-4 w-4 text-emerald-500" />
                            Point of Sale Location
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <Label className="text-[9px] uppercase font-black text-zinc-600 tracking-widest">Street Address</Label>
                                    <p className="text-zinc-200 font-bold text-sm leading-relaxed">{seller.adresse?.adresseLigne1 || "N/A"}</p>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[9px] uppercase font-black text-zinc-600 tracking-widest">Created On</Label>
                                    <p className="text-zinc-400 font-medium text-xs">{new Date(seller.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <Label className="text-[9px] uppercase font-black text-zinc-600 tracking-widest">Department</Label>
                                    <p className="text-zinc-200 font-bold text-sm">{seller.adresse?.departement || "N/A"}</p>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[9px] uppercase font-black text-zinc-600 tracking-widest">Commune</Label>
                                    <p className="text-zinc-200 font-bold text-sm">{seller.adresse?.commune || "N/A"}</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <Label className="text-[9px] uppercase font-black text-zinc-600 tracking-widest">Section Communale</Label>
                                    <p className="text-zinc-200 font-bold text-sm">{seller.adresse?.sectionCommunale || "N/A"}</p>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[9px] uppercase font-black text-zinc-600 tracking-widest">Account Type</Label>
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                            "text-[9px] font-black uppercase px-2 py-0.5 rounded-md w-fit block border-[1px]",
                                            getSellerTypeColor(seller.type)
                                        )}
                                    >
                                        {seller.type}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-emerald-600/5 border-emerald-500/10 flex flex-col justify-center items-center p-8 text-center border-dashed backdrop-blur-sm">
                    <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
                        <Eye className="h-8 w-8 text-emerald-500" />
                    </div>
                    <CardTitle className="text-sm font-black text-white uppercase tracking-widest mb-2">Live View Enabled</CardTitle>
                    <p className="text-[10px] text-zinc-500 uppercase font-bold leading-relaxed max-w-[200px]">
                        You are currently viewing the local operations for this sales point.
                    </p>
                </Card>
            </div>
        </div>
    );
};

export default SellerLocal;
