import { useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import DataTable from "datatables.net-dt";
import "datatables.net-dt/css/dataTables.dataTables.css";
import Swal from "sweetalert2";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { PlusIcon, ArrowLeftIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { EyeIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import myLogo from "../../src/assets/react.svg";


const getNavLinkClass = (isActive) => {
    return `block rounded md:p-0 dark:text-white ${isActive
        ? "text-blue-700 underline underline-offset-2 block border-b border-gray-100 hover:bg-gray-50 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0 dark:text-gray-400 md:dark:hover:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700"
        : "block text-gray-600 border-b border-gray-100 hover:bg-gray-50 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0 dark:text-gray-400 md:dark:hover:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700"
        }`;
};


/* ✅ Supabase client */
const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function EmployeeTableNew({ loginButton }) {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const tableRef = useRef(null);
    const dtRef = useRef(null);
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();

    // Demo hardcoded OTP
    const DEMO_OTP = "1234";

    const handleLoginClick = async () => {
        const { value: formValues } = await Swal.fire({
            title: "Login",
            html:
                '<input id="swal-email" class="swal2-input" placeholder="Email">' +
                '<input id="swal-otp" class="swal2-input" placeholder="OTP (demo)">',
            focusConfirm: false,
            showCancelButton: true,
            preConfirm: () => ({
                email: document.getElementById("swal-email")?.value?.trim(),
                otp: document.getElementById("swal-otp")?.value?.trim(),
            }),
        });

        if (!formValues) return; // cancelled

        const { email, otp } = formValues;

        if (!email) {
            Swal.fire({ icon: "warning", title: "Missing", text: "Please enter email." });
            return;
        }

        try {
            // 1) Check if email exists and not soft-deleted
            const { data: found, error: selErr } = await supabase
                .from("employees")
                .select("*")
                .eq("email", email)
                .is("deleted_at", null)
                .limit(1);

            if (selErr) throw selErr;

            if (!found || found.length === 0) {
                Swal.fire({ icon: "error", title: "Not found", text: `Email ${email} not found.` });
                return;
            }

            const user = found[0];

            // 2) Validate OTP
            if (otp !== DEMO_OTP) {
                Swal.fire({ icon: "error", title: "Wrong OTP", text: "The OTP you entered is incorrect." });
                return;
            }

            // 3) OTP correct → update login_status
            const { data: updated, error: updErr } = await supabase
                .from("employees")
                .update({ login_status: "logged_in" })
                .eq("id", user.id)
                .select("*");

            if (updErr) throw updErr;

            // Refresh UI
            await fetchRows();
            initDataTable();

            // Show success referencing emp_code and name
            Swal.fire({
                icon: "success",
                title: "Logged In",
                text: `${updated?.[0]?.emp_code || user.emp_code} (${updated?.[0]?.name || user.name}) Logged In Successfully`,
                confirmButtonColor: "#16a34a",
            });
        } catch (err) {
            console.error("Login error:", err);
            Swal.fire({ icon: "error", title: "Error", text: err.message || "Login failed. Check console." });
        }
    };


    const escapeHtml = (s) =>
        String(s ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");

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
            if (showAlert) {
                Swal.fire({
                    icon: "success",
                    title: "Data Loaded",
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

    /* 🔹 CRUD operations */
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
                login_status: "logged_out",
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

    /* 🔹 Initial load */
    useEffect(() => {
        (async () => {
            const res = await fetchRows(false);
            if (res.ok) initDataTable();
        })();
    }, []);

    /* 🔹 Refresh table on data change */
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

    /* 🟢 Handlers */

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
            <p><strong>Employee Code:</strong> ${escapeHtml(row.emp_code)}</p>
            <input id="swal-name" class="swal2-input" value="${escapeHtml(row.name || "")}" placeholder="Full Name">
            <input id="swal-email" class="swal2-input" value="${escapeHtml(row.email || "")}" placeholder="Email">
            <input id="swal-dept" class="swal2-input" value="${escapeHtml(row.department || "")}" placeholder="Department">
            <input id="swal-role" class="swal2-input" value="${escapeHtml(row.role || "")}" placeholder="Role">
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
            preConfirm: () => document.getElementById("swal-deletedby").value.trim() || "Unknown",
        });

        if (!deletedBy) return;

        try {
            await softDeleteRow(row.id, deletedBy);
            await fetchRows(true);
            Swal.fire({
                icon: "success",
                title: "Deleted",
                text: `'${row.emp_code} (${row.name})' deleted successfully by ${deletedBy}.`,
                confirmButtonColor: "#dc2626",
            });
        } catch (err) {
            console.error("Delete error:", err);
            Swal.fire("Error", "Failed to delete employee.", "error");
        }
    };

    const handleView = (row) => {
        Swal.fire({
            title: `${escapeHtml(row.emp_code)} — ${escapeHtml(row.name)}`,
            html: `
        <div style="text-align:left; line-height:1.6">
          <p><strong>Email:</strong> ${escapeHtml(row.email)}</p>
          <p><strong>Department:</strong> ${escapeHtml(row.department)}</p>
          <p><strong>Role:</strong> ${escapeHtml(row.role)}</p>
          <p><strong>Status:</strong> ${escapeHtml(row.status)}</p>
          <p><strong>Login Status:</strong> ${escapeHtml(row.login_status)}</p>
          ${row.deleted_at
                    ? `<p><strong>Deleted At:</strong> ${new Date(row.deleted_at).toLocaleString()}</p>
               <p><strong>Deleted By:</strong> ${escapeHtml(row.deleted_by || "N/A")}</p>`
                    : ""}
        </div>`,
            icon: row.deleted_at ? "error" : "info",
            confirmButtonText: "Close",
            confirmButtonColor: "#2563eb",
        });
    };

    const handleRefresh = async () => {
        const res = await fetchRows(true);
        if (res.ok) {
            initDataTable();
        }
    };

    /* ---------- UI ---------- */
    return (
        <>
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
                            {/* Conditional Login button */}
                            {location.pathname === "/employees-new" && (
                                <NavLink onClick={handleLoginClick}
                                >
                                    login
                                </NavLink>
                            )}

                        </ul>
                    </div>
                </div>
            </nav >
            {/* navbar end*/}
            < div className="min-h-screen bg-gray-100 p-2 items-center" >
                <div className="max-w-full w-full mx-auto">
                    <header className="flex items-end justify-end p-1">
                        {/* <h1 className="text-2xl font-bold">Employee Report</h1> */}
                        <div className="flex gap-2">
                            <button
                                title="Add Employee"
                                onClick={handleAdd}
                                className="p-2 bg-green-600 text-white rounded hover:bg-green-700"
                            >
                                <PlusIcon className="h-4 w-4" />
                            </button>
                            {/* <Link
                            title="Back to Home"
                            to="/"
                            className="p-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center justify-center"
                        >
                            <ArrowLeftIcon className="h-4 w-4" />
                        </Link> */}
                            <button
                                title="Refresh Employee List"
                                onClick={handleRefresh}
                                className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                <ArrowPathIcon className="h-4 w-4" />
                            </button>
                        </div>
                    </header>

                    <div className="rounded-xl shadow overflow-y-auto h-[86vh]">
                        {loading && rows.length === 0 ? (
                            <div className="p-6 text-center text-gray-600">Loading…</div>
                        ) : rows.length === 0 ? (
                            <div className="p-6 text-center text-gray-500">No employees found.</div>
                        ) : (
                            <table ref={tableRef} id="myTable" className="display w-full font-mono">
                                <thead className="bg-slate-800 text-white sticky top-0">
                                    <tr>
                                        <th>#</th>
                                        <th>Emp Code</th>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Department</th>
                                        <th>Role</th>
                                        <th>Login Status</th>
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
                                            <td>{r.login_status}</td>
                                            <td className="space-x-2 flex justify-end">
                                                <button
                                                    onClick={() => handleView(r)}
                                                    title="View Employee"
                                                    className="p-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
                                                >
                                                    <EyeIcon className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(r)}
                                                    title="Edit Employee"
                                                    className="p-2 bg-yellow-400 rounded hover:bg-yellow-500"
                                                >
                                                    <PencilSquareIcon className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(r)}
                                                    title="Delete Employee"
                                                    className="p-2 bg-red-500 text-white rounded hover:bg-red-600"
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            </td>

                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div >
        </>
    );
}
