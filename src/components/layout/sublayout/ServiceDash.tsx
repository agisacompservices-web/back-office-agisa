import { useEffect } from "react";
import { ServSidebarProvider } from "../../../context/ServSidebarContext"
import { ServSidebar } from "../../includes/ServSidebar";
import { Outlet, useLocation, useNavigate, useParams } from "react-router-dom"
import { Topbar } from "../../includes/Topbar";

export default function ServiceDashLayout() {
    const { enterpriseCode } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const storedUser = localStorage.getItem('agisa_user');
        if (!storedUser || !enterpriseCode) return;

        const user = JSON.parse(storedUser);
        const memberships = user.memberships || [];
        const currentMembership = memberships.find(
            (m: any) => m.enterprise?.enterpriseCode === enterpriseCode
        );

        // Determine effective role for this enterprise
        let effectiveRole = user.role?.level?.toUpperCase();
        if (currentMembership && (currentMembership.membershipRoles?.length || 0) > 0) {
            effectiveRole = currentMembership.membershipRoles[0].role?.level?.toUpperCase();
        }

        // Global Roles (ADMIN, etc.) have full access within the enterprise layout
        const isGlobalAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(user.role?.level?.toUpperCase());
        if (isGlobalAdmin) return;

        // Path analysis: /:enterpriseCode/subpath -> extract "subpath"
        const pathParts = location.pathname.split('/').filter(Boolean);
        // pathParts[0] is enterpriseCode, pathParts[1] is the sub-route
        const subPath = pathParts[1] || '';

        // ROLE-BASED ROUTE GUARD MAPPING
        if (effectiveRole === 'MANAGER_HEADQUARTER_LOCAL') {
            const allowedPaths = ['headquaterlocal', 'hqlocaltransaction', 'profile'];
            if (!allowedPaths.includes(subPath)) {
                navigate(`/${enterpriseCode}/headquaterlocal`, { replace: true });
            }
        }
        else if (effectiveRole === 'MANAGER_HEADQUARTER') {
            const prohibitedPaths = ['headquaterlocal', 'hqlocaltransaction'];
            if (subPath === '' || prohibitedPaths.includes(subPath)) {
                navigate(`/${enterpriseCode}/headquarters`, { replace: true });
            }
        }
        else if (effectiveRole === 'MANAGER_SELLER') {
            const allowedPaths = ['seller', 'sellertransaction', 'profile'];
            if (subPath === '' || !allowedPaths.includes(subPath)) {
                navigate(`/${enterpriseCode}/seller`, { replace: true });
            }
        }
        else if (effectiveRole === 'SELLER') {
            const allowedPaths = ['sellerlocal', 'sellerlocaltransaction', 'profile'];
            if (subPath === '' || !allowedPaths.includes(subPath)) {
                navigate(`/${enterpriseCode}/sellerlocal`, { replace: true });
            }
        }
        else if (effectiveRole === 'MANAGER') {
            const allowedPaths = ['', 'profile', 'betting-reports', 'betting-parieur', 'felcash-deposit', 'felcash-reports', 'felcash-users'];
            if (!allowedPaths.includes(subPath)) {
                navigate(`/${enterpriseCode}/`, { replace: true });
            }
        }
        else {
            // OTHER roles (USER, etc.)
            const allowedPaths = ['', 'profile'];
            if (!allowedPaths.includes(subPath)) {
                navigate(`/${enterpriseCode}/`, { replace: true });
            }
        }

    }, [location.pathname, enterpriseCode, navigate]);

    return (
        <ServSidebarProvider>
            <div className="flex h-screen overflow-hidden bg-white">
                <ServSidebar />
                <div className="flex flex-col flex-1 overflow-hidden">
                    <Topbar />
                    <main className="flex-1 overflow-y-auto p-4">
                        <Outlet />
                    </main>
                    {/* <SystemsFooter /> */}
                </div>
            </div>
        </ServSidebarProvider>
    );
}