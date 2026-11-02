
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { rateLimit } = require("express-rate-limit");
const pool = require("./db");

const authRouter = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is missing from .env");
}

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    error: "Too many attempts. Please try again later.",
  },
});

function createToken(userId) {
  return jwt.sign(
    { userId },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function setAuthCookie(res, userId) {
  const token = createToken(userId);
  res.cookie("devflow_token", token, cookieOptions);
}

function authenticate(req, res, next) {
  const token = req.cookies?.devflow_token;

  if (!token) {
    return res.status(401).json({
      error: "Please log in first.",
    });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);

    if (
      typeof payload !== "object" ||
      !Number.isSafeInteger(payload.userId)
    ) {
      return res.status(401).json({
        error: "Invalid authentication token.",
      });
    }

    req.userId = payload.userId;
    next();
  } catch {
    return res.status(401).json({
      error: "Session expired. Please log in again.",
    });
  }
}

// Limit repeated authentication requests.
authRouter.use(loginLimiter);

// REGISTER
authRouter.post("/register", async (req, res) => {
  let client;

  try {
    const { name, email, password } = req.body;

    if (
      typeof name !== "string" ||
      name.trim().length < 2 ||
      name.trim().length > 80
    ) {
      return res.status(400).json({
        error: "Name must contain 2 to 80 characters.",
      });
    }

    if (
      typeof email !== "string" ||
      email.length > 255 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
      return res.status(400).json({
        error: "Enter a valid email address.",
      });
    }

    if (
      typeof password !== "string" ||
      password.length < 8 ||
      Buffer.byteLength(password, "utf8") > 72
    ) {
      return res.status(400).json({
        error: "Password must be at least 8 characters and at most 72 bytes.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(password, 12);

    client = await pool.connect();

    await client.query("BEGIN");

    const existingUsers = await client.query(
      "SELECT COUNT(*)::int AS count FROM users"
    );

    const result = await client.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email`,
      [name.trim(), normalizedEmail, passwordHash]
    );

    const user = result.rows[0];

    // Assign previously imported tasks to the first account.
    if (existingUsers.rows[0].count === 0) {
      await client.query(
        "UPDATE tasks SET user_id = $1 WHERE user_id IS NULL",
        [user.id]
      );
    }

    await client.query("COMMIT");

    setAuthCookie(res, user.id);

    return res.status(201).json({
      message: "Account created successfully.",
      user,
    });

  } catch (error) {
    if (client) {
      await client.query("ROLLBACK").catch(() => {});
    }

    if (error.code === "23505") {
      return res.status(409).json({
        error: "An account with this email already exists.",
      });
    }

    console.error("Registration error:", error.message);

    return res.status(500).json({
      error: "Could not create account.",
    });

  } finally {
    if (client) client.release();
  }
});

// LOGIN
authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        error: "Email and password are required.",
      });
    }

    const result = await pool.query(
      `SELECT id, name, email, password_hash
       FROM users
       WHERE email = $1`,
      [email.trim().toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: "Invalid email or password.",
      });
    }

    const user = result.rows[0];

    const passwordMatches = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        error: "Invalid email or password.",
      });
    }

    setAuthCookie(res, user.id);

    return res.json({
      message: "Login successful.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });

  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      error: "Could not log in.",
    });
  }
});

// GET CURRENT USER
authRouter.get("/me", authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email FROM users WHERE id = $1",
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: "User account not found.",
      });
    }

    return res.json({
      user: result.rows[0],
    });

  } catch (error) {
    console.error("User lookup error:", error.message);

    return res.status(500).json({
      error: "Could not retrieve user.",
    });
  }
});

// LOGOUT
authRouter.post("/logout", (req, res) => {
  res.clearCookie("devflow_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  res.json({
    message: "Logged out successfully.",
  });
});

module.exports = {
  authRouter,
  authenticate,
};
