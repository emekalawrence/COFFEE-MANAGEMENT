import { Link, NavLink } from "react-router";

function Navbar() {
  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <img className="logo" src="/logo.png" alt="Logo" />
        <h3 className="shop-name">Wings Coffee Shop</h3>
      </Link>

      <ul className="nav-links">
        <li>
          <NavLink to="/" end>
            Home
          </NavLink>
        </li>
        <li>
          <NavLink to="/menu">Menu</NavLink>
        </li>
        <li>
          <NavLink to="/OrderForm">Checkout</NavLink>
        </li>
        <li>
          <NavLink to="/staff/login">Staff</NavLink>
        </li>
      </ul>
    </nav>
  );
}

export default Navbar;
