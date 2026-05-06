import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
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
    Search,
    Loader2,
    ArrowDownCircle,
    User,
    CheckCircle,
    AlertCircle,
    TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';
import felcashApi, { FelcashDepositRequest } from '../../../../context/api/felcash';
import usersApi from '../../../../context/api/users';
import enterpriseApi from '../../../../context/api/enterprise';
import { cn } from '../../../../lib/utils';

interface AccountInfo {
    id: string;
    accountNumber: string;
    balance: number;
    currency: string;
    fullName?: string;
    firstName?: string;
    lastName?: string;
    ownerName?: string;
    ownerPhone?: string;
    email?: string;
    phone?: string;
    owner?: {
        fullName?: string;
        firstName?: string;
        lastName?: string;
        email?: string;
        phone?: string;
    };
    user?: {
        fullName?: string;
        firstName?: string;
        lastName?: string;
        email?: string;
        phone?: string;
    };
}

const FelcashDeposit: React.FC = () => {
    const { t } = useTranslation();
    const { enterpriseCode } = useParams<{ enterpriseCode: string }>();

    const [enterpriseId, setEnterpriseId] = useState('');
    const [sellerBalance, setSellerBalance] = useState<number | null>(null);
    const [initLoading, setInitLoading] = useState(true);

    // Step 1 — Account lookup
    const [accountNumber, setAccountNumber] = useState('');
    const [lookupLoading, setLookupLoading] = useState(false);
    const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);

    // Step 2 — Deposit form
    const [amount, setAmount] = useState('');
    const [currency, setCurrency] = useState<'HTG' | 'USD'>('HTG');
    const [description, setDescription] = useState('');
    const [exchangeRate, setExchangeRate] = useState<number | null>(null);
    const [rateLoading, setRateLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Load enterprise context & seller info
    const loadEnterprise = useCallback(async () => {
        setInitLoading(true);
        try {
            const user = await usersApi.getMe();
            const isAdmin = ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(user.role?.level);
            const membership = user.memberships?.find(
                (m: any) => m.enterprise?.enterpriseCode === enterpriseCode
            );
            let entId: string | undefined;

            if (!membership && isAdmin) {
                const entRes = await enterpriseApi.getAll({ search: enterpriseCode });
                const matched = entRes.data?.find((e: any) => e.enterpriseCode === enterpriseCode);
                entId = matched?.id;
            } else {
                entId = membership?.enterprise?.id;
                setSellerBalance(membership?.seller?.balance ?? null);
            }

            if (!entId) {
                toast.error(t('common.errors.enterpriseNotFound') || 'Enterprise not found');
                return;
            }
            setEnterpriseId(entId);
        } catch (e) {
            toast.error(t('common.errors.loadFailed') || 'Failed to load enterprise data');
        } finally {
            setInitLoading(false);
        }
    }, [enterpriseCode, t]);

    useEffect(() => {
        loadEnterprise();
    }, [loadEnterprise]);

    // Fetch exchange rate when currency switches to USD
    useEffect(() => {
        if (currency !== 'USD') { setExchangeRate(null); return; }
        setRateLoading(true);
        felcashApi.getExchangeRate()
            .then(data => setExchangeRate(data?.vente ?? data?.rate ?? null))
            .catch(() => toast.error('Failed to fetch exchange rate'))
            .finally(() => setRateLoading(false));
    }, [currency]);

    const formatAccountNumberUI = (val: string) => {
        const digits = val.replace(/\D/g, '');
        const limited = digits.substring(0, 9);
        if (limited.length <= 3) return limited;
        if (limited.length <= 5) return `${limited.slice(0, 3)}-${limited.slice(3)}`;
        return `${limited.slice(0, 3)}-${limited.slice(3, 5)}-${limited.slice(5)}`;
    };

    const handleLookup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!accountNumber.trim()) return;
        setLookupLoading(true);
        setAccountInfo(null);
        try {
            const data = await felcashApi.lookupAccount(accountNumber.trim());
            setAccountInfo(data);
        } catch (err: any) {
            toast.error(err?.response?.data?.message || t('felcashDeposit.errors.accountNotFound') || 'Account not found');
        } finally {
            setLookupLoading(false);
        }
    };

    const handleDeposit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!accountInfo || !enterpriseId) return;
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            toast.error(t('felcashDeposit.errors.invalidAmount') || 'Invalid amount');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload: FelcashDepositRequest = {
                accountNumber: accountInfo.accountNumber,
                amount: numAmount,
                currency,
                enterpriseId,
                description: description || undefined,
            };
            await felcashApi.initiateDeposit(payload);
            toast.success(t('felcashDeposit.toasts.depositSuccess') || 'Deposit successful!');
            // Reset form
            setAccountInfo(null);
            setAccountNumber('');
            setAmount('');
            setDescription('');
            setCurrency('HTG');
            loadEnterprise();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || t('felcashDeposit.errors.depositFailed') || 'Deposit failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const htgEquivalent =
        currency === 'USD' && exchangeRate && amount
            ? (parseFloat(amount) * exchangeRate).toFixed(2)
            : null;

    const ownerName = accountInfo
        ? accountInfo.ownerName ||
        accountInfo.fullName ||
        [accountInfo.firstName, accountInfo.lastName].filter(Boolean).join(' ') ||
        accountInfo.owner?.fullName ||
        [accountInfo.owner?.firstName, accountInfo.owner?.lastName].filter(Boolean).join(' ') ||
        accountInfo.user?.fullName ||
        [accountInfo.user?.firstName, accountInfo.user?.lastName].filter(Boolean).join(' ') ||
        accountInfo.owner?.email ||
        accountInfo.user?.email ||
        accountInfo.email ||
        '—'
        : null;

    if (initLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black tracking-tight text-black uppercase">
                        {t('felcashDeposit.title') || 'Zone Cash — Dépôt Client'}
                    </h2>
                    <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">
                        {t('felcashDeposit.description') || 'Créditer un compte client Zone Cash'}
                    </p>
                </div>
                {sellerBalance !== null && (
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2">
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                                {t('felcashDeposit.sellerBalance') || 'Solde Disponible'}
                            </p>
                            <p className="text-sm font-black text-black">
                                {sellerBalance.toLocaleString()} HTG
                            </p>
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Step 1 — Account Lookup */}
                <Card className="bg-slate-50 border-slate-200 border-t-2 border-t-emerald-500">
                    <CardHeader className="pb-4 border-b border-slate-200/50">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                            <Search className="h-3.5 w-3.5 text-emerald-500" />
                            {t('felcashDeposit.step1.title') || 'Étape 1 — Trouver le compte'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <form onSubmit={handleLookup} className="space-y-4">
                            <div className="grid gap-2">
                                <Label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">
                                    {t('felcashDeposit.step1.accountNumber') || 'Numéro de Compte'}
                                </Label>
                                <Input
                                    placeholder="XXX-XX-XXXX"
                                    value={accountNumber}
                                    onChange={e => setAccountNumber(formatAccountNumberUI(e.target.value))}
                                    className="bg-white border-slate-200 text-black h-11 font-bold focus-visible:ring-emerald-500/50 uppercase tracking-widest"
                                    maxLength={11}
                                />
                                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                                    {t('felcashDeposit.step1.format') || 'Format: 123-45-6789'}
                                </p>
                            </div>
                            <Button
                                type="submit"
                                disabled={lookupLoading || !accountNumber.trim()}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-black font-black uppercase tracking-widest h-11 transition-all active:scale-95"
                            >
                                {lookupLoading
                                    ? <Loader2 className="h-4 w-4 animate-spin" />
                                    : <><Search className="h-4 w-4 mr-2" />{t('felcashDeposit.step1.search') || 'Rechercher'}</>
                                }
                            </Button>
                        </form>

                        {/* Account info result */}
                        {accountInfo && (
                            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">
                                        {t('felcashDeposit.step1.accountFound') || 'Compte trouvé'}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">
                                            {t('felcashDeposit.step1.owner') || 'Titulaire'}
                                        </p>
                                        <p className="text-sm font-black text-black flex items-center gap-1">
                                            <User className="h-3 w-3 text-emerald-500" />
                                            {ownerName}
                                        </p>
                                        {(accountInfo.ownerPhone || accountInfo.phone || accountInfo.owner?.phone || accountInfo.user?.phone) && (
                                            <p className="text-[10px] text-zinc-500 font-bold">
                                                {accountInfo.ownerPhone || accountInfo.phone || accountInfo.owner?.phone || accountInfo.user?.phone}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">
                                            {t('felcashDeposit.step1.balance') || 'Solde Actuel'}
                                        </p>
                                        <p className="text-sm font-black text-black">
                                            {(accountInfo.balance ?? 0).toLocaleString()} {accountInfo.currency}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">
                                            {t('felcashDeposit.step1.accountNo') || 'Compte #'}
                                        </p>
                                        <p className="text-sm font-mono font-black text-black">
                                            {formatAccountNumberUI(accountInfo.accountNumber)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">
                                            {t('felcashDeposit.step1.currency') || 'Devise du Compte'}
                                        </p>
                                        <p className="text-sm font-black text-black">
                                            {accountInfo.currency}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Step 2 — Deposit Form */}
                <Card className={cn(
                    'bg-slate-50 border-slate-200 border-t-2 transition-all',
                    accountInfo ? 'border-t-blue-500' : 'border-t-slate-200 opacity-60 pointer-events-none'
                )}>
                    <CardHeader className="pb-4 border-b border-slate-200/50">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                            <ArrowDownCircle className="h-3.5 w-3.5 text-blue-500" />
                            {t('felcashDeposit.step2.title') || 'Étape 2 — Effectuer le dépôt'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <form onSubmit={handleDeposit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">
                                        {t('felcashDeposit.step2.amount') || 'Montant'}
                                    </Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                        className="bg-white border-slate-200 text-black h-11 font-bold focus-visible:ring-blue-500/50"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">
                                        {t('felcashDeposit.step2.currency') || 'Devise'}
                                    </Label>
                                    <Select value={currency} onValueChange={(v) => setCurrency(v as 'HTG' | 'USD')}>
                                        <SelectTrigger className="bg-white border-slate-200 text-black h-11 font-bold focus:ring-blue-500/50">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white border-slate-200 text-black">
                                            <SelectItem value="HTG" className="font-bold text-xs">HTG</SelectItem>
                                            <SelectItem value="USD" className="font-bold text-xs">USD</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Exchange rate info */}
                            {currency === 'USD' && (
                                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                                    {rateLoading ? (
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600">
                                                Chargement du taux...
                                            </span>
                                        </div>
                                    ) : exchangeRate ? (
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-blue-700">
                                                {t('felcashDeposit.step2.rate') || 'Taux de change'}:{' '}
                                                <span className="text-black">1 USD = {exchangeRate} HTG</span>
                                            </p>
                                            {htgEquivalent && (
                                                <p className="text-[10px] font-black uppercase tracking-widest text-blue-700">
                                                    {t('felcashDeposit.step2.equivalent') || 'Équivalent'}:{' '}
                                                    <span className="text-black font-black text-sm">
                                                        {parseFloat(htgEquivalent).toLocaleString()} HTG
                                                    </span>
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-red-500">
                                            <AlertCircle className="h-3 w-3" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">
                                                {t('felcashDeposit.errors.noRate') || 'Taux indisponible'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="grid gap-2">
                                <Label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">
                                    {t('felcashDeposit.step2.description') || 'Description (optionnel)'}
                                </Label>
                                <Input
                                    placeholder={t('felcashDeposit.step2.descriptionPlaceholder') || 'Ex: Dépôt espèces'}
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    className="bg-white border-slate-200 text-black h-11 focus-visible:ring-blue-500/50"
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={isSubmitting || !accountInfo || !amount || !enterpriseId}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest h-12 transition-all active:scale-95 shadow-md mt-2"
                            >
                                {isSubmitting
                                    ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    : <ArrowDownCircle className="h-4 w-4 mr-2" />
                                }
                                {isSubmitting
                                    ? (t('felcashDeposit.step2.processing') || 'Traitement...')
                                    : (t('felcashDeposit.step2.confirm') || 'Confirmer le Dépôt')
                                }
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default FelcashDeposit;
