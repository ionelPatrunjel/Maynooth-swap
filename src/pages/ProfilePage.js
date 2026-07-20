import React from "react";
import { Link } from "react-router-dom";

const ProfilePage = ({ currentUser, items, borrows, users }) => {
  if (!currentUser) {
    return (
      <div className="app-container">
        <div className="card">
          <p>You need to log in.</p>
        </div>
      </div>
    );
  }

  const myItems = items.filter((i) => i.ownerId === currentUser.id);

  const myBorrowRecords = borrows.filter(
    (b) => b.borrowerId === currentUser.id
  );

  const myBorrowedActive = myBorrowRecords.filter(
    (b) => b.status === "borrowed" || b.status === "late"
  );

  const myBorrowedReturned = myBorrowRecords.filter(
    (b) => b.status === "returned"
  );

  const othersBorrowedFromMe = borrows.filter(
    (b) => b.ownerId === currentUser.id
  );

  const othersBorrowedActive = othersBorrowedFromMe.filter(
    (b) => b.status === "borrowed" || b.status === "late"
  );

  const othersBorrowedReturned = othersBorrowedFromMe.filter(
    (b) => b.status === "returned"
  );

  const findItem = (id, name) =>
    items.find((i) => i.id === id)?.title || name || "Unknown item";

  const findUser = (id) =>
    users.find((u) => u.id === id)?.name || "Unknown user";

  const myUserData = users.find((u) => u.id === currentUser.id);
  const myReviews = myUserData?.reviews || [];
  const myReviewCount = myReviews.length;
  const myRating = myReviewCount === 0 ? 0 : myUserData.rating;
  const myLateReturns = myUserData?.lateReturns || 0;

  return (
    <div className="app-container">
      <div className="card">
        <h2>{currentUser.name}</h2>
        <p>{currentUser.email}</p>
        <p>
          Rating: {myRating}⭐ ({myReviewCount})
        </p>

        <h3 style={{ marginTop: 16 }}>Items Returned Late</h3>
        {myLateReturns === 0 ? (
          <p>No late returns 🎉</p>
        ) : (
          <p>
            You returned <strong>{myLateReturns}</strong> item
            {myLateReturns > 1 ? "s" : ""} late.
          </p>
        )}

        <h3 style={{ marginTop: 16 }}>My Reviews</h3>
        {myReviewCount === 0 && <p>No reviews yet.</p>}
        {myReviews.map((r) => (
          <p key={r.id}>
            <Link
              to={`/users/${r.fromUserId}`}
              style={{ textDecoration: "underline", color: "#2563eb" }}
            >
              <strong>{r.from}</strong>
            </Link>{" "}
            ({r.stars}⭐): {r.text}
          </p>
        ))}

        <h3 style={{ marginTop: 24 }}>Items I Listed</h3>
        {myItems.length === 0 && <p>No items listed.</p>}
        {myItems.map((i) => (
          <p key={i.id}>• {i.title}</p>
        ))}

        <h3 style={{ marginTop: 24 }}>Items I Am Currently Borrowing</h3>
        {myBorrowedActive.length === 0 && <p>None.</p>}
        {myBorrowedActive.map((b) => (
          <p key={b.id}>
            • {findItem(b.itemId, b.itemName)} (from {findUser(b.ownerId)})
          </p>
        ))}

        

        <h3 style={{ marginTop: 24 }}>My Items Currently Borrowed by Others</h3>
        {othersBorrowedActive.length === 0 && <p>None.</p>}
        {othersBorrowedActive.map((b) => (
          <p key={b.id}>
            • {findItem(b.itemId, b.itemName)} (borrowed by{" "}
            {findUser(b.borrowerId)})
          </p>
        ))}

        <h3 style={{ marginTop: 24 }}>My Items Borrowed in the Past</h3>
        {othersBorrowedReturned.length === 0 && <p>No past borrows.</p>}
        {othersBorrowedReturned.map((b) => (
          <p key={b.id}>
            • {findItem(b.itemId, b.itemName)} (returned by{" "}
            {findUser(b.borrowerId)})
          </p>
        ))}
      </div>
    </div>
  );
};

export default ProfilePage;
