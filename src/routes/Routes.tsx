import { createBrowserRouter } from "react-router-dom";
import Login from "../pages/auth/login";
import ForgotPassword from "../pages/auth/forgot-password";
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

export const router = createBrowserRouter([
    { path: "/", element: <Login /> },
    { path: "/forgot-password", element: <ForgotPassword /> },
    {
        path: "/dashboard",
        element: <DashboardLayout />,
        children: [
            {
                index: true,
                element: <Dashboard />,
            },
        ],
    },
    {
        path: "/finance",
        element: <FinanceLayout />,
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
        element: <AccountingLayout />,
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
        element: <LitigationLayout />,
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
        element: <ServicesLayout />,
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
        element: <GlobalReportLayout />,
        children: [
            {
                index: true,
                element: <GlobalReport />,
            },
        ],
    },
    {
        path: "/permissions",
        element: <SettingsLayout />,
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
]);