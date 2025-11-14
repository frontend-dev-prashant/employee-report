import { useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import "datatables.net-dt/css/dataTables.dataTables.css";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import myLogo from "../../src/assets/react.svg";

/* ✅ Supabase client */
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);


const getNavLinkClass = (isActive) => {
  return `block rounded md:p-0 dark:text-white ${isActive
    ? "text-blue-700 underline underline-offset-2 block border-b border-gray-100 hover:bg-gray-50 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0 dark:text-gray-400 md:dark:hover:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700"
    : "block text-gray-600 border-b border-gray-100 hover:bg-gray-50 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0 dark:text-gray-400 md:dark:hover:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700"
    }`;
};

export default function About() {
  const [stats, setStats] = useState({ logged_in: 0, logged_out: 0, deleted: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();


  useEffect(() => {
    let mounted = true;

    const loadCounts = async () => {
      setLoading(true);
      try {
        const totalRes = await supabase
          .from("employees")
          .select("id", { count: "exact", head: true });

        const activeRes = await supabase
          .from("employees")
          .select("id", { count: "exact", head: true })
          .is("deleted_at", null)
          .eq("login_status", "logged_in");

        const deletedRes = await supabase
          .from("employees")
          .select("id", { count: "exact", head: true })
          .not("deleted_at", "is", null);

        if (!mounted) return;

        setStats({
          total: totalRes.count || 0,
          login_status: activeRes.count || 0,
          deleted: deletedRes.count || 0,
        });
        setError(null);
      } catch (err) {
        console.error("Failed to load counts", err);
        setError(err.message || "Failed to load stats");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadCounts();
    return () => (mounted = false);
  }, []);

  return (
    <>
      <div>
        {/* navbar */}
        <nav className="bg-white border border-gray-200 dark:border-gray-700 px-2 sm:px-4 py-2.5 rounded dark:bg-gray-800 shadow">
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

                {/* Conditional Login button */}
                {location.pathname === "/employees-new" && (
                  <NavLink onClick={handleLoginClick}
                  >
                    login
                  </NavLink>
                )}

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
              </ul>
            </div>
          </div>
        </nav >
        {/* navbar end*/}
      </div>
      <div className="min-h-screen bg-gray-50 py-12 px-6">
        <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow p-8">
          <header className="flex items-start justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">About — Employee Report</h1>
              <p className="mt-2 text-slate-600 max-w-4xl">
                Live employee listing and CRUD demo using React (Vite), Tailwind and Supabase. This page
                explains what the report does and shows a few live stats from the database.
              </p>
              <div className="mt-4 flex gap-3">
                <a
                  href="/employees"
                  className="inline-block px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700"
                >
                  Open Employee Report
                </a>
                <a
                  href="https://supabase.com/dashboard/org/jyxwcnslnndxbgxpekvs"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block px-4 py-2 border border-slate-200 rounded text-slate-700 hover:bg-slate-50"
                >
                  Open Supabase
                </a>
              </div>
            </div>
          </header>

          <section className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-lg">
              <h4 className="text-sm text-slate-500">Total Employees</h4>
              <div className="mt-2 text-2xl font-semibold text-slate-900">
                {loading ? "..." : stats.total}
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg">
              <h4 className="text-sm text-slate-500">Login Status (logged_in)</h4>
              <div className="mt-2 text-2xl font-semibold text-slate-900">
                {loading ? "..." : stats.login_status}
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg">
              <h4 className="text-sm text-slate-500">Deleted / Archived</h4>
              <div className="mt-2 text-2xl font-semibold text-slate-900">
                {loading ? "..." : stats.deleted}
              </div>
            </div>
          </section>

          <section className="mt-8">
            <h3 className="text-lg font-semibold">What this report includes</h3>
            <ul className="mt-3 list-disc list-inside space-y-2 text-slate-700">
              <li>Live table powered by Supabase (REST / Realtime) and displayed with DataTables.</li>
              <li>Full CRUD: Add, View, Edit, Soft-delete (deleted_at + deleted_by).</li>
              <li>Audit columns (emp_code, deleted_at, deleted_by) for traceability.</li>
              <li>SweetAlert2 modals for dialogs and confirmations.</li>
              <li>Easy to deploy on Vercel — add env vars and go live.</li>
            </ul>
          </section>

          <section className="mt-8">
            <h3 className="text-lg font-semibold">Quick setup notes</h3>
            <ol className="mt-3 list-decimal list-inside space-y-2 text-slate-700">
              <li>
                Ensure <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> are in
                <code>.env.local</code> and restart the dev server.
              </li>
              <li>
                Enable <strong>RLS</strong> policy for <code>SELECT</code> on the <code>employees</code> table so the anon key can read data.
              </li>
              <li>
                To show deleted records or restore them, add a toggle that filters <code>deleted_at IS NOT NULL</code>.
              </li>
            </ol>
          </section>

          <footer className="mt-8 text-sm text-slate-500">
            Built with ❤️ — React + Vite + Tailwind + Supabase.
          </footer>
        </div>

        {error && <div className="max-w-5xl mx-auto mt-4 text-red-600">Error: {error}</div>}
      </div>
    </>
  );
}
