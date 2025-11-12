import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Swal from "sweetalert2";
import "./index.css";

console.log("Supabase URL:", import.meta.env.VITE_SUPABASE_URL);
console.log("Supabase Key exists:", !!import.meta.env.VITE_SUPABASE_ANON_KEY);


// ✅ Create Supabase client once
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function App() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEmployees = async () => {
      setLoading(true);
      try {
        // 👇 Fetch all rows from "employees" table
        const { data, error } = await supabase.from("employees").select("*");

        if (error) throw error;

        console.log("✅ Employees:", data);
        setEmployees(data || []);
        Swal.fire({
          icon: "success",
          title: "Data Loaded",
          toast: true,
          timer: 1500,
          position: "top-end",
          showConfirmButton: false,
        });
      } catch (err) {
        console.error("❌ Supabase Fetch Error:", err);
        Swal.fire({
          icon: "error",
          title: "Failed to Load Data",
          text: err.message,
        });
      } finally {
        setLoading(false);
      }
    };

    loadEmployees();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8 flex justify-center">
      <div className="w-full max-w-5xl">
        <h1 className="text-2xl font-bold mb-4">Employee Report</h1>

        <div className="bg-white rounded shadow overflow-x-auto">
          {loading ? (
            <div className="p-6 text-center text-gray-600">Loading…</div>
          ) : employees.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No employees found.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-800 text-white">
                <tr>
                  <th className="p-3 text-left">#</th>
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Email</th>
                  <th className="p-3 text-left">Dept</th>
                  <th className="p-3 text-left">Role</th>
                  <th className="p-3 text-right">Salary</th>
                  <th className="p-3 text-center">Login</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((r, i) => (
                  <tr key={r.id} className="odd:bg-white even:bg-slate-50">
                    <td className="p-3">{i + 1}</td>
                    <td className="p-3 font-medium">{r.name}</td>
                    <td className="p-3">{r.email}</td>
                    <td className="p-3">{r.department}</td>
                    <td className="p-3">{r.role}</td>
                    <td className="p-3 text-right">
                      ₹{Number(r.salary || 0).toLocaleString()}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          r.login_status === "logged_in"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {r.login_status}
                      </span>
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
