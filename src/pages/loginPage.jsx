// import React, { useState} from 'react'
import React from 'react';
import '../component/css/login.css'
import securityLogo from '../component/asset/Security Shield.png'
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
    const navigate = useNavigate();
    const handleSubmit = (e) => {
        e.preventDefault();
        navigate("/profile");
    };

    return (
        <div className="container">
            <div className="box-container">
                    <div className="pic-container">
                        <img src={securityLogo} alt="securityLogo" />
                    </div>
                    <div className="text">
                        <h1>Login</h1>
                        <p>Smart Audit</p>
                    </div>
                    <form onSubmit={handleSubmit} className="text-input">
                        <input type="text" name="username" placeholder="Username" required />
                        <input type="password" name="password" placeholder="Password" required />
                        <button type="submit">Login</button>
                    </form>
                </div>
            </div>
    )
}

export default LoginPage