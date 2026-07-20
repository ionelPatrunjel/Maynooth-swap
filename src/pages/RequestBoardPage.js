import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { getChatId } from "../utils/chat";

const RequestBoardPage = ({ currentUser, users, requests }) => {
  const navigate = useNavigate();

  const [itemName, setItemName] = useState("");
  const [neededUntil, setNeededUntil] = useState("");
  const [place, setPlace] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");

  const createRequest = async (e) => {
    e.preventDefault();

    await addDoc(collection(db, "requests"), {
      itemName,
      neededUntil,
      place,
      note,
      userId: currentUser.id,
      createdAt: serverTimestamp(),
    });

    setItemName("");
    setNeededUntil("");
    setPlace("");
    setNote("");
    setMessage("Request posted.");
  };

  const list = requests
    .filter((r) => !r.deleted)  // hide deleted ones
    .map((r) => ({
        ...r,
        user: users.find((u) => u.id === r.userId),
    }));

  const deleteRequest = async (id) => {
    if (!window.confirm("Delete this request?")) return;
    await deleteDoc(doc(db, "requests", id));
  };

  return (
    <div className="app-container">
      <div className="card">
        <h2>Request an item</h2>

        <form onSubmit={createRequest}>
          <label>
            Item needed
            <input
              className="input"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              required
            />
          </label>

          <label>
            Needed until
            <input
              type="datetime-local"
              className="input"
              value={neededUntil}
              onChange={(e) => setNeededUntil(e.target.value)}
              required
            />
          </label>

          <label>
            Meeting place
            <input
              className="input"
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              required
            />
          </label>

          <label>
            Extra details
            <textarea
              className="textarea"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>

          <button className="button">Post request</button>
        </form>

        {message && <p>{message}</p>}
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h3>Active requests</h3>

        {list.map((r) => {
          const requester = r.user;
          if (!requester) return null;

          const isOwner = requester.id === currentUser.id;
          const chatId =
            !isOwner && currentUser
              ? getChatId(currentUser.id, requester.id)
              : null;

          return (
            <div
              key={r.id}
              style={{ padding: "10px 0", borderBottom: "1px solid #eee" }}
            >
              <p>
                <strong>Requesting:</strong> {r.itemName}
              </p>

              <p style={{ fontSize: 13 }}>
                By: {requester.name} ({requester.email})
              </p>

              <p style={{ fontSize: 13 }}>
                Needed until: {new Date(r.neededUntil).toLocaleString()}
              </p>

              <p style={{ fontSize: 13 }}>Place: {r.place}</p>

              {isOwner ? (
                <button
                    className="button"
                    style={{ backgroundColor: "#dc2626", marginTop: 6 }}
                    onClick={() => deleteRequest(r.id)}
                >
                    Delete request
                </button>
                ) : (
                chatId && (
                    <button
                    className="button"
                    style={{ backgroundColor: "#22c55e", marginTop: 6 }}
                    onClick={() => navigate(`/chat/${chatId}`)}
                    >
                    Lend Item
                    </button>
                    )
                )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RequestBoardPage;