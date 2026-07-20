import React from "react";
import { Link } from "react-router-dom";

const ItemCard = ({ item, age }) => {
  return (
    <Link
      to={`/items/${item.id}`}
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <div className="card" style={{ marginTop: 12 }}>
        <h3>{item.title}</h3>

        {/* Posted time */}
        <p style={{ fontSize: 12, color: "#666", marginTop: -4, marginBottom: 6 }}>
          {age}
        </p>

        <p>{item.category}</p>

        {item.owner && (
          <p style={{ fontSize: 13 }}>
            Owner: {item.owner.name} ({item.owner.rating}⭐)
          </p>
        )}
      </div>
    </Link>
  );
};

export default ItemCard;
