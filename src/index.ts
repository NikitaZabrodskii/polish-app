import "reflect-metadata";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import morgan from "morgan";
import multer from "multer";
import path from "path";
import fs from "fs";
import cookieParser from "cookie-parser";
import { initializeDataSource } from "./data-source";
import testService from "./services/TestService";
import userService from "./service/UserService";
import { Test } from "./entity/Test";
import { authenticate } from "./middleware/auth";

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: true, // Allow all origins in development
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Content-Length",
      "X-Requested-With",
    ],
    credentials: true,
  })
);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // Accept only audio files
    if (file.mimetype.startsWith("audio/")) {
      cb(null, true);
    } else {
      cb(new Error("Only audio files are allowed!") as any);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Middleware
app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Initialize database
(async () => {
  try {
    await initializeDataSource();
    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Failed to initialize database:", error);
    process.exit(1);
  }
})();

// Auth Routes

// Register a new user
app.post(
  "/api/auth/register",
  (req: Request, res: Response, next: NextFunction): void => {
    (async () => {
      try {
        const { username, password } = req.body;

        if (!username || !password) {
          res.status(400).json({ error: "Username and password are required" });
          return;
        }

        const user = await userService.register(username, password);

        // Don't include password in response
        const { password: _, ...userWithoutPassword } = user;

        res.status(201).json({
          message: "User registered successfully",
          user: userWithoutPassword,
        });
      } catch (error) {
        if (
          error instanceof Error &&
          error.message === "Username already exists"
        ) {
          res.status(409).json({ error: error.message });
          return;
        }
        next(error);
      }
    })();
  }
);

// Login
app.post(
  "/api/auth/login",
  (req: Request, res: Response, next: NextFunction): void => {
    (async () => {
      try {
        const { username, password } = req.body;

        if (!username || !password) {
          res.status(400).json({ error: "Username and password are required" });
          return;
        }

        const { user, token } = await userService.login(username, password);

        // Set token as HTTP-only cookie
        res.cookie("token", token, {
          httpOnly: true,
          secure: true, // Must be true when SameSite=None
          maxAge: 24 * 60 * 60 * 1000, // 1 day
          sameSite: "none",
          path: "/",
        });

        // Don't include password in response
        const { password: _, ...userWithoutPassword } = user;

        res.status(200).json({
          message: "Login successful",
          user: userWithoutPassword,
          token,
        });
      } catch (error) {
        if (
          error instanceof Error &&
          error.message === "Invalid username or password"
        ) {
          res.status(401).json({ error: error.message });
          return;
        }
        next(error);
      }
    })();
  }
);

// Logout
app.post("/api/auth/logout", (req: Request, res: Response): void => {
  // Clear the token cookie
  res.clearCookie("token");
  res.status(200).json({ message: "Logout successful" });
});

// Change password (requires authentication)
app.post(
  "/api/auth/change-password",
  authenticate,
  (req: Request, res: Response, next: NextFunction): void => {
    (async () => {
      try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
          res
            .status(400)
            .json({ error: "Current password and new password are required" });
          return;
        }

        // User ID comes from authenticated user in request
        await userService.changePassword(
          req.user.id,
          currentPassword,
          newPassword
        );

        res.status(200).json({ message: "Password changed successfully" });
      } catch (error) {
        if (
          error instanceof Error &&
          (error.message === "User not found" ||
            error.message === "Current password is incorrect")
        ) {
          res.status(400).json({ error: error.message });
          return;
        }
        next(error);
      }
    })();
  }
);

// Protected route example
app.get("/api/auth/me", authenticate, (req: Request, res: Response): void => {
  // User is available from the authenticate middleware
  const { password: _, ...userWithoutPassword } = req.user;
  res.status(200).json({ user: userWithoutPassword });
});

// Routes

// 1. Create test endpoint
app.post(
  "/api/tests",
  authenticate,
  upload.single("audiofile"),
  (req: Request, res: Response, next: NextFunction): void => {
    (async () => {
      try {
        const { title, text } = req.body;
        let answers: string[] = [];

        if (req.body.answers) {
          try {
            // Handle answers as JSON string or array
            answers =
              typeof req.body.answers === "string"
                ? JSON.parse(req.body.answers)
                : req.body.answers;
          } catch (e) {
            res.status(400).json({ error: "Invalid answers format" });
            return;
          }
        }

        if (!title || !text) {
          res.status(400).json({ error: "Title and text are required" });
          return;
        }

        if (!Array.isArray(answers)) {
          res.status(400).json({ error: "Answers must be an array" });
          return;
        }

        const relativePath = req.file
          ? `/uploads/${req.file.filename}`
          : undefined;

        const newTest = await testService.createTest(
          title,
          text,
          answers,
          relativePath
        );

        // Create full URL for audiofile if it exists
        if (newTest.audiofile) {
          const host = req.get("host");
          const protocol = req.protocol;
          newTest.audiofile = `${protocol}://${host}${newTest.audiofile}`;
        }

        res.status(201).json(newTest);
      } catch (error) {
        next(error);
      }
    })();
  }
);

// 2. Delete test by id
app.delete(
  "/api/tests/:id",
  authenticate,
  (req: Request, res: Response, next: NextFunction): void => {
    (async () => {
      try {
        const id = parseInt(req.params.id, 10);

        if (isNaN(id)) {
          res.status(400).json({ error: "Invalid ID format" });
          return;
        }

        // Get the test to check if it exists and to get the audiofile path
        const test = await testService.getTestById(id);

        if (!test) {
          res.status(404).json({ error: "Test not found" });
          return;
        }

        // Delete the test from the database
        await testService.deleteTest(id);

        // Delete associated audio file if exists
        if (test.audiofile) {
          const audiofilePath = path.join(__dirname, "..", test.audiofile);
          if (fs.existsSync(audiofilePath)) {
            fs.unlinkSync(audiofilePath);
          }
        }

        res.status(200).json({ message: "Test deleted successfully" });
      } catch (error) {
        next(error);
      }
    })();
  }
);

// 3. Get all tests (just titles)
app.get(
  "/api/tests",
  (req: Request, res: Response, next: NextFunction): void => {
    (async () => {
      try {
        const tests = await testService.getAllTests();

        // Add base URL to the response for constructing audio URLs on the frontend
        const host = req.get("host");
        const protocol = req.protocol;
        const baseUrl = `${protocol}://${host}`;

        res.status(200).json({
          tests,
          baseUrl,
        });
      } catch (error) {
        next(error);
      }
    })();
  }
);

// 4. Get test by id
app.get(
  "/api/tests/:id",
  (req: Request, res: Response, next: NextFunction): void => {
    (async () => {
      try {
        const id = parseInt(req.params.id, 10);

        if (isNaN(id)) {
          res.status(400).json({ error: "Invalid ID format" });
          return;
        }

        const test = await testService.getTestById(id);

        if (!test) {
          res.status(404).json({ error: "Test not found" });
          return;
        }

        // Create full URL for audiofile if it exists
        if (test.audiofile) {
          const host = req.get("host");
          const protocol = req.protocol;
          test.audiofile = `${protocol}://${host}${test.audiofile}`;
        }

        res.status(200).json(test);
      } catch (error) {
        next(error);
      }
    })();
  }
);

// Update test by id
app.put(
  "/api/tests/:id",
  authenticate,
  upload.single("audiofile"),
  (req: Request, res: Response, next: NextFunction): void => {
    (async () => {
      try {
        const id = parseInt(req.params.id, 10);

        if (isNaN(id)) {
          res.status(400).json({ error: "Invalid ID format" });
          return;
        }

        const { title, text } = req.body;
        let answers: string[] = [];

        if (req.body.answers) {
          try {
            // Handle answers as JSON string or array
            answers =
              typeof req.body.answers === "string"
                ? JSON.parse(req.body.answers)
                : req.body.answers;
          } catch (e) {
            res.status(400).json({ error: "Invalid answers format" });
            return;
          }
        }

        if (!title || !text) {
          res.status(400).json({ error: "Title and text are required" });
          return;
        }

        if (!Array.isArray(answers)) {
          res.status(400).json({ error: "Answers must be an array" });
          return;
        }

        // Check if test exists
        const existingTest = await testService.getTestById(id);
        if (!existingTest) {
          res.status(404).json({ error: "Test not found" });
          return;
        }

        // Process audio file if uploaded
        let relativePath: string | null = existingTest.audiofile;

        if (req.file) {
          // New audio file uploaded, update path
          relativePath = `/uploads/${req.file.filename}`;

          // Delete old audio file if exists
          if (existingTest.audiofile) {
            const oldFilePath = path.join(
              __dirname,
              "..",
              existingTest.audiofile
            );
            if (fs.existsSync(oldFilePath)) {
              fs.unlinkSync(oldFilePath);
            }
          }
        } else if (req.body.removeAudio === "true") {
          // Remove existing audio if requested
          if (existingTest.audiofile) {
            const oldFilePath = path.join(
              __dirname,
              "..",
              existingTest.audiofile
            );
            if (fs.existsSync(oldFilePath)) {
              fs.unlinkSync(oldFilePath);
            }
          }
          relativePath = null;
        }

        // Update test in database
        const updatedTest = await testService.updateTest(
          id,
          title,
          text,
          answers,
          relativePath
        );

        // Create full URL for audiofile if it exists
        if (updatedTest.audiofile) {
          const host = req.get("host");
          const protocol = req.protocol;
          updatedTest.audiofile = `${protocol}://${host}${updatedTest.audiofile}`;
        }

        res.status(200).json(updatedTest);
      } catch (error) {
        next(error);
      }
    })();
  }
);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Error:", err);
  res.status(500).json({ error: "An unexpected error occurred" });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
