// src/components/Home.js
import React from 'react';
import { Link } from 'react-router-dom';
import EmployeeTable from './EmployeeTable';
import Navbar from './Navbar';

const Home = () => {
    return (
        <>
            <div>
                <Link to="/employees"><span className='underline underline-offset-2 text-blue-600'>Employees</span></Link>
            </div >
        </>
    );
};

export default Home;
