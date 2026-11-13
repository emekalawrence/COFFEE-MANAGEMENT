import { apiUrl } from "~/lib/api";
import { useState } from "react";
import { useCart } from "~/context/CartContext";
import { useNavigate } from "react-router";
import "./FormOrder.css";
import DeliveryLocation from "./DeliveryLocation";

function FormOrder() {
  const { cart, clearCart } = useCart();
  const navigate = useNavigate();

  const [notice, setNotice] = useState("");
  const [fulfillment, setFulfillment] = useState("pickup");
  const [deliveryLocation, setDeliveryLocation] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (cart.length === 0) {
      setNotice("Your cart is empty. Please add items first.");
      return;
    }

    if (fulfillment === "delivery" && !deliveryLocation) {
      setNotice("Please provide your delivery location.");
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);

    setSubmitting(true);
    setNotice("");

    try {
      const payload = {
        firstName: formData.get("firstName"),
        lastName: formData.get("lastName"),
        phone: formData.get("phone"),
        email: formData.get("email"),
        pickupTime: formData.get("pickupTime"),
        pickupDate: formData.get("pickupDate"),
        notes: formData.get("notes"),
        fulfilmentType: fulfillment === "pickup" ? "pickup" : "local_delivery",
        paymentMethod:
          formData.get("payment") === "pickup"
            ? "pay_at_pickup"
            : "pay_on_delivery",
        items: cart.map((item) => ({
          menuItemId: item.id,
          quantity: item.quantity,
        })),
      };

      if (fulfillment === "delivery") {
        payload.deliveryLocation = deliveryLocation;
      }

      const response = await fetch(apiUrl("/api/orders"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to place order.");
      }

      const orderId = result.data?.id || result.order?.id;
      if (!orderId || !result.trackingToken) {
        clearCart();
        form.reset();
        setNotice(
          "Your order was placed, but live tracking could not be started. Please contact the cafe for an update.",
        );
        return;
      }

      clearCart();
      form.reset();
      setFulfillment("pickup");
      setDeliveryLocation(null);
      navigate(
        `/order-status/${encodeURIComponent(orderId)}#access=${result.trackingToken}`,
      );
    } catch (error) {
      setNotice(error.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="checkout-form" onSubmit={handleSubmit}>
      <section className="checkout-section">
        <h2>Information</h2>
        <h3>Personal information</h3>

        <div className="checkout-fields">
          <label>
            First name
            <input name="firstName" autoComplete="given-name" required />
          </label>

          <label>
            Last name
            <input name="lastName" autoComplete="family-name" required />
          </label>

          <label>
            Phone number
            <input name="phone" type="tel" autoComplete="tel" required />
          </label>

          <label>
            Email
            <input name="email" type="email" autoComplete="email" required />
          </label>
        </div>
      </section>

      <section className="checkout-section">
        <h2>Pickup information</h2>

        <div className="checkout-fields">
          <label>
            Pickup date
            <input name="pickupDate" type="date" required />
          </label>

          <label>
            Pickup time
            <input name="pickupTime" type="time" required />
          </label>

          <label className="checkout-field-full">
            Order notes <span className="optional-label">Optional</span>
            <textarea
              name="notes"
              rows="2"
              placeholder="Add any special requests"
            />
          </label>
        </div>
      </section>

      <section className="checkout-section">
        <h2>Order fulfilment</h2>

        <fieldset className="checkout-choices">
          <legend className="visually-hidden">
            Choose how to receive your order
          </legend>

          <label className="checkout-choice">
            <input
              type="radio"
              name="fulfillment"
              value="pickup"
              checked={fulfillment === "pickup"}
              onChange={() => {
                setFulfillment("pickup");
                setDeliveryLocation(null);
              }}
            />

            <span>
              <strong>Pickup at Wings Cafe</strong>
              <small>Collect your order at the cafe</small>
            </span>

            <strong className="choice-price">Free</strong>
          </label>

          <label className="checkout-choice">
            <input
              type="radio"
              name="fulfillment"
              value="delivery"
              checked={fulfillment === "delivery"}
              onChange={() => setFulfillment("delivery")}
            />

            <span>
              <strong>Local delivery</strong>
              <small>Have your order delivered to your location</small>
            </span>
          </label>
        </fieldset>

        {fulfillment === "delivery" && (
          <DeliveryLocation
            value={deliveryLocation}
            onChange={setDeliveryLocation}
          />
        )}
      </section>

      <section className="checkout-section payment-section">
        <h2>Payment</h2>

        <fieldset className="checkout-choices">
          <legend className="visually-hidden">Choose a payment method</legend>

          <label className="checkout-choice">
            <input type="radio" name="payment" value="pickup" defaultChecked />
            <span>
              <strong>Pay at pickup</strong>
              <small>Cash or card at the counter</small>
            </span>
          </label>

          <label className="checkout-choice">
            <input type="radio" name="payment" value="delivery" />
            <span>
              <strong>Pay on delivery</strong>
              <small>Cash or card when your order arrives</small>
            </span>
          </label>
        </fieldset>
      </section>

      <button
        className="place-order-button"
        type="submit"
        disabled={submitting}
      >
        {submitting ? "PLACING ORDER..." : "PLACE ORDER"}
      </button>

      {notice && (
        <p className="checkout-notice" role="status">
          {notice}
        </p>
      )}
    </form>
  );
}

export default FormOrder;
