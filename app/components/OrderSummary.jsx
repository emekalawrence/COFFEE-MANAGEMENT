import { Link } from "react-router";
import "./OrderSummary.css";

function OrderSummary({ items, total }) {
  const itemCount = items.reduce((count, item) => count + item.quantity, 0);

  return (
    <aside className="checkout-summary" aria-labelledby="summary-title">
      <h2 id="summary-title">
        Order summary <span>({itemCount})</span>
      </h2>
      {items.length === 0 ? (
        <div className="empty-bag">
          <span className="empty-bag-icon" aria-hidden="true">
            <img src="logo1.jpg" alt="Empty Bag" />
          </span>
          <p>Your bag is empty. Add something delicious from our menu.</p>
          <Link to="/menu">Browse the menu</Link>
        </div>
      ) : (
        <ul className="order-items">
          {items.map((item) => (
            <li className="order-summary-item" key={item.id}>
              <img src={item.image} alt="" />
              <span className="order-summary-details">
                <strong>{item.name}</strong>
                <small>Qty: {item.quantity}</small>
              </span>
              <strong className="order-summary-price">
                M{(item.price * item.quantity).toFixed(2)}
              </strong>
            </li>
          ))}
        </ul>
      )}
      <div className="summary-totals">
        <div>
          <span>Subtotal</span>
          <span>M{total.toFixed(2)}</span>
        </div>
        <div>
          <span>Delivery</span>
          <span>—</span>
        </div>
        <div className="summary-total">
          <strong>Total</strong>
          <strong>M{total.toFixed(2)}</strong>
        </div>
      </div>
    </aside>
  );
}

export default OrderSummary;
