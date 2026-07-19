import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import zonecashApi from '../../../../context/api/zonecash';

export default function ZoneCashBusinessValidation() {
  const { t } = useTranslation();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocUrl, setSelectedDocUrl] = useState<string | null>(null);
  const [rejectingAccountId, setRejectingAccountId] = useState<string | null>(null);
  const [rejectionReasonText, setRejectionReasonText] = useState<string>('');
  const [rejectNameFlag, setRejectNameFlag] = useState(false);
  const [rejectDocumentFlag, setRejectDocumentFlag] = useState(false);

  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await zonecashApi.getPendingBusinessAccounts();
      setAccounts(res || []);
    } catch (err: any) {
      toast.error(t('businessValidation.toasts.errorLoad') || 'Erreur lors du chargement des comptes en attente');
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleValidate = async (
    accountId: string, 
    status: 'ACTIVE' | 'REJECTED', 
    reason?: string,
    rejectName?: boolean,
    rejectDocument?: boolean
  ) => {
    try {
      await zonecashApi.validateBusinessAccount(accountId, status, reason, rejectName, rejectDocument);
      toast.success(status === 'ACTIVE' 
        ? (t('businessValidation.toasts.successApprove') || 'Compte Approuvé avec succès')
        : (t('businessValidation.toasts.successReject') || 'Compte Rejeté avec succès')
      );
      fetchAccounts();
    } catch (err: any) {
      toast.error(t('businessValidation.toasts.errorValidation') || 'Erreur lors de la validation du compte');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">{t('businessValidation.loading') || 'Chargement...'}</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-black text-slate-800">
          {t('businessValidation.title') || 'Validation des Comptes Business'}
        </h1>
      </div>

      {accounts.length === 0 ? (
        <Card className="shadow-none border-dashed bg-slate-50">
          <CardContent className="p-12 text-center text-slate-500">
            {t('businessValidation.noPending') || 'Aucun compte business en attente de validation.'}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map(acc => (
            <Card key={acc.id} className="shadow-sm">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-lg font-black">{acc.name}</CardTitle>
                <p className="text-sm text-slate-500">
                  {t('businessValidation.owner') || 'Propriétaire'}: {acc.user?.fullName || '---'}
                </p>
                <p className="text-sm text-slate-500">
                  {t('businessValidation.phone') || 'Téléphone'}: {acc.user?.phone || '---'}
                </p>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={() => setSelectedDocUrl(acc.documentUrl)}
                    variant="outline"
                    className="flex items-center text-blue-600 font-medium text-sm bg-blue-50 p-3 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors w-full justify-center"
                  >
                    {t('businessValidation.viewDoc') || "Voir le document d'enregistrement"}
                  </Button>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={() => {
                      setRejectingAccountId(acc.id);
                      setRejectionReasonText('');
                      setRejectNameFlag(false);
                      setRejectDocumentFlag(false);
                    }}
                    variant="outline"
                    className="flex-1 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                  >
                    {t('businessValidation.reject') || 'Rejeter'}
                  </Button>
                  <Button
                    onClick={() => handleValidate(acc.id, 'ACTIVE')}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    {t('businessValidation.approve') || 'Approuver'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedDocUrl && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-10"
          onClick={() => setSelectedDocUrl(null)}
        >
          <div 
            className="bg-white rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-white">
              <h3 className="text-lg font-black text-slate-800">
                {t('businessValidation.docTitle') || "Document d'enregistrement"}
              </h3>
              <button 
                onClick={() => setSelectedDocUrl(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-all text-xl font-bold"
              >
                ✕
              </button>
            </div>
            {/* Modal Body */}
            <div className="flex-1 bg-slate-100 relative">
              <iframe 
                src={selectedDocUrl} 
                className="w-full h-full border-none"
                title="Business Document"
              />
            </div>
          </div>
        </div>
      )}

      {rejectingAccountId && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setRejectingAccountId(null)}
        >
          <div 
            className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-xl font-black text-slate-800 mb-2">
              {t('businessValidation.rejectReasonTitle') || 'Motif du rejet'}
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              {t('businessValidation.rejectInstructions') || 'Veuillez cocher les éléments incorrects et saisir la raison du rejet.'}
            </p>

            {/* Checkboxes for incorrect elements */}
            <div className="space-y-3 mb-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <span className="text-[12px] font-black text-slate-500 uppercase tracking-widest block">
                {t('businessValidation.itemsToCorrect') || 'Éléments à corriger :'}
              </span>
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rejectNameFlag}
                  onChange={(e) => setRejectNameFlag(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-bold text-slate-700">
                  {t('businessValidation.incorrectName') || 'Nom du business incorrect'}
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rejectDocumentFlag}
                  onChange={(e) => setRejectDocumentFlag(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-bold text-slate-700">
                  {t('businessValidation.invalidDoc') || 'Document invalide ou expiré'}
                </span>
              </label>
            </div>
            
            <textarea
              value={rejectionReasonText}
              onChange={e => setRejectionReasonText(e.target.value)}
              className="w-full h-24 border-2 border-slate-200 rounded-xl p-3 text-slate-800 text-sm focus:border-blue-600 focus:outline-none mb-4 resize-none"
              placeholder="Ex: Le document fourni est expiré ou illisible..."
            />

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setRejectingAccountId(null)}
                className="px-4 py-2 text-slate-500 hover:bg-slate-50 border-slate-200"
              >
                {t('businessValidation.cancel') || 'Annuler'}
              </Button>
              <Button
                onClick={async () => {
                  if (!rejectNameFlag && !rejectDocumentFlag) {
                    toast.error(t('businessValidation.toasts.selectElementError') || "Veuillez cocher au moins un élément à corriger.");
                    return;
                  }
                  if (!rejectionReasonText.trim()) {
                    toast.error(t('businessValidation.toasts.reasonRequiredError') || "La raison du rejet est obligatoire.");
                    return;
                  }
                  const reason = rejectionReasonText.trim();
                  setRejectingAccountId(null);
                  handleValidate(rejectingAccountId, 'REJECTED', reason, rejectNameFlag, rejectDocumentFlag);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors"
              >
                {t('businessValidation.confirmReject') || 'Confirmer le rejet'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
