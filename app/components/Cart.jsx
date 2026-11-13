import React from "react";
import "./Cart.css";

function Cart(props) {
  const total = props.cart.reduce((sum, item) => {
    return sum + item.price * item.quantity;
  }, 0);

  return (
    <div className={`cart-overlay ${props.isOpen ? "open" : ""}`}>
      <section className="cart" aria-label="Shopping cart">
        <div className="cart-heading">
          <h2 className="cart-title">Your Shopping Cart</h2>
          <button
            className="cart-dismiss-button"
            type="button"
            aria-label="Close shopping cart"
            onClick={props.onCloseCart}
          >
            ×
          </button>
        </div>
        <div className="cart-summary">
          <p>Hear is your Order</p>
          <h3>
            {props.cart.length} {props.cart.length === 1 ? "Item" : "Items"}
          </h3>
        </div>

        <div className="cart-items">
          {props.cart.map((item) => (
            <article className="cart-item" key={item.id}>
              <img
                className="cart-item-image"
                src={item.image || "/image/coffee.jpg"}
                alt=""
                loading="lazy"
              />

              <div className="cart-item-details">
                <h3>{item.name}</h3>
                <p className="cart-item-price">
                  M{Number(item.price).toFixed(2)} each
                </p>
                <div className="quantity-controls">
                  <button
                    type="button"
                    aria-label={`Decrease ${item.name} quantity`}
                    onClick={() => props.decreaseQuantity(item.id)}
                  >
                    −
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    type="button"
                    aria-label={`Increase ${item.name} quantity`}
                    onClick={() => props.increaseQuantity(item.id)}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="cart-item-actions">
                <p className="cart-item-subtotal">
                  M{(item.price * item.quantity).toFixed(2)}
                </p>
                <button
                  className="cart-item-remove"
                  type="button"
                  onClick={() => props.removeFromCart(item.id)}
                >
                  Remove
                </button>
              </div>
            </article>
          ))}
          {props.cart.length === 0 && (
            <p className="cart-empty">Your cart is empty.</p>
          )}
        </div>

        <footer className="cart-footer">
          <div className="total-row">
            <h3>Total </h3>
            <p>M{total.toFixed(2)}</p>
          </div>

          <button
            className="checkout-button"
            type="button"
            onClick={props.onCheckout}
          >
            Checkout
            <span aria-hidden="true">›</span>
          </button>
        </footer>
      </section>
    </div>
  );
}
export default Cart;
