import { createBrowserRouter } from "react-router-dom";
import Login from "../pages/auth/login";
import TwoFactor from "../pages/auth/twofactor";
import ForgotPassword from "../pages/auth/forgot-password";
import ResetPassword from "../pages/auth/reset-password";
import VerifyEmail from "../pages/auth/verify-email";
import DashboardLayout from "../components/layout/Dashboard";
import Dashboard from "../pages/dashboard/dashboard";
import FinanceLayout from "../components/layout/Finance";
import Finance from "../pages/finance/finance";
import FinanceReport from "../pages/finance/finance-report";
import AccountingLayout from "../components/layout/Accounting";
import Accounting from "../pages/accounting/accounting";
import AccountingReport from "../pages/accounting/accounting-report";
import LitigationLayout from "../components/layout/Litigation";
import Litigation from "../pages/litigation/litigation";
import LitigationReport from "../pages/litigation/litigationreport";
import ServicesLayout from "../components/layout/Services";
import Services from "../pages/services/services";
import ServicesReport from "../pages/services/servicesreport";
import GlobalReportLayout from "../components/layout/GlobalReport";
import GlobalReport from "../pages/reports/globalreport";
import SettingsLayout from "../components/layout/Settings";
import Audit from "../pages/settings/audit";
import Users from "../pages/settings/users";
import Monitoring from "../pages/settings/monitoring";
import System from "../pages/settings/system";
import Permissions from "../pages/settings/settings";
import Headquarters from "../pages/services/headquarters";
import NotFound from "../pages/errors/NotFound";
import ProtectedRoute from "./ProtectedRoute";
import ProfileLayout from "../components/layout/Profile";
import Profile from "../pages/profile/profile";
import ServiceDashLayout from "../components/layout/sublayout/ServiceDash";
import ServiceDash from "../pages/services/affectedservices/servicedash";
import HeadquaterLocal from "../pages/services/affectedservices/headquaterlocal";
import HQTransaction from "../pages/services/hqtransaction";
import HQLocalTransaction from "../pages/services/affectedservices/hqlocaltransaction";

export const router = createBrowserRouter([
    { path: "/", element: <Login /> },
    { path: "/login", element: <Login /> },
    { path: "/two-factor", element: <TwoFactor /> },
    { path: "/forgot-password", element: <ForgotPassword /> },
    { path: "/reset-password", element: <ResetPassword /> },
    { path: "/verify-email", element: <VerifyEmail /> },
    {
        path: "/dashboard",
        element: <ProtectedRoute><DashboardLayout /></ProtectedRoute>,
        children: [
            {
                index: true,
                element: <Dashboard />,
            },
        ],
    },
    {
        path: "/finance",
        element: <ProtectedRoute><FinanceLayout /></ProtectedRoute>,
        children: [
            {
                index: true,
                element: <Finance />,
            },
            {
                path: "report",
                element: <FinanceReport />,
            },
        ],
    },
    {
        path: "/accounting",
        element: <ProtectedRoute><AccountingLayout /></ProtectedRoute>,
        children: [
            {
                index: true,
                element: <Accounting />,
            },
            {
                path: "report",
                element: <AccountingReport />,
            },
        ],
    },
    {
        path: "/litigation",
        element: <ProtectedRoute><LitigationLayout /></ProtectedRoute>,
        children: [
            {
                index: true,
                element: <Litigation />,
            },
            {
                path: "report",
                element: <LitigationReport />,
            },
        ],
    },
    {
        path: "/services",
        element: <ProtectedRoute><ServicesLayout /></ProtectedRoute>,
        children: [
            {
                index: true,
                element: <Services />,
            },
            {
                path: "report",
                element: <ServicesReport />,
            },
        ],
    },
    {
        path: "/global-reports",
        element: <ProtectedRoute><GlobalReportLayout /></ProtectedRoute>,
        children: [
            {
                index: true,
                element: <GlobalReport />,
            },
        ],
    },
    {
        path: "/permissions",
        element: <ProtectedRoute><SettingsLayout /></ProtectedRoute>,
        children: [
            {
                index: true,
                element: <Permissions />,
            },
            {
                path: "audit",
                element: <Audit />,
            },
            {
                path: "users",
                element: <Users />,
            },
            {
                path: "monitoring",
                element: <Monitoring />,
            },
            {
                path: "system",
                element: <System />,
            },
        ],

    },
    {
        path: "/profile",
        element: <ProtectedRoute><ProfileLayout /></ProtectedRoute>,
        children: [
            {
                index: true,
                element: <Profile />,
            },
        ],
    },
    {
        path: "/:enterpriseCode",
        element: <ProtectedRoute><ServiceDashLayout /></ProtectedRoute>,
        children: [
            {
                index: true,
                element: <ServiceDash />,
            },
            {
                path: "profile",
                element: <Profile />,
            },
            {
                path: "headquarters",
                element: <Headquarters />,
            },
            {
                path: "headquaterlocal",
                element: <HeadquaterLocal />,
            },
            {
                path: "hqtransaction",
                element: <HQTransaction />,
            },
            {
                path: "hqlocaltransaction",
                element: <HQLocalTransaction />,
            },
        ],
    },
    { path: "*", element: <NotFound /> },
]);