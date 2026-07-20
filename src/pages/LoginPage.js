import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

const LoginPage = ({ authLoading }) => {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const emailRegex = /^([a-z]+)\.([a-z]+)\.(20[0-9]{2})@mumail\.ie$/;

  if (authLoading) {
    return (
      <div className="app-container">
        <div className="card">
          <p>Loading…</p>
        </div>
      </div>
    );
  }

  const submit = async (e) => {
    e.preventDefault();

    const trimmed = email.trim().toLowerCase();

    if (!emailRegex.test(trimmed)) {
      setError("Email must follow firstname.surname.year@mumail.ie");
      return;
    }

    if (!pass.trim()) {
      setError("Please enter your password.");
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, trimmed, pass);
      navigate("/");
    } catch (err) {
      console.error(err);
      setError("Invalid email or password.");
    }
  };

  return (
    <div className="app-container">
      <div className="card">
        <h2>Student Login</h2>

        <form onSubmit={submit} style={{ marginTop: 12 }}>
          <label>
            Student Email (@mumail.ie)
            <input
              className="input"
              type="email"
              placeholder="firstname.surname.year@mumail.ie"
              value={email}
              onChange={(e) => setEmail(e.target.value.toLowerCase())}
            />
          </label>

          <label style={{ marginTop: 10 }}>
            Password
            <input
              className="input"
              type="password"
              placeholder="Enter your password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
            />
          </label>

          {error && (
            <p style={{ color: "red", fontSize: 13, marginTop: 8 }}>
              {error}
            </p>
          )}

          <button className="button" type="submit" style={{ marginTop: 10 }}>
            Continue
          </button>

          <button
            type="button"
            className="button"
            style={{ marginTop: 10, backgroundColor: "#6b7280" }}
            onClick={() => navigate("/register")}
          >
            Create an account
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
