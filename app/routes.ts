import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("pages/home.jsx"),
  route("menu", "pages/menu.jsx"),
  route("OrderForm", "pages/OrderForm.jsx"),
  route("order-status/:id", "pages/OrderStatus.jsx"),

  route("staff/login", "pages/staff/StaffLogin.jsx"),
  route("staff/dashboard", "pages/staff/StaffDashboard.jsx"),
  route("staff/menu", "pages/staff/StaffMenu.jsx"),
] satisfies RouteConfig;
