// src/components/Home.jsx
import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient"; // adjust path if needed
import { useLocation } from "react-router";

const getNavLinkClass = (isActive) => {
    return `block rounded md:p-0 dark:text-white ${isActive
        ? "text-blue-700 underline underline-offset-2 block border-b border-gray-100 hover:bg-gray-50 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0 dark:text-gray-400 md:dark:hover:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700"
        : "block text-gray-600 border-b border-gray-100 hover:bg-gray-50 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0 dark:text-gray-400 md:dark:hover:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700"
        }`;
};

export default function Home() {
    const navigate = useNavigate();
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);

    const [counts, setCounts] = useState({
        created_today: 0,
        created_yesterday: 0,
        deleted_today: 0,
        deleted_yesterday: 0,
        loggedin_today: 0,
        loggedin_yesterday: 0,
    });
    const [loading, setLoading] = useState(true);

    // Returns ISO boundaries for local days (midnight to midnight)
    const startOfDayIso = (d) => {
        const x = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
        return x.toISOString();
    };
    const nextDayIso = (d) => {
        const x = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 0, 0, 0, 0);
        return x.toISOString();
    };

    const getCount = async (col, gteIso, ltIso) => {
        try {
            // Build query with head:true to only fetch count
            let query = supabase.from("employees").select("*", { head: true, count: "exact" });
            if (gteIso && ltIso) query = query.gte(col, gteIso).lt(col, ltIso);
            else if (gteIso) query = query.gte(col, gteIso);
            else if (ltIso) query = query.lt(col, ltIso);

            const { count, error } = await query;
            if (error) {
                console.error("Supabase count error", error);
                return 0;
            }
            return count ?? 0;
        } catch (e) {
            console.error(e);
            return 0;
        }
    };

    async function fetchCounts() {
        setLoading(true);
        try {
            const today = new Date();
            const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);

            const tStart = startOfDayIso(today);
            const tNext = nextDayIso(today);

            const yStart = startOfDayIso(yesterday);
            const yNext = nextDayIso(yesterday);

            // Use last_login for "logged in" counts, deleted_at for deletions, created_at for created.
            const [
                ctCreated,
                ctCreatedY,
                ctDeleted,
                ctDeletedY,
                ctLoggedIn,
                ctLoggedInY,
            ] = await Promise.all([
                getCount("created_at", tStart, tNext),
                getCount("created_at", yStart, yNext),
                getCount("deleted_at", tStart, tNext),
                getCount("deleted_at", yStart, yNext),
                getCount("last_login", tStart, tNext),
                getCount("last_login", yStart, yNext),
            ]);

            setCounts({
                created_today: ctCreated,
                created_yesterday: ctCreatedY,
                deleted_today: ctDeleted,
                deleted_yesterday: ctDeletedY,
                loggedin_today: ctLoggedIn,
                loggedin_yesterday: ctLoggedInY,
            });
        } catch (err) {
            console.error("fetchCounts error:", err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchCounts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const cards = [
        { title: "Created today", key: "created_today", filter: "created_today", subtitle: "New employees" },
        { title: "Created Yesterday", key: "created_yesterday", filter: "created_yesterday", subtitle: "New employees (yesterday)" },
        { title: "Deleted Today", key: "deleted_today", filter: "deleted_today", subtitle: "Deleted records" },
        { title: "Deleted Yesterday", key: "deleted_yesterday", filter: "deleted_yesterday", subtitle: "Deleted records (yesterday)" },
        { title: "Logged In Today", key: "loggedin_today", filter: "loggedin_today", subtitle: "Users who logged in today" },
        { title: "Logged In Yesterday", key: "loggedin_yesterday", filter: "loggedin_yesterday", subtitle: "Users who logged in yesterday" },
    ];

    return (
        <>
            {/* navbar */}
            <nav className="bg-white border border-gray-200 dark:border-gray-700 px-2 sm:px-4 py-2.5 rounded dark:bg-gray-800 shadow-sm">
                <div className="container flex flex-wrap justify-between items-center mx-auto">
                    {/* Logo */}
                    <Link to="/" className="flex items-center" title="Home">
                        {/* <img src={myLogo} className="h-6 w-6" alt="Logo" /> */}
                        <span className="font-semibold">Employee Report</span>
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
                                <NavLink
                                    to="/employees-new"
                                    className={({ isActive }) => getNavLinkClass(isActive)}
                                >
                                    Employee
                                </NavLink>
                            </li>

                            <li>
                                <a
                                    href="tel:+917738735890"
                                    className="block py-2 pr-4 pl-3 text-gray-700 hover:bg-gray-50 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0 dark:text-gray-400 md:dark:hover:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent"
                                >
                                    Contact
                                </a>
                            </li>

                            {/* Conditional Login link placeholder (Home doesn't define handleLoginClick here) */}
                            {location.pathname === "/employees-new" && (
                                <li className="block py-2 pr-4 pl-3 text-gray-700 hover:bg-gray-50 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0 dark:text-gray-400 md:dark:hover:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent">
                                    <NavLink to="/employees-new">login</NavLink>
                                </li>
                            )}

                        </ul>
                    </div>
                </div>
            </nav >
            {/* navbar end*/}
            <div className="container mx-auto max-w-7xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-bold">Dashboard</h1>
                    <div className="space-x-2">
                        <button
                            onClick={fetchCounts}
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                        >
                            Refresh
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {cards.map((card) => (
                        <div
                            key={card.key}
                            onClick={() => navigate(`/report/${card.filter}`)}
                            className="cursor-pointer bg-white shadow rounded-lg p-4 hover:shadow-lg transition"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold">{card.title}</h3>
                                    <p className="text-sm text-gray-500">{card.subtitle}</p>
                                </div>
                                <div className="text-right">
                                    {loading ? (
                                        <div className="text-xl font-bold animate-pulse">—</div>
                                    ) : (
                                        <div className="text-3xl font-extrabold">{counts[card.key] ?? 0}</div>
                                    )}
                                    <div className="text-xs text-gray-400">records</div>
                                </div>
                            </div>

                            <div className="mt-3">
                                <div className="w-full bg-gray-100 rounded-full h-2">
                                    <div
                                        className="h-2 rounded-full"
                                        style={{
                                            width: `${Math.min((counts[card.key] ?? 0) * 8, 100)}%`,
                                            background: "linear-gradient(90deg,#6366f1,#06b6d4)",
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}
