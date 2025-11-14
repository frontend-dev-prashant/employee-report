import { useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import DataTable from "datatables.net-dt";
import "datatables.net-dt/css/dataTables.dataTables.css";
import Swal from "sweetalert2";
import { Link } from "react-router-dom";
import { PlusIcon, ArrowLeftIcon, ArrowPathIcon } from '@heroicons/react/24/outline'; // Import the icons

/* ✅ Supabase client */
const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function EmployeeTable() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const tableRef = useRef(null);
    const dtRef = useRef(null);

    const escapeHtml = (s) =>
        String(s ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");

    /* 🔹 Fetch employees (exclude deleted) */
    // const fetchRows = async () => {
    //     setLoading(true);
    //     try {
    //         const { data, error } = await supabase
    //             .from("employees")
    //             .select("*")
    //             .is("deleted_at", null) // only show active (non-deleted)
    //             .order("emp_code", { ascending: true });

    //         if (error) throw error;
    //         setRows(data || []);

    //         Swal.fire({
    //             icon: "info",
    //             title: "🔄 Data Loaded",
    //             timer: 2000,
    //             text: `Fetched ${data.length} employees successfully.`,
    //             confirmButtonColor: "#2563eb",
    //         });

    //         return { ok: true, count: (data || []).length };
    //     } catch (err) {
    //         console.error("❌ Fetch error:", err);
    //         Swal.fire("Error", "Failed to load employees.", "error");
    //         return { ok: false };
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    /* 🔹 Fetch employees (exclude deleted) */
    const fetchRows = async (showAlert = false) => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("employees")
                .select("*")
                .is("deleted_at", null)
                .order("emp_code", { ascending: true });

            if (error) throw error;
            setRows(data || []);

            // ✅ Only show alert when explicitly requested
            if (showAlert) {
                Swal.fire({
                    icon: "info",
                    title: "🔄 Data Loaded",
                    timer: 2000,
                    text: `Fetched ${data.length} employees successfully.`,
                    confirmButtonColor: "#2563eb",
                });
            }

            return { ok: true, count: (data || []).length };
        } catch (err) {
            console.error("❌ Fetch error:", err);
            Swal.fire("Error", "Failed to load employees.", "error");
            return { ok: false };
        } finally {
            setLoading(false);
        }
    };


    /* 🔹 CRUD Operations */
    const createRow = async (payload) => {
        const { data, error } = await supabase
            .from("employees")
            .insert([payload])
            .select("*");
        if (error) throw error;
        return data;
    };

    const updateRow = async (id, patch) => {
        const { data, error } = await supabase
            .from("employees")
            .update(patch)
            .eq("id", id)
            .select("*");
        if (error) throw error;
        return data;
    };

    const softDeleteRow = async (id, deletedBy) => {
        const { data, error } = await supabase
            .from("employees")
            .update({
                deleted_at: new Date().toISOString(),
                deleted_by: deletedBy,
                status: "deleted",
            })
            .eq("id", id)
            .select("*");
        if (error) throw error;
        return data;
    };

    /* 🔹 DataTable lifecycle */
    const initDataTable = () => {
        if (dtRef.current) {
            try {
                dtRef.current.destroy();
            } catch { }
            dtRef.current = null;
        }
        dtRef.current = new DataTable(tableRef.current, {
            paging: true,
            pageLength: 8,
            searching: true,
            ordering: true,
            info: true,
            autoWidth: false,
        });
    };

    useEffect(() => {
        (async () => {
            const res = await fetchRows(false); // no popup on page load
            if (res.ok) initDataTable();
        })();
    }, []);

    useEffect(() => {
        if (rows.length > 0) setTimeout(() => initDataTable(), 50);
    }, [rows]);

    useEffect(() => {
        return () => {
            if (dtRef.current) {
                try {
                    dtRef.current.destroy();
                } catch { }
            }
        };
    }, []);

    /* 🔹 Handlers */

    const handleView = (row) => {
        Swal.fire({
            title: `${escapeHtml(row.emp_code)} — ${escapeHtml(row.name)}`,
            html: `
        <div style="text-align:left; line-height:1.6">
          <p><strong>Employee Code:</strong> ${escapeHtml(row.emp_code)}</p>
          <p><strong>Name:</strong> ${escapeHtml(row.name)}</p>
          <p><strong>Email:</strong> ${escapeHtml(row.email)}</p>
          <p><strong>Department:</strong> ${escapeHtml(row.department)}</p>
          <p><strong>Role:</strong> ${escapeHtml(row.role)}</p>
          <p><strong>Status:</strong> ${escapeHtml(row.status)}</p>
          <p><strong>Login Status:</strong> ${escapeHtml(row.login_status)}</p>
          ${row.deleted_at
                    ? `<p><strong>Deleted At:</strong> ${new Date(
                        row.deleted_at
                    ).toLocaleString()}</p>
                 <p><strong>Deleted By:</strong> ${escapeHtml(
                        row.deleted_by || "N/A"
                    )}</p>`
                    : ""
                }
        </div>`,
            icon: row.deleted_at ? "error" : "info",
            confirmButtonText: "Close",
            confirmButtonColor: "#2563eb",
        });
    };

    const handleAdd = async () => {
        const { value: formValues } = await Swal.fire({
            title: "Add Employee",
            html: `
        <input id="swal-name" class="swal2-input" placeholder="Full Name">
        <input id="swal-email" class="swal2-input" placeholder="Email">
        <input id="swal-dept" class="swal2-input" placeholder="Department">
        <input id="swal-role" class="swal2-input" placeholder="Role">
      `,
            confirmButtonText: "Add",
            showCancelButton: true,
            preConfirm: () => ({
                name: document.getElementById("swal-name").value.trim(),
                email: document.getElementById("swal-email").value.trim(),
                department: document.getElementById("swal-dept").value.trim(),
                role: document.getElementById("swal-role").value.trim(),
            }),
        });

        if (!formValues) return;
        if (!formValues.name || !formValues.email) {
            Swal.fire("Validation", "Name and Email are required.", "warning");
            return;
        }

        try {
            const inserted = await createRow({
                ...formValues,
                status: "active",
                login_status: "logged_out",
            });
            await fetchRows(true);
            const createdName = inserted?.[0]?.name || formValues.name;
            Swal.fire({
                icon: "success",
                title: "✅ Created",
                text: `"${createdName}" Created Successfully`,
                confirmButtonColor: "#16a34a",
            });
        } catch (err) {
            console.error("Create error:", err);
            Swal.fire("Error", "Failed to add employee.", "error");
        }
    };

    const handleEdit = async (row) => {
        const { value: formValues } = await Swal.fire({
            title: `Edit — ${row.emp_code} (${escapeHtml(row.name)})`,
            html: `
        <input id="swal-name" class="swal2-input" value="${escapeHtml(
                row.name || ""
            )}" placeholder="Full Name">
        <input id="swal-email" class="swal2-input" value="${escapeHtml(
                row.email || ""
            )}" placeholder="Email">
        <input id="swal-dept" class="swal2-input" value="${escapeHtml(
                row.department || ""
            )}" placeholder="Department">
        <input id="swal-role" class="swal2-input" value="${escapeHtml(
                row.role || ""
            )}" placeholder="Role">
      `,
            showCancelButton: true,
            confirmButtonText: "Save",
            preConfirm: () => ({
                name: document.getElementById("swal-name").value.trim(),
                email: document.getElementById("swal-email").value.trim(),
                department: document.getElementById("swal-dept").value.trim(),
                role: document.getElementById("swal-role").value.trim(),
            }),
        });

        if (!formValues) return;
        try {
            await updateRow(row.id, formValues);
            await fetchRows(true);
            Swal.fire({
                icon: "success",
                title: "Updated",
                text: `'${row.emp_code} (${row.name})' Updated Successfully`,
                confirmButtonColor: "#f59e0b",
            });
        } catch (err) {
            console.error("Update error:", err);
            Swal.fire("Error", "Failed to update employee.", "error");
        }
    };

    const handleDelete = async (row) => {
        const { value: deletedBy } = await Swal.fire({
            title: `Delete ${escapeHtml(row.emp_code)}?`,
            html: `<input id="swal-deletedby" class="swal2-input" placeholder="Deleted By (Your Name)">`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Delete",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#dc2626",
            preConfirm: () =>
                document.getElementById("swal-deletedby").value.trim() || "Unknown",
        });

        if (!deletedBy) return;

        try {
            await softDeleteRow(row.id, deletedBy);
            await fetchRows(true);
            Swal.fire({
                icon: "success",
                title: "Deleted",
                text: `'${row.emp_code} (${row.name})' Deleted Successfully by ${deletedBy}`,
                confirmButtonColor: "#dc2626",
            });
        } catch (err) {
            console.error("Delete error:", err);
            Swal.fire("Error", "Failed to delete employee.", "error");
        }
    };

    const handleRefresh = async () => {
        const res = await fetchRows(true);
        if (res.ok) {
            initDataTable();
            Swal.fire({
                icon: "info",
                title: "🔄 Refreshed",
                text: `Fetched ${res.count} Employees from Database`,
                confirmButtonColor: "#2563eb",
            });
        }
    };

    /* ---------- UI ---------- */
    return (
        <div className="min-h-screen bg-gray-100 p-2 items-center">
            <div className="max-w-full w-full mx-auto">
                <header className="flex items-center justify-between p-1">
                    <h1 className="text-2xl font-bold">Employee Report</h1>
                    <div className="flex gap-2">
                        {/* Add */}
                        <button title="Add Employee"
                            onClick={handleAdd}
                            className="p-2 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                            <PlusIcon className="h-4 w-4" />
                        </button>

                        {/* Back */}
                        <Link title="Back to Home"
                            to="/"
                            className="p-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center justify-center"
                        >
                            <ArrowLeftIcon className="h-4 w-4" />
                        </Link>

                        {/* Refresh */}
                        <button title="Refresh Employee List"
                            onClick={handleRefresh}
                            className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            <ArrowPathIcon className="h-4 w-4" />
                        </button>
                    </div>
                </header>

                <div className="rounded-xl shadow overflow-y-auto h-[84vh]">
                    {loading && rows.length === 0 ? (
                        <div className="p-6 text-center text-gray-600">Loading…</div>
                    ) : rows.length === 0 ? (
                        <div className="p-6 text-center text-gray-500">
                            No employees found.
                        </div>
                    ) : (
                        <table ref={tableRef} id="myTable" className="display w-full">
                            <thead className="bg-slate-800 text-white sticky top-0">
                                <tr>
                                    <th>#</th>
                                    <th>Emp Code</th>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Department</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th className="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((r, i) => (
                                    <tr key={r.id}>
                                        <td>{i + 1}</td>
                                        <td>
                                            <span className="font-mono text-sm text-blue-700 bg-blue-50 px-2 py-1 rounded">
                                                {r.emp_code}
                                            </span>
                                        </td>
                                        <td className="font-medium">{r.name}</td>
                                        <td>{r.email}</td>
                                        <td>{r.department}</td>
                                        <td>{r.role}</td>
                                        <td>{r.status}</td>
                                        <td className="space-x-2">
                                            <button
                                                onClick={() => handleView(r)}
                                                className="px-2 py-1 bg-indigo-500 text-white rounded text-xs"
                                            >
                                                View
                                            </button>
                                            <button
                                                onClick={() => handleEdit(r)}
                                                className="px-2 py-1 bg-yellow-400 rounded text-xs"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(r)}
                                                className="px-2 py-1 bg-red-500 text-white rounded text-xs"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}