import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { 
    RefreshCw, 
    Loader2, 
    User, 
    Clock,
    AlertCircle,
    Wallet,
    ArrowUpRight,
    Search
} from 'lucide-react';
import { toast } from 'sonner';
import zonecashApi from '../../../../context/api/zonecash';
import { format } from 'date-fns';
import { Input } from '../../../../components/ui/input';

const ZoneCashGlobalChangeBasket: React.FC = () => {
    const { t } = useTranslation();
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchBasket = useCallback(async () => {
        setLoading(true);
        try {
            const data = await zonecashApi.getGlobalChangeBasket();
            setRecords(data);
        } catch (err) {
            toast.error(t('globalChange.errorFetchBasket', 'Failed to fetch profit records'));
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchBasket();
    }, [fetchBasket]);

    const filteredRecords = records.filter(r => 
        r.transaction?.account?.user?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalProfit = records.reduce((acc, r) => acc + Number(r.amount), 0);

    if (loading && records.length === 0) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <span className="ml-2 text-xs font-bold text-slate-500 uppercase tracking-widest">{t('globalChange.loading', 'Loading...')}</span>
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black tracking-tight text-black uppercase">
                        {t('globalChange.basketTitle', 'Global Change — Profit Basket')}
                    </h2>
                    <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">
                        {t('globalChange.basketDescription', 'Monitor accumulated profits from currency exchange transactions')}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-green-50 border border-green-100 px-4 py-2 rounded-xl flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                            <Wallet size={16} className="text-white" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-green-600 uppercase leading-none mb-1">Total Profit</p>
                            <p className="text-lg font-black text-green-700 leading-none">HTG {totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                        </div>
                    </div>
                    <Button variant="outline" onClick={fetchBasket} className="border-slate-200 text-zinc-500 font-bold uppercase text-[10px] tracking-widest h-10 px-4">
                        <RefreshCw className={`h-3 w-3 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        {t('globalChange.refresh', 'Refresh')}
                    </Button>
                </div>
            </div>

            <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                        placeholder="Search by agent name or description..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 h-11 bg-slate-50 border-none font-bold text-slate-600 placeholder:text-slate-400 focus-visible:ring-blue-500"
                    />
                </div>
            </div>

            <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-6 py-4">
                    <CardTitle className="text-[11px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        <ArrowUpRight className="h-3.5 w-3.5 text-green-500" />
                        {t('globalChange.recentProfits', 'Recent Profit Records')}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/30 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Agent / Provider</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Description</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Profit (HTG)</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredRecords.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center justify-center opacity-40">
                                                <AlertCircle size={40} className="mb-2 text-slate-300" />
                                                <p className="text-sm font-bold uppercase tracking-widest text-slate-400">No profit records found</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRecords.map((record) => (
                                        <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center">
                                                        <User size={16} className="text-blue-500" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-900">{record.transaction?.account?.user?.fullName || 'System'}</p>
                                                        <p className="text-[10px] font-bold text-slate-400">{record.transaction?.account?.user?.phone || 'N/A'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <p className="text-[11px] font-bold text-slate-600 max-w-[300px] leading-relaxed">
                                                    {record.description}
                                                </p>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-green-600">
                                                        +HTG {Number(record.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </span>
                                                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter mt-0.5">
                                                        {record.currency}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-1.5 text-slate-400">
                                                    <Clock size={12} />
                                                    <span className="text-[11px] font-bold">{format(new Date(record.createdAt), 'MMM dd, yyyy • HH:mm')}</span>
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

export default ZoneCashGlobalChangeBasket;
