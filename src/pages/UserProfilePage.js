import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

const UserProfilePage = ({ users, items, borrows, currentUser }) => {
  const { id } = useParams();
  const [loadedUser, setLoadedUser] = useState(null);

  useEffect(() => {
    if (!users || users.length === 0) return;
    const u = users.find((u) => u.id === id);
    setLoadedUser(u || null);
  }, [users, id]);

  if (!users || users.length === 0)
    return (
      <div className="app-container">
        <div className="card">Loading user…</div>
      </div>
    );

  if (!loadedUser)
    return (
      <div className="app-container">
        <div className="card">User not found.</div>
      </div>
    );

  const theirItems = items.filter((i) => i.ownerId === loadedUser.id);
  const reviewCount = loadedUser.reviews?.length || 0;
  const lateReturns = loadedUser.lateReturns || 0;

  return (
    <div className="app-container">
      <div className="card">
        <h2>{loadedUser.name}</h2>
        <p>{loadedUser.email}</p>
        <p>
          Rating: {loadedUser.rating}⭐ ({reviewCount})
        </p>

        <h3 style={{ marginTop: 16 }}>Items Returned Late</h3>
        {lateReturns === 0 ? (
          <p>No late returns 🎉</p>
        ) : (
          <p>{lateReturns} late</p>
        )}

        {currentUser.id !== loadedUser.id && (
          <Link to={`/review/${loadedUser.id}`}>
            <button className="button">Leave review</button>
          </Link>
        )}

        <h3 style={{ marginTop: 16 }}>Reviews</h3>
        {reviewCount === 0 && <p>No reviews yet.</p>}

        {reviewCount > 0 &&
          loadedUser.reviews.map((r) => (
            <p key={r.id}>
              <Link
                to={`/users/${r.fromUserId}`}
                style={{ textDecoration: "none" }}
              >
                <strong>{r.from}</strong>
              </Link>{" "}
              ({r.stars}⭐): {r.text}
            </p>
          ))}

        <h3 style={{ marginTop: 16 }}>Items lended</h3>
        {theirItems.length === 0 && <p>No items.</p>}
        {theirItems.length > 0 &&
          theirItems.map((i) => <p key={i.id}>• {i.title}</p>)}
      </div>
    </div>
  );
};

export default UserProfilePage;
