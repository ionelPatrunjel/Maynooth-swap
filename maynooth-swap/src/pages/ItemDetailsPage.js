import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getChatId } from "../utils/chat";

const ItemDetailsPage = ({
  items,
  users,
  currentUser,
  onDeleteItem,
}) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const item = items.find((i) => i.id === id);
  const [msg, setMsg] = useState("");

  if (!item) {
    return (
      <div className="app-container">
        <div className="card">
          <p>Item not found.</p>
        </div>
      </div>
    );
  }

  const owner = users.find((u) => u.id === item.ownerId);
  const isOwner = currentUser && owner && currentUser.id === owner.id;

  const handleBorrow = () => {
    if (!currentUser || isOwner || !owner) return;

    const chatId = getChatId(currentUser.id, owner.id);
    navigate(`/chat/${chatId}?itemId=${item.id}&mode=borrow`);
  };

  const handleDelete = async () => {
    if (!isOwner) return;
    if (!window.confirm("Delete this item permanently?")) return;

    await onDeleteItem(item.id);
    navigate("/");
  };

  return (
    <div className="app-container">
      <div className="card">
        <h2>{item.title}</h2>

        <p>{item.description}</p>

        <p>
          <strong>Location:</strong> {item.location}
        </p>

        {item.mustReturn && (
          <p>
            <strong>Return by:</strong> {item.returnBy}
          </p>
        )}

        <p>
          <strong>Posted:</strong> {item.postedAt}
        </p>

        <hr />

        {owner && (
          <p>
            <strong>Owner:</strong>{" "}
            <Link to={`/users/${owner.id}`}>{owner.name}</Link>
          </p>
        )}

        {!isOwner && (
          <button
            className="button"
            style={{ marginTop: 10 }}
            onClick={handleBorrow}
          >
            Ask to borrow / open chat
          </button>
        )}

        {isOwner && (
          <button
            className="button"
            style={{ marginTop: 10, backgroundColor: "#dc2626" }}
            onClick={handleDelete}
          >
            Delete item
          </button>
        )}

        {msg && <p style={{ marginTop: 10 }}>{msg}</p>}
      </div>
    </div>
  );
};

export default ItemDetailsPage;
