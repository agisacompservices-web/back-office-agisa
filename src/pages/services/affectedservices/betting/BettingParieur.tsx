import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import bettingApi from "../../../../context/api/betting";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../../../../components/ui/table";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "../../../../components/ui/card";
import { Input } from "../../../../components/ui/input";
import { Button } from "../../../../components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "../../../../components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../../components/ui/tabs";
import { Search, Loader2 } from "lucide-react";
import { toast } from "sonner";

// Custom hook for debouncing search input
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
}

interface Parieur {
    id: string;
    email: string;
    phone: string;
    additionalInfo?: {
        Amount?: number;
    };
}

interface HistoryItem {
    id: string;
    amount?: number;
    montant?: number;
    date?: string;
    createdAt?: string;
    status?: string;
    type?: string;
}

interface ReceiptItem {
    id: string;
    amount?: number;
    stake?: number;
    potentialWin?: number;
    status?: string;
    receiptStatus?: string;
    date?: string;
    createdAt?: string;
}

const BettingParieur: React.FC = () => {
    const { t } = useTranslation();
    const [parieurs, setParieurs] = useState<Parieur[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchPhone, setSearchPhone] = useState("");
    const debouncedSearch = useDebounce(searchPhone, 500);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Details Modal State
    const [selectedUser, setSelectedUser] = useState<Parieur | null>(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [historyType, setHistoryType] = useState<'depot' | 'retrait'>('depot');
    const [receiptStatus, setReceiptStatus] = useState<'ongoing' | 'winning' | 'loosing'>('ongoing');
    const [historyData, setHistoryData] = useState<HistoryItem[]>([]);
    const [receiptData, setReceiptData] = useState<ReceiptItem[]>([]);

    const limit = 20;

    const fetchParieurs = React.useCallback(async (currentPage: number, phoneFilter: string) => {
        try {
            setLoading(true);
            const data = await bettingApi.getParieurs(currentPage, limit, phoneFilter || undefined);
            if (data && data.users) {
                setParieurs(data.users);
                setTotalPages(data.totalPages || 1);
            } else {
                setParieurs([]);
                setTotalPages(1);
            }
        } catch (error) {
            console.error("Error fetching parieurs:", error);
            toast.error(t('bettingReport.errors.fetchFailed') || "Failed to load parieurs");
            setParieurs([]);
        } finally {
            setLoading(false);
        }
    }, [t, limit]);

    useEffect(() => {
        setPage(1); // Reset to page 1 when search changes
    }, [debouncedSearch]);

    useEffect(() => {
        fetchParieurs(page, debouncedSearch);
    }, [page, debouncedSearch, fetchParieurs]);

    // Fetch Details Logic
    const fetchHistory = async (userId: string, type: 'depot' | 'retrait') => {
        try {
            setDetailsLoading(true);
            const data = await bettingApi.getParieurHistory(userId, type, 1, 50);
            // The API returns { histories: [...] }
            setHistoryData(data?.histories || data?.data || []);
        } catch (error) {
            toast.error("Failed to load history");
            setHistoryData([]);
        } finally {
            setDetailsLoading(false);
        }
    };

    const fetchReceipts = async (userId: string, status: 'ongoing' | 'winning' | 'loosing') => {
        try {
            setDetailsLoading(true);
            const data = await bettingApi.getParieurReceipts(userId, status);
            // The API returns { receipts: [...] }
            setReceiptData(data?.receipts || (Array.isArray(data) ? data : []));
        } catch (error) {
            toast.error("Failed to load receipts");
            setReceiptData([]);
        } finally {
            setDetailsLoading(false);
        }
    };

    const handleUserClick = (user: Parieur) => {
        setSelectedUser(user);
        fetchHistory(user.id, historyType);
        fetchReceipts(user.id, receiptStatus);
    };

    useEffect(() => {
        if (selectedUser) fetchHistory(selectedUser.id, historyType);
    }, [historyType, selectedUser]); // Added selectedUser

    useEffect(() => {
        if (selectedUser) fetchReceipts(selectedUser.id, receiptStatus);
    }, [receiptStatus, selectedUser]); // Added selectedUser

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{t('bettingParieur.title')}</h2>
                    <p className="text-muted-foreground">
                        {t('bettingParieur.description')}
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t('bettingParieur.cardTitle')}</CardTitle>
                    <CardDescription>
                        {t('bettingParieur.cardDescription')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center space-x-2 mb-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={t('bettingParieur.searchPlaceholder')}
                                className="pl-8"
                                value={searchPhone}
                                onChange={(e) => setSearchPhone(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('bettingParieur.table.phone')}</TableHead>
                                    <TableHead>{t('bettingParieur.table.email')}</TableHead>
                                    <TableHead>{t('bettingParieur.table.id')}</TableHead>
                                    <TableHead className="text-right">{t('bettingParieur.table.balance')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading && parieurs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                        </TableCell>
                                    </TableRow>
                                ) : parieurs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            {t('bettingParieur.table.noUsers')}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    parieurs.map((user) => (
                                        <TableRow
                                            key={user.id}
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => handleUserClick(user)}
                                        >
                                            <TableCell className="font-medium">{user.phone || 'N/A'}</TableCell>
                                            <TableCell>{user.email || 'N/A'}</TableCell>
                                            <TableCell className="text-xs text-muted-foreground font-mono">{user.id}</TableCell>
                                            <TableCell className="text-right font-bold text-primary">
                                                {user.additionalInfo?.Amount !== undefined
                                                    ? `${Number(user.additionalInfo.Amount).toLocaleString()} HTG`
                                                    : '0 HTG'}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex items-center justify-end space-x-2 py-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1 || loading}
                        >
                            {t('bettingParieur.pagination.previous')}
                        </Button>
                        <div className="text-sm text-muted-foreground">
                            {t('bettingParieur.pagination.pageOf', { page, totalPages })}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages || loading}
                        >
                            {t('bettingParieur.pagination.next')}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{t('bettingParieur.modal.title')}</DialogTitle>
                        <DialogDescription>
                            {t('bettingParieur.modal.description')} <strong>{selectedUser?.phone || selectedUser?.email}</strong>
                        </DialogDescription>
                    </DialogHeader>

                    <Tabs defaultValue="history" className="w-full mt-4">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="history">{t('bettingParieur.modal.history')}</TabsTrigger>
                            <TabsTrigger value="receipts">{t('bettingParieur.modal.receipts')}</TabsTrigger>
                        </TabsList>

                        <TabsContent value="history" className="space-y-4">
                            <div className="flex gap-2">
                                <Button
                                    variant={historyType === 'depot' ? 'default' : 'outline'}
                                    onClick={() => setHistoryType('depot')}
                                    size="sm"
                                >
                                    {t('bettingParieur.modal.deposits')}
                                </Button>
                                <Button
                                    variant={historyType === 'retrait' ? 'default' : 'outline'}
                                    onClick={() => setHistoryType('retrait')}
                                    size="sm"
                                >
                                    {t('bettingParieur.modal.withdrawals')}
                                </Button>
                            </div>

                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>{t('bettingParieur.modal.historyTable.date')}</TableHead>
                                            <TableHead>{t('bettingParieur.modal.historyTable.amount')}</TableHead>
                                            <TableHead>{t('bettingParieur.modal.historyTable.status')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {detailsLoading ? (
                                            <TableRow><TableCell colSpan={3} className="text-center py-4"><Loader2 className="animate-spin mx-auto h-5 w-5" /></TableCell></TableRow>
                                        ) : historyData.length === 0 ? (
                                            <TableRow><TableCell colSpan={3} className="text-center py-4">{t('bettingParieur.modal.historyTable.noHistory', { type: historyType })}</TableCell></TableRow>
                                        ) : (
                                            historyData.map((item, idx) => (
                                                <TableRow key={item.id || idx}>
                                                    <TableCell>{item.createdAt || item.date ? new Date(item.createdAt || item.date!).toLocaleString() : 'N/A'}</TableCell>
                                                    <TableCell className="font-bold">{item.montant ?? item.amount ?? 0} HTG</TableCell>
                                                    <TableCell className="capitalize">{item.type || item.status || historyType}</TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </TabsContent>

                        <TabsContent value="receipts" className="space-y-4">
                            <div className="flex gap-2">
                                <Button variant={receiptStatus === 'ongoing' ? 'default' : 'outline'} onClick={() => setReceiptStatus('ongoing')} size="sm">{t('bettingParieur.modal.ongoing')}</Button>
                                <Button variant={receiptStatus === 'winning' ? 'default' : 'outline'} onClick={() => setReceiptStatus('winning')} size="sm">{t('bettingParieur.modal.winning')}</Button>
                                <Button variant={receiptStatus === 'loosing' ? 'default' : 'outline'} onClick={() => setReceiptStatus('loosing')} size="sm">{t('bettingParieur.modal.loosing')}</Button>
                            </div>

                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>{t('bettingParieur.modal.receiptTable.date')}</TableHead>
                                            <TableHead>{t('bettingParieur.modal.receiptTable.amountPlaced')}</TableHead>
                                            <TableHead>{t('bettingParieur.modal.receiptTable.potentialWin')}</TableHead>
                                            <TableHead>{t('bettingParieur.modal.receiptTable.status')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {detailsLoading ? (
                                            <TableRow><TableCell colSpan={4} className="text-center py-4"><Loader2 className="animate-spin mx-auto h-5 w-5" /></TableCell></TableRow>
                                        ) : receiptData.length === 0 ? (
                                            <TableRow><TableCell colSpan={4} className="text-center py-4">{t('bettingParieur.modal.receiptTable.noReceipts', { status: receiptStatus })}</TableCell></TableRow>
                                        ) : (
                                            receiptData.map((item, idx) => (
                                                <TableRow key={item.id || idx}>
                                                    <TableCell>{item.createdAt || item.date ? new Date(item.createdAt || item.date!).toLocaleString() : 'N/A'}</TableCell>
                                                    <TableCell className="font-bold">{item.stake ?? item.amount ?? 0} HTG</TableCell>
                                                    <TableCell className="text-green-600 font-bold">{item.potentialWin || 0} HTG</TableCell>
                                                    <TableCell className="capitalize">{item.receiptStatus || item.status || receiptStatus}</TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </TabsContent>
                    </Tabs>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default BettingParieur;
