import { apiUrl } from "~/lib/api";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import "./StaffDashboard.css";

function StaffDashboard() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("staffToken") : null;

  useEffect(() => {
    if (!token) {
      navigate("/staff/login");
      return;
    }

    async function loadDashboard() {
      try {
        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [ordersResponse, statsResponse] = await Promise.all([
          fetch(apiUrl("/api/orders"), { headers }),
          fetch(apiUrl("/api/dashboard/stats"), { headers }),
        ]);

        if (ordersResponse.status === 401 || statsResponse.status === 401) {
          localStorage.removeItem("staffToken");
          localStorage.removeItem("staff");
          navigate("/staff/login");
          return;
        }

        const ordersResult = await ordersResponse.json();
        const statsResult = await statsResponse.json();

        if (!ordersResponse.ok || !statsResponse.ok) {
          throw new Error("Could not load dashboard information.");
        }

        setOrders(
          Array.isArray(ordersResult.data)
            ? ordersResult.data
            : ordersResult.data?.orders || ordersResult.orders || [],
        );

        setStats(statsResult.data || statsResult);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [token, navigate]);

  const updateStatus = async (orderId, status) => {
    try {
      const response = await fetch(
        apiUrl(`/api/orders/${orderId}/status`),
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Could not update order.");
      }

      setOrders((current) =>
        current.map((order) =>
          order.id === orderId ? { ...order, ...result.data } : order,
        ),
      );
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  const logout = () => {
    localStorage.removeItem("staffToken");
    localStorage.removeItem("staff");
    navigate("/staff/login");
  };

  const getStatusClass = (status) => {
    const value = String(status || "Pending").toLowerCase();
    if (value === "preparing") return "status-pill preparing";
    if (value === "ready") return "status-pill ready";
    if (value === "collected") return "status-pill collected";
    return "status-pill pending";
  };

  if (loading) {
    return (
      <main className="staff-dashboard-page">
        <div className="loading-state">Loading dashboard...</div>
      </main>
    );
  }

  return (
    <main className="staff-dashboard-page">
      <header className="staff-topbar">
        <div className="staff-brand-wrap">
          <div className="staff-brand-badge">W</div>
          <div>
            <p className="staff-brand-eyebrow">Operations</p>
            <h1>Wings Cafe</h1>
          </div>
        </div>

        <div className="staff-toolbar">
          <button className="staff-secondary-button" onClick={() => navigate("/staff/menu")}>
            Manage Menu
          </button>
          <button className="staff-primary-button staff-logout-button" onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      {error && <p className="staff-error-banner" role="alert">{error}</p>}

      <section className="staff-dashboard-header">
        <div>
          <p className="staff-kicker">Staff dashboard</p>
          <h2>Service overview</h2>
        </div>
      </section>

      <section className="stats-grid">
        <article className="stat-card primary">
          <span>Today's sales</span>
          <strong>M{Number(stats.todaySales || 0).toFixed(2)}</strong>
        </article>
        <article className="stat-card">
          <span>Total orders</span>
          <strong>{stats.totalOrders ?? orders.length}</strong>
        </article>
        <article className="stat-card">
          <span>Pending</span>
          <strong>{stats.pendingOrders ?? 0}</strong>
        </article>
        <article className="stat-card">
          <span>Preparing</span>
          <strong>{stats.preparingOrders ?? 0}</strong>
        </article>
        <article className="stat-card">
          <span>Ready</span>
          <strong>{stats.readyOrders ?? 0}</strong>
        </article>
        <article className="stat-card">
          <span>Collected</span>
          <strong>{stats.collectedOrders ?? 0}</strong>
        </article>
      </section>

      <section className="orders-panel">
        <div className="panel-heading">
          <h3>Customer orders</h3>
        </div>

        {orders.length === 0 ? (
          <div className="empty-state">No orders found.</div>
        ) : (
          <div className="orders-grid">
            {orders.map((order) => (
              <article key={order.id} className="order-card">
                <div className="order-header">
                  <div>
                    <p className="order-label">Order</p>
                    <h4>{order.orderNumber || order.id}</h4>
                  </div>
                  <span className={getStatusClass(order.status)}>{order.status}</span>
                </div>

                <div className="order-meta">
                  <p>
                    <strong>Customer:</strong> {order.firstName} {order.lastName}
                  </p>
                  <p>
                    <strong>Phone:</strong> {order.phone}
                  </p>
                  <p>
                    <strong>Total:</strong> M{Number(order.total || 0).toFixed(2)}
                  </p>
                </div>

                {Array.isArray(order.items) && (
                  <ul className="order-items">
                    {order.items.map((item) => (
                      <li key={item.menuItemId || `${order.id}-${item.name}`}>
                        <span>
                          {item.name} × {item.quantity}
                        </span>
                        <strong>M{Number(item.subtotal || 0).toFixed(2)}</strong>
                      </li>
                    ))}
                  </ul>
                )}

                <label className="status-control">
                  <span>Update status</span>
                  <select
                    value={order.status}
                    onChange={(event) => updateStatus(order.id, event.target.value)}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Preparing">Preparing</option>
                    <option value="Ready">Ready</option>
                    <option value="Collected">Collected</option>
                  </select>
                </label>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default StaffDashboard;
