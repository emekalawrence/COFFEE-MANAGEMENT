import FormOrder from "~/components/FormOrder";
import OrderSummary from "~/components/OrderSummary";
import { useCart } from "~/context/CartContext";

function OrderForm() {
  const { cart, total } = useCart();

  return (
    <main className="checkout-page">
      <div className="checkout-shell">
        <header className="checkout-header">
          <p>Wings Coffee Shop / Checkout</p>
          <h1>CHECKOUT</h1>
        </header>
        <div className="checkout-columns">
          <FormOrder />
          <OrderSummary items={cart} total={total} />
        </div>
      </div>
    </main>
  );
}

export default OrderForm;
