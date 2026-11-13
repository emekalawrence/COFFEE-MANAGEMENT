import { apiUrl } from "~/lib/api";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import "./StaffMenu.css";

const menuImages = [
  "IMG-20261113-WA0002.jpg",
  "IMG-20261113-WA0003.jpg",
  "IMG-20261113-WA0004.jpg",
  "IMG-20261113-WA0005.jpg",
  "IMG-20261113-WA0007.jpg",
  "IMG-20261113-WA0008.jpg",
  "IMG-20261113-WA0009.jpg",
  "IMG-20261113-WA0010.jpg",
  "IMG-20261113-WA0011.jpg",
  "IMG-20261113-WA0012.jpg",
  "IMG-20261113-WA0013.jpg",
  "IMG-20261113-WA0014.jpg",
  "IMG-20261113-WA0015.jpg",
  "IMG-20261113-WA0016.jpg",
  "IMG-20261113-WA0017.jpg",
  "IMG-20261113-WA0018.jpg",
  "IMG-20261113-WA0019.jpg",
  "IMG-20261113-WA0020.jpg",
  "IMG-20261113-WA0021.jpg",
  "IMG-20261113-WA0023.jpg",
  "IMG-20261113-WA0024.jpg",
  "IMG-20261113-WA0025.jpg",
  "IMG-20261113-WA0026.jpg",
  "IMG-20261113-WA0027.jpg",
  "IMG-20261113-WA0028.jpg",
  "IMG-20261113-WA0030.jpg",
  "IMG-20261113-WA0031.jpg",
  "IMG-20261113-WA0032.jpg",
  "IMG-20261113-WA0033.jpg",
  "coffee.jpg",
  "drinks.jpg",
  "food (2).jpg",
  "pastries.jpg",
].map((filename) => ({
  src: `/image/${filename}`,
  name: filename.replace(/\.jpg$/i, ""),
}));

function StaffMenu() {
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    available: true,
    image: "/image/coffee.jpg",
  });

  const token =
    typeof window !== "undefined" ? localStorage.getItem("staffToken") : null;

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  async function loadMenu() {
    try {
      const response = await fetch(apiUrl("/api/menu"));
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Could not load menu.");
      }

      setMenuItems(result.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!token) {
      navigate("/staff/login");
      return;
    }

    loadMenu();
  }, []);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const resetForm = () => {
    setForm({
      name: "",
      description: "",
      price: "",
      category: "",
      available: true,
      image: "/image/coffee.jpg",
    });
    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    try {
      const payload = {
        ...form,
        price: Number(form.price),
      };

      const url = editingId
        ? apiUrl(`/api/menu/${editingId}`)
        : apiUrl("/api/menu");

      const response = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Could not save menu item.");
      }

      resetForm();
      await loadMenu();
    } catch (err) {
      setError(err.message);
    }
  };

  const startEditing = (item) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      description: item.description,
      price: String(item.price),
      category: item.category || "",
      available: item.available,
      image: item.image || "/image/coffee.jpg",
    });
  };

  const deleteItem = async (id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) {
      return;
    }

    try {
      const response = await fetch(apiUrl(`/api/menu/${id}`), {
        method: "DELETE",
        headers,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Could not delete item.");
      }

      await loadMenu();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <main className="staff-menu-page">
        <div className="loading-state">Loading menu...</div>
      </main>
    );
  }

  return (
    <main className="staff-menu-page">
      <header className="staff-topbar">
        <div className="staff-brand-wrap">
          <div className="staff-brand-badge">W</div>
          <div>
            <p className="staff-brand-eyebrow">Menu management</p>
            <h1>Wings Cafe</h1>
          </div>
        </div>

        <button className="staff-secondary-button" onClick={() => navigate("/staff/dashboard")}>
          Back to dashboard
        </button>
      </header>

      {error && <p className="staff-error-banner" role="alert">{error}</p>}

      <section className="staff-menu-layout">
        <div className="menu-form-card">
          <div className="panel-heading">
            <h2>{editingId ? "Edit menu item" : "Add menu item"}</h2>
          </div>

          <form className="menu-form" onSubmit={handleSubmit}>
            <label className="staff-field">
              <span>Item name</span>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Vanilla latte"
                required
              />
            </label>

            <label className="staff-field">
              <span>Description</span>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Rich espresso with creamy vanilla foam"
                required
              />
            </label>

            <div className="menu-form-row">
              <label className="staff-field">
                <span>Price (M)</span>
                <input
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={handleChange}
                  required
                />
              </label>

              <label className="staff-field">
                <span>Category</span>
                <input
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  placeholder="Coffee"
                  required
                />
              </label>
            </div>

            <fieldset className="image-picker">
              <legend>Choose a product image</legend>
              <div className="image-picker-grid">
                {menuImages.map((image) => (
                  <label
                    className={`image-option ${form.image === image.src ? "selected" : ""}`}
                    key={image.src}
                    title={image.name}
                  >
                    <input
                      type="radio"
                      name="image"
                      value={image.src}
                      checked={form.image === image.src}
                      onChange={handleChange}
                    />
                    <img src={image.src} alt="" loading="lazy" />
                    <span>{image.name}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="checkbox-row">
              <input
                name="available"
                type="checkbox"
                checked={form.available}
                onChange={handleChange}
              />
              <span>Available for sale</span>
            </label>

            <div className="form-actions">
              <button className="staff-primary-button" type="submit">
                {editingId ? "Update item" : "Add item"}
              </button>

              {editingId && (
                <button className="staff-secondary-button" type="button" onClick={resetForm}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="menu-list-card">
          <div className="panel-heading">
            <h2>Existing menu items</h2>
          </div>

          {menuItems.length === 0 ? (
            <div className="empty-state">No menu items found.</div>
          ) : (
            <div className="menu-grid">
              {menuItems.map((item) => (
                <article key={item.id} className="menu-item-card">
                  <img
                    className="menu-item-image"
                    src={item.image || "/image/coffee.jpg"}
                    alt=""
                    loading="lazy"
                  />
                  <div className="menu-item-header">
                    <div>
                      <p className="item-category">{item.category}</p>
                      <h3>{item.name}</h3>
                    </div>
                    <span className={`availability ${item.available ? "in-stock" : "out-of-stock"}`}>
                      {item.available ? "Available" : "Unavailable"}
                    </span>
                  </div>

                  <p className="menu-item-description">{item.description}</p>
                  <div className="menu-item-footer">
                    <strong>M{Number(item.price).toFixed(2)}</strong>
                    <div className="mini-actions">
                      <button className="staff-secondary-button" onClick={() => startEditing(item)}>
                        Edit
                      </button>
                      <button className="staff-delete-button" onClick={() => deleteItem(item.id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default StaffMenu;
