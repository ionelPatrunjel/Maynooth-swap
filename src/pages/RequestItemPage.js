import React, { useState } from "react";
import { useParams } from "react-router-dom";

const RequestItemPage = ({ items }) => {
  const { id } = useParams();

  const item = items.find((i) => i.id === id);

  const [place, setPlace] = useState("");
  const [time, setTime] = useState("");
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (!item) {
    return (
      <div className="app-container">
        <div className="card">
          <h2>Item not found</h2>
          <p>This item does not exist or was removed.</p>
        </div>
      </div>
    );
  }

  const submitRequest = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="app-container">
      <div className="card">
        <h2>Request Item</h2>

        <p>
          You are requesting: <strong>{item.title}</strong>
        </p>

        {!submitted && (
          <form onSubmit={submitRequest} style={{ marginTop: 12 }}>
            <label>
              Meeting place
              <input
                className="input"
                required
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                placeholder="Example: Library entrance, SU building, etc."
              />
            </label>

            <label>
              Time needed
              <input
                type="datetime-local"
                className="input"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </label>

            <label>
              Optional message
              <textarea
                className="textarea"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Any extra details..."
              ></textarea>
            </label>

            <button className="button" style={{ marginTop: 12 }}>
              Send request
            </button>
          </form>
        )}

        {submitted && (
          <div style={{ marginTop: 14 }}>
            <h3>Request sent</h3>
            <p>Your request has been recorded.</p>

            <p><strong>Meeting place:</strong> {place}</p>
            <p><strong>Time:</strong> {new Date(time).toLocaleString()}</p>

            {note && (
              <p>
                <strong>Your message:</strong> {note}
              </p>
            )}

            <p style={{ marginTop: 10, fontSize: 13 }}>
              You can return to the item page at any time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestItemPage;
