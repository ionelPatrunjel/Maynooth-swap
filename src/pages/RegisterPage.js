import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

const RegisterPage = () => {
  const [email, setEmail] = useState("");
  const [pass1, setPass1] = useState("");
  const [pass2, setPass2] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const emailRegex = /^([a-z]+)\.([a-z]+)\.(20[0-9]{2})@mumail\.ie$/;

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    const trimmed = email.trim().toLowerCase();

    if (!trimmed.match(emailRegex)) {
      setError("Email must follow firstname.surname.year@mumail.ie");
      return;
    }

    if (pass1.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (pass1 !== pass2) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const cred = await createUserWithEmailAndPassword(auth, trimmed, pass1);

      const [first, last] = trimmed.split("@")[0].split(".");
      const name =
        first.charAt(0).toUpperCase() +
        first.slice(1) +
        " " +
        last.charAt(0).toUpperCase() +
        last.slice(1);

      await setDoc(doc(db, "users", cred.user.uid), {
        name,
        email: trimmed,
        rating: 0,
        reviews: [],
        lateReturns: 0,
      });

      navigate("/login");
    } catch (err) {
      setError("Registration failed.");
    }
  };

  return (
    <div className="app-container">
      <div className="card">
        <h2>Create Account</h2>

        <form onSubmit={submit}>
          <label>
            Student Email
            <input
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <label>
            Password
            <input
              className="input"
              type="password"
              value={pass1}
              onChange={(e) => setPass1(e.target.value)}
            />
          </label>

          <label>
            Confirm Password
            <input
              className="input"
              type="password"
              value={pass2}
              onChange={(e) => setPass2(e.target.value)}
            />
          </label>

          {error && <p style={{ color: "red" }}>{error}</p>}

          <button className="button" type="submit">
            Register
          </button>

          <button
            type="button"
            className="button"
            style={{ background: "#666", marginTop: 10 }}
            onClick={() => navigate("/login")}
          >
            Back to Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
