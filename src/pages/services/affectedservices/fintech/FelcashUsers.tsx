import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import felcashApi from '../../../../context/api/felcash';
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
import { Search, Loader2, ArrowDownCircle, ArrowUpCircle, User, Wallet, RefreshCw, MonitorCheck } from 'lucide-react';
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

interface FelcashUser {
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

interface FelcashAccount {
    id: string;
    accountNumber: string;
    type: string;
    currency: string;
    balance: number;
}

interface TxItem {
    id: string;
    amount: number;
    currency: string;
    type: string;
    status: string;
    createdAt: string;
    description?: string;
}

const FelcashUsers: React.FC = () => {
    const { t } = useTranslation();
    const [users, setUsers] = useState<FelcashUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 500);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 20;

    // Modal
    const [selectedUser, setSelectedUser] = useState<FelcashUser | null>(null);
    const [userAccounts, setUserAccounts] = useState<FelcashAccount[]>([]);
    const [accountsLoading, setAccountsLoading] = useState(false);
    const [txLoading, setTxLoading] = useState(false);
    const [txType, setTxType] = useState<'all' | 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER' | 'SERVICE_PAYMENT'>('all');
    const [transactions, setTransactions] = useState<TxItem[]>([]);
    const [txPage, setTxPage] = useState(1);
    const [txTotalPages, setTxTotalPages] = useState(1);
    const [selectedAccountId, setSelectedAccountId] = useState<string>('all');

    const fetchUsers = useCallback(async (p: number, s: string) => {
        setLoading(true);
        try {
            const data = await felcashApi.getUsers(p, limit, s || undefined);
            setUsers(data?.users ?? data?.data ?? data?.items ?? []);
            const total = data?.total ?? 0;
            const lim = data?.limit ?? limit;
            setTotalPages(data?.totalPages ?? data?.meta?.lastPage ?? (total > 0 ? Math.ceil(total / lim) : 1));
        } catch {
            toast.error(t('felcashUsers.errors.fetchFailed') || 'Échec du chargement des clients');
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
            const data = await felcashApi.getUserTransactions(userId, p, 20, actualAccId);
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
            const data = await felcashApi.getUserAccounts(userId);
            setUserAccounts(Array.isArray(data) ? data : []);
        } catch {
            setUserAccounts([]);
        } finally {
            setAccountsLoading(false);
        }
    }, []);

    const handleUserClick = (user: FelcashUser) => {
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

    const displayName = (user: FelcashUser) =>
        user.fullName || [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || user.phone || user.id.slice(0, 8);

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 animate-in fade-in duration-500">
            <div>
                <h2 className="text-3xl font-black tracking-tight text-black uppercase">
                    {t('felcashUsers.title') || 'Zone Cash — Clients'}
                </h2>
                <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">
                    {t('felcashUsers.description') || 'Liste des comptes clients Zone Cash'}
                </p>
            </div>

            <Card className="bg-slate-50 border-slate-200">
                <CardHeader className="border-b border-slate-200/50 py-4">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-purple-500" />
                        {t('felcashUsers.cardTitle') || 'Comptes enregistrés'}
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                    <div className="relative max-w-sm mb-4">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={t('felcashUsers.searchPlaceholder') || 'Rechercher par email / téléphone...'}
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
                                        {t('felcashUsers.table.name') || 'Nom'}
                                    </TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest">
                                        {t('felcashUsers.table.email') || 'Email'}
                                    </TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest">
                                        {t('felcashUsers.table.phone') || 'Téléphone'}
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
                                            {t('felcashUsers.table.noUsers') || 'Aucun client trouvé'}
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
                            {t('felcashUsers.modal.title') || 'Détails du Client'}
                        </DialogTitle>
                        <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                            {selectedUser && displayName(selectedUser)}
                        </DialogDescription>
                    </DialogHeader>

                    <Tabs defaultValue="transactions" className="w-full mt-2">
                        <TabsList className="bg-slate-50 border border-slate-200 p-1">
                            <TabsTrigger value="transactions"
                                className="data-[state=active]:bg-emerald-500 data-[state=active]:text-black text-zinc-400 font-bold uppercase text-[10px] tracking-widest px-6">
                                {t('felcashUsers.modal.transactions') || 'Transactions'}
                            </TabsTrigger>
                            <TabsTrigger value="info"
                                className="data-[state=active]:bg-emerald-500 data-[state=active]:text-black text-zinc-400 font-bold uppercase text-[10px] tracking-widest px-6">
                                {t('felcashUsers.modal.info') || 'Informations'}
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
                                            <option value="all">{t('felcashUsers.modal.allAccounts') || 'Tous les comptes'}</option>
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
                                            {type === 'all' && (t('felcashUsers.modal.all') || 'Tous')}
                                            {type === 'DEPOSIT' && <><ArrowDownCircle className="h-3 w-3 mr-1 text-emerald-600" />{t('felcashUsers.modal.deposits') || 'Dépôts'}</>}
                                            {type === 'WITHDRAWAL' && <><ArrowUpCircle className="h-3 w-3 mr-1 text-red-500" />{t('felcashUsers.modal.withdrawals') || 'Retraits'}</>}
                                            {type === 'TRANSFER' && <><RefreshCw className="h-3 w-3 mr-1 text-blue-500" />{t('felcashUsers.modal.transfers') || 'Transferts'}</>}
                                            {type === 'SERVICE_PAYMENT' && <><MonitorCheck className="h-3 w-3 mr-1 text-purple-500" />{t('felcashUsers.modal.services') || 'Services'}</>}
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
                                                {t('felcashUsers.modal.noTransactions') || 'Aucune transaction'}
                                            </TableCell></TableRow>
                                        ) : filteredTx.map((tx, i) => (
                                            <TableRow key={tx.id || i} className="border-slate-200">
                                                <TableCell className="text-xs">
                                                    {tx.createdAt ? new Date(tx.createdAt).toLocaleString() : '—'}
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
                                                    <span className={`text-[10px] font-black uppercase ${
                                                        tx.status === 'COMPLETED' ? 'text-emerald-600'
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
                                            { label: t('felcashUsers.modal.id') || 'ID', value: selectedUser.id },
                                            { label: t('felcashUsers.table.name') || 'Nom', value: displayName(selectedUser) },
                                            { label: t('felcashUsers.table.email') || 'Email', value: selectedUser.email || '—' },
                                            { label: t('felcashUsers.table.phone') || 'Téléphone', value: selectedUser.phone || '—' },
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
                                            {t('felcashUsers.modal.accounts') || 'Comptes'}
                                        </p>
                                        {accountsLoading ? (
                                            <div className="flex justify-center py-4">
                                                <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
                                            </div>
                                        ) : userAccounts.length === 0 ? (
                                            <p className="text-xs text-zinc-500 font-bold uppercase text-center py-4">
                                                {t('felcashUsers.modal.noAccounts') || 'Aucun compte'}
                                            </p>
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {userAccounts.map(acc => (
                                                    <div key={acc.id} className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">
                                                                {acc.currency} · {acc.type}
                                                            </span>
                                                        </div>
                                                        <p className="text-lg font-black text-black">
                                                            {(acc.balance ?? 0).toLocaleString()} {acc.currency}
                                                        </p>
                                                        <p className="text-[10px] text-zinc-500 font-mono mt-1">{acc.accountNumber}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </TabsContent>
                    </Tabs>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default FelcashUsers;
