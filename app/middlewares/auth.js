const User = require("../models/user");
const { verifyToken } = require("../services/jwtToken");

// auth middleware -------------------------------------------------------------->
const authMiddleware = async (req, res, next) => {
  let token;
  try {
    if (
      req.headers["authorization"] &&
      req.headers["authorization"].startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
      const decodedData = verifyToken(token);
      const user = await User.findById(decodedData?.id).select(password-1,timestamps-1);
      req.user = user;
      next();
    } else {
      return res.status(401).json({ message: "Login Again Unauthorized" });
    }
  } catch (err) {
    throw new Error("Internal Server Error", err.message);
  }
};

/// Is Admin -------------------------------------------------------------------------------->
const isAdmin = async (req, res, next) => {
  try {
    if (req?.user?.role === "admin") {
      next();
    } else {
      return res.status(401).json({ message: "Not an admin" });
    }
  } catch (err) {
    throw new Error("Internal Server Error", err.message);
  }
};


module.exports ={
    authMiddleware,
    isAdmin
}