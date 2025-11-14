import { useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import DataTable from "datatables.net-dt";
import "datatables.net-dt/css/dataTables.dataTables.css";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
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
    const MySwal = withReactContent(Swal);

    const handleLoginClick = async () => {
        /* ------------------------------------
           1️⃣ Ask for email first
        ------------------------------------ */
        const { value: email } = await MySwal.fire({
            title: "Login",
            html: `
            <input id="swal-email"
                class="swal2-input border border-gray-300 rounded-md px-3 py-2"
                placeholder="Enter Email" />
        `,
            confirmButtonText: "Send OTP",
            showCancelButton: true,
            preConfirm: () => document.getElementById("swal-email").value.trim(),
        });

        if (!email) return;

        /* ------------------------------------
           2️⃣ Check email in Supabase
        ------------------------------------ */
        const { data: found, error } = await supabase
            .from("employees")
            .select("*")
            .eq("email", email)
            .is("deleted_at", null)
            .limit(1);

        if (!found || found.length === 0) {
            Swal.fire({ icon: "error", title: "Not found", text: "Email not found in database." });
            return;
        }

        const user = found[0];

        /* ------------------------------------
           3️⃣ Show OTP input UI (4 boxes)
        ------------------------------------ */
        await MySwal.fire({
            title: "Enter OTP",
            html: `
            <p class="mb-2 text-gray-700">OTP sent to <b>${email}</b></p>

            <div class="flex justify-center gap-3 mt-3" id="otp-container">
                ${[0, 1, 2, 3]
                    .map(
                        (i) =>
                            `<input id="otp-${i}" maxlength="1"
                                class="otp-input w-12 h-12 text-xl text-center border-2 border-gray-300 rounded-md
                                focus:border-indigo-500 focus:ring focus:ring-indigo-200"
                            />`
                    )
                    .join("")}
            </div>
        `,
            confirmButtonText: "Verify OTP",
            focusConfirm: false,
            didOpen: () => setupOtpInputs(),
        });

        /* ------------------------------------
           4️⃣ Gather OTP entered
        ------------------------------------ */
        const otp = Array.from({ length: 4 }, (_, i) =>
            document.getElementById(`otp-${i}`).value
        ).join("");

        if (otp !== DEMO_OTP) {
            Swal.fire({ icon: "error", title: "Wrong OTP", text: "Incorrect OTP" });
            return;
        }

        /* ------------------------------------
           5️⃣ Update login_status in Supabase
        ------------------------------------ */
        const { data: updated, updErr } = await supabase
            .from("employees")
            .update({ login_status: "logged_in" })
            .eq("id", user.id)
            .select("*");

        if (updErr) {
            Swal.fire("Error", updErr.message, "error");
            return;
        }

        // Refresh UI
        await fetchRows();
        initDataTable();

        /* ------------------------------------
           6️⃣ Success message
        ------------------------------------ */
        Swal.fire({
            icon: "success",
            title: "Logged In",
            text: `${updated?.[0]?.emp_code || user.emp_code} (${updated?.[0]?.name || user.name}) Logged In Successfully`,
            confirmButtonColor: "#16a34a",
        });
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

        // DESTROY DATATABLE BEFORE React re-renders
        if (dtRef.current) {
            try { dtRef.current.destroy(); } catch { }
            dtRef.current = null;
        }

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
                    timer: 1500,
                    text: `Fetched ${data.length} employees.`,
                });
            }

            return { ok: true };

        } catch (err) {
            console.error(err);
            Swal.fire("Error", "Load failed", "error");
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


    /* 🔹 Refresh DataTable after rows update & DOM ready */
    useEffect(() => {
        if (!loading && rows.length > 0) {
            setTimeout(() => initDataTable(), 0);
        }
    }, [rows, loading]);

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

    /* 🔥 Auto-move & Auto-submit OTP digits */
    const setupOtpInputs = () => {
        const inputs = document.querySelectorAll(".otp-input");
        inputs[0].focus();

        inputs.forEach((inp, idx) => {
            inp.addEventListener("input", () => {
                inp.value = inp.value.replace(/[^0-9]/g, "");

                // Move to next box when typed
                if (inp.value && idx < 3) {
                    inputs[idx + 1].focus();
                }

                // Auto submit when all 4 digits filled
                if ([...inputs].every((i) => i.value)) {
                    Swal.clickConfirm();
                }
            });

            // Backspace handling
            inp.addEventListener("keydown", (e) => {
                if (e.key === "Backspace" && !inp.value && idx > 0) {
                    inputs[idx - 1].focus();
                }
            });
        });
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

                    <div className="shadow overflow-y-auto h-[86vh]">
                        {loading && rows.length === 0 ? (
                            <div className="p-6 text-center text-gray-600">Loading…</div>
                        ) : rows.length === 0 ? (
                            <div className="p-6 text-center text-gray-500">No employees found.</div>
                        ) : (
                            <>
                                <div className="flex justify-items-end">
                                    <button
                                        title="Add Employee"
                                        onClick={handleAdd}
                                        className="p-2 bg-green-600 text-white rounded hover:bg-green-700"
                                    >
                                        <PlusIcon className="h-4 w-4" />
                                    </button>
                                    <button
                                        title="Refresh Employee List"
                                        onClick={handleRefresh}
                                        className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                    >
                                        <ArrowPathIcon className="h-4 w-4" />
                                    </button>
                                </div>
                                <table
                                    ref={tableRef}
                                    className="min-w-full table-auto bg-white shadow-lg rounded-lg overflow-hidden"
                                >

                                    <thead className="bg-gradient-to-r from-blue-500 to-teal-500 text-white">
                                        <tr className="border-b border-gray-200">
                                            <th className="p-4 text-left">#</th>
                                            <th className="p-4 text-left">Emp Code</th>
                                            <th className="p-4 text-left">Name</th>
                                            <th className="p-4 text-left">Email</th>
                                            <th className="p-4 text-left">Department</th>
                                            <th className="p-4 text-left">Role</th>
                                            <th className="p-4 text-left">Login Status</th>
                                            <th className="p-4 text-right">Actions</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {rows.map((r, i) => (
                                            <tr
                                                key={r.id}
                                                className="hover:bg-gray-100 transition-all duration-300 border-b border-gray-00"
                                            >
                                                <td className="p-4">{i + 1}</td>
                                                <td className="p-4">
                                                    <span className="font-mono text-blue-700 bg-blue-50 px-3 py-1 rounded-md">
                                                        {r.emp_code}
                                                    </span>
                                                </td>
                                                <td className="p-4 font-medium">{r.name}</td>
                                                <td className="p-4">{r.email}</td>
                                                <td className="p-4">{r.department}</td>
                                                <td className="p-4">{r.role}</td>
                                                <td className="p-4">{r.login_status}</td>
                                                <td className="p-4 text-right space-x-3">
                                                    <button className="p-2 text-indigo-600 rounded-md hover:bg-indigo-200 transition duration-300">
                                                        <EyeIcon className="h-5 w-5" />
                                                    </button>
                                                    <button className="p-2 text-yellow-600 rounded-md hover:bg-yellow-200 transition duration-300">
                                                        <PencilSquareIcon className="h-5 w-5" />
                                                    </button>
                                                    <button className="p-2 text-red-600 rounded-md hover:bg-red-200 transition duration-300">
                                                        <TrashIcon className="h-5 w-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </>
                        )}
                    </div>
                </div>
            </div >
        </>
    );
}
