import "datatables.net-dt/css/dataTables.dataTables.css";
import "./index.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from "./components/Home";
import EmployeeTable from "./components/EmployeeTable";
import Navbar from "./components/Navbar";


export default function App() {
  return (
    <div className="space-y-2">
      <BrowserRouter>
        {/* ✅ Navbar must be inside the return */}
        <Navbar />

        {/* Optional: add top margin so content isn’t hidden behind navbar */}
        <div>
          <Routes>
            <Route index element={<Home />} />
            <Route path="/employees" element={<EmployeeTable />} />
          </Routes>
        </div>
      </BrowserRouter>
    </div>
  );
}