import React from "react";
import "./MenuCard.css";

function MenuCard({ id, name, description, price, image, available = true, onAddToCart }) {
  return (
    <article className="menu-card">
      <img src={image} alt={name} />
      <div className="menu-card-content">
        <h3>{name}</h3>
        <p>{description}</p>
        <p className="menu-card-availability">
          {available ? "Available" : "Currently unavailable"}
        </p>
        <div className="menu-card-actions">
          <p className="menu-card-price">M{Number(price).toFixed(2)}</p>
          <button
            className="add-to-cart-button"
            type="button"
            disabled={!available}
            onClick={() => onAddToCart(id)}
          >
            {available ? "Add to Cart" : "Unavailable"}
          </button>
        </div>
      </div>
    </article>
  );
}

export default MenuCard;
