import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { RefreshCw, Save, Loader2, DollarSign, User, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import zonecashApi from '../../../../context/api/zonecash';

const ZoneCashGlobalChangeFees: React.FC = () => {
    const { t } = useTranslation();
    const [personalFee, setPersonalFee] = useState('');
    const [businessFee, setBusinessFee] = useState('');
    const [personalLimit, setPersonalLimit] = useState('');
    const [businessLimit, setBusinessLimit] = useState('');
    const [agentCommissionPercentage, setAgentCommissionPercentage] = useState('');
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchFees = useCallback(async () => {
        setLoading(true);
        try {
            const data = await zonecashApi.getGlobalChangeFees();
            setPersonalFee(data.personalFee.toString());
            setBusinessFee(data.businessFee.toString());
            setPersonalLimit(data.personalLimit.toString());
            setBusinessLimit(data.businessLimit.toString());
            setAgentCommissionPercentage(data.agentCommissionPercentage.toString());
        } catch (err) {
            toast.error(t('globalChange.errorFetch', 'Failed to fetch fees'));
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchFees();
    }, [fetchFees]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const p = parseFloat(personalFee);
        const b = parseFloat(businessFee);
        const pl = parseFloat(personalLimit);
        const bl = parseFloat(businessLimit);
        const acp = parseFloat(agentCommissionPercentage);

        if (isNaN(p) || p < 0 || isNaN(b) || b < 0 || isNaN(pl) || pl < 0 || isNaN(bl) || bl < 0 || isNaN(acp) || acp < 0) {
            toast.error(t('globalChange.invalidValues', 'Please enter valid fees, limits and commission'));
            return;
        }

        setIsSubmitting(true);
        try {
            await zonecashApi.updateGlobalChangeFees({
                personalFee: p, 
                businessFee: b,
                personalLimit: pl,
                businessLimit: bl,
                agentCommissionPercentage: acp
            } as any);
            toast.success(t('globalChange.successUpdate', 'Global Change settings updated successfully!'));
            fetchFees();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || t('globalChange.errorUpdate', 'Failed to update fees'));
        } finally {
            setIsSubmitting(false);
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
            <div>
                <h2 className="text-3xl font-black tracking-tight text-black uppercase">
                    {t('globalChange.title', 'Global Change — Configuration')}
                </h2>
                <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">
                    {t('globalChange.description', 'Adjust fees and limits for Global Change accounts')}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-slate-50 border-slate-200 border-t-2 border-t-blue-500">
                    <CardHeader className="pb-4 border-b border-slate-200/50">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                             <DollarSign className="h-3.5 w-3.5 text-blue-500" />
                            {t('globalChange.cardTitle', 'Global Configuration')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">
                                        {t('globalChange.personalFee', 'Personal Fee')}
                                    </Label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                            <User size={18} className="text-zinc-400" />
                                        </div>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={personalFee}
                                            onChange={e => setPersonalFee(e.target.value)}
                                            className="bg-white border-slate-300 text-black h-12 pl-10 font-black text-lg focus-visible:ring-blue-500/50"
                                            placeholder="0.00"
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-zinc-400">HTG</div>
                                    </div>
                                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                                        {t('globalChange.personalFeeDesc', 'One-time fee for personal account activation')}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">
                                        {t('globalChange.businessFee', 'Business Fee')}
                                    </Label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                            <Building2 size={18} className="text-zinc-400" />
                                        </div>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={businessFee}
                                            onChange={e => setBusinessFee(e.target.value)}
                                            className="bg-white border-slate-300 text-black h-12 pl-10 font-black text-lg focus-visible:ring-blue-500/50"
                                            placeholder="0.00"
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-zinc-400">HTG</div>
                                    </div>
                                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                                        {t('globalChange.businessFeeDesc', 'One-time fee for business account activation')}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">
                                        {t('globalChange.personalLimit', 'Personal Daily Limit')}
                                    </Label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                            <DollarSign size={18} className="text-zinc-400" />
                                        </div>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={personalLimit}
                                            onChange={e => setPersonalLimit(e.target.value)}
                                            className="bg-white border-slate-300 text-black h-12 pl-10 font-black text-lg focus-visible:ring-blue-500/50"
                                            placeholder="0.00"
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-zinc-400">HTG</div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">
                                        {t('globalChange.businessLimit', 'Business Daily Limit')}
                                    </Label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                            <DollarSign size={18} className="text-zinc-400" />
                                        </div>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={businessLimit}
                                            onChange={e => setBusinessLimit(e.target.value)}
                                            className="bg-white border-slate-300 text-black h-12 pl-10 font-black text-lg focus-visible:ring-blue-500/50"
                                            placeholder="0.00"
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-zinc-400">HTG</div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">
                                        {t('globalChange.agentCommission', 'Agent Commission (%)')}
                                    </Label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                            <DollarSign size={18} className="text-zinc-400" />
                                        </div>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={agentCommissionPercentage}
                                            onChange={e => setAgentCommissionPercentage(e.target.value)}
                                            className="bg-white border-slate-300 text-black h-12 pl-10 font-black text-lg focus-visible:ring-blue-500/50"
                                            placeholder="1.00"
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-zinc-400">%</div>
                                    </div>
                                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                                        {t('globalChange.agentCommissionDesc', 'Percentage of the exchange profit shared with the agent')}
                                    </p>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest h-12 transition-all active:scale-95"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" />
                                        {t('globalChange.saveConfig', 'Save Configuration')}
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card className="bg-blue-600 text-white border-none overflow-hidden relative">
                        <div className="absolute top-[-20px] right-[-20px] opacity-10">
                            <DollarSign size={160} />
                        </div>
                        <CardHeader>
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest opacity-80">
                                {t('globalChange.recapTitle', 'Current Recap')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                             <div className="flex justify-between items-end border-b border-white/10 pb-4">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70">{t('globalChange.personal', 'Personal')}</p>
                                    <p className="text-3xl font-black">{parseFloat(personalFee).toLocaleString()} HTG</p>
                                    <p className="text-[9px] font-bold opacity-60 mt-1">{t('globalChange.limitPerDay', { amount: parseFloat(personalLimit).toLocaleString() })}</p>
                                </div>
                                <User size={40} className="opacity-20" />
                            </div>
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70">{t('globalChange.business', 'Business')}</p>
                                    <p className="text-3xl font-black">{parseFloat(businessFee).toLocaleString()} HTG</p>
                                    <p className="text-[9px] font-bold opacity-60 mt-1">{t('globalChange.limitPerDay', { amount: parseFloat(businessLimit).toLocaleString() })}</p>
                                </div>
                                <Building2 size={40} className="opacity-20" />
                            </div>
                        </CardContent>
                    </Card>

                    <Button variant="outline" onClick={fetchFees} className="w-full border-slate-200 text-zinc-500 font-bold uppercase text-[10px] tracking-widest">
                        <RefreshCw className="h-3 w-3 mr-2" />
                        {t('globalChange.refresh', 'Refresh Data')}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ZoneCashGlobalChangeFees;
