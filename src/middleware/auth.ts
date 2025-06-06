import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import userService from "../service/UserService";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables.");
}

// Secure JWT secret key

// Extend the Request interface to include the user property
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// Middleware to check if user is authenticated
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from multiple sources: query, body, or headers

    const token = req.headers.authorization?.split(" ")[1]; // Bearer token format

    console.log("Token received:", token);

    if (!token) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: number;
      username: string;
    };

    console.log("Decoded token:", decoded);

    // Find user from token data
    const user = await userService.getUserById(decoded.id);

    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    // Add user to request object
    req.user = user;
    console.log("User authenticated:", user.username);

    next();
  } catch (error) {
    console.error("Authentication error:", error);

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: "Invalid token" });
      return;
    }

    res.status(401).json({ error: "Authentication failed" });
  }
};
