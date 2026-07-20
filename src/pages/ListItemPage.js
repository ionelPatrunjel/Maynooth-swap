import React, { useState } from "react";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const ListItemPage = ({ currentUser }) => {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Clothes");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [mustReturn, setMustReturn] = useState(true);
  const [returnBy, setReturnBy] = useState("");
  const [msg, setMsg] = useState("");

  const submit = async (e) => {
    e.preventDefault();

    try {
      await addDoc(collection(db, "items"), {
        title,
        category,
        description,
        location,
        mustReturn,
        returnBy: mustReturn ? returnBy : null,
        ownerId: currentUser.id,
        images: [],
        postedAt: new Date().toISOString().split("T")[0],
        createdAt: serverTimestamp()
      });

      setMsg("Item listed!");
      setTitle("");
      setDescription("");
      setLocation("");
      setReturnBy("");
      setMustReturn(true);
    } catch (err) {
      console.error(err);
      setMsg("Error listing item. Try again.");
    }
  };

  return (
    <div className="app-container">
      <div className="card">
        <h2>List item</h2>

        <form onSubmit={submit}>
          <label>
            Title
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </label>

          <label>
            Category
            <select
              className="select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option>Clothes</option>
              <option>Appliances</option>
              <option>Books</option>
              <option>Other</option>
            </select>
          </label>

          <label>
            Description
            <textarea
              className="textarea"
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            ></textarea>
          </label>

          <label>
            Location
            <input
              className="input"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </label>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 10
            }}
          >
            <input
              type="checkbox"
              checked={mustReturn}
              onChange={(e) => setMustReturn(e.target.checked)}
            />
            Must return
          </label>

          {mustReturn && (
            <label style={{ marginTop: 10 }}>
              Return by:
              <input
                className="input"
                type="date"
                required
                value={returnBy}
                onChange={(e) => setReturnBy(e.target.value)}
              />
            </label>
          )}

          <button className="button" style={{ marginTop: 12 }}>
            Submit
          </button>
        </form>

        {msg && <p style={{ marginTop: 10 }}>{msg}</p>}
      </div>
    </div>
  );
};

export default ListItemPage;
