import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import {
    RefreshCw,
    Loader2,
    User,
    Clock,
    AlertCircle,
    ArrowLeftRight,
    Search,
    Info
} from 'lucide-react';
import { toast } from 'sonner';
import zonecashApi from '../../../../context/api/zonecash';
import { format } from 'date-fns';

const ZoneCashGlobalChangeRequests: React.FC = () => {
    const { t } = useTranslation();
    const [requests, setRequests] = useState<any[]>([]);
    const [filteredRequests, setFilteredRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');

    const fetchRequests = useCallback(async () => {
        setLoading(true);
        try {
            const data = await zonecashApi.getGlobalChangeRequests();
            setRequests(data);
        } catch (err) {
            toast.error(t('globalChange.errorFetchRequests', 'Failed to fetch exchange requests'));
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    // Apply filtering client-side
    useEffect(() => {
        let result = requests;

        if (statusFilter !== 'ALL') {
            result = result.filter(req => req.status === statusFilter);
        }

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(req => {
                const requesterName = req.requester?.fullName?.toLowerCase() || '';
                const requesterPhone = req.requester?.phone?.toLowerCase() || '';
                const providerName = req.provider?.fullName?.toLowerCase() || '';
                const providerPhone = req.provider?.phone?.toLowerCase() || '';
                const id = req.id?.toLowerCase() || '';

                return requesterName.includes(query) || 
                       requesterPhone.includes(query) || 
                       providerName.includes(query) || 
                       providerPhone.includes(query) ||
                       id.includes(query);
            });
        }

        setFilteredRequests(result);
    }, [requests, searchQuery, statusFilter]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return <Badge className="bg-green-100 text-green-700 border-green-200 font-black text-[10px] uppercase">Completed</Badge>;
            case 'ACCEPTED':
                return <Badge className="bg-blue-100 text-blue-700 border-blue-200 font-black text-[10px] uppercase">Accepted</Badge>;
            case 'CANCELLED':
                return <Badge className="bg-red-100 text-red-700 border-red-200 font-black text-[10px] uppercase">Cancelled</Badge>;
            case 'PENDING':
            default:
                return <Badge className="bg-amber-100 text-amber-700 border-amber-200 font-black text-[10px] uppercase">Pending</Badge>;
        }
    };

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <span className="ml-2 text-xs font-bold text-slate-500 uppercase tracking-widest">{t('globalChange.loading', 'Loading...')}</span>
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black tracking-tight text-black uppercase flex items-center gap-2">
                        <ArrowLeftRight className="h-7 w-7 text-blue-600" />
                        {t('globalChange.requestsTitle', 'Money Market — Exchange Requests')}
                    </h2>
                    <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider mt-1">
                        {t('globalChange.requestsDescription', 'View and monitor peer-to-peer currency swap/exchange requests')}
                    </p>
                </div>
                <Button variant="outline" onClick={fetchRequests} className="self-start sm:self-auto border-slate-200 text-zinc-500 font-bold uppercase text-[10px] tracking-widest h-10 px-4">
                    <RefreshCw className="h-3 w-3 mr-2" />
                    {t('globalChange.refresh', 'Refresh')}
                </Button>
            </div>

            {/* Filter controls */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50 p-4 rounded-lg border border-slate-100">
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    {['ALL', 'PENDING', 'ACCEPTED', 'COMPLETED', 'CANCELLED'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-wider border transition-all ${
                                statusFilter === status
                                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>

                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder={t('common.searchPlaceholder', 'Search by name, phone or ID...')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-md text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400 font-bold"
                    />
                </div>
            </div>

            <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-6 py-4">
                    <CardTitle className="text-[11px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        <Info className="h-3.5 w-3.5 text-blue-500" />
                        {t('globalChange.recentRequests', 'Recent Swap/Exchange Requests')}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/30 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">{t('globalChange.requester', 'Requester')}</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">{t('globalChange.provider', 'Provider')}</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">{t('globalChange.amount', 'Amount')}</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">{t('globalChange.target', 'Target')}</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">{t('globalChange.status', 'Status')}</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">{t('globalChange.commission', 'Commission')}</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">{t('globalChange.profitShared', 'Profit Shared')}</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">{t('globalChange.date', 'Date')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredRequests.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center justify-center opacity-40">
                                                <AlertCircle size={40} className="mb-2 text-slate-300" />
                                                <p className="text-sm font-bold uppercase tracking-widest text-slate-400">{t('globalChange.noRequests', 'No swap requests found')}</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRequests.map((req) => (
                                        <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                                            {/* Requester */}
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center">
                                                        <User size={14} className="text-blue-500" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-black text-slate-900">{req.requester?.fullName || 'N/A'}</p>
                                                        <p className="text-[10px] font-bold text-slate-400">{req.requester?.phone || 'N/A'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            {/* Provider */}
                                            <td className="px-6 py-5">
                                                {req.provider ? (
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                                                            <User size={14} className="text-emerald-600" />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-black text-slate-900">{req.provider.fullName}</p>
                                                            <p className="text-[10px] font-bold text-slate-400">{req.provider.phone}</p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase italic">No agent yet</span>
                                                )}
                                            </td>
                                            {/* Amount */}
                                            <td className="px-6 py-5">
                                                <span className="text-xs font-black text-slate-900">
                                                    {Number(req.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {req.currency}
                                                </span>
                                            </td>
                                            {/* Target Currency */}
                                            <td className="px-6 py-5">
                                                <Badge className="bg-slate-100 text-slate-700 border-slate-200 font-black text-[10px] uppercase">
                                                    {req.targetCurrency}
                                                </Badge>
                                            </td>
                                            {/* Status */}
                                            <td className="px-6 py-5">
                                                {getStatusBadge(req.status)}
                                            </td>
                                            {/* Commission */}
                                            <td className="px-6 py-5">
                                                <span className="text-xs font-bold text-slate-700">
                                                    {req.commissionAmount != null 
                                                        ? `${Number(req.commissionAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} HTG`
                                                        : '-'}
                                                </span>
                                            </td>
                                            {/* Profit Shared */}
                                            <td className="px-6 py-5">
                                                <span className="text-xs font-bold text-slate-700">
                                                    {req.profitShared != null 
                                                        ? `${Number(req.profitShared).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} HTG`
                                                        : '-'}
                                                </span>
                                            </td>
                                            {/* Date */}
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-1.5 text-slate-400">
                                                    <Clock size={12} />
                                                    <span className="text-[10px] font-bold">
                                                        {format(new Date(req.createdAt), 'MMM dd, yyyy • HH:mm')}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ZoneCashGlobalChangeRequests;
