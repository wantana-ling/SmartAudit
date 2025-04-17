import React, { useState } from 'react';
import pic from '../component/asset/p.webp';
import '../component/css/profile.css';

function ProfilePage() {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [selectedServer, setSelectedServer] = useState(null);

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    const closeDropdown = () => {
        setIsDropdownOpen(false);
    };

    const handleSelectServer = (server) => {
        setSelectedServer(server);
        console.log(`Selected: ${server}`); // Log the selected server, you can remove this log
    };

    const handleEnterServer = () => {
        if (selectedServer) {
            console.log(`Entering ${selectedServer}`); // Handle action for entering the selected server
            // Example: Redirect to another page or perform an action based on the selected server
            const serverSlug = selectedServer.toLowerCase().replace(" ", "-");
            window.location.href = `/server/${serverSlug}`;
        } else {
            alert("Please select a server first.");
        }
    };

    return (
        <div className="container">
            <div className="box-container">
                <div className="profile">
                    <img src={pic} alt="Profile Picture" />
                </div>
                <p className="name">Somwang</p>
                <p className="position">Security Operation</p>
                <div className="dropdown">
                    <button onClick={toggleDropdown} className="dropdown-btn">
                        {selectedServer ? `Selected: ${selectedServer}` : "Select Server"}
                        <span><i className="bi bi-chevron-down"></i></span>
                    </button>
                    {isDropdownOpen && (
                        <div className="dropdown-menu">
                            <span onClick={closeDropdown} className="close-btn"><i className="bi bi-x"></i></span>
                            <div className="servers">
                                <p>Select <i className="bi bi-chevron-down"></i></p>
                                <a
                                    href="#"
                                    onClick={(e) => { e.preventDefault(); handleSelectServer('Server 1'); }}
                                    className={selectedServer === 'Server 1' ? 'selected' : ''}
                                >
                                    Server 1
                                </a>
                                <a
                                    href="#"
                                    onClick={(e) => { e.preventDefault(); handleSelectServer('Server 2'); }}
                                    className={selectedServer === 'Server 2' ? 'selected' : ''}
                                >
                                    Server 2
                                </a>
                                <a
                                    href="#"
                                    onClick={(e) => { e.preventDefault(); handleSelectServer('Server 3'); }}
                                    className={selectedServer === 'Server 3' ? 'selected' : ''}
                                >
                                    Server 3
                                </a>
                            </div>

                            <button className='enter-btn' onClick={handleEnterServer}>Enter Server</button>
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
