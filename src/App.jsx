import React, { useState, useEffect } from "react";
import EmployeeList from "./components/EmployeeList";
import ThemeToggle from "./components/ThemeToggle";

function App() {
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("theme") === "dark"
  );

  useEffect(() => {
    const html = document.documentElement;
    if (darkMode) {
      html.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      html.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300 p-6">
      <div className="max-w-6xl mx-auto flex justify-between items-center mb-6">
        <ThemeToggle darkMode={darkMode} setDarkMode={setDarkMode} />
      </div>
      <EmployeeList />
    </div>
  );
}

export default App;
