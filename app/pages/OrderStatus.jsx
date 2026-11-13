import { apiUrl } from "~/lib/api";
import { useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "react-router";
import "./OrderStatus.css";

const orderStages = ["Pending", "Preparing", "Ready", "Collected"];

function OrderStatus() {
  const { id } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [notificationPermission, setNotificationPermission] = useState("default");
  const [notificationMessage, setNotificationMessage] = useState("");
  const previousStatus = useRef(null);

  const tokenMatch = location.hash.match(/^#access=([a-f\d]{64})$/i);
  const trackingToken = tokenMatch?.[1];

  useEffect(() => {
    if ("Notification" in window) {
      setNotificationPermission(window.Notification.permission);
    } else {
      setNotificationPermission("unsupported");
    }
  }, []);

  useEffect(() => {
    if (!trackingToken) {
      setError(
        "This tracking link is incomplete. Please open the link from your order confirmation.",
      );
      return undefined;
    }

    let active = true;
    let timeoutId;

    const loadStatus = async () => {
      try {
        const response = await fetch(
          apiUrl(`/api/orders/${encodeURIComponent(id)}/track`),
          {
            headers: {
              Authorization: `Bearer ${trackingToken}`,
            },
          },
        );
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Could not load your order status.");
        }

        if (active) {
          const nextOrder = result.data;
          const wasReady = previousStatus.current === "Ready";
          setOrder(nextOrder);
          setError("");

          if (
            nextOrder.status === "Ready" &&
            !wasReady &&
            notificationPermission === "granted"
          ) {
            try {
              new window.Notification("Your Wings Cafe order is ready", {
                body: "Please collect your order or await delivery.",
                icon: "/logo.png",
              });
            } catch {
              setNotificationMessage(
                "Your order is ready. The on-page alert is available below.",
              );
            }
          }

          previousStatus.current = nextOrder.status;
        }
      } catch (loadError) {
        if (active) {
          setError(loadError.message);
        }
      } finally {
        if (active) {
          timeoutId = window.setTimeout(loadStatus, 4000);
        }
      }
    };

    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") {
        window.clearTimeout(timeoutId);
        loadStatus();
      }
    };

    document.addEventListener("visibilitychange", refreshWhenVisible);
    loadStatus();

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [id, trackingToken, notificationPermission]);

  const enableNotifications = async () => {
    if (!("Notification" in window)) {
      setNotificationPermission("unsupported");
      setNotificationMessage(
        "This browser does not support desktop notifications. Keep this page open for live updates.",
      );
      return;
    }

    try {
      const permission = await window.Notification.requestPermission();
      setNotificationPermission(permission);
      setNotificationMessage(
        permission === "granted"
          ? "Desktop alerts are enabled for this order."
          : "Desktop alerts were not enabled. The on-page ready message will still appear.",
      );
    } catch {
      setNotificationMessage(
        "Desktop alerts could not be enabled. The on-page ready message will still appear.",
      );
    }
  };

  const isReady =
    Boolean(order?.readyAt) ||
    order?.status === "Ready" ||
    order?.status === "Collected";
  const currentStage = orderStages.indexOf(order?.status);
  const progress = currentStage < 0 ? 0 : (currentStage / (orderStages.length - 1)) * 100;
  const canEnableNotifications =
    notificationPermission === "default" || notificationPermission === "granted";

  return (
    <main className="order-status-page">
      <div className="order-status-shell">
        <header className="order-status-brand">
          <div className="order-status-brand-mark" aria-hidden="true">W</div>
          <div>
            <p>Wings Cafe</p>
            <span>Order updates</span>
          </div>
          <span className="live-indicator">
            <span aria-hidden="true" />
            Live
          </span>
        </header>

        <section className="order-status-card">
          <div className="order-status-heading">
            <div>
              <p className="order-status-kicker">Your coffee is in good hands</p>
              <h1>Order status</h1>
              <p className="order-status-number">
                Order <strong>{order?.orderNumber || "—"}</strong>
              </p>
            </div>
            {order && (
              <span className={`order-status-badge ${isReady ? "ready" : ""}`}>
                {order.status}
              </span>
            )}
          </div>

          {error && <p className="order-status-error" role="alert">{error}</p>}

          {order ? (
            <>
              <section
                className={`order-ready-alert ${isReady ? "is-ready" : ""}`}
                role="status"
                aria-live="polite"
              >
                <span className="order-ready-icon" aria-hidden="true">
                  {isReady ? "✓" : "…"}
                </span>
                <div>
                  <h2>
                    {order.status === "Collected"
                      ? "Order collected"
                      : isReady
                        ? "Your order is ready!"
                        : order.status === "Preparing"
                          ? "Freshly brewing"
                          : "Order received"}
                  </h2>
                  <p>
                    {order.status === "Collected"
                      ? "Thanks for stopping by. We hope you enjoy it!"
                      : isReady
                        ? order.fulfilmentType === "local_delivery"
                          ? "Your order is ready and will be on its way shortly."
                          : "Your order is ready for pickup at Wings Cafe."
                        : "We’ll update this page as soon as your order is ready."}
                  </p>
                </div>
              </section>

              <section className="order-progress-section" aria-label="Order progress">
                <div className="order-progress-caption">
                  <span>Order progress</span>
                  <strong>{order.status}</strong>
                </div>
                <div className="order-progress-track">
                  <span style={{ width: `${progress}%` }} />
                </div>
                <ol className="order-progress">
                  {orderStages.map((stage, index) => {
                    const complete = currentStage >= 0 && index < currentStage;
                    const current = stage === order.status;

                    return (
                      <li
                        key={stage}
                        className={[
                          complete ? "complete" : "",
                          current ? "current" : "",
                        ].filter(Boolean).join(" ")}
                      >
                        <span className="progress-dot" aria-hidden="true">
                          {complete ? "✓" : index + 1}
                        </span>
                        <span>{stage}</span>
                      </li>
                    );
                  })}
                </ol>
              </section>

              {(order.pickupDate || order.pickupTime) && (
                <div className="order-detail-row">
                  <span>{order.fulfilmentType === "local_delivery" ? "Delivery time" : "Pickup time"}</span>
                  <strong>
                    {[order.pickupDate, order.pickupTime].filter(Boolean).join(" · ")}
                  </strong>
                </div>
              )}

              <section className="notification-preference">
                <div>
                  <strong>Get a desktop alert</strong>
                  <p>
                    Allow browser notifications so you can see when your order is ready.
                  </p>
                  {notificationMessage && (
                    <p className="notification-message" role="status">
                      {notificationMessage}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={enableNotifications}
                  disabled={!canEnableNotifications}
                >
                  {notificationPermission === "granted"
                    ? "Enabled"
                    : notificationPermission === "denied"
                      ? "Blocked"
                      : notificationPermission === "unsupported"
                        ? "Unavailable"
                        : "Enable alerts"}
                </button>
              </section>
            </>
          ) : (
            !error && (
              <div className="order-status-loading" role="status">
                <span className="loading-spinner" aria-hidden="true" />
                <p>Connecting to your order…</p>
              </div>
            )
          )}
        </section>

        <p className="order-status-footer">
          Keep this page open to follow your order. It refreshes automatically.
        </p>
      </div>
    </main>
  );
}

export default OrderStatus;
