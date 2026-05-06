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
import BecomeSeller from "../pages/public/becomeSeller";
import BecomeHq from "../pages/public/becomeHq";
import NotFound from "../pages/errors/NotFound";
import ProtectedRoute from "./ProtectedRoute";
import ProfileLayout from "../components/layout/Profile";
import Profile from "../pages/profile/profile";
import ServiceDashLayout from "../components/layout/sublayout/ServiceDash";
import ServiceDash from "../pages/services/affectedservices/servicedash";
import HeadquaterLocal from "../pages/services/affectedservices/headquaterlocal";
import HQTransaction from "../pages/services/hqtransaction";
import HQLocalTransaction from "../pages/services/affectedservices/hqlocaltransaction";
import Seller from "../pages/services/seller";
import SellerTransaction from "../pages/services/sellertransaction";
import SellerLocal from "../pages/services/affectedservices/sellerlocal";
import SellerLocalTransaction from "../pages/services/affectedservices/sellerlocaltransaction";
import CommissionRates from "../pages/settings/commission";
import BettingReport from "../pages/services/affectedservices/betting/BettingReport";
import BettingParieur from "../pages/services/affectedservices/betting/BettingParieur";
import FelcashDeposit from "../pages/services/affectedservices/fintech/FelcashDeposit";
import FelcashReport from "../pages/services/affectedservices/fintech/FelcashReport";
import FelcashUsers from "../pages/services/affectedservices/fintech/FelcashUsers";
import FelcashExchangeRate from "../pages/services/affectedservices/fintech/FelcashExchangeRate";
import Plans from "../pages/settings/plans";

export const router = createBrowserRouter([
    { path: "/", element: <Login /> },
    { path: "/login", element: <Login /> },
    { path: "/two-factor", element: <TwoFactor /> },
    { path: "/forgot-password", element: <ForgotPassword /> },
    { path: "/reset-password", element: <ResetPassword /> },
    { path: "/verify-email", element: <VerifyEmail /> },
    { path: "/become-seller", element: <BecomeSeller /> },
    { path: "/become-hq", element: <BecomeHq /> },
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
            {
                path: "commission",
                element: <CommissionRates />,
            },
            {
                path: "plans",
                element: <Plans />,
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
            {
                path: "seller",
                element: <Seller />,
            },
            {
                path: "sellertransaction",
                element: <SellerTransaction />,
            },
            {
                path: "sellerlocal",
                element: <SellerLocal />,
            },
            {
                path: "sellerlocaltransaction",
                element: <SellerLocalTransaction />,
            },
            {
                path: "betting-reports",
                element: <BettingReport />,
            },
            {
                path: "betting-parieur",
                element: <BettingParieur />,
            },
            {
                path: "zonecash-deposit",
                element: <FelcashDeposit />,
            },
            {
                path: "zonecash-reports",
                element: <FelcashReport />,
            },
            {
                path: "zonecash-users",
                element: <FelcashUsers />,
            },
            {
                path: "zonecash-exchange",
                element: <FelcashExchangeRate />,
            },
        ],
    },
    { path: "*", element: <NotFound /> },
]);