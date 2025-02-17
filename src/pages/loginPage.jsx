// import React, { useState} from 'react'
import React from 'react';
import '../component/css/login.css'

function LoginPage() {
    return (
        <div className="container">
            <div className="box-container">
                <div className="form-contaniner">
                    {/* <img src="" alt="" /> */}
                    <div className="text">
                        <h1>Login</h1>
                        <p>Smart Audit</p>
                    </div>
                    <form action="/audit" method="post">
                        <input type="text" name="username" placeholder="Username" required/>
                        <input type="text" name="password" placeholder="Password" required/>
                        <p class="link-text"><a href="#">Forget Password?</a></p>
                        <button type="submit">Login</button>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default LoginPage