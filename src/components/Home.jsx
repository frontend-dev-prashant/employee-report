// src/components/Home.js
import { Link } from 'react-router-dom';

const Home = () => {
    return (
        <>
            <div>
                {/* <Link to="/employees"><span className='underline underline-offset-2 text-blue-600'>Employees</span></Link> */} 
                <Link to="/employees-new"><span className='underline underline-offset-2 text-blue-600'>Employees New</span></Link>
            </div >
        </>
    );
};

export default Home;
