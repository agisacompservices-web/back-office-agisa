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
    ShieldHalf,
    Building2,
    DollarSign,
    TrendingUp,
    Wallet,
    ArrowUpRight
} from "lucide-react";
import { toast } from "sonner";
import headquartersApi, { Headquarter } from "../../../context/api/headquarters";
import usersApi from "../../../context/api/users";
import { cn } from "../../../lib/utils";
import { Label } from "../../../components/ui/label";

const HeadquaterLocal: React.FC = () => {
    const { enterpriseCode } = useParams<{ enterpriseCode: string }>();
    const [hq, setHq] = useState<Headquarter | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchHqData = useCallback(async () => {
        setIsLoading(true);
        try {
            // 1. Get Me to find membership
            const user = await usersApi.getMe();
            const membership = user.memberships?.find(
                (m: any) => m.enterprise?.enterpriseCode === enterpriseCode
            );

            if (!membership) {
                toast.error("Error", { description: "You are not a member of this enterprise." });
                setIsLoading(false);
                return;
            }

            let targetHqId = membership.headquarter?.id;

            // 1b. Fallback: If no headquarterId in membership, try finding HQ where user is manager
            if (!targetHqId) {
                console.log("No headquarterId in membership, trying manager fallback...");
                const managerHqs = await headquartersApi.getAll({
                    managerId: user.id,
                    enterpriseId: membership.enterprise?.id,
                    limit: 1
                });

                if (managerHqs.data && managerHqs.data.length > 0) {
                    targetHqId = managerHqs.data[0].id;
                }
            }

            if (!targetHqId) {
                toast.error("Error", { description: "You are not assigned to a headquarter." });
                setIsLoading(false);
                return;
            }

            // 2. Fetch specific HQ
            const res = await headquartersApi.getAll({
                headquarterId: targetHqId,
                limit: 1
            });

            if (res.data && res.data.length > 0) {
                setHq(res.data[0]);
            } else {
                toast.error("Error", { description: "Headquarter data not found." });
            }
        } catch (error) {
            console.error("Failed to fetch local headquarter details:", error);
            toast.error("Error", { description: "Could not load headquarter data." });
        } finally {
            setIsLoading(false);
        }
    }, [enterpriseCode]);

    useEffect(() => {
        fetchHqData();
    }, [fetchHqData]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    if (!hq) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-zinc-500">
                <ShieldHalf className="h-12 w-12 mb-4 opacity-20" />
                <p>No headquarter assigned or accessible.</p>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                        <Building2 className="h-6 w-6 sm:h-8 sm:w-8 text-emerald-500" />
                        {hq.name}
                    </h1>
                    <p className="text-zinc-500 mt-1 uppercase text-[10px] sm:text-xs font-black tracking-widest flex items-center gap-2">
                        Local Headquarter Management <ArrowUpRight className="h-3 w-3" />
                    </p>
                </div>
                <Badge className={cn(
                    "w-fit px-4 py-1 font-bold",
                    hq.isActive
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-red-500/10 text-red-400 border-red-500/20"
                )}>
                    {hq.isActive ? "ACTIVE" : "SUSPENDED"}
                </Badge>
            </div>

            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {/* Balance Card */}
                <Card className="bg-white/5 border-white/10 overflow-hidden relative group hover:border-emerald-500/30 transition-all duration-300">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Wallet className="h-24 w-24 text-emerald-500" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardDescription className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">
                            Current Balance
                        </CardDescription>
                        <CardTitle className="text-xl sm:text-2xl font-black text-white flex items-center gap-2 flex-wrap min-w-0">
                            {hq.balance?.toLocaleString() || "0"}
                            <span className="text-xs font-medium text-zinc-500">USD</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold">
                            <TrendingUp className="h-3 w-3" />
                            Live funds available
                        </div>
                    </CardContent>
                </Card>

                {/* Started Balance Card */}
                <Card className="bg-white/5 border-white/10 overflow-hidden relative group hover:border-blue-500/30 transition-all duration-300">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <DollarSign className="h-24 w-24 text-blue-500" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardDescription className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">
                            Starting Balance
                        </CardDescription>
                        <CardTitle className="text-xl sm:text-2xl font-black text-white flex items-center gap-2 flex-wrap min-w-0">
                            {hq.startedBalance?.toLocaleString() || "0"}
                            <span className="text-xs font-medium text-zinc-500">USD</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-xs text-blue-400 font-bold">
                            <ArrowUpRight className="h-3 w-3" />
                            Initial allocation
                        </div>
                    </CardContent>
                </Card>

                {/* Commission Card */}
                <Card className="bg-white/5 border-white/10 overflow-hidden relative group hover:border-orange-500/30 transition-all duration-300">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <TrendingUp className="h-24 w-24 text-orange-500" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardDescription className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">
                            Commission Rate
                        </CardDescription>
                        <CardTitle className="text-3xl sm:text-4xl font-black text-white flex items-center gap-2 flex-wrap">
                            {hq.commission || "0"}
                            <span className="text-xs font-medium text-zinc-500">%</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-xs text-orange-400 font-bold">
                            <ShieldHalf className="h-3 w-3" />
                            Fixed service fee
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-white/5 border-white/10">
                <CardHeader>
                    <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                        <ShieldHalf className="h-5 w-5 text-emerald-500" />
                        Details Information
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6 grid-cols-1 sm:grid-cols-3">
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <Label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">Headquarter Name</Label>
                            <p className="text-white font-medium">{hq.name}</p>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">Service Type</Label>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="bg-zinc-800 text-zinc-300 border-white/5 rounded-md">
                                    {hq.type || "STANDARD"}
                                </Badge>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <Label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">Associated Manager</Label>
                            <p className="text-white font-medium">{hq.manager?.fullName || 'N/A'}</p>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">Created At</Label>
                            <p className="text-white font-medium">{hq.createdAt ? new Date(hq.createdAt).toLocaleDateString() : 'N/A'}</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <Label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">HQ Code</Label>
                            <p className="text-white font-medium uppercase tracking-wider">{hq.code || 'N/A'}</p>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">Location Info</Label>
                            <div className="text-white font-medium space-y-0.5">
                                {hq.adresse ? (
                                    <>
                                        <p className="truncate">{hq.adresse.adresseLigne1}</p>
                                        <p className="text-[10px] text-zinc-400">
                                            {hq.adresse.commune}, {hq.adresse.departement}
                                        </p>
                                    </>
                                ) : 'N/A'}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default HeadquaterLocal;