import React from "react";
import "./cartIndicator.css";

function CartIndicator({ cart, onClick, isCartOpen }) {
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <button
      className={`cart-indicator ${isCartOpen ? "cart-open" : ""}`}
      type="button"
      onClick={onClick}
      aria-label={`Open cart, ${itemCount} items, total M ${total.toFixed(2)}`}
      title="Open cart"
    >
      <span className="cart-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false">
          <path d="M3 4h2l2.2 10.1a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 1.9-1.4L21 8H6" />
          <circle cx="10" cy="19" r="1.25" />
          <circle cx="18" cy="19" r="1.25" />
        </svg>
        <span className="cart-count">{itemCount}</span>
      </span>

      <span className="cart-total">M {total.toFixed(2)}</span>
    </button>
  );
}

export default CartIndicator;
