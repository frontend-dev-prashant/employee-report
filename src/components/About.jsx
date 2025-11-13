import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";


const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function About() {
  const [stats, setStats] = useState({ total: 0, active: 0, deleted: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
          .eq("status", "active");

        const deletedRes = await supabase
          .from("employees")
          .select("id", { count: "exact", head: true })
          .not("deleted_at", "is", null);

        if (!mounted) return;

        setStats({
          total: totalRes.count || 0,
          active: activeRes.count || 0,
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

          <div className="text-right">
            <h3 className="text-sm text-slate-500">Status</h3>
            <div className="mt-2 inline-flex items-center gap-3">
              <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">Live DB</span>
              <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-800 rounded">Demo</span>
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
            <h4 className="text-sm text-slate-500">Active</h4>
            <div className="mt-2 text-2xl font-semibold text-slate-900">
              {loading ? "..." : stats.active}
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
  );
}
