import "datatables.net-dt/css/dataTables.dataTables.css";
import "./index.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from "./components/Home";
import About from "./components/About";
import EmployeeTableNew from "./components/EmployeeTableNew";
import ReportPage from "./components/ReportPage";

export default function App() {
  return (
    <div className="space-y-2">
      <BrowserRouter>
        <div>
          <Routes>
            <Route path="/" element={<Home />} />

            {/* Accepts /report and /report/:filter (e.g. /report/created_today) */}
            <Route path="/report" element={<ReportPage />} />
            <Route path="/report/:filter" element={<ReportPage />} />

            <Route path="/employees-new" element={<EmployeeTableNew />} />
            <Route path="/about" element={<About />} />

            {/* Helpful fallback while developing */}
            <Route path="*" element={<div className="p-6">No route matched — check the URL</div>} />
          </Routes>
        </div>
      </BrowserRouter>
    </div>
  );
}
