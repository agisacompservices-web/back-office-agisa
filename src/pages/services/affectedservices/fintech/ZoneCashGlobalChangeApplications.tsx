import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import {
    RefreshCw,
    CheckCircle,
    XCircle,
    Loader2,
    User,
    Building2,
    FileText,
    ExternalLink,
    Clock,
    AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import zonecashApi from '../../../../context/api/zonecash';
import { format } from 'date-fns';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../../../../components/ui/dialog';

const ZoneCashGlobalChangeApplications: React.FC = () => {
    const { t } = useTranslation();
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        type: 'APPROVE' | 'REJECT' | null;
        application: any | null;
    }>({
        isOpen: false,
        type: null,
        application: null
    });

    const fetchApplications = useCallback(async () => {
        setLoading(true);
        try {
            const data = await zonecashApi.getGlobalChangeRegistrations();
            setApplications(data);
        } catch (err) {
            toast.error(t('globalChange.errorFetchApps', 'Failed to fetch applications'));
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchApplications();
    }, [fetchApplications]);

    const openConfirmModal = (type: 'APPROVE' | 'REJECT', application: any) => {
        setConfirmModal({
            isOpen: true,
            type,
            application
        });
    };

    const handleConfirmAction = async () => {
        const { type, application } = confirmModal;
        if (!type || !application) return;

        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setProcessingId(application.id);

        try {
            if (type === 'APPROVE') {
                await zonecashApi.approveGlobalChangeRegistration(application.id);
                toast.success(t('globalChange.successApprove', 'Application approved successfully!'));
            } else {
                await zonecashApi.rejectGlobalChangeRegistration(application.id);
                toast.success(t('globalChange.successReject', 'Application rejected successfully!'));
            }
            fetchApplications();
        } catch (err: any) {
            const errorMsg = err?.response?.data?.message ||
                (type === 'APPROVE' ? t('globalChange.errorApprove', 'Failed to approve') : t('globalChange.errorReject', 'Failed to reject'));
            toast.error(errorMsg);
        } finally {
            setProcessingId(null);
            setConfirmModal({ isOpen: false, type: null, application: null });
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'APPROVED':
                return <Badge className="bg-green-100 text-green-700 border-green-200 font-black text-[10px] uppercase">Approved</Badge>;
            case 'REJECTED':
                return <Badge className="bg-red-100 text-red-700 border-red-200 font-black text-[10px] uppercase">Rejected</Badge>;
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
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black tracking-tight text-black uppercase">
                        {t('globalChange.appsTitle', 'Money Market — Applications')}
                    </h2>
                    <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">
                        {t('globalChange.appsDescription', 'Review and manage user applications for Money Market services')}
                    </p>
                </div>
                <Button variant="outline" onClick={fetchApplications} className="border-slate-200 text-zinc-500 font-bold uppercase text-[10px] tracking-widest h-10 px-4">
                    <RefreshCw className={`h-3 w-3 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    {t('globalChange.refresh', 'Refresh')}
                </Button>
            </div>

            <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-6 py-4">
                    <CardTitle className="text-[11px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5 text-blue-500" />
                        {t('globalChange.recentApps', 'Recent Applications')}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/30 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 w-[25%]">User</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Type</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Date</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {applications.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center justify-center opacity-40">
                                                <AlertCircle size={40} className="mb-2 text-slate-300" />
                                                <p className="text-sm font-bold uppercase tracking-widest text-slate-400">No applications found</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    applications.map((app) => (
                                        <tr key={app.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center">
                                                        <User size={16} className="text-blue-500" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-900">{app.user?.fullName}</p>
                                                        <p className="text-[10px] font-bold text-slate-400">{app.user?.phone}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-2">
                                                    {app.type === 'BUSINESS' ? (
                                                        <div className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                                                            <Building2 size={12} strokeWidth={2.5} />
                                                            <span className="text-[10px] font-black uppercase tracking-tight">Business</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1.5 text-zinc-600 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                                                            <User size={12} strokeWidth={2.5} />
                                                            <span className="text-[10px] font-black uppercase tracking-tight">Personal</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                {getStatusBadge(app.status)}
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-1.5 text-slate-400">
                                                    <Clock size={12} />
                                                    <span className="text-[11px] font-bold">{format(new Date(app.createdAt), 'MMM dd, yyyy • HH:mm')}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {app.status === 'PENDING' && (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => openConfirmModal('APPROVE', app)}
                                                                disabled={processingId === app.id}
                                                                className="h-8 border-green-200 text-green-600 hover:bg-green-50 hover:text-green-700 font-black text-[10px] uppercase tracking-widest"
                                                            >
                                                                {processingId === app.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3 mr-1.5" />}
                                                                Approve
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => openConfirmModal('REJECT', app)}
                                                                disabled={processingId === app.id}
                                                                className="h-8 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-black text-[10px] uppercase tracking-widest"
                                                            >
                                                                {processingId === app.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3 mr-1.5" />}
                                                                Reject
                                                            </Button>
                                                        </>
                                                    )}
                                                    {app.type === 'BUSINESS' && (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => window.open(app.patentUrl, '_blank')}
                                                            className="h-8 text-blue-500 font-black text-[10px] uppercase tracking-widest"
                                                        >
                                                            <ExternalLink className="h-3 w-3 mr-1.5" />
                                                            View Patent
                                                        </Button>
                                                    )}
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

            <Dialog open={confirmModal.isOpen} onOpenChange={(open) => !open && setConfirmModal(prev => ({ ...prev, isOpen: false }))}>
                <DialogContent className="sm:max-w-[425px] bg-white border-slate-200 shadow-2xl p-0 overflow-hidden">
                    <div className={`h-1.5 w-full ${confirmModal.type === 'APPROVE' ? 'bg-green-500' : 'bg-red-500'}`} />
                    <div className="p-8">
                        <DialogHeader className="mb-6">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${confirmModal.type === 'APPROVE' ? 'bg-green-50' : 'bg-red-50'}`}>
                                {confirmModal.type === 'APPROVE' ?
                                    <CheckCircle className="h-6 w-6 text-green-500" /> :
                                    <AlertCircle className="h-6 w-6 text-red-500" />
                                }
                            </div>
                            <DialogTitle className="text-xl font-black text-slate-900 uppercase tracking-tight">
                                {confirmModal.type === 'APPROVE' ? t('globalChange.confirmApproveTitle', 'Approve Application') : t('globalChange.confirmRejectTitle', 'Reject Application')}
                            </DialogTitle>
                            <DialogDescription className="text-sm font-bold text-slate-500 uppercase tracking-wide mt-1">
                                {confirmModal.type === 'APPROVE' ?
                                    t('globalChange.confirmApproveDesc', 'Are you sure you want to approve this Money Market application?') :
                                    t('globalChange.confirmRejectDesc', 'Are you sure you want to reject this Money Market application?')
                                }
                            </DialogDescription>
                        </DialogHeader>

                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center">
                                    <User size={18} className="text-slate-400" />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-slate-900 uppercase">{confirmModal.application?.user?.fullName}</p>
                                    <p className="text-[10px] font-bold text-slate-400">{confirmModal.application?.user?.phone}</p>
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="flex-col sm:flex-row gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setConfirmModal({ isOpen: false, type: null, application: null })}
                                className="flex-1 h-12 border-slate-200 text-slate-500 font-black uppercase text-xs tracking-widest hover:bg-slate-50"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleConfirmAction}
                                className={`flex-1 h-12 font-black uppercase text-xs tracking-widest shadow-lg ${confirmModal.type === 'APPROVE' ?
                                        'bg-green-600 hover:bg-green-700 text-white shadow-green-200' :
                                        'bg-red-600 hover:bg-red-700 text-white shadow-red-200'
                                    }`}
                            >
                                {confirmModal.type === 'APPROVE' ? 'Confirm Approval' : 'Confirm Rejection'}
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ZoneCashGlobalChangeApplications;
