import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import ItemCard from "../components/ItemCard";
import { getChatId } from "../utils/chat";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

const formatAge = (ts) => {
  if (!ts) return "Unknown";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const now = new Date();
  const diff = now - d;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Posted today";
  if (days === 1) return "Posted yesterday";
  return `Posted ${days} days ago`;
};

const HomePage = ({ items, users, requests, currentUser, borrows }) => {
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");

  const safeUsers = users || [];
  const safeItems = items || [];

  const itemsWithOwners = safeItems
    .map((item) => {
      const owner = safeUsers.find((u) => u && u.id === item.ownerId);
      return { ...item, owner: owner || null };
    })
    .filter((item) => item.owner);

  const lentOutItemIds = new Set(
    (borrows || [])
      .filter((b) => b.itemId && b.status !== "returned")
      .map((b) => b.itemId)
  );

  const visibleItems = itemsWithOwners.filter(
    (item) => !lentOutItemIds.has(item.id)
  );

  const filteredItems = useMemo(() => {
    return visibleItems.filter((item) => {
      const target = (
        item.title +
        " " +
        item.description +
        " " +
        item.location +
        " " +
        (item.owner?.name || "")
      ).toLowerCase();

      const matchesSearch = target.includes(search.toLowerCase());
      const matchesCategory =
        filterCategory === "All" || item.category === filterCategory;

      return matchesSearch && matchesCategory;
    });
  }, [visibleItems, search, filterCategory]);

  const activeRequests = (requests || []).filter((r) => !r.deleted);

  const requestsWithUsers = activeRequests
    .map((r) => {
      const user = safeUsers.find((u) => u && u.id === r.userId);
      return user ? { ...r, user } : null;
    })
    .filter(Boolean);

  const deleteRequest = async (requestId) => {
    try {
      await updateDoc(doc(db, "requests", requestId), {
        deleted: true,
      });
    } catch (err) {
      console.error("Failed to delete request:", err);
    }
  };

  return (
    <div className="app-container">
      <div className="card">
        <h2>Available items</h2>

        {currentUser && (
          <p style={{ fontSize: 13, marginBottom: 10, color: "#555" }}>
            Welcome <strong>{currentUser.name}</strong> ({currentUser.email})
          </p>
        )}

        <input
          className="input search-input"
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <label style={{ fontSize: 13 }}>Category</label>
        <select
          className="select"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option>All</option>
          <option>Clothes</option>
          <option>Books</option>
          <option>Appliances</option>
        </select>
      </div>

      {filteredItems.map((item) => (
        <ItemCard
          key={item.id}
          item={item}
          owner={item.owner}
          age={formatAge(item.createdAt)}
        />
      ))}

      <div className="card" style={{ marginTop: 20 }}>
        <h2>Requests</h2>

        {requestsWithUsers.length === 0 && (
          <p style={{ fontSize: 13 }}>No active requests.</p>
        )}

        {requestsWithUsers.map((r) => {
          const requester = r.user;

          const chatId =
            requester && currentUser
              ? getChatId(currentUser.id, requester.id)
              : null;

          const isOwner =
            requester && currentUser
              ? requester.id === currentUser.id
              : false;

          return (
            <div
              key={r.id}
              style={{
                padding: "10px 0",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              <p>
                <strong>Requesting:</strong> {r.itemName}
              </p>

              <p
                style={{
                  fontSize: 12,
                  color: "#666",
                  marginTop: -4,
                  marginBottom: 6,
                }}
              >
                {formatAge(r.createdAt)}
              </p>

              <p style={{ fontSize: 13 }}>
                By: {requester.name} ({requester.email})
              </p>

              <p style={{ fontSize: 13 }}>
                Needed until:{" "}
                {r.neededUntil
                  ? new Date(r.neededUntil).toLocaleString()
                  : "Not set"}
              </p>

              <p style={{ fontSize: 13 }}>Place: {r.place}</p>

              {!isOwner && chatId && (
                <div style={{ marginTop: 6 }}>
                  <Link
                    to={`/chat/${chatId}?itemName=${r.itemName}&role=owner&requestId=${r.id}`}
                  >
                    <button className="button" style={{ fontSize: 13 }}>
                      Lend Item
                    </button>
                  </Link>
                </div>
              )}

              {isOwner && (
                <button
                  className="button"
                  style={{ marginTop: 6 }}
                  onClick={() => {
                    if (
                      window.confirm(
                        "Are you sure you want to delete this request?"
                      )
                    ) {
                      deleteRequest(r.id);
                    }
                  }}
                >
                  Delete Request
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HomePage;
