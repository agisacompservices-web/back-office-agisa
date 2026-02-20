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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../../../components/ui/table";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "../../../components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../../../components/ui/select";
import {
    ShieldHalf,
    Building2,
    DollarSign,
    TrendingUp,
    Wallet,
    ArrowUpRight,
    Plus,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    RefreshCcw,
    Filter,
    X,
    FileText
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../../components/ui/button";
import headquartersApi, { Headquarter } from "../../../context/api/headquarters";
import { HeadquarterRequestDialog } from "../../../components/requests/HeadquarterRequestDialog";
import requestApi, { Request, RequestStatus, RequestType } from "../../../context/api/request";
import usersApi from "../../../context/api/users";
import { cn } from "../../../lib/utils";
import { Label } from "../../../components/ui/label";
import { useTranslation } from "react-i18next";

const HeadquaterLocal: React.FC = () => {
    const { t } = useTranslation();
    const { enterpriseCode } = useParams<{ enterpriseCode: string }>();
    const [hq, setHq] = useState<Headquarter | null>(null);
    const [requests, setRequests] = useState<Request[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRequestsLoading, setIsRequestsLoading] = useState(false);
    const [filterType, setFilterType] = useState<string>("ALL");
    const [filterStatus, setFilterStatus] = useState<string>("ALL");

    const fetchHqData = useCallback(async () => {
        setIsLoading(true);
        try {
            // 1. Get Me to find membership
            const user = await usersApi.getMe();
            const membership = user.memberships?.find(
                (m: any) => m.enterprise?.enterpriseCode === enterpriseCode
            );

            if (!membership) {
                toast.error(t('hqLocal.toasts.error'), { description: t('hqLocal.toasts.notMember') });
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
                toast.error(t('hqLocal.toasts.error'), { description: t('hqLocal.toasts.noHqAssign') });
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
                toast.error(t('hqLocal.toasts.error'), { description: t('hqLocal.toasts.hqNotFound') });
            }
        } catch (error) {
            console.error("Failed to fetch local headquarter details:", error);
            toast.error(t('hqLocal.toasts.error'), { description: t('hqLocal.toasts.hqLoadFail') });
        } finally {
            setIsLoading(false);
        }
    }, [enterpriseCode, t]);

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 10;

    const fetchRequests = useCallback(async (pageToFetch = 1) => {
        if (!hq?.id) return;
        try {
            setIsRequestsLoading(true);
            const params: any = {
                headquarterId: hq.id,
                page: pageToFetch,
                limit
            };
            if (filterType !== "ALL") params.type = filterType;
            if (filterStatus !== "ALL") params.status = filterStatus;

            const data = await requestApi.getAll(params);
            setRequests(data.data || []);
            setTotalPages(data.meta.lastPage || 1);
            setPage(data.meta.page || pageToFetch);
        } catch (error) {
            console.error("Failed to fetch requests:", error);
        } finally {
            setIsRequestsLoading(false);
        }
    }, [hq?.id, filterType, filterStatus]);

    useEffect(() => {
        fetchHqData();
    }, [fetchHqData]);

    useEffect(() => {
        fetchRequests(1);
    }, [fetchRequests]);

    const getStatusIcon = (status: RequestStatus) => {
        switch (status) {
            case RequestStatus.APPROVED: return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
            case RequestStatus.REJECTED: return <XCircle className="h-4 w-4 text-red-500" />;
            case RequestStatus.CANCELLED: return <AlertCircle className="h-4 w-4 text-zinc-500" />;
            default: return <Clock className="h-4 w-4 text-orange-500 animate-pulse" />;
        }
    };

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
                <p>{t('hqLocal.state.noHqAssigned')}</p>
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
                        {t('hqLocal.ui.mgmt')} <ArrowUpRight className="h-3 w-3" />
                    </p>
                </div>
                <div className="flex gap-2 items-center">
                    <Badge className={cn(
                        "w-fit px-4 py-1 font-bold rounded-md",
                        hq.isActive
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-red-500/10 text-red-400 border-red-500/20"
                    )}>
                        {hq.isActive ? t('hqLocal.ui.active') : t('hqLocal.ui.suspended')}
                    </Badge>
                    <HeadquarterRequestDialog
                        headquarterId={hq.id}
                        enterpriseId={hq.enterpriseId}
                        isActive={hq.isActive}
                        maxWithdrawalBalance={hq.withdrawalBalance || 0}
                    >
                        <Badge className="rounded-md cursor-pointer hover:bg-emerald-500/20 transition-colors gap-1.5 py-1 px-3 text-emerald-400 bg-emerald-500/10 border-emerald-500/20">
                            <Plus className="h-4 w-4" />
                            {t('hqLocal.ui.requestBtn')}
                        </Badge>
                    </HeadquarterRequestDialog>
                </div>
            </div>

            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                {/* Balance Card */}
                <Card className="bg-white/5 border-white/10 overflow-hidden relative group hover:border-emerald-500/30 transition-all duration-300">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Wallet className="h-24 w-24 text-emerald-500" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardDescription className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">
                            {t('hqLocal.cards.currBal')}
                        </CardDescription>
                        <CardTitle className="text-xl sm:text-2xl font-black text-white flex items-center gap-2 flex-wrap min-w-0">
                            {hq.balance?.toLocaleString() || "0"}
                            <span className="text-xs font-medium text-zinc-500">HTG</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold">
                            <TrendingUp className="h-3 w-3" />
                            {t('hqLocal.cards.liveFunds')}
                        </div>
                    </CardContent>
                </Card>

                {/* Withdrawal Balance Card */}
                <Card className="bg-white/5 border-white/10 overflow-hidden relative group hover:border-orange-500/30 transition-all duration-300" style={{ borderLeft: '3px solid #f97316' }}>
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <TrendingUp className="h-24 w-24 text-orange-500" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardDescription className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">
                            {t('hqLocal.cards.withBal')}
                        </CardDescription>
                        <CardTitle className="text-xl sm:text-2xl font-black text-white flex items-center gap-2 flex-wrap min-w-0">
                            {hq.withdrawalBalance?.toLocaleString() || "0"}
                            <span className="text-xs font-medium text-zinc-500">HTG</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-xs text-orange-400 font-bold">
                            <TrendingUp className="h-3 w-3" />
                            {t('hqLocal.cards.settled')}
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
                            {t('hqLocal.cards.startBal')}
                        </CardDescription>
                        <CardTitle className="text-xl sm:text-2xl font-black text-white flex items-center gap-2 flex-wrap min-w-0">
                            {hq.startedBalance?.toLocaleString() || "0"}
                            <span className="text-xs font-medium text-zinc-500">HTG</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-xs text-blue-400 font-bold">
                            <ArrowUpRight className="h-3 w-3" />
                            {t('hqLocal.cards.initAlloc')}
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
                            {t('hqLocal.cards.commBal')}
                        </CardDescription>
                        <CardTitle className="text-3xl sm:text-4xl font-black text-white flex items-center gap-2 flex-wrap">
                            {hq.commission || "0"}
                            <span className="text-xs font-medium text-zinc-500">HTG</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-xs text-orange-400 font-bold">
                            <ShieldHalf className="h-3 w-3" />
                            {t('hqLocal.cards.fixedFee')}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="details" className="w-full">
                <TabsList className="bg-white/5 border-white/10 w-full sm:w-auto p-1 font-bold">
                    <TabsTrigger value="details" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
                        {t('hqLocal.tabs.hqProfile')}
                    </TabsTrigger>
                    <TabsTrigger value="requests" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
                        {t('hqLocal.tabs.reqHistory')}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="mt-6">
                    <Card className="bg-white/5 border-white/10">
                        <CardHeader>
                            <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                                <ShieldHalf className="h-5 w-5 text-emerald-500" />
                                {t('hqLocal.details.infoTitle')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-6 grid-cols-1 sm:grid-cols-3">
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <Label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">{t('hqLocal.details.hqName')}</Label>
                                    <p className="text-white font-medium">{hq.name}</p>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">{t('hqLocal.details.srvType')}</Label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="outline" className="bg-zinc-800 text-zinc-300 border-white/5 rounded-md">
                                            {hq.type || "STANDARD"}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <Label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">{t('hqLocal.details.assocMgr')}</Label>
                                    <p className="text-white font-medium">{hq.manager?.fullName || t('hqLocal.details.na')}</p>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">{t('hqLocal.details.createdAt')}</Label>
                                    <p className="text-white font-medium">{hq.createdAt ? new Date(hq.createdAt).toLocaleDateString('en-US') : t('hqLocal.details.na')}</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <Label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">{t('hqLocal.details.hqCode')}</Label>
                                    <p className="text-white font-medium uppercase tracking-wider">{hq.code || t('hqLocal.details.na')}</p>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">{t('hqLocal.details.locInfo')}</Label>
                                    <div className="text-white font-medium space-y-0.5">
                                        {hq.adresse ? (
                                            <>
                                                <p className="truncate">{hq.adresse.adresseLigne1}</p>
                                                <p className="text-[10px] text-zinc-400">
                                                    {hq.adresse.commune}, {hq.adresse.departement}
                                                </p>
                                            </>
                                        ) : t('hqLocal.details.na')}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="requests" className="mt-6">
                    <Card className="bg-white/5 border-white/10">
                        <CardHeader>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-emerald-500" />
                                    {t('hqLocal.reqs.subHist')}
                                </CardTitle>

                                <div className="flex flex-wrap items-center gap-2">
                                    <div className="flex items-center gap-2 bg-zinc-900/50 border border-white/5 rounded-md px-2 py-1">
                                        <Filter className="h-3 w-3 text-zinc-500" />
                                        <Select value={filterType} onValueChange={setFilterType}>
                                            <SelectTrigger className="h-7 w-[110px] bg-transparent border-none text-[10px] font-bold uppercase tracking-wider focus:ring-0">
                                                <SelectValue placeholder={t('hqLocal.reqs.typePH')} />
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                                <SelectItem value="ALL">{t('hqLocal.reqs.allTypes')}</SelectItem>
                                                <SelectItem value={RequestType.DEPOSIT}>Deposit</SelectItem>
                                                <SelectItem value={RequestType.WITHDRAWAL}>Withdrawal</SelectItem>
                                                <SelectItem value={RequestType.ACTIVATION}>Activation</SelectItem>
                                                <SelectItem value={RequestType.DEACTIVATION}>Deactivation</SelectItem>
                                            </SelectContent>
                                        </Select>

                                        <div className="h-4 w-px bg-white/5 mx-1" />

                                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                                            <SelectTrigger className="h-7 w-[110px] bg-transparent border-none text-[10px] font-bold uppercase tracking-wider focus:ring-0">
                                                <SelectValue placeholder={t('hqLocal.reqs.statusPH')} />
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                                <SelectItem value="ALL">{t('hqLocal.reqs.allStatus')}</SelectItem>
                                                <SelectItem value={RequestStatus.PENDING}>Pending</SelectItem>
                                                <SelectItem value={RequestStatus.APPROVED}>Approved</SelectItem>
                                                <SelectItem value={RequestStatus.REJECTED}>Rejected</SelectItem>
                                                <SelectItem value={RequestStatus.CANCELLED}>Cancelled</SelectItem>
                                            </SelectContent>
                                        </Select>

                                        {(filterType !== "ALL" || filterStatus !== "ALL") && (
                                            <>
                                                <div className="h-4 w-px bg-white/5 mx-1" />
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 w-6 p-0 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-full"
                                                    onClick={() => {
                                                        setFilterType("ALL");
                                                        setFilterStatus("ALL");
                                                    }}
                                                    title={t('hqLocal.reqs.clearFilters')}
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </>
                                        )}
                                    </div>

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-zinc-500 hover:text-white h-9 px-3 gap-2"
                                        onClick={() => fetchRequests(1)}
                                        disabled={isRequestsLoading}
                                    >
                                        <RefreshCcw className={cn("h-4 w-4", isRequestsLoading && "animate-spin")} />
                                        <span className="hidden sm:inline">{t('hqLocal.reqs.refresh')}</span>
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isRequestsLoading ? (
                                <div className="py-10 text-center text-zinc-500 animate-pulse text-xs font-bold uppercase tracking-widest">
                                    {t('hqLocal.state.fetchingReqs')}
                                </div>
                            ) : requests.length === 0 ? (
                                <div className="py-20 text-center flex flex-col items-center gap-3">
                                    <ShieldHalf className="h-10 w-10 text-zinc-800" />
                                    <p className="text-zinc-500 text-sm font-medium">{t('hqLocal.state.noReqs')}</p>
                                </div>
                            ) : (
                                <div className="rounded-md border border-white/5 overflow-hidden">
                                    <Table>
                                        <TableHeader className="bg-white/[0.02]">
                                            <TableRow className="border-white/5">
                                                <TableHead className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">{t('hqLocal.reqs.cols.type')}</TableHead>
                                                <TableHead className="text-[10px] uppercase font-black text-zinc-500 tracking-widest text-right">{t('hqLocal.reqs.cols.amount')}</TableHead>
                                                <TableHead className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">{t('hqLocal.reqs.cols.status')}</TableHead>
                                                <TableHead className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">{t('hqLocal.reqs.cols.date')}</TableHead>
                                                <TableHead className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">{t('hqLocal.reqs.cols.desc')}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {requests.map((request) => (
                                                <TableRow key={request.id} className="border-white/5 hover:bg-white/[0.02] transition-colors">
                                                    <TableCell className="font-bold text-white text-xs">
                                                        <div className="flex items-center gap-2">
                                                            <span>{request.type}</span>
                                                            {request.receiptUrl && (
                                                                <a href={request.receiptUrl} target="_blank" rel="noreferrer" className="text-emerald-500 hover:text-emerald-400" title={t('hqLocal.reqs.viewTx')}>
                                                                    <FileText className="h-3.5 w-3.5" />
                                                                </a>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right font-black text-white text-xs whitespace-nowrap">
                                                        {request.amount ? `${Number(request.amount).toLocaleString('en-US')} USD` : '-'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2 text-[10px] font-black tracking-wider uppercase">
                                                            {getStatusIcon(request.status)}
                                                            <span className={cn(
                                                                request.status === RequestStatus.APPROVED && "text-emerald-500",
                                                                request.status === RequestStatus.REJECTED && "text-red-500",
                                                                request.status === RequestStatus.PENDING && "text-orange-500",
                                                                request.status === RequestStatus.CANCELLED && "text-zinc-500",
                                                                request.status === RequestStatus.IN_ACCOUNTING && "text-purple-500",
                                                                request.status === RequestStatus.AUDITED && "text-blue-500",
                                                                request.status === RequestStatus.IN_LITIGATION && "text-yellow-500",
                                                                request.status === RequestStatus.IN_FINANCE && "text-pink-500",
                                                                request.status === RequestStatus.COMPLETED && "text-green-500"
                                                            )}>
                                                                {request.status}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-zinc-400 text-xs">
                                                        {new Date(request.createdAt).toLocaleDateString('en-US')}
                                                    </TableCell>
                                                    <TableCell className="text-zinc-500 text-xs italic truncate max-w-[200px]">
                                                        {request.description || t('hqLocal.reqs.noDesc')}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}

                            {/* Pagination Controls */}
                            {requests.length > 0 && (
                                <div className="flex items-center justify-between mt-4">
                                    <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                                        {t('hqLocal.reqs.pageLabel')} {page} {t('hqLocal.reqs.ofLabel')} {totalPages}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => fetchRequests(page - 1)}
                                            disabled={page <= 1 || isRequestsLoading}
                                            className="h-8 border-white/10 bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 text-[10px] font-bold uppercase tracking-widest"
                                        >
                                            {t('hqLocal.reqs.prevBtn')}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => fetchRequests(page + 1)}
                                            disabled={page >= totalPages || isRequestsLoading}
                                            className="h-8 border-white/10 bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 text-[10px] font-bold uppercase tracking-widest"
                                        >
                                            {t('hqLocal.reqs.nextBtn')}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default HeadquaterLocal;