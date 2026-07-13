import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import zonecashApi from '../../../../context/api/zonecash';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../../../components/ui/table';
import {
    Card, CardContent, CardHeader, CardTitle,
} from '../../../../components/ui/card';
import { Input } from '../../../../components/ui/input';
import { Button } from '../../../../components/ui/button';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '../../../../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs';
import { Search, Loader2, ArrowDownCircle, ArrowUpCircle, User, Wallet, RefreshCw, MonitorCheck, Lock, Unlock, ArrowRight, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../../../lib/utils';

function useDebounce<T>(value: T, delay: number): T {
    const [deb, setDeb] = useState<T>(value);
    useEffect(() => {
        const h = setTimeout(() => setDeb(value), delay);
        return () => clearTimeout(h);
    }, [value, delay]);
    return deb;
}

interface ZoneCashUser {
    id: string;
    email?: string;
    phone?: string;
    fullName?: string;
    firstName?: string;
    lastName?: string;
    isActive?: boolean;
    isVerified?: boolean;
    createdAt?: string;
}

interface ZoneCashAccount {
    id: string;
    accountNumber: string;
    type: string;
    currency: string;
    balance: number;
    isBlocked?: boolean;
    blockReason?: string | null;
    blockedAmount?: number | null;
    isDefinitivelyBlocked?: boolean;
    unblockAt?: string | null;
}

interface TxAccount {
    accountNumber: string;
    currency: string;
    type: string;
}

interface TxItem {
    id: string;
    amount: number;
    currency: string;
    type: string;
    status: string;
    date?: string;
    createdAt?: string;
    description?: string;
    account?: TxAccount;
}

const ZoneCashUsers: React.FC = () => {
    const { t } = useTranslation();
    const [users, setUsers] = useState<ZoneCashUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 500);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 20;

    // Modal
    const [selectedUser, setSelectedUser] = useState<ZoneCashUser | null>(null);
    const [userAccounts, setUserAccounts] = useState<ZoneCashAccount[]>([]);
    const [accountsLoading, setAccountsLoading] = useState(false);
    const [txLoading, setTxLoading] = useState(false);
    const [txType, setTxType] = useState<'all' | 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER' | 'SERVICE_PAYMENT'>('all');
    const [transactions, setTransactions] = useState<TxItem[]>([]);
    const [txPage, setTxPage] = useState(1);
    const [txTotalPages, setTxTotalPages] = useState(1);
    const [selectedAccountId, setSelectedAccountId] = useState<string>('all');

    // Transaction Detail Modal
    const [selectedTx, setSelectedTx] = useState<TxItem | null>(null);
    const [copiedTxId, setCopiedTxId] = useState(false);

    const copyTxId = (id: string) => {
        navigator.clipboard.writeText(id).then(() => {
            setCopiedTxId(true);
            setTimeout(() => setCopiedTxId(false), 2000);
        });
    };

    const getTxTrace = (tx: TxItem) => {
        const own = tx.account?.accountNumber ?? 'Mon compte';
        const desc = tx.description || '—';
        const isNegative = tx.amount < 0;
        switch (tx.type) {
            case 'DEPOSIT':
                return { from: desc, to: own };
            case 'WITHDRAWAL':
                return { from: own, to: desc };
            case 'TRANSFER':
                return isNegative ? { from: own, to: desc } : { from: desc, to: own };
            case 'SERVICE_PAYMENT':
            case 'BILL_PAYMENT':
                return { from: own, to: desc };
            default:
                return { from: own, to: desc };
        }
    };

    // Block Account Modal States
    const [blockDialogOpen, setBlockDialogOpen] = useState(false);
    const [blockingAccount, setBlockingAccount] = useState<ZoneCashAccount | null>(null);
    const [isBlockedInput, setIsBlockedInput] = useState(false);
    const [blockTypeInput, setBlockTypeInput] = useState<'DEFINITIVE' | 'PARTIAL'>('DEFINITIVE');
    const [blockReasonInput, setBlockReasonInput] = useState('');
    const [blockedAmountInput, setBlockedAmountInput] = useState('');
    const [unblockAtInput, setUnblockAtInput] = useState('');
    const [submittingBlock, setSubmittingBlock] = useState(false);

    const handleOpenBlockDialog = (acc: ZoneCashAccount) => {
        setBlockingAccount(acc);
        setIsBlockedInput(acc.isBlocked ?? false);
        setBlockTypeInput(acc.isDefinitivelyBlocked ? 'DEFINITIVE' : 'PARTIAL');
        setBlockReasonInput(acc.blockReason ?? '');
        setBlockedAmountInput(acc.blockedAmount !== null ? String(acc.blockedAmount) : '');
        
        if (acc.unblockAt) {
            const date = new Date(acc.unblockAt);
            setUnblockAtInput(date.toISOString().slice(0, 16));
        } else {
            setUnblockAtInput('');
        }
        
        setBlockDialogOpen(true);
    };

    const handleSaveBlock = async () => {
        if (!blockingAccount) return;
        
        if (isBlockedInput) {
            if (!blockReasonInput.trim()) {
                toast.error(t('zonecashUsers.modal.reasonRequired') || 'Veuillez saisir une raison');
                return;
            }
            if (blockTypeInput === 'PARTIAL') {
                const amt = parseFloat(blockedAmountInput);
                if (isNaN(amt) || amt <= 0) {
                    toast.error(t('zonecashUsers.modal.amountRequired') || 'Veuillez saisir un montant valide');
                    return;
                }
            }
        }

        setSubmittingBlock(true);
        try {
            const isDefinitively = blockTypeInput === 'DEFINITIVE';
            const amt = blockTypeInput === 'PARTIAL' ? parseFloat(blockedAmountInput) : undefined;
            const unblockAtIso = isBlockedInput && unblockAtInput ? new Date(unblockAtInput).toISOString() : undefined;
            
            await zonecashApi.blockAccount(
                blockingAccount.id,
                isBlockedInput,
                isBlockedInput ? blockReasonInput.trim() : undefined,
                isBlockedInput ? amt : undefined,
                isBlockedInput ? isDefinitively : undefined,
                unblockAtIso
            );
            
            toast.success(t('zonecashUsers.modal.blockSuccess') || 'Statut du compte mis à jour');
            setBlockDialogOpen(false);
            if (selectedUser) {
                fetchAccounts(selectedUser.id);
            }
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Erè pandan anrejistreman an');
        } finally {
            setSubmittingBlock(false);
        }
    };

    const fetchUsers = useCallback(async (p: number, s: string) => {
        setLoading(true);
        try {
            const data = await zonecashApi.getUsers(p, limit, s || undefined);
            setUsers(data?.users ?? data?.data ?? data?.items ?? []);
            const total = data?.total ?? 0;
            const lim = data?.limit ?? limit;
            setTotalPages(data?.totalPages ?? data?.meta?.lastPage ?? (total > 0 ? Math.ceil(total / lim) : 1));
        } catch {
            toast.error(t('zonecashUsers.errors.fetchFailed') || 'Échec du chargement des clients');
            setUsers([]);
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => { setPage(1); }, [debouncedSearch]);
    useEffect(() => { fetchUsers(page, debouncedSearch); }, [page, debouncedSearch, fetchUsers]);

    const fetchTransactions = useCallback(async (userId: string, p: number, accId?: string) => {
        setTxLoading(true);
        try {
            const actualAccId = accId === 'all' ? undefined : accId;
            const data = await zonecashApi.getUserTransactions(userId, p, 20, actualAccId);
            setTransactions(data?.transactions ?? data?.data ?? data?.items ?? []);
            const total = data?.total ?? 0;
            setTxTotalPages(data?.totalPages ?? data?.meta?.lastPage ?? (total > 0 ? Math.ceil(total / 20) : 1));
        } catch {
            toast.error('Failed to load transactions');
            setTransactions([]);
        } finally {
            setTxLoading(false);
        }
    }, []);

    const fetchAccounts = useCallback(async (userId: string) => {
        setAccountsLoading(true);
        try {
            const data = await zonecashApi.getUserAccounts(userId);
            setUserAccounts(Array.isArray(data) ? data : []);
        } catch {
            setUserAccounts([]);
        } finally {
            setAccountsLoading(false);
        }
    }, []);

    const handleUserClick = (user: ZoneCashUser) => {
        setSelectedUser(user);
        setUserAccounts([]);
        setTxPage(1);
        setTxType('all');
        setSelectedAccountId('all');
        fetchTransactions(user.id, 1, 'all');
        fetchAccounts(user.id);
    };

    useEffect(() => {
        if (selectedUser) fetchTransactions(selectedUser.id, txPage, selectedAccountId);
    }, [txPage, selectedUser, selectedAccountId, fetchTransactions]);

    const filteredTx = txType === 'all'
        ? transactions
        : transactions.filter(tx => tx.type === txType);

    const displayName = (user: ZoneCashUser) =>
        user.fullName || [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || user.phone || user.id.slice(0, 8);

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 animate-in fade-in duration-500">
            <div>
                <h2 className="text-3xl font-black tracking-tight text-black uppercase">
                    {t('zonecashUsers.title') || 'ZoneCash — Clients'}
                </h2>
                <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">
                    {t('zonecashUsers.description') || 'Liste des comptes clients ZoneCash'}
                </p>
            </div>

            <Card className="bg-slate-50 border-slate-200">
                <CardHeader className="border-b border-slate-200/50 py-4">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-purple-500" />
                        {t('zonecashUsers.cardTitle') || 'Comptes enregistrés'}
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                    <div className="relative max-w-sm mb-4">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={t('zonecashUsers.searchPlaceholder') || 'Rechercher par email / téléphone...'}
                            className="pl-8 bg-white border-slate-200 text-black h-10 text-xs"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="rounded-md border border-slate-200">
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest">
                                        {t('zonecashUsers.table.name') || 'Nom'}
                                    </TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest">
                                        {t('zonecashUsers.table.email') || 'Email'}
                                    </TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest">
                                        {t('zonecashUsers.table.phone') || 'Téléphone'}
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-purple-500" />
                                        </TableCell>
                                    </TableRow>
                                ) : users.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center text-xs text-zinc-500 font-bold uppercase">
                                            {t('zonecashUsers.table.noUsers') || 'Aucun client trouvé'}
                                        </TableCell>
                                    </TableRow>
                                ) : users.map(user => (
                                    <TableRow
                                        key={user.id}
                                        className="cursor-pointer hover:bg-slate-50 transition-colors border-slate-200"
                                        onClick={() => handleUserClick(user)}
                                    >
                                        <TableCell className="font-bold text-xs">{displayName(user)}</TableCell>
                                        <TableCell className="text-xs text-zinc-600">{user.email || '—'}</TableCell>
                                        <TableCell className="text-xs text-zinc-600">{user.phone || '—'}</TableCell>
                                        <TableCell className="text-right font-black text-xs text-emerald-600">
                                            —
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-4">
                        <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1 || loading}
                            className="text-[10px] font-black uppercase tracking-widest bg-slate-50 border-slate-200">
                            {t('common.previous') || 'Précédent'}
                        </Button>
                        <span className="text-[10px] font-bold text-zinc-500 uppercase">
                            {page} / {totalPages}
                        </span>
                        <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages || loading}
                            className="text-[10px] font-black uppercase tracking-widest bg-slate-50 border-slate-200">
                            {t('common.next') || 'Suivant'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* User Detail Modal */}
            <Dialog open={!!selectedUser} onOpenChange={open => !open && setSelectedUser(null)}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto bg-white border-slate-200">
                    <DialogHeader>
                        <DialogTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                            <User className="h-4 w-4 text-purple-500" />
                            {t('zonecashUsers.modal.title') || 'Détails du Client'}
                        </DialogTitle>
                        <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                            {selectedUser && displayName(selectedUser)}
                        </DialogDescription>
                    </DialogHeader>

                    <Tabs defaultValue="transactions" className="w-full mt-2">
                        <TabsList className="bg-slate-50 border border-slate-200 p-1">
                            <TabsTrigger value="transactions"
                                className="data-[state=active]:bg-emerald-500 data-[state=active]:text-black text-zinc-400 font-bold uppercase text-[10px] tracking-widest px-6">
                                {t('zonecashUsers.modal.transactions') || 'Transactions'}
                            </TabsTrigger>
                            <TabsTrigger value="info"
                                className="data-[state=active]:bg-emerald-500 data-[state=active]:text-black text-zinc-400 font-bold uppercase text-[10px] tracking-widest px-6">
                                {t('zonecashUsers.modal.info') || 'Informations'}
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="transactions" className="space-y-3 mt-4">
                            <div className="flex flex-col md:flex-row md:items-center gap-3">
                                {userAccounts.length > 0 && (
                                    <div className="flex items-center gap-2">
                                        <Wallet className="h-3.5 w-3.5 text-zinc-400" />
                                        <select
                                            value={selectedAccountId}
                                            onChange={(e) => {
                                                setSelectedAccountId(e.target.value);
                                                setTxPage(1);
                                            }}
                                            className="bg-white border border-slate-200 rounded-md text-[10px] font-black uppercase tracking-widest px-2 h-8 outline-none focus:ring-1 focus:ring-emerald-500"
                                        >
                                            <option value="all">{t('zonecashUsers.modal.allAccounts') || 'Tous les comptes'}</option>
                                            {userAccounts.map(acc => (
                                                <option key={acc.id} value={acc.id}>
                                                    {acc.currency} · {acc.accountNumber} ({acc.type})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div className="flex flex-wrap gap-2">
                                    {(['all', 'DEPOSIT', 'WITHDRAWAL', 'TRANSFER', 'SERVICE_PAYMENT'] as const).map(type => (
                                        <Button key={type}
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setTxType(type)}
                                            className={cn(
                                                'font-black uppercase text-[10px] tracking-widest h-8 px-3',
                                                txType === type
                                                    ? 'bg-emerald-500 text-black border-emerald-500'
                                                    : 'bg-slate-100 text-zinc-500 border-slate-200 hover:bg-slate-200'
                                            )}>
                                            {type === 'all' && (t('zonecashUsers.modal.all') || 'Tous')}
                                            {type === 'DEPOSIT' && <><ArrowDownCircle className="h-3 w-3 mr-1 text-emerald-600" />{t('zonecashUsers.modal.deposits') || 'Dépôts'}</>}
                                            {type === 'WITHDRAWAL' && <><ArrowUpCircle className="h-3 w-3 mr-1 text-red-500" />{t('zonecashUsers.modal.withdrawals') || 'Retraits'}</>}
                                            {type === 'TRANSFER' && <><RefreshCw className="h-3 w-3 mr-1 text-blue-500" />{t('zonecashUsers.modal.transfers') || 'Transferts'}</>}
                                            {type === 'SERVICE_PAYMENT' && <><MonitorCheck className="h-3 w-3 mr-1 text-purple-500" />{t('zonecashUsers.modal.services') || 'Services'}</>}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <div className="rounded-md border border-slate-200">
                                <Table>
                                    <TableHeader className="bg-slate-50">
                                        <TableRow>
                                            <TableHead className="text-[10px] font-black uppercase tracking-widest">Date</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase tracking-widest">Type</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase tracking-widest">Montant</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase tracking-widest">Statut</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {txLoading ? (
                                            <TableRow><TableCell colSpan={4} className="text-center py-6">
                                                <Loader2 className="animate-spin mx-auto h-5 w-5 text-emerald-500" />
                                            </TableCell></TableRow>
                                        ) : filteredTx.length === 0 ? (
                                            <TableRow><TableCell colSpan={4} className="text-center py-6 text-xs text-zinc-500 font-bold uppercase">
                                                {t('zonecashUsers.modal.noTransactions') || 'Aucune transaction'}
                                            </TableCell></TableRow>
                                        ) : filteredTx.map((tx, i) => (
                                            <TableRow
                                                key={tx.id || i}
                                                className="border-slate-200 cursor-pointer hover:bg-blue-50/50 transition-colors"
                                                onClick={() => setSelectedTx(tx)}
                                            >
                                                <TableCell className="text-xs">
                                                    {(tx.date ?? tx.createdAt) ? new Date((tx.date ?? tx.createdAt)!).toLocaleString('fr-FR') : '—'}
                                                </TableCell>
                                                <TableCell>
                                                    <span className={cn(
                                                        "text-[10px] font-black uppercase px-2 py-0.5 rounded-full",
                                                        tx.type === 'DEPOSIT' ? 'bg-emerald-100 text-emerald-700' :
                                                            tx.type === 'WITHDRAWAL' ? 'bg-red-100 text-red-700' :
                                                                tx.type === 'TRANSFER' ? 'bg-blue-100 text-blue-700' :
                                                                    tx.type === 'SERVICE_PAYMENT' ? 'bg-purple-100 text-purple-700' :
                                                                        'bg-slate-100 text-slate-700'
                                                    )}>
                                                        {tx.type}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="font-black text-xs">
                                                    {(tx.amount ?? 0).toLocaleString()} {tx.currency}
                                                </TableCell>
                                                <TableCell>
                                                    <span className={`text-[10px] font-black uppercase ${tx.status === 'COMPLETED' ? 'text-emerald-600'
                                                        : tx.status === 'PENDING' ? 'text-orange-500'
                                                            : 'text-red-500'
                                                        }`}>
                                                        {tx.status}
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            <div className="flex items-center justify-end gap-2">
                                <Button variant="outline" size="sm" onClick={() => setTxPage(p => Math.max(1, p - 1))}
                                    disabled={txPage === 1 || txLoading}
                                    className="text-[10px] font-black uppercase tracking-widest bg-slate-50 border-slate-200">
                                    {t('common.previous') || 'Précédent'}
                                </Button>
                                <span className="text-[10px] font-bold text-zinc-500">{txPage} / {txTotalPages}</span>
                                <Button variant="outline" size="sm" onClick={() => setTxPage(p => Math.min(txTotalPages, p + 1))}
                                    disabled={txPage === txTotalPages || txLoading}
                                    className="text-[10px] font-black uppercase tracking-widest bg-slate-50 border-slate-200">
                                    {t('common.next') || 'Suivant'}
                                </Button>
                            </div>
                        </TabsContent>

                        <TabsContent value="info" className="mt-4 space-y-4">
                            {selectedUser && (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        {[
                                            { label: t('zonecashUsers.modal.id') || 'ID', value: selectedUser.id },
                                            { label: t('zonecashUsers.table.name') || 'Nom', value: displayName(selectedUser) },
                                            { label: t('zonecashUsers.table.email') || 'Email', value: selectedUser.email || '—' },
                                            { label: t('zonecashUsers.table.phone') || 'Téléphone', value: selectedUser.phone || '—' },
                                            { label: 'Statut', value: selectedUser.isActive ? '✓ Actif' : '✗ Inactif' },
                                            { label: 'Vérifié', value: selectedUser.isVerified ? '✓ Oui' : '✗ Non' },
                                            { label: 'Inscrit le', value: selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : '—' },
                                        ].map(({ label, value }) => (
                                            <div key={label} className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{label}</p>
                                                <p className="text-sm font-bold text-black mt-1 break-all">{value}</p>
                                            </div>
                                        ))}
                                    </div>

                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 flex items-center gap-1">
                                            <Wallet className="h-3 w-3" />
                                            {t('zonecashUsers.modal.accounts') || 'Comptes'}
                                        </p>
                                        {accountsLoading ? (
                                            <div className="flex justify-center py-4">
                                                <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
                                            </div>
                                        ) : userAccounts.length === 0 ? (
                                            <p className="text-xs text-zinc-500 font-bold uppercase text-center py-4">
                                                {t('zonecashUsers.modal.noAccounts') || 'Aucun compte'}
                                            </p>
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {userAccounts.map(acc => {
                                                    const cardBg = acc.isBlocked ? 'bg-red-50/70 border-red-200' : 'bg-emerald-50 border-emerald-200';
                                                    const labelColor = acc.isBlocked ? 'text-red-700' : 'text-emerald-700';
                                                    return (
                                                        <div key={acc.id} className={cn("border rounded-lg p-3 flex flex-col justify-between", cardBg)}>
                                                            <div>
                                                                <div className="flex items-center justify-between mb-1">
                                                                    <span className={cn("text-[10px] font-black uppercase tracking-widest", labelColor)}>
                                                                        {acc.currency} · {acc.type}
                                                                    </span>
                                                                    {acc.isBlocked ? (
                                                                        <span className="bg-red-100 text-red-700 text-[8px] font-black uppercase px-1.5 py-0.5 rounded flex items-center gap-1">
                                                                            <Lock className="h-2 w-2" />
                                                                            {acc.isDefinitivelyBlocked 
                                                                                ? t('zonecashUsers.modal.blockedDefinitively') || 'Bloqué Définitif' 
                                                                                : t('zonecashUsers.modal.blockedStatus') || 'Restreint'}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="bg-emerald-100 text-emerald-700 text-[8px] font-black uppercase px-1.5 py-0.5 rounded flex items-center gap-1">
                                                                            <Unlock className="h-2 w-2" />
                                                                            {t('zonecashUsers.modal.active') || 'Actif'}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className="text-lg font-black text-black">
                                                                    {(acc.balance ?? 0).toLocaleString()} {acc.currency}
                                                                </p>
                                                                <p className="text-[10px] text-zinc-500 font-mono mt-1">{acc.accountNumber}</p>
                                                                
                                                                {acc.isBlocked && (
                                                                    <div className="mt-2 pt-2 border-t border-red-200/50 text-[10px] space-y-1">
                                                                        {!acc.isDefinitivelyBlocked && acc.blockedAmount !== null && (
                                                                            <p className="text-red-700 font-bold">
                                                                                {t('zonecashUsers.modal.blockedAmountLabel', { currency: acc.currency }) || `Montant Bloqué`}: <span className="font-black">{(acc.blockedAmount ?? 0).toLocaleString()} {acc.currency}</span>
                                                                            </p>
                                                                        )}
                                                                        {acc.unblockAt && (
                                                                            <p className="text-red-700 font-bold text-[9px]">
                                                                                {t('zonecashUsers.modal.unblockAt') || 'Jusqu\'au'}: <span className="font-black">{new Date(acc.unblockAt).toLocaleString('fr-FR')}</span>
                                                                            </p>
                                                                        )}
                                                                        <p className="text-red-600 italic">
                                                                            <span className="font-bold uppercase text-[8px]">{t('zonecashUsers.modal.blockReason') || 'Raison'}:</span> {acc.blockReason || 'Pa gen rezon'}
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="mt-3 pt-2 border-t border-slate-200/50 flex justify-end">
                                                                <Button 
                                                                    variant="outline" 
                                                                    size="sm" 
                                                                    onClick={() => handleOpenBlockDialog(acc)}
                                                                    className="h-7 text-[9px] font-black uppercase tracking-widest px-2.5 bg-white hover:bg-slate-50 border-slate-200 text-zinc-600 flex items-center gap-1.5"
                                                                >
                                                                    <Lock className="h-3 w-3 text-red-500" />
                                                                    {t('zonecashUsers.modal.manageBlock') || 'Gérer les restrictions'}
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </TabsContent>
                    </Tabs>
                </DialogContent>
            </Dialog>

            {/* Transaction Detail Modal */}
            <Dialog open={!!selectedTx} onOpenChange={open => !open && setSelectedTx(null)}>
                <DialogContent className="max-w-md bg-white border-slate-200">
                    <DialogHeader>
                        <DialogTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                            <RefreshCw className="h-4 w-4 text-blue-500" />
                            Détail de la Transaction
                        </DialogTitle>
                        <DialogDescription className="text-[10px] font-mono text-zinc-400 flex items-center gap-1.5 mt-0.5">
                            {selectedTx?.id ?? ''}
                            <button
                                onClick={() => selectedTx && copyTxId(selectedTx.id)}
                                className="ml-1 text-zinc-400 hover:text-zinc-700 transition-colors"
                                title="Copier l'ID"
                            >
                                {copiedTxId ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                            </button>
                        </DialogDescription>
                    </DialogHeader>

                    {selectedTx && (() => {
                        const trace = getTxTrace(selectedTx);
                        const isNegative = selectedTx.amount < 0;
                        const displayAmount = Math.abs(selectedTx.amount);
                        const txDate = selectedTx.date ?? selectedTx.createdAt;

                        return (
                            <div className="space-y-4 pt-2">
                                {/* Amount */}
                                <div className="flex flex-col items-center bg-slate-50 border border-slate-200 rounded-xl py-5">
                                    <span className={cn(
                                        "text-3xl font-black tracking-tight",
                                        isNegative ? 'text-red-600' : 'text-emerald-600'
                                    )}>
                                        {isNegative ? '−' : '+'}{displayAmount.toLocaleString('fr-FR')} {selectedTx.account?.currency ?? selectedTx.currency}
                                    </span>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className={cn(
                                            "text-[10px] font-black uppercase px-2 py-0.5 rounded-full",
                                            selectedTx.type === 'DEPOSIT' ? 'bg-emerald-100 text-emerald-700' :
                                            selectedTx.type === 'WITHDRAWAL' ? 'bg-red-100 text-red-700' :
                                            selectedTx.type === 'TRANSFER' ? 'bg-blue-100 text-blue-700' :
                                            selectedTx.type === 'SERVICE_PAYMENT' ? 'bg-purple-100 text-purple-700' :
                                            'bg-slate-100 text-slate-700'
                                        )}>
                                            {selectedTx.type}
                                        </span>
                                        <span className={cn(
                                            "text-[10px] font-black uppercase",
                                            selectedTx.status === 'COMPLETED' ? 'text-emerald-600' :
                                            selectedTx.status === 'PENDING' ? 'text-orange-500' : 'text-red-500'
                                        )}>
                                            {selectedTx.status}
                                        </span>
                                    </div>
                                    {txDate && (
                                        <span className="text-[10px] text-zinc-400 font-bold mt-1">
                                            {new Date(txDate).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}
                                        </span>
                                    )}
                                </div>

                                {/* Trace: Source → Destination */}
                                <div className="rounded-xl border border-slate-200 overflow-hidden">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 px-3 pt-2.5 pb-1.5 bg-slate-50 border-b border-slate-200">
                                        Traçabilité — Origine &amp; Destination
                                    </p>
                                    <div className="flex items-center gap-2 px-3 py-4">
                                        {/* From */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1">
                                                {selectedTx.type === 'DEPOSIT' ? 'Source / Agent' : 'Expéditeur'}
                                            </p>
                                            <p className="text-xs font-black text-black break-all font-mono leading-tight">
                                                {trace.from}
                                            </p>
                                        </div>

                                        {/* Arrow */}
                                        <div className="flex-shrink-0">
                                            <div className="bg-blue-100 rounded-full p-1.5">
                                                <ArrowRight className="h-3.5 w-3.5 text-blue-600" />
                                            </div>
                                        </div>

                                        {/* To */}
                                        <div className="flex-1 min-w-0 text-right">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1">
                                                {selectedTx.type === 'WITHDRAWAL' ? 'Destination' : 'Destinataire'}
                                            </p>
                                            <p className="text-xs font-black text-black break-all font-mono leading-tight">
                                                {trace.to}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Account */}
                                {selectedTx.account && (
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-2 flex items-center gap-1">
                                            <Wallet className="h-3 w-3" />
                                            Compte ZoneCash impliqué
                                        </p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] text-zinc-500 font-bold uppercase">{selectedTx.account.type}</span>
                                            <span className="text-xs font-black font-mono text-black">{selectedTx.account.accountNumber}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] text-zinc-500 font-bold uppercase">Devise</span>
                                            <span className="text-xs font-black text-black">{selectedTx.account.currency}</span>
                                        </div>
                                    </div>
                                )}

                                {/* Description */}
                                {selectedTx.description && (
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1">Description</p>
                                        <p className="text-xs text-zinc-700 font-bold">{selectedTx.description}</p>
                                    </div>
                                )}
                            </div>
                        );
                    })()}
                </DialogContent>
            </Dialog>

            {/* Block Account Modal */}
            <Dialog open={blockDialogOpen} onOpenChange={open => !open && setBlockDialogOpen(false)}>
                <DialogContent className="max-w-md bg-white border-slate-200">
                    <DialogHeader>
                        <DialogTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                            <Lock className="h-4 w-4 text-red-500" />
                            {t('zonecashUsers.modal.blockTitle') || 'Gérer les Restrictions du Compte'}
                        </DialogTitle>
                        <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                            {blockingAccount && `${blockingAccount.currency} · ${blockingAccount.accountNumber} (${blockingAccount.type})`}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4 text-xs font-bold text-slate-700">
                        <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg p-3">
                            <div className="space-y-0.5">
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                                    {t('zonecashUsers.modal.blockStatus') || 'Restreindre le Compte'}
                                </p>
                                <p className="text-[9px] text-zinc-400">Activer ou désactiver les restrictions sur ce compte</p>
                            </div>
                            <input 
                                type="checkbox" 
                                checked={isBlockedInput} 
                                onChange={e => setIsBlockedInput(e.target.checked)} 
                                className="h-4 w-4 accent-red-500 cursor-pointer"
                            />
                        </div>

                        {isBlockedInput && (
                            <>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                                        {t('zonecashUsers.modal.blockType') || 'Type de restriction'}
                                    </label>
                                    <div className="flex gap-2">
                                        {(['DEFINITIVE', 'PARTIAL'] as const).map(type => (
                                            <Button 
                                                key={type}
                                                type="button"
                                                variant="outline"
                                                onClick={() => setBlockTypeInput(type)}
                                                className={cn(
                                                    'flex-1 text-[10px] font-black uppercase tracking-widest h-9',
                                                    blockTypeInput === type
                                                        ? 'bg-red-500 text-white border-red-500 hover:bg-red-600 hover:text-white'
                                                        : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                                                )}
                                            >
                                                {type === 'DEFINITIVE' 
                                                    ? t('zonecashUsers.modal.definitive') || 'Définitif' 
                                                    : t('zonecashUsers.modal.amountLimit') || 'Montant Limite'}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                {blockTypeInput === 'PARTIAL' && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                                            {t('zonecashUsers.modal.blockedAmountLabel', { currency: blockingAccount?.currency ?? 'HTG' }) || 'Montant Bloqué'}
                                        </label>
                                        <Input
                                            type="number"
                                            value={blockedAmountInput}
                                            onChange={e => setBlockedAmountInput(e.target.value)}
                                            placeholder="e.g. 5000"
                                            className="bg-white border-slate-200 text-black h-10 text-xs font-bold"
                                        />
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                                        {t('zonecashUsers.modal.blockReasonLabel') || 'Raison du blocage (Obligatoire)'}
                                    </label>
                                    <Input
                                        type="text"
                                        value={blockReasonInput}
                                        onChange={e => setBlockReasonInput(e.target.value)}
                                        placeholder="e.g. Transaction suspecte"
                                        className="bg-white border-slate-200 text-black h-10 text-xs font-bold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                                        {t('zonecashUsers.modal.unblockAtLabel') || 'Déblocage automatique (Optionnel)'}
                                    </label>
                                    <Input
                                        type="datetime-local"
                                        value={unblockAtInput}
                                        onChange={e => setUnblockAtInput(e.target.value)}
                                        className="bg-white border-slate-200 text-black h-10 text-xs font-bold"
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            disabled={submittingBlock}
                            onClick={() => setBlockDialogOpen(false)}
                            className="text-[10px] font-black uppercase tracking-widest bg-slate-50 border-slate-200 text-zinc-600"
                        >
                            Cancel
                        </Button>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            disabled={submittingBlock}
                            onClick={handleSaveBlock}
                            className="text-[10px] font-black uppercase tracking-widest bg-emerald-500 text-black hover:bg-emerald-600 border-emerald-500"
                        >
                            {submittingBlock ? <Loader2 className="animate-spin h-3.5 w-3.5" /> : (t('common.save') || 'Save')}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ZoneCashUsers;
