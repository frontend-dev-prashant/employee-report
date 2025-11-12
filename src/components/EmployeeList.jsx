// src/components/EmployeeList.js
import React from 'react';
import EmployeeTable from './EmployeeTable';

const EmployeeList = () => {
    const employees = [
        { id: 1, name: "John Doe", position: "Software Engineer", department: "Engineering", salary: "$120,000" },
        { id: 2, name: "Jane Smith", position: "Product Manager", department: "Product", salary: "$110,000" },
        { id: 3, name: "Alice Johnson", position: "UX Designer", department: "Design", salary: "$100,000" },
        { id: 4, name: "Bob Brown", position: "Marketing Specialist", department: "Marketing", salary: "$90,000" },
        { id: 5, name: "Charlie Davis", position: "Data Scientist", department: "Data", salary: "$115,000" },
    ];

    return (
        <div className="p-4">
            <h1 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-300">Employee Report</h1>
            <EmployeeTable employees={employees} />
        </div>
    );
};

export default EmployeeList;
