import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Textarea } from '../../../../components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../../../components/ui/select';
import {
    Save,
    Loader2,
    Plus,
    Trash2,
    ArrowUp,
    ArrowDown,
    FileText,
    Globe,
    Calendar,
    RefreshCw,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import zonecashApi from '../../../../context/api/zonecash';

interface Section {
    title: string;
    content: string;
}

const ZoneCashPrivacyPolicy: React.FC = () => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [language, setLanguage] = useState<'English' | 'Kreyòl' | 'Français'>('English');
    const [title, setTitle] = useState('');
    const [lastUpdated, setLastUpdated] = useState('');
    const [sections, setSections] = useState<Section[]>([]);
    const [isDirty, setIsDirty] = useState(false);

    const fetchPolicy = useCallback(async (lang: 'English' | 'Kreyòl' | 'Français') => {
        setLoading(true);
        try {
            const data = await zonecashApi.getPrivacyPolicy(lang);
            if (data) {
                setTitle(data.title || '');
                setLastUpdated(data.lastUpdated || '');
                setSections(
                    Array.isArray(data.sections)
                        ? data.sections
                        : typeof data.sections === 'string'
                        ? JSON.parse(data.sections)
                        : []
                );
                setIsDirty(false);
            }
        } catch (error) {
            console.error('Error fetching privacy policy:', error);
            toast.error(t('privacyPolicy.errorFetch') || 'Echèk pou chaje règleman konfidansyalite yo.');
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchPolicy(language);
    }, [language, fetchPolicy]);

    const handleSave = async () => {
        if (!title.trim()) {
            toast.error(t('privacyPolicy.titleRequired') || 'Tit règleman an obligatwa.');
            return;
        }

        setSaving(true);
        try {
            await zonecashApi.updatePrivacyPolicy({
                lang: language,
                title,
                lastUpdated,
                sections
            });
            toast.success(t('privacyPolicy.saveSuccess') || 'Règleman konfidansyalite yo sove avèk siksè.');
            setIsDirty(false);
        } catch (error) {
            console.error('Error saving privacy policy:', error);
            toast.error(t('privacyPolicy.saveError') || 'Erè pandan sovgad règleman yo.');
        } finally {
            setSaving(false);
        }
    };

    const handleSectionChange = (index: number, field: keyof Section, value: string) => {
        const updated = [...sections];
        updated[index] = { ...updated[index], [field]: value };
        setSections(updated);
        setIsDirty(true);
    };

    const handleAddSection = () => {
        setSections([...sections, { title: '', content: '' }]);
        setIsDirty(true);
        // Micro-interaction scroll after short delay
        setTimeout(() => {
            window.scrollTo({
                top: document.body.scrollHeight,
                behavior: 'smooth'
            });
        }, 100);
    };

    const handleRemoveSection = (index: number) => {
        const updated = sections.filter((_, idx) => idx !== index);
        setSections(updated);
        setIsDirty(true);
    };

    const handleMoveSection = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === sections.length - 1) return;

        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        const updated = [...sections];
        const temp = updated[index];
        updated[index] = updated[targetIndex];
        updated[targetIndex] = temp;

        setSections(updated);
        setIsDirty(true);
    };

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto animate-in fade-in slide-in-from-top-4 duration-300">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-6">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
                        <FileText className="h-8 w-8 text-blue-600" />
                        {t('privacyPolicy.pageTitle') || 'Konfigirasyon Règleman Konfidansyalite'}
                    </h1>
                    <p className="text-slate-500 mt-1 text-sm md:text-base">
                        {t('privacyPolicy.pageDescription') || 'Jere règleman konfidansyalite ak tèm legal ki parèt sou aplikasyon mobil lan.'}
                    </p>
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <Button
                        variant="outline"
                        onClick={() => fetchPolicy(language)}
                        disabled={loading || saving}
                        className="hover:bg-slate-50 border-slate-200"
                        title={t('privacyPolicy.reload') || 'Rechaje'}
                    >
                        <RefreshCw className={`h-4 w-4 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={loading || saving || (!isDirty && sections.length > 0)}
                        className={`w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2 rounded-xl shadow-lg shadow-blue-100 hover:shadow-xl hover:shadow-blue-200 transition-all flex items-center justify-center gap-2 ${isDirty ? 'animate-pulse' : ''}`}
                    >
                        {saving ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                {t('privacyPolicy.saving') || 'Ap Sove...'}
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4" />
                                {t('privacyPolicy.save') || 'Sove Règleman yo'}
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Left Column: Controls & Meta */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300">
                        <CardHeader className="bg-slate-50/50 pb-4 border-b border-slate-100 rounded-t-xl">
                            <CardTitle className="text-base font-black text-slate-800 flex items-center gap-2">
                                <Globe className="h-4 w-4 text-blue-600 animate-pulse" />
                                {t('privacyPolicy.langConfig') || 'Konfigirasyon Lang'}
                            </CardTitle>
                            <CardDescription>
                                {t('privacyPolicy.langDesc') || 'Chwazi lang ou vle modifye done yo pou li.'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-5 space-y-4">
                            {isDirty && (
                                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs font-semibold flex items-center gap-2 animate-bounce">
                                    <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                                    <span>{t('privacyPolicy.unsavedChanges') || 'Ou gen chanjman ki pa sove! Pa bliye klike Sove.'}</span>
                                </div>
                            )}

                            {!isDirty && !loading && (
                                <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg text-xs font-semibold flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
                                    <span>{t('privacyPolicy.saved') || 'Done yo an sekirite epi senkronize ak sèvè a.'}</span>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                    {t('privacyPolicy.selectLang') || 'Lang Aktif'}
                                </Label>
                                <Select
                                    value={language}
                                    onValueChange={(val: 'English' | 'Kreyòl' | 'Français') => setLanguage(val)}
                                    disabled={loading || saving}
                                >
                                    <SelectTrigger className="w-full bg-white border-slate-200 h-11 font-medium">
                                        <SelectValue placeholder="Lang" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="English">🇺🇸 English</SelectItem>
                                        <SelectItem value="Kreyòl">🇭🇹 Kreyòl Ayisyen</SelectItem>
                                        <SelectItem value="Français">🇫🇷 Français</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border border-slate-100 shadow-sm">
                        <CardHeader className="bg-slate-50/50 pb-4 border-b border-slate-100 rounded-t-xl">
                            <CardTitle className="text-base font-black text-slate-800 flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-blue-600" />
                                {t('privacyPolicy.metaDetails') || 'Metadòne Dokiman'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-5 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="doc-title" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                    {t('privacyPolicy.docTitle') || 'Tit Dokiman an'}
                                </Label>
                                <Input
                                    id="doc-title"
                                    value={title}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                        setTitle(e.target.value);
                                        setIsDirty(true);
                                    }}
                                    disabled={loading || saving}
                                    placeholder="e.g. Privacy Policy & Legal Terms"
                                    className="bg-white border-slate-200 font-medium"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="doc-updated" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                    {t('privacyPolicy.lastUpdated') || 'Dènye Mizajou'}
                                </Label>
                                <Input
                                    id="doc-updated"
                                    value={lastUpdated}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                        setLastUpdated(e.target.value);
                                        setIsDirty(true);
                                    }}
                                    disabled={loading || saving}
                                    placeholder="e.g. Last updated: June 18, 2026"
                                    className="bg-white border-slate-200 font-medium"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Sections Editor */}
                <div className="lg:col-span-8 space-y-6">
                    {loading ? (
                        <div className="bg-white rounded-xl border border-slate-100 p-12 text-center flex flex-col items-center justify-center gap-3">
                            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                            <p className="text-slate-500 font-medium">{t('privacyPolicy.loading') || 'Ap chaje règleman yo...'}</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-lg font-black text-slate-800">
                                    {t('privacyPolicy.sectionsTitle') || 'Seksyon yo'} ({sections.length})
                                </h2>
                                <Button
                                    onClick={handleAddSection}
                                    className="bg-blue-50 border border-blue-100 text-blue-600 hover:bg-blue-100 font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5"
                                >
                                    <Plus className="h-4 w-4" />
                                    {t('privacyPolicy.addSection') || 'Ajoute Seksyon'}
                                </Button>
                            </div>

                            {sections.length === 0 ? (
                                <Card className="border-dashed border-slate-200 shadow-none bg-slate-50/50">
                                    <CardContent className="p-12 text-center text-slate-400">
                                        <p className="font-medium text-slate-500 mb-2">
                                            {t('privacyPolicy.noSections') || 'Pa gen okenn seksyon nan règleman sa yo.'}
                                        </p>
                                        <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                                            {t('privacyPolicy.noSectionsDesc') || 'Klike sou bouton anlè a pou w kòmanse kreye premye seksyon règleman ou yo.'}
                                        </p>
                                        <Button
                                            onClick={handleAddSection}
                                            variant="outline"
                                            className="border-slate-200 text-slate-700 font-semibold"
                                        >
                                            <Plus className="h-4 w-4 mr-1.5 text-blue-600" />
                                            {t('privacyPolicy.createFirst') || 'Kreye Premye Seksyon'}
                                        </Button>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="space-y-4">
                                    {sections.map((sec, idx) => (
                                        <Card 
                                            key={idx} 
                                            className="border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden"
                                        >
                                            <div className="flex justify-between items-center bg-slate-50/50 px-5 py-3 border-b border-slate-100">
                                                <span className="text-xs font-black text-blue-600 uppercase tracking-widest">
                                                    {t('privacyPolicy.section') || 'Seksyon'} #{idx + 1}
                                                </span>
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleMoveSection(idx, 'up')}
                                                        disabled={idx === 0}
                                                        className="h-8 w-8 text-slate-500 hover:text-slate-900 disabled:opacity-30"
                                                        title={t('privacyPolicy.moveUp') || 'Moute'}
                                                    >
                                                        <ArrowUp className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleMoveSection(idx, 'down')}
                                                        disabled={idx === sections.length - 1}
                                                        className="h-8 w-8 text-slate-500 hover:text-slate-900 disabled:opacity-30"
                                                        title={t('privacyPolicy.moveDown') || 'Desann'}
                                                    >
                                                        <ArrowDown className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleRemoveSection(idx)}
                                                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors ml-1"
                                                        title={t('privacyPolicy.delete') || 'Efase'}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                            
                                            <CardContent className="p-5 space-y-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor={`sec-title-${idx}`} className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                                        {t('privacyPolicy.sectionTitle') || 'Tit Seksyon'}
                                                    </Label>
                                                    <Input
                                                        id={`sec-title-${idx}`}
                                                        value={sec.title}
                                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSectionChange(idx, 'title', e.target.value)}
                                                        className="bg-white border-slate-200 font-semibold"
                                                        placeholder="e.g. 1. Enfòmasyon Nou Kolekte"
                                                    />
                                                </div>
                                                
                                                <div className="space-y-2">
                                                    <Label htmlFor={`sec-content-${idx}`} className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                                        {t('privacyPolicy.sectionContent') || 'Kontni Seksyon'}
                                                    </Label>
                                                    <Textarea
                                                        id={`sec-content-${idx}`}
                                                        value={sec.content}
                                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleSectionChange(idx, 'content', e.target.value)}
                                                        className="bg-white border-slate-200 min-h-[100px] font-medium leading-relaxed"
                                                        placeholder="Ekri kontni an detay pou seksyon sa a..."
                                                    />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default ZoneCashPrivacyPolicy;
