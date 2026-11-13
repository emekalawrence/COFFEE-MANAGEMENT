import jwt from "jsonwebtoken";

function createRoleMiddleware(allowedRoles) {
  return (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const token = authHeader.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (!allowedRoles.includes(decoded.role)) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission",
        });
      }

      req.staff = decoded;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }
  };
}

// Admin and staff can access staff-level features
export const verifyStaff = createRoleMiddleware(["admin", "staff"]);

// Only admins can access administrator features
export const verifyAdmin = createRoleMiddleware(["admin"]);
