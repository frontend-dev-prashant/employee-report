// src/components/Home.js
import React from 'react';
import { Link } from 'react-router-dom';
import EmployeeTable from './EmployeeTable';
import Navbar from './Navbar';

const Home = () => {
    return (
        <>
            <div>
                <div className="max-w-sm rounded overflow-hidden shadow-lg">
                    <div className="px-6 py-4">
                        <p className="text-gray-700 text-base">
                            emp_code:123456
                        </p>
                    </div>
                    <div className="px-6 pt-4 pb-2">
                        <span className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">#photography</span>
                        <span className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">#travel</span>
                        <span className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">#winter</span>
                    </div>
                </div>
            </div >
        </>
    );
};
export default Home;
