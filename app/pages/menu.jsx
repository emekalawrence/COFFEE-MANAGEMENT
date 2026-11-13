import { apiUrl } from "~/lib/api";
import MenuCard from "~/components/MenuCard";
import MenuRecommendation from "~/components/MenuRecommendation";
import Cart from "~/components/Cart";
import CartIndicator from "~/components/cartIndicator";
import { useCart } from "~/context/CartContext";
import { useNavigate } from "react-router";
import { useEffect, useState } from "react";

function Menu() {
  const {
    cart,
    addToCart,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    clearCart,
  } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchMenu() {
      try {
        const response = await fetch(apiUrl("/api/menu"));

        if (!response.ok) {
          throw new Error("Failed to load menu");
        }

        const data = await response.json();

        setMenuItems(data.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchMenu();
  }, []);

  const add_to_cart = (id) => {
    const selected = menuItems.find((item) => item.id === id);

    if (!selected) {
      throw new Error(`Menu item ${id} was not found`);
    }

    addToCart(selected);
    setIsCartOpen(true);
  };
  return (
    <div className={`menu-card-container ${isCartOpen ? "cart-open" : ""}`}>
      <MenuRecommendation
        items={menuItems}
        loading={loading}
        onAddToCart={add_to_cart}
      />

      {loading && <p>Loading menu...</p>}

      {error && <p>{error}</p>}

      {!loading && !error && menuItems.length === 0 && (
        <p>No menu items available.</p>
      )}
      {menuItems.map((item) => (
        <MenuCard
          key={item.id}
          id={item.id}
          name={item.name}
          description={item.description}
          price={item.price}
          image={item.image || "/image/coffee.jpg"}
          available={item.available}
          onAddToCart={add_to_cart}
        />
      ))}
      <Cart
        cart={cart}
        increaseQuantity={increaseQuantity}
        decreaseQuantity={decreaseQuantity}
        removeFromCart={removeFromCart}
        isOpen={isCartOpen}
        onCloseCart={() => setIsCartOpen(false)}
        onCheckout={() => navigate("/OrderForm")}
      />
      <CartIndicator
        cart={cart}
        isCartOpen={isCartOpen}
        onClick={() => setIsCartOpen(true)}
      />
    </div>
  );
}

export default Menu;
