import React from "react";

const ThemeToggle = ({ darkMode, setDarkMode }) => {
    return (
        <div className="justify-items-end">
            <button
                onClick={() => setDarkMode(!darkMode)}
                className="px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 
                 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 
                 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
                {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
            </button>
        </div>
    );
};

export default ThemeToggle;
