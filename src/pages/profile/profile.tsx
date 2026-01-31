import React, { useEffect, useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import usersApi, { TrustedDevice } from "../../context/api/users";
import authApi from "../../context/api/auth";
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "../../components/ui/avatar";
import { Button } from "../../components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Switch } from "../../components/ui/switch";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../../components/ui/dialog";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "../../components/ui/tooltip";
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from "../../components/ui/input-otp";
import {
    User,
    Phone,
    ShieldCheck,
    Smartphone,
    Lock,
    ChevronRight,
    Eye,
    EyeOff,
    History,
    CheckCircle2,
    QrCode,
    Download,
    ImagePlus,
    Loader2
} from "lucide-react";

interface ActivityLog {
    action: string;
    timestamp: string;
    ip?: string;
    userAgent?: string;
}

interface UserData {
    fullName: string;
    email: string;
    role: {
        name: string;
    };
    avatarUrl?: string;
    lastLoginAt?: string;
    userCode?: string;
    phone?: string;
    bio?: string;
    activityLogs?: ActivityLog[];
    twoFactorEnabled: boolean;
}

const Profile: React.FC = () => {
    const [user, setUser] = useState<UserData | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

    // Form fields state
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [bio, setBio] = useState('');
    const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState(false);
    const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
    const [backupCodes, setBackupCodes] = useState<string[]>([]);
    const [isSettingUp2FA, setIsSettingUp2FA] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showTrustedDevicesModal, setShowTrustedDevicesModal] = useState(false);
    const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);
    const [otpCode, setOtpCode] = useState("");
    const [otpStatus, setOtpStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Password visibility states
    const [showCurrentPass, setShowCurrentPass] = useState(false);
    const [showNewPass, setShowNewPass] = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);

    // Password fields state
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
    });


    // State for Trusted Devices
    const [trustedDevices, setTrustedDevices] = useState<TrustedDevice[]>([]);
    const [isFetchingDevices, setIsFetchingDevices] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem('agisa_user');
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
                // Initialize form fields
                if (parsedUser.fullName) {
                    const parts = parsedUser.fullName.split(' ');
                    setFirstName(parts[0] || '');
                    setLastName(parts.slice(1).join(' ') || '');
                }
                setPhone(parsedUser.phone || '');
                setBio(parsedUser.bio || '');
                setAvatarPreview(parsedUser.avatarUrl || null);
                setIsTwoFactorEnabled(parsedUser.twoFactorEnabled || false);
            } catch (e) {
                console.error("Failed to parse user from localStorage", e);
            }
        }
    }, []);

    const fetchTrustedDevices = useCallback(async () => {
        setIsFetchingDevices(true);
        try {
            const devices = await usersApi.getTrustedDevices();
            setTrustedDevices(devices);
        } catch (error) {
            console.error("Failed to fetch trusted devices", error);
            // toast.error("Impossible de charger les appareils de confiance");
        } finally {
            setIsFetchingDevices(false);
        }
    }, []);

    useEffect(() => {
        if (showTrustedDevicesModal) {
            fetchTrustedDevices();
        }
    }, [showTrustedDevicesModal, fetchTrustedDevices]);

    const handleRemoveDevice = async (deviceId: string) => {
        try {
            const updated = await usersApi.removeTrustedDevice(deviceId);
            setTrustedDevices(updated);
            toast.success("Appareil supprimé avec succès");
        } catch (error) {
            toast.error("Erreur lors de la suppression");
        }
    };

    const handleClearDevices = async () => {
        try {
            await usersApi.clearTrustedDevices();
            setTrustedDevices([]);
            toast.success("Tous les appareils ont été supprimés");
        } catch (error) {
            toast.error("Erreur lors de la suppression globale");
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validation de base
        if (!file.type.startsWith('image/')) {
            toast.error("Please select a valid image.");
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB
            toast.error("Image too large. Limit is 5MB.");
            return;
        }

        setSelectedFile(file);

        // Show local preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setAvatarPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleUpdateProfile = async () => {
        if (!user) return;

        setIsUpdatingProfile(true);
        const loadingToast = toast.loading("Updating profile...");

        try {
            const fullName = `${firstName} ${lastName}`.trim();
            const updateData: any = {
                fullName,
                phone,
                bio,
            };

            if (selectedFile) {
                updateData.avatar = selectedFile;
            }

            const updatedProfile = await usersApi.updateMe(updateData);

            // Sync with local state
            const newUser = {
                ...user,
                fullName: updatedProfile.fullName,
                phone: updatedProfile.phone,
                bio: updatedProfile.bio,
                avatarUrl: updatedProfile.avatarUrl
            };
            setUser(newUser);
            setAvatarPreview(updatedProfile.avatarUrl || null);
            setSelectedFile(null); // Clear selected file after success

            // Sync with localStorage
            localStorage.setItem('agisa_user', JSON.stringify(newUser));

            // Notify other components (like UserAvatar in the Topbar)
            window.dispatchEvent(new Event('user-profile-updated'));

            toast.success("Profile updated successfully!", { id: loadingToast });
        } catch (error: any) {
            console.error("Failed to update profile", error);
            const errorMessage = error.response?.data?.message || "Error updating profile.";
            toast.error(errorMessage, { id: loadingToast });
        } finally {
            setIsUpdatingProfile(false);
        }
    };

    const triggerFileSelect = () => {
        fileInputRef.current?.click();
    };

    const handleDownloadCodes = () => {
        if (!backupCodes || backupCodes.length === 0) return;
        const content = `AGISA - CODES DE SECOURS 2FA\n\nUtilisez ces codes si vous perdez l'accès à votre application d'authentification.\n\n${backupCodes.map(code => `- ${code}`).join('\n')}\n\nDate: ${new Date().toLocaleString()}\n`;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `agisa-backup-codes-${user?.fullName.replace(/\s+/g, '-').toLowerCase()}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleToggle2FA = async (checked: boolean) => {
        if (checked) {
            // Setup flow
            setIsSettingUp2FA(true);
            try {
                const data = await authApi.setup2FA();
                setQrCodeUrl(data.qrCodeDataUrl);
                setBackupCodes(data.backupCodes);
                setShowTwoFactorModal(true);
            } catch (error: any) {
                toast.error("Error setting up 2FA");
                console.error(error);
            } finally {
                setIsSettingUp2FA(false);
            }
        } else {
            // Disable flow
            try {
                await authApi.disable2FA();
                setIsTwoFactorEnabled(false);

                // Update local user state
                if (user) {
                    const newUser = { ...user, twoFactorEnabled: false };
                    setUser(newUser);
                    localStorage.setItem('agisa_user', JSON.stringify(newUser));
                }

                toast.success("2FA Authentication disabled");
            } catch (error: any) {
                toast.error("Error disabling 2FA");
            }
        }
    };

    const handleConfirmEnable2FA = useCallback(async () => {
        if (otpCode.length !== 6) return;

        setOtpStatus('verifying');
        try {
            await authApi.enable2FA(otpCode);
            setOtpStatus('success');
            setIsTwoFactorEnabled(true);

            // Update local user state
            if (user) {
                const newUser = { ...user, twoFactorEnabled: true };
                setUser(newUser);
                localStorage.setItem('agisa_user', JSON.stringify(newUser));
            }

            toast.success("2FA Authentication enabled successfully!");

            // Delay closing modal to show success state
            setTimeout(() => {
                setShowTwoFactorModal(false);
                setOtpCode("");
                setOtpStatus('idle');
            }, 800);
        } catch (error: any) {
            setOtpStatus('error');
            toast.error(error.response?.data?.message || "Invalid code");

            // Reset after animation
            setTimeout(() => {
                setOtpCode("");
                setOtpStatus('idle');
            }, 500);
        }
    }, [otpCode, user]);

    // Auto-submit when 6 digits are reached
    useEffect(() => {
        if (otpCode.length === 6 && otpStatus === 'idle') {
            handleConfirmEnable2FA();
        }
    }, [otpCode, otpStatus, handleConfirmEnable2FA]);

    const handleUpdatePassword = async () => {
        // Validation
        if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmNewPassword) {
            toast.error("All fields are required", { description: "Please fill in all the fields." });
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmNewPassword) {
            toast.error("Confirmation error", { description: "The new passwords do not match." });
            return;
        }

        if (passwordData.newPassword.length < 8) {
            toast.error("Password too short", { description: "The password must be at least 8 characters long." });
            return;
        }

        setIsUpdatingPassword(true);
        const loadingToast = toast.loading("Updating password...");

        try {
            await usersApi.updateMyPassword(passwordData);
            toast.success("Password updated successfully!", { id: loadingToast });
            setShowPasswordModal(false);
            // Reset fields
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmNewPassword: ''
            });
        } catch (error: any) {
            console.error("Failed to update password", error);
            const errorMessage = error.response?.data?.message || "Error updating password.";
            toast.error(errorMessage, { id: loadingToast });
        } finally {
            setIsUpdatingPassword(false);
        }
    };

    if (!user) return <div className="flex h-full items-center justify-center text-white">Loading...</div>;

    return (
        <div className="container mx-auto max-w-7xl animate-in fade-in duration-500 py-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">

                {/* --- LEFT COLUMN --- */}
                <div className="lg:col-span-4 space-y-6">

                    {/* Profile Header Card */}
                    <Card className="overflow-hidden border-white/10 bg-white/5 backdrop-blur-xl">
                        <div className="relative h-24 w-full bg-gradient-to-r from-emerald-600/20 to-blue-600/20">
                            <img
                                src="https://images.unsplash.com/photo-1635350736475-c8cef4b21906?q=80&w=2070&auto=format&fit=crop"
                                alt="Cover"
                                className="h-full w-full object-cover opacity-40"
                            />
                            <div className="absolute top-3 right-3 flex gap-1.5">
                                <div className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-400 backdrop-blur-md border border-emerald-500/20">
                                    <CheckCircle2 className="h-2.5 w-2.5" />
                                    VÉRIFIÉ
                                </div>
                                <div className="flex items-center gap-1 rounded-full bg-emerald-500/80 px-2 py-0.5 text-[9px] font-bold text-white shadow-lg">
                                    <div className="h-1 w-1 rounded-full bg-white animate-pulse" />
                                    ACTIF
                                </div>
                            </div>
                        </div>
                        <div className="relative -mt-10 flex flex-col items-center pb-6 px-4">
                            <div className="relative group">
                                <Avatar className="h-24 w-24 border-4 border-[#0a0a0a] shadow-2xl transition-transform duration-300 group-hover:scale-105">
                                    <AvatarImage src={avatarPreview || ''} className="object-cover" />
                                    <AvatarFallback className="bg-emerald-500 text-2xl font-black text-white">
                                        {getInitials(user.fullName)}
                                    </AvatarFallback>
                                </Avatar>

                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    className="hidden"
                                    accept="image/*"
                                />
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button
                                                onClick={triggerFileSelect}
                                                disabled={isUpdatingProfile}
                                                className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-500 transition-colors border-2 border-[#0a0a0a] disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isUpdatingProfile ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <ImagePlus className="h-4 w-4" />
                                                )}
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent className="bg-slate-800 text-white border-none">
                                            <p>Change Photo</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>

                            <h2 className="mt-4 text-center text-xl font-bold text-white tracking-tight">
                                {user.fullName}
                            </h2>
                            <p className="mt-1 text-center text-xs font-bold text-emerald-500 uppercase tracking-[0.2em] opacity-80 flex items-center gap-2">
                                <ShieldCheck className="h-3 w-3" />
                                {user.role.name}
                            </p>
                        </div>
                        <div className="py-2 px-3">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-widest pb-2">
                                <History className="h-3.5 w-3.5" />
                                Statistics
                            </div>
                            <div className="rounded-lg bg-white/5 p-3 border border-white/5 flex items-start gap-3 hover:bg-white/10 transition-colors duration-300">
                                <div className="rounded-full bg-emerald-500/10 p-1.5 border border-emerald-500/20 text-emerald-500">
                                    <History className="h-3.5 w-3.5" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <p className="text-sm font-bold text-white">Last login</p>
                                    </div>
                                    <p className="text-xs text-slate-400 capitalize">
                                        {user.lastLoginAt
                                            ? `${new Date(user.lastLoginAt).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}, ${new Date(user.lastLoginAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
                                            : "First connection"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Settings/Parameters Card */}
                    <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
                        <CardHeader className="py-3">
                            <CardTitle className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                                <ShieldCheck className="h-3.5 w-3.5" />
                                Settings
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 pb-4">
                            {/* 2FA Switch */}
                            <div className="flex items-center justify-between rounded-lg bg-white/5 p-3 border border-white/5 hover:bg-white/10 transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-full bg-emerald-500/10 p-1.5 text-emerald-500">
                                        <ShieldCheck className="h-3.5 w-3.5" />
                                    </div>
                                    <span className="text-xs font-bold text-white tracking-tight">2FA Authentication</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    {isSettingUp2FA && <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />}
                                    <Switch
                                        checked={isTwoFactorEnabled}
                                        disabled={isSettingUp2FA}
                                        onCheckedChange={handleToggle2FA}
                                        className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-white/10 border-white/10 shadow-lg data-[state=checked]:shadow-emerald-500/20"
                                    />
                                </div>
                            </div>

                            {/* Trusted Devices */}
                            <div
                                className="flex items-center justify-between rounded-lg bg-white/5 p-4 border border-white/5 hover:bg-white/10 transition-all cursor-pointer group"
                                onClick={() => setShowTrustedDevicesModal(true)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="rounded-full bg-purple-500/10 p-2 text-purple-400">
                                        <Smartphone className="h-4 w-4" />
                                    </div>
                                    <span className="text-sm font-medium text-white">Trusted Devices</span>
                                </div>
                                <Eye className="h-4 w-4 text-slate-500 group-hover:text-white transition-colors" />
                            </div>

                            {/* Change Password */}
                            <div
                                className="flex items-center justify-between rounded-lg bg-white/5 p-4 border border-white/5 hover:bg-white/10 transition-all cursor-pointer group"
                                onClick={() => setShowPasswordModal(true)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="rounded-full bg-orange-500/10 p-2 text-orange-400">
                                        <Lock className="h-4 w-4" />
                                    </div>
                                    <span className="text-sm font-medium text-white">Update Password</span>
                                </div>
                                <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-white transition-colors" />
                            </div>
                        </CardContent>
                    </Card>

                </div>

                {/* --- RIGHT COLUMN --- */}
                <div className="lg:col-span-8 space-y-4">

                    {/* Details Card */}
                    <Card className="border-white/10 bg-white/5 backdrop-blur-xl border-t-emerald-500/50">
                        <CardHeader className="py-4">
                            <CardTitle className="flex items-center gap-2 text-base font-bold text-white tracking-tight">
                                <User className="h-4 w-4 text-emerald-500" />
                                Profile Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 pb-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Last Name</Label>
                                    <Input
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        className="h-10 border-white/10 bg-white/5 text-white focus:border-emerald-500/50 focus:ring-emerald-500/20 text-sm"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">First Name</Label>
                                    <Input
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        className="h-10 border-white/10 bg-white/5 text-white focus:border-emerald-500/50 focus:ring-emerald-500/20 text-sm"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Phone</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                                        <Input
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder="+509 XXXX-XXXX"
                                            className="h-10 pl-10 border-white/10 bg-white/5 text-white focus:border-emerald-500/50 focus:ring-emerald-500/20 text-sm"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Email (Read Only)</Label>
                                    <Input
                                        value={user.email}
                                        readOnly
                                        className="h-10 border-white/5 bg-white/[0.02] text-slate-500 cursor-not-allowed text-sm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Bio</Label>
                                <textarea
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    placeholder="Tell us a bit about yourself..."
                                    className="min-h-[100px] w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all duration-200"
                                />
                            </div>

                            <div className="flex justify-end pt-2">
                                <Button
                                    onClick={handleUpdateProfile}
                                    disabled={isUpdatingProfile}
                                    className="h-10 bg-emerald-600 px-8 font-black uppercase tracking-widest text-white hover:bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isUpdatingProfile ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                    Update
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Activity Card */}
                    <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
                        <CardHeader className="py-4">
                            <CardTitle className="text-base font-bold text-white tracking-tight">Recent Activity</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 pb-6">
                            {user?.activityLogs && user.activityLogs.length > 0 ? (
                                user.activityLogs.slice(0, 5).map((log, i) => (
                                    <div key={i} className="relative pl-7 before:absolute before:left-[10px] before:top-2 before:h-full before:w-[2px] before:bg-white/10 last:before:hidden">
                                        <div className="absolute left-0 top-1 h-5 w-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 p-1 flex items-center justify-center text-emerald-500">
                                            <History className="h-2.5 w-2.5" />
                                        </div>
                                        <div className="rounded-xl border border-white/10 bg-white/5 p-3.5 hover:border-emerald-500/30 transition-all duration-300 group">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                                    {log.action === 'LOGIN' ? 'Login' :
                                                        log.action === 'PROFILE_UPDATE' ? 'Profile Update' :
                                                            log.action === 'TWO_FACTOR_ENABLED' ? '2FA Enabled' :
                                                                log.action === 'TWO_FACTOR_DISABLED' ? '2FA Disabled' :
                                                                    log.action === 'ACCOUNT_UNLOCK' ? 'Account Unlocked' :
                                                                        log.action === 'PASSWORD_CHANGE' ? 'Password Change' : log.action}
                                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                                                </h4>
                                                {log.ip && (
                                                    <span className="text-[10px] font-medium text-slate-500 bg-white/5 px-2 py-0.5 rounded">IP: {log.ip}</span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-400 mb-3">
                                                {log.action === 'LOGIN' ? 'Successful login to the account' :
                                                    log.action === 'PROFILE_UPDATE' ? 'Updated profile information' :
                                                        log.action === 'TWO_FACTOR_ENABLED' ? 'Enabled two-factor authentication' :
                                                            log.action === 'TWO_FACTOR_DISABLED' ? 'Disabled two-factor authentication' :
                                                                log.action === 'ACCOUNT_UNLOCK' ? 'Account was unlocked by administrator' :
                                                                    log.action === 'PASSWORD_CHANGE' ? 'Successfully changed account password' : 'User activity detected'}
                                            </p>
                                            <div className="flex flex-wrap gap-4 text-[10px] text-slate-500">
                                                <div className="flex items-center gap-1.5">
                                                    <History className="h-3 w-3" />
                                                    <span>{new Date(log.timestamp).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <History className="h-3 w-3 opacity-0" /> {/* Spacer */}
                                                    <span>{new Date(log.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </div>
                                            {log.userAgent && (
                                                <p className="mt-3 text-[9px] text-slate-600 font-mono truncate">
                                                    Device: {log.userAgent}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8">
                                    <History className="h-8 w-8 text-slate-600 mx-auto mb-3 opacity-20" />
                                    <p className="text-sm text-slate-500">No recent activity found</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                </div>
            </div>

            {/* --- PASSWORD MODAL --- */}
            <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
                <DialogContent className="max-w-md border-white/10 bg-black/60 backdrop-blur-2xl text-white outline-none shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3 text-xl font-bold tracking-tight">
                            <div className="rounded-full bg-emerald-500/10 p-2 text-emerald-500">
                                <Lock className="h-5 w-5" />
                            </div>
                            Update Password
                        </DialogTitle>
                        <DialogDescription className="text-slate-400 font-medium">
                            Update your password security
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-5 py-4">
                        {/* Current Password */}
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Current Password</Label>
                            <div className="relative">
                                <Input
                                    type={showCurrentPass ? "text" : "password"}
                                    value={passwordData.currentPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                    className="h-12 pr-10 border-white/10 bg-white/5 text-white focus:border-emerald-500/50 focus:ring-emerald-500/20"
                                />
                                <button
                                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                                >
                                    {showCurrentPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        {/* New Password */}
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">New Password</Label>
                            <div className="relative">
                                <Input
                                    type={showNewPass ? "text" : "password"}
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                    className="h-12 pr-10 border-white/10 bg-white/5 text-white focus:border-emerald-500/50 focus:ring-emerald-500/20"
                                />
                                <button
                                    onClick={() => setShowNewPass(!showNewPass)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                                >
                                    {showNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm New Password */}
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Confirm New Password</Label>
                            <div className="relative">
                                <Input
                                    type={showConfirmPass ? "text" : "password"}
                                    value={passwordData.confirmNewPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, confirmNewPassword: e.target.value })}
                                    className="h-12 pr-10 border-white/10 bg-white/5 text-white focus:border-emerald-500/50 focus:ring-emerald-500/20"
                                />
                                <button
                                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                                >
                                    {showConfirmPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="ghost"
                            onClick={() => setShowPasswordModal(false)}
                            className="bg-white/5 text-white hover:bg-white/10 h-12 uppercase font-black tracking-widest text-[10px] flex-1 sm:flex-none"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleUpdatePassword}
                            disabled={isUpdatingPassword}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white h-12 px-6 uppercase font-black tracking-widest text-[10px] flex items-center gap-2 flex-1 sm:flex-none disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isUpdatingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                            Update
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* --- TRUSTED DEVICES MODAL --- */}
            <Dialog open={showTrustedDevicesModal} onOpenChange={setShowTrustedDevicesModal}>
                <DialogContent className="max-w-2xl border-white/10 bg-black/60 backdrop-blur-2xl text-white outline-none shadow-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
                    <DialogHeader className="p-6 pb-4 shrink-0 border-b border-white/5">
                        <DialogTitle className="flex items-center gap-3 text-xl font-bold tracking-tight">
                            <div className="rounded-full bg-blue-500/10 p-2 text-blue-400">
                                <History className="h-5 w-5" />
                            </div>
                            Trusted devices
                        </DialogTitle>
                        <DialogDescription className="text-slate-400 font-medium">
                            Devices on which 2FA will not be requested for a limited period.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-4 space-y-4">
                        {isFetchingDevices ? (
                            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                                <p className="text-sm text-slate-400">Loading devices...</p>
                            </div>
                        ) : trustedDevices.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 space-y-4 decoration-slate-500/20">
                                <div className="rounded-full bg-slate-500/10 p-4 text-slate-500">
                                    <Smartphone className="h-8 w-8" />
                                </div>
                                <p className="text-sm text-slate-400">No trusted devices found</p>
                            </div>
                        ) : (
                            trustedDevices.map((device) => (
                                <div
                                    key={device.id}
                                    className="rounded-xl border border-white/10 bg-white/5 p-5 hover:border-blue-500/30 transition-all duration-300 group"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1 min-w-0 pr-4">
                                            <h4 className="text-[13px] font-bold text-white truncate mb-1">
                                                {device.userAgent}
                                            </h4>
                                            <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-white/5 px-2 py-0.5 rounded w-fit">
                                                <span className="font-bold text-blue-400">IP: {device.ipAddress}</span>
                                                <span className="opacity-50">•</span>
                                                <span>{device.location || 'Unknown location'}</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveDevice(device.id)}
                                            className="text-[11px] font-bold text-red-400 hover:text-red-300 transition-colors uppercase tracking-widest bg-red-400/10 px-3 py-1.5 rounded-lg border border-red-400/20"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10px] text-slate-500">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-slate-400">Last used:</span>
                                            <span className="text-slate-300">
                                                {new Date(device.lastUsedAt).toLocaleString('fr-FR')}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-slate-400">Expire le:</span>
                                            <span className="text-slate-300">
                                                {new Date(device.expiresAt).toLocaleString('fr-FR')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <DialogFooter className="flex-col sm:flex-row gap-4 border-t border-white/10 p-6 shrink-0">
                        {trustedDevices.length > 0 && (
                            <Button
                                variant="ghost"
                                onClick={handleClearDevices}
                                className="bg-red-400/5 text-red-400 hover:bg-red-400/10 hover:text-red-300 h-10 uppercase font-black tracking-widest text-[9px] w-full sm:w-auto"
                            >
                                Remove all
                            </Button>
                        )}
                        <div className="flex-1" />
                        <Button
                            variant="ghost"
                            onClick={() => setShowTrustedDevicesModal(false)}
                            className="bg-white/5 text-white hover:bg-white/10 h-10 uppercase font-black tracking-widest text-[9px] w-full sm:w-auto px-8"
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* --- 2FA CONFIGURATION MODAL --- */}
            <Dialog open={showTwoFactorModal} onOpenChange={setShowTwoFactorModal}>
                <DialogContent className="max-w-4xl border-white/10 bg-black/60 backdrop-blur-2xl text-white outline-none shadow-2xl overflow-hidden p-0 rounded-3xl max-h-[90vh] flex flex-col">
                    <DialogHeader className="p-6 pb-4 flex flex-row items-center justify-between border-b border-white/5 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-blue-500/10 p-2.5 text-blue-400">
                                <QrCode className="h-5 w-5" />
                            </div>
                            <DialogTitle className="text-xl font-bold text-white tracking-tight">2FA Configuration</DialogTitle>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
                            {/* Left Side: QR Code */}
                            <div className="md:col-span-5 flex flex-col items-center justify-start pt-4 border-b md:border-b-0 md:border-r border-white/5 bg-white/[0.02]">
                                <div className="p-4 rounded-3xl border border-white/10 bg-white shadow-2xl shadow-blue-500/10 ring-1 ring-white/5 mb-4">
                                    {qrCodeUrl ? (
                                        <img
                                            src={qrCodeUrl}
                                            alt="QR Code"
                                            className="h-44 w-44"
                                        />
                                    ) : (
                                        <div className="h-44 w-44 flex items-center justify-center text-slate-400">
                                            <Loader2 className="h-8 w-8 animate-spin" />
                                        </div>
                                    )}
                                </div>
                                {/* Warning Banner */}
                                <div className="mx-8 flex items-start gap-4 rounded-2xl bg-orange-500/10 p-5 border border-orange-500/20">
                                    <div className="rounded-full bg-orange-500/10 p-1.5 text-orange-500">
                                        <ShieldCheck className="h-4 w-4" />
                                    </div>
                                    <p className="text-[11px] font-bold text-orange-200/80 leading-normal">
                                        Please save your backup codes in a secure location before enabling 2FA.
                                    </p>
                                </div>
                            </div>

                            {/* Right Side: Configuration */}
                            <div className="md:col-span-7 pt-2 pb-8 space-y-8">
                                {/* Backup Codes Section */}
                                <div className="px-8 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-black uppercase tracking-widest text-white/40">Backup Codes</h4>
                                        <div className="flex gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 rounded-lg text-slate-500 hover:text-blue-400 hover:bg-white/5"
                                                onClick={handleDownloadCodes}
                                                disabled={!backupCodes.length}
                                            >
                                                <Download className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                        {backupCodes.length > 0 ? (
                                            backupCodes.map((code, idx) => (
                                                <div key={idx} className="flex h-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 text-[11px] font-mono font-bold text-slate-300 shadow-sm uppercase tracking-wider">
                                                    {code}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="col-span-2 py-8 text-center text-slate-500 text-xs">
                                                Generating codes...
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* OTP Verification Section */}
                                <div className="px-8 space-y-6">
                                    <div className={`flex justify-center transition-all duration-300 ${otpStatus === 'error' ? 'animate-shake' : ''}`}>
                                        <InputOTP
                                            maxLength={6}
                                            value={otpCode}
                                            onChange={setOtpCode}
                                            pattern="^[0-9]*$"
                                            disabled={otpStatus === 'verifying' || otpStatus === 'success'}
                                        >
                                            <InputOTPGroup className="gap-2.5">
                                                {[0, 1, 2, 3, 4, 5].map((i) => (
                                                    <InputOTPSlot
                                                        key={i}
                                                        index={i}
                                                        className={`h-14 w-12 rounded-xl border transition-all duration-300 text-xl font-bold shadow-sm
                                                            ${otpStatus === 'success' ? 'border-emerald-500 text-emerald-500 bg-emerald-500/10' :
                                                                otpStatus === 'error' ? 'border-red-500 text-red-500 bg-red-500/10' :
                                                                    otpStatus === 'verifying' ? 'opacity-50 border-white/10 bg-white/5' :
                                                                        otpCode.length > i ? 'text-blue-400 border-blue-400/50 bg-white/5' :
                                                                            'text-slate-400 border-white/10 bg-white/5'}
                                                        `}
                                                    />
                                                ))}
                                            </InputOTPGroup>
                                        </InputOTP>
                                    </div>
                                    <p className="text-[11px] text-blue-400/70 font-bold text-center leading-relaxed px-4">
                                        Enter the 6-digit code from your authenticator app to enable 2FA.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-white/5 border-t border-white/5 flex justify-end shrink-0">
                        <Button
                            variant="ghost"
                            onClick={() => setShowTwoFactorModal(false)}
                            className="text-slate-400 hover:bg-white/5 h-11 px-8 font-black uppercase tracking-widest text-[10px]"
                        >
                            Cancel
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

        </div>
    );
};

export default Profile;
