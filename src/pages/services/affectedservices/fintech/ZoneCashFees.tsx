import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../../../components/ui/select';
import {
    Settings,
    Save,
    Loader2,
    CreditCard,
    Percent,
    Banknote,
    ShieldCheck,
    Globe,
    User,
    Briefcase,
    TrendingUp,
    Shield
} from 'lucide-react';
import { toast } from 'sonner';
import zonecashApi from '../../../../context/api/zonecash';

const ZoneCashFees: React.FC = () => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [remoteFee, setRemoteFee] = useState({
        value: 0,
        type: 'FIXED' as 'FIXED' | 'PERCENTAGE'
    });
    const [businessAccountFee, setBusinessAccountFee] = useState(0);

    const [limits, setLimits] = useState<Record<string, { monthlyLimit: number; transactionLimit: number }>>({
        PERSONAL: { monthlyLimit: 100000, transactionLimit: 100000 },
        BUSINESS: { monthlyLimit: 1000000, transactionLimit: 500000 },
        CARD: { monthlyLimit: 50000, transactionLimit: 10000 },
        INVESTMENT: { monthlyLimit: 5000000, transactionLimit: 1000000 },
        INSURANCE: { monthlyLimit: 2000000, transactionLimit: 500000 },
    });

    const fetchFees = useCallback(async () => {
        setLoading(true);
        try {
            const data = await zonecashApi.getFintechFees();
            if (data) {
                setRemoteFee({
                    value: Number(data.remoteDepositFeeValue),
                    type: data.remoteDepositFeeType as 'FIXED' | 'PERCENTAGE'
                });
                setBusinessAccountFee(Number(data.businessAccountFee || 0));

                if (data.limits && Array.isArray(data.limits) && data.limits.length > 0) {
                    const loadedLimits: Record<string, { monthlyLimit: number; transactionLimit: number }> = {
                        PERSONAL: { monthlyLimit: 100000, transactionLimit: 100000 },
                        BUSINESS: { monthlyLimit: 1000000, transactionLimit: 500000 },
                        CARD: { monthlyLimit: 50000, transactionLimit: 10000 },
                        INVESTMENT: { monthlyLimit: 5000000, transactionLimit: 1000000 },
                        INSURANCE: { monthlyLimit: 2000000, transactionLimit: 500000 },
                    };
                    data.limits.forEach((limit: any) => {
                        loadedLimits[limit.accountType] = {
                            monthlyLimit: Number(limit.monthlyLimit),
                            transactionLimit: Number(limit.transactionLimit),
                        };
                    });
                    setLimits(loadedLimits);
                }
            }
        } catch (error) {
            toast.error(t('common.errors.loadFailed') || 'Echèk chajman frè yo');
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchFees();
    }, [fetchFees]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const limitsPayload = Object.entries(limits).map(([accountType, values]) => ({
                accountType,
                monthlyLimit: values.monthlyLimit,
                transactionLimit: values.transactionLimit,
            }));

            await zonecashApi.updateFintechFees({
                remoteDepositFeeValue: remoteFee.value,
                remoteDepositFeeType: remoteFee.type,
                businessAccountFee: businessAccountFee,
                limits: limitsPayload,
            });
            toast.success(t('common.success.save') || 'Konfigirasyon anrejistre avèk siksè');
        } catch (error) {
            toast.error(t('common.errors.saveFailed') || 'Erè pandan anrejistreman an');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#0052cc]" />
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-8 p-4 md:p-8 pt-6 animate-in fade-in duration-700">
            {/* Header Area */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black tracking-tight text-black uppercase">
                        {t('zonecashFees.title') || 'ZoneCash — Konfigirasyon Frè'}
                    </h2>
                    <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-1">
                        {t('zonecashFees.subtitle') || 'Jere frè tranzaksyon ak limit sistèm yo'}
                    </p>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-[#0052cc] hover:bg-[#0041a3] text-white font-black uppercase tracking-widest px-6 h-12 transition-all active:scale-95 shadow-lg shadow-blue-500/20"
                >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    {saving ? t('common.saving') || 'Anrejistreman...' : t('common.save') || 'Anrejistre'}
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                {/* Remote Deposit Fee Card */}
                <Card className="border-slate-200 shadow-sm overflow-hidden group hover:border-blue-200 transition-colors">
                    <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 rounded-lg group-hover:scale-110 transition-transform duration-300">
                                <Globe className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <CardTitle className="text-sm font-black uppercase tracking-widest">
                                    {t('zonecashFees.remoteDeposit.title') || 'Depo a Distans (Remote)'}
                                </CardTitle>
                                <CardDescription className="text-[10px] font-bold uppercase tracking-wider mt-0.5">
                                    {t('zonecashFees.remoteDeposit.desc') || 'Frè aplike lè kliyan an pa prezan'}
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-2 space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                                    <Settings className="h-3 w-3" />
                                    {t('zonecashFees.type') || 'Tip de Frè'}
                                </Label>
                                <Select
                                    value={remoteFee.type}
                                    onValueChange={(v) => setRemoteFee({ ...remoteFee, type: v as 'FIXED' | 'PERCENTAGE' })}
                                >
                                    <SelectTrigger className="bg-slate-50 border-slate-200 h-11 font-bold focus:ring-blue-500/50">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border-slate-200">
                                        <SelectItem value="FIXED" className="font-bold flex items-center gap-2">
                                            <div className="flex items-center gap-2">
                                                <Banknote className="h-3.5 w-3.5 text-emerald-500" />
                                                <span>{t('zonecashFees.types.fixed') || 'Montan Fix (HTG)'}</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="PERCENTAGE" className="font-bold">
                                            <div className="flex items-center gap-2">
                                                <Percent className="h-3.5 w-3.5 text-blue-500" />
                                                <span>{t('zonecashFees.types.percentage') || 'Pousantaj (%)'}</span>
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                                    <CreditCard className="h-3 w-3" />
                                    {t('zonecashFees.value') || 'Valè Frè a'}
                                </Label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        value={remoteFee.value}
                                        onChange={(e) => setRemoteFee({ ...remoteFee, value: parseFloat(e.target.value) || 0 })}
                                        className="bg-white border-slate-200 h-11 font-black pl-4 pr-10 focus-visible:ring-blue-500/50"
                                        placeholder="0.00"
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                                        {remoteFee.type === 'FIXED' ? (
                                            <span className="text-[10px] font-black uppercase">HTG</span>
                                        ) : (
                                            <Percent className="h-4 w-4" />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Visual Helper / Preview */}
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-4">
                            <div className="p-2 bg-white rounded-full shadow-sm">
                                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    {t('zonecashFees.preview.title') || 'Egzanp Kalkil'}
                                </p>
                                <p className="text-xs font-bold text-slate-600 leading-relaxed">
                                    {remoteFee.type === 'FIXED' ? (
                                        t('zonecashFees.preview.fixed', { value: remoteFee.value, net: (1000 - remoteFee.value).toLocaleString() })
                                    ) : (
                                        t('zonecashFees.preview.percentage', {
                                            fee: (1000 * remoteFee.value / 100).toFixed(2),
                                            value: remoteFee.value,
                                            net: (1000 - (1000 * remoteFee.value / 100)).toLocaleString()
                                        })
                                    )}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Business Account Opening Fee Card */}
                <Card className="border-slate-200 shadow-sm overflow-hidden group hover:border-blue-200 transition-colors">
                    <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-50 rounded-lg group-hover:scale-110 transition-transform duration-300">
                                <CreditCard className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                                <CardTitle className="text-sm font-black uppercase tracking-widest">
                                    Ouvèti Kont Biznis
                                </CardTitle>
                                <CardDescription className="text-[10px] font-bold uppercase tracking-wider mt-0.5">
                                    Frè pou kliyan an louvri yon kont biznis
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-2 space-y-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                                <Banknote className="h-3 w-3" />
                                Valè Frè a (HTG)
                            </Label>
                            <div className="relative">
                                <Input
                                    type="number"
                                    value={businessAccountFee}
                                    onChange={(e) => setBusinessAccountFee(parseFloat(e.target.value) || 0)}
                                    className="bg-white border-slate-200 h-11 font-black pl-4 pr-10 focus-visible:ring-blue-500/50"
                                    placeholder="0.00"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                                    <span className="text-[10px] font-black uppercase">HTG</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-4">
                            <div className="p-2 bg-white rounded-full shadow-sm">
                                <ShieldCheck className="h-4 w-4 text-amber-500" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    Enfòmasyon
                                </p>
                                <p className="text-xs font-bold text-slate-600 leading-relaxed">
                                    Frè sa a ap debite otomatikman sou lòt kont itilizatè a chwazi a lè l ap louvri kont biznis la. Si frè a se 0, kreyasyon an ap gratis.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Account Limits Configuration Section */}
                <div className="space-y-6 md:col-span-2 mt-4">
                    <div className="border-t border-slate-100 pt-6">
                        <h3 className="text-xl font-black tracking-tight text-black uppercase">
                            Limit Kont & Tranzaksyon yo (HTG)
                        </h3>
                        <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider mt-0.5">
                            Konfigure limit maksimòm chak tip kont ka resevwa pa mwa epi limit pou yon sèl tranzaksyon.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            {
                                key: 'PERSONAL',
                                name: 'Kont Pèsonèl',
                                desc: 'Kont pou itilizatè endividyèl',
                                gradient: 'from-emerald-500 to-teal-500',
                                icon: User,
                                iconBg: 'bg-emerald-50',
                                iconColor: 'text-emerald-600',
                            },
                            {
                                key: 'BUSINESS',
                                name: 'Kont Biznis',
                                desc: 'Kont pou antrepriz ak machann',
                                gradient: 'from-blue-500 to-indigo-500',
                                icon: Briefcase,
                                iconBg: 'bg-blue-50',
                                iconColor: 'text-blue-600',
                            },
                            {
                                key: 'CARD',
                                name: 'Kat FelCash',
                                desc: 'Limit sou kreyasyon ak itilizasyon kat',
                                gradient: 'from-purple-500 to-pink-500',
                                icon: CreditCard,
                                iconBg: 'bg-purple-50',
                                iconColor: 'text-purple-600',
                            },
                            {
                                key: 'INVESTMENT',
                                name: 'Kont Envestisman',
                                desc: 'Kont pou fon envestisman ak plasman',
                                gradient: 'from-cyan-500 to-sky-500',
                                icon: TrendingUp,
                                iconBg: 'bg-cyan-50',
                                iconColor: 'text-cyan-600',
                            },
                            {
                                key: 'INSURANCE',
                                name: 'Kont Asirans',
                                desc: 'Kont pou kouvèti ak reklamasyon asirans',
                                gradient: 'from-rose-500 to-red-500',
                                icon: Shield,
                                iconBg: 'bg-rose-50',
                                iconColor: 'text-rose-600',
                            },
                        ].map((config) => {
                            const IconComponent = config.icon;
                            const currentLimits = limits[config.key] || { monthlyLimit: 0, transactionLimit: 0 };
                            return (
                                <Card key={config.key} className="border-slate-200 shadow-sm overflow-hidden group hover:border-blue-200 transition-colors">
                                    <div className={`h-1 bg-gradient-to-r ${config.gradient}`} />
                                    <CardHeader className="pb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 ${config.iconBg} rounded-lg group-hover:scale-110 transition-transform duration-300`}>
                                                <IconComponent className={`h-5 w-5 ${config.iconColor}`} />
                                            </div>
                                            <div>
                                                <CardTitle className="text-sm font-black uppercase tracking-widest">
                                                    {config.name}
                                                </CardTitle>
                                                <CardDescription className="text-[10px] font-bold uppercase tracking-wider mt-0.5">
                                                    {config.desc}
                                                </CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-2 space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                                                <Banknote className="h-3 w-3" />
                                                Limit pa Mwa (HTG)
                                            </Label>
                                            <div className="relative">
                                                <Input
                                                    type="number"
                                                    value={currentLimits.monthlyLimit}
                                                    onChange={(e) => setLimits({
                                                        ...limits,
                                                        [config.key]: {
                                                            ...currentLimits,
                                                            monthlyLimit: parseFloat(e.target.value) || 0
                                                        }
                                                    })}
                                                    className="bg-white border-slate-200 h-10 font-black pl-3 pr-10 focus-visible:ring-blue-500/50"
                                                    placeholder="0.00"
                                                />
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                                                    <span className="text-[9px] font-black uppercase">HTG</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                                                <Settings className="h-3 w-3" />
                                                Limit yon Sèl Tranzaksyon (HTG)
                                            </Label>
                                            <div className="relative">
                                                <Input
                                                    type="number"
                                                    value={currentLimits.transactionLimit}
                                                    onChange={(e) => setLimits({
                                                        ...limits,
                                                        [config.key]: {
                                                            ...currentLimits,
                                                            transactionLimit: parseFloat(e.target.value) || 0
                                                        }
                                                    })}
                                                    className="bg-white border-slate-200 h-10 font-black pl-3 pr-10 focus-visible:ring-blue-500/50"
                                                    placeholder="0.00"
                                                />
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                                                    <span className="text-[9px] font-black uppercase">HTG</span>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>

                {/* Info Box */}
                <div className="space-y-6 md:col-span-2">
                    <div className="bg-[#f0f5ff] border border-[#d6e4ff] rounded-2xl p-6 relative overflow-hidden">
                        <div className="absolute -right-8 -bottom-8 opacity-5 transform rotate-12">
                            <Settings size={160} />
                        </div>
                        <div className="relative z-10 space-y-4">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-[#0052cc]" />
                                <h3 className="font-black uppercase tracking-widest text-[#0052cc] text-sm">
                                    {t('zonecashFees.notes.title') || 'Nòt sou Konfigirasyon'}
                                </h3>
                            </div>
                            <ul className="space-y-3">
                                {[
                                    t('zonecashFees.notes.item1'),
                                    t('zonecashFees.notes.item2'),
                                    t('zonecashFees.notes.item3'),
                                    t('zonecashFees.notes.item4')
                                ].map((item, i) => (
                                    <li key={i} className="flex gap-3 text-xs font-bold text-slate-600">
                                        <div className="h-1.5 w-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ZoneCashFees;
