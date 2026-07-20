import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

const LeaveReviewPage = ({ currentUser }) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [targetUser, setTargetUser] = useState(null);
  const [text, setText] = useState("");
  const [stars, setStars] = useState(5);

  useEffect(() => {
    const load = async () => {
      const ref = doc(db, "users", id);
      const snap = await getDoc(ref);
      if (snap.exists()) setTargetUser({ id: snap.id, ...snap.data() });
    };
    load();
  }, [id]);

  if (!targetUser) {
    return (
      <div className="app-container">
        <div className="card">Loading user…</div>
      </div>
    );
  }

  if (currentUser.id === id) {
    return (
      <div className="app-container">
        <div className="card">You cannot review yourself.</div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newReview = {
      id: "r" + Date.now(),
      from: currentUser.name,
      fromUserId: currentUser.id,
      stars: Number(stars),
      text,
    };

    const updatedReviews = [...(targetUser.reviews || []), newReview];
    const totalStars = updatedReviews.reduce((s, r) => s + r.stars, 0);
    const avg = totalStars / updatedReviews.length;

    await updateDoc(doc(db, "users", id), {
      reviews: updatedReviews,
      rating: Number(avg.toFixed(1)),
    });

    navigate(`/users/${id}`);
  };

  return (
    <div className="app-container">
      <div className="card">
        <h2>Leave a Review for {targetUser.name}</h2>

        <form onSubmit={handleSubmit}>
          <label>
            Rating
            <select
              className="select"
              value={stars}
              onChange={(e) => setStars(e.target.value)}
            >
              <option value="1">1 star</option>
              <option value="2">2 stars</option>
              <option value="3">3 stars</option>
              <option value="4">4 stars</option>
              <option value="5">5 stars</option>
            </select>
          </label>

          <label>
            Comment
            <textarea
              className="textarea"
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              required
            ></textarea>
          </label>

          <button className="button" type="submit">
            Submit Review
          </button>
        </form>
      </div>
    </div>
  );
};

export default LeaveReviewPage;
