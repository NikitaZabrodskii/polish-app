import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import userService from "../service/UserService";

const JWT_SECRET =
  "11aef5190b7ae7ab631c2edaea7469fc933dad66c076ee835956d0e9d31ddc4e6a8432edd61dbbc552c9886bb3547ee65e8b6409a9dc52fcd60cd7505fde704e"; // Secure JWT secret key

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
    const token =
      (req.query?.token as string) ||
      (req.body?.token as string) ||
      req.headers.authorization?.split(" ")[1]; // Bearer token format

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
