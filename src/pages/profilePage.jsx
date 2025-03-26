import React, { useState } from 'react';
import pic from '../component/asset/p.webp';
import '../component/css/profile.css';

function ProfilePage() {
    // สร้างสถานะเพื่อจัดการการเปิด/ปิดของ dropdown
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // ฟังก์ชัน toggleDropdown เพื่อเปลี่ยนสถานะของ dropdown
    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    // ฟังก์ชันสำหรับปิด dropdown
    const closeDropdown = () => {
        setIsDropdownOpen(false);
    };

    return (
        <div className="container">
            <div className="box-container">
                <div className="profile">
                    <img src={pic} alt="Profile Picture" />
                </div>
                <p className="name">Somwang</p>
                <p className='position'>Security Operation</p>
                <div className="dropdown">
                    <button onClick={toggleDropdown} className="dropdown-btn">
                        Select Server<span><i class="bi bi-chevron-down"></i></span>
                    </button>
                    {isDropdownOpen && (
                        <div className="dropdown-menu">
                            <span onClick={closeDropdown} className="close-btn"><i class="bi bi-x"></i></span>
                            <div className="servers">
                                <p>Select <i class="bi bi-chevron-down"></i></p>
                                <a href="#">Server 1</a>
                                <a href="#">Server 2</a>
                                <a href="#">Server 3</a>
                            </div>
                            
                            <button className='enter-btn'>Enter Server</button>
                        </div>
                    )}
                </div>
                <button>Change Password</button>
                <button>History</button>
            </div>
        </div>
    );
}

export default ProfilePage;
