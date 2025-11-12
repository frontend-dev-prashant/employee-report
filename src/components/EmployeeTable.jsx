// src/components/EmployeeTable.js
import React from 'react';

const EmployeeTable = ({ employees }) => {
    return (
        <div className="overflow-x-auto shadow-md rounded-lg border border-gray-300">
            <table className="min-w-full table-auto bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-300 text-sm text-center">
                <thead className="bg-gray-200 dark:bg-gray-700 text-md">
                    <tr className="border-b border-gray-300 dark:border-gray-600">
                        <th className="py-3 px-4">Sr No.</th>
                        <th className="py-3 px-4">Employee Id</th>
                        <th className="py-3 px-4">Name</th>
                        <th className="py-3 px-4">Position</th>
                        <th className="py-3 px-4">Department</th>
                        <th className="py-3 px-4">Salary</th>
                    </tr>
                </thead>
                <tbody>
                    {employees.map((employee, index) => (
                        <tr key={employee.id} className="border-b border-gray-300 dark:border-gray-700">
                            <td className="py-3 px-4">{index + 1}</td>
                            <td className="py-3 px-4">{employee.id}</td>
                            <td className="py-3 px-4">{employee.name}</td>
                            <td className="py-3 px-4">{employee.position}</td>
                            <td className="py-3 px-4">{employee.department}</td>
                            <td className="py-3 px-4">{employee.salary}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

        </div>
    );
};

export default EmployeeTable;
