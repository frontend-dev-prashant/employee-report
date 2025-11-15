// File: src/components/ReportPage.jsx
// Purpose: Show filtered employee reports (created / deleted / logout by day).
// Notes:
// - Expects a supabase client exported from src/supabaseClient.js
// - Route should be /report/:filter where filter is one of:
//   created_today, created_yesterday, deleted_today, deleted_yesterday, logout_today, logout_yesterday

import { useEffect, useState } from "react";
import { useParams, useNavigate, Link, NavLink } from "react-router-dom";
import { supabase } from "./supabaseClient"; // <-- fixed import path (was "./supabaseClient")
import myLogo from "../../src/assets/react.svg";

/* NavLink style helper (kept from your original) */
const getNavLinkClass = (isActive) => {
    return `block rounded md:p-0 dark:text-white ${isActive
        ? "text-blue-700 underline underline-offset-2 block border-b border-gray-100 hover:bg-gray-50 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0 dark:text-gray-400 md:dark:hover:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700"
        : "block text-gray-600 border-b border-gray-100 hover:bg-gray-50 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0 dark:text-gray-400 md:dark:hover:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700"
        }`;
};

export default function ReportPage() {
    const [isOpen, setIsOpen] = useState(false);
    const { filter } = useParams();
    const navigate = useNavigate();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);

    // Helper: local day boundaries -> ISO strings
    const startOfDayIso = (d) => {
        const x = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
        return x.toISOString();
    };
    const nextDayIso = (d) => {
        const x = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 0, 0, 0, 0);
        return x.toISOString();
    };

    useEffect(() => {
        fetchRows();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filter]);

    // Fetch rows according to the filter param
    const fetchRows = async () => {
        setLoading(true);
        try {
            const today = new Date();
            const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);

            const tStart = startOfDayIso(today);
            const tNext = nextDayIso(today);
            const yStart = startOfDayIso(yesterday);
            const yNext = nextDayIso(yesterday);

            // Default query (fallback)
            let query = supabase
                .from("employees")
                .select("id, emp_code, name, email, department, role, created_at, last_login, last_logout, deleted_at, deleted_by")
                .order("created_at", { ascending: false })
                .limit(500);

            // Build queries for each filter
            switch (filter) {
                case "created_today":
                    query = supabase
                        .from("employees")
                        .select("*")
                        .gte("created_at", tStart)
                        .lt("created_at", tNext)
                        .order("created_at", { ascending: false });
                    break;

                case "created_yesterday":
                    query = supabase
                        .from("employees")
                        .select("*")
                        .gte("created_at", yStart)
                        .lt("created_at", yNext)
                        .order("created_at", { ascending: false });
                    break;

                case "deleted_today":
                    query = supabase
                        .from("employees")
                        .select("*")
                        .gte("deleted_at", tStart)
                        .lt("deleted_at", tNext)
                        .order("deleted_at", { ascending: false });
                    break;

                case "deleted_yesterday":
                    query = supabase
                        .from("employees")
                        .select("*")
                        .gte("deleted_at", yStart)
                        .lt("deleted_at", yNext)
                        .order("deleted_at", { ascending: false });
                    break;

                case "logout_today":
                    query = supabase
                        .from("employees")
                        .select("*")
                        .gte("last_logout", tStart)
                        .lt("last_logout", tNext)
                        .order("last_logout", { ascending: false });
                    break;

                case "logout_yesterday":
                    query = supabase
                        .from("employees")
                        .select("*")
                        .gte("last_logout", yStart)
                        .lt("last_logout", yNext)
                        .order("last_logout", { ascending: false });
                    break;

                default:
                    // leave `query` as the fallback defined above (recent 500)
                    break;
            }

            const { data, error } = await query;
            if (error) {
                console.error("Supabase fetch error:", error);
                setRows([]);
            } else {
                setRows(data || []);
            }
        } catch (err) {
            console.error(err);
            setRows([]);
        } finally {
            setLoading(false);
        }
    };

    // Nicely formatted header title
    const headerTitle = filter ? String(filter).replaceAll("_", " ") : "Report";

    return (
        <>
            {/* navbar */}
            <nav className="bg-white border border-gray-200 dark:border-gray-700 px-2 sm:px-4 py-2.5 rounded dark:bg-gray-800 shadow-sm">
                <div className="container flex flex-wrap justify-between items-center mx-auto">
                    {/* Logo */}
                    <Link to="/" className="flex items-center" title="Home">
                        <img src={myLogo} className="h-6 w-6" alt="Logo" />
                        Employee Report
                    </Link>

                    {/* Mobile menu toggle button */}
                    <div className="flex items-center md:hidden">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            type="button"
                            className="inline-flex items-center p-2 ml-3 text-sm text-gray-500 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
                        >
                            <span className="sr-only">Open main menu</span>
                            {isOpen ? (
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            ) : (
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
                                </svg>
                            )}
                        </button>
                    </div>

                    {/* Navigation links */}
                    <div className={`w-full md:block md:w-auto ${isOpen ? "block" : "hidden"}`} id="mobile-menu">
                        <ul className="flex flex-col mt-4 md:flex-row md:space-x-8 md:mt-0 md:text-sm md:font-medium">
                            <li>
                                <NavLink to="/" className={({ isActive }) => getNavLinkClass(isActive)}>
                                    Home
                                </NavLink>
                            </li>

                            <li>
                                <NavLink to="/about" className={({ isActive }) => getNavLinkClass(isActive)}>
                                    About
                                </NavLink>
                            </li>

                            {/* Employee button */}
                            <li>
                                <NavLink to="/employees-new" className={({ isActive }) => getNavLinkClass(isActive)}>
                                    Employee
                                </NavLink>
                            </li>

                            <li>
                                <a
                                    href="tel:+917738735890"
                                >
                                    Contact
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>
            {/* navbar end*/}

            <div className="container mx-auto max-w-7xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-bold capitalize">{headerTitle}</h1>
                    <div className="space-x-2">
                        <button onClick={() => navigate(-1)} className="px-3 py-1 bg-gray-100 rounded">Back</button>
                        <button onClick={fetchRows} className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition">Refresh</button>
                    </div>
                </div>

                <div className="overflow-x-auto bg-white rounded shadow">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Emp#</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Name</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Email</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Department</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Role</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Created At</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Last Login</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Deleted At</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Deleted By</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                            {loading ? (
                                <tr>
                                    <td colSpan={10} className="px-4 py-6 text-center text-gray-500">Loading…</td>
                                </tr>
                            ) : rows.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="px-4 py-6 text-center text-gray-500">No records found</td>
                                </tr>
                            ) : (
                                rows.map((r) => (
                                    <tr key={r.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-2 whitespace-nowrap text-sm">{r.emp_code}</td>
                                        <td className="px-4 py-2 text-sm">{r.name}</td>
                                        <td className="px-4 py-2 text-sm">{r.email}</td>
                                        <td className="px-4 py-2 text-sm">{r.department ?? "-"}</td>
                                        <td className="px-4 py-2 text-sm">{r.role ?? "-"}</td>
                                        <td className="px-4 py-2 text-sm">{r.created_at ? new Date(r.created_at).toLocaleString() : "-"}</td>
                                        <td className="px-4 py-2 text-sm">{r.last_login ? new Date(r.last_login).toLocaleString() : "-"}</td>
                                        <td className="px-4 py-2 text-sm">{r.deleted_at ? new Date(r.deleted_at).toLocaleString() : "-"}</td>
                                        <td className="px-4 py-2 text-sm">{r.deleted_by ?? "-"}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}
