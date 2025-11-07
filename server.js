// ===============================
// 🔹 IMPORTS & INITIAL SETUP
// ===============================
import express from "express";
import mysql from "mysql2";
import bcrypt from "bcryptjs";
import path from "path";
import cors from "cors";
import { fileURLToPath } from "url";
import session from "express-session";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// ===============================
// 🔹 DATABASE CONNECTION
// ===============================
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) console.error("❌ MySQL connection failed:", err.message);
  else console.log(`✅ Connected to MySQL database: ${process.env.DB_NAME}`);
});

// ===============================
// 🔹 MIDDLEWARE SETUP
// ===============================
app.use(express.json());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, "public")));

// ===============================
// 🔹 PASSPORT STRATEGIES
// ===============================

// Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.APP_URL}/auth/google/callback`,
    },
    (accessToken, refreshToken, profile, done) => {
      const email = profile.emails[0].value;
      const name = profile.displayName;

      db.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
        if (err) return done(err);
        if (results.length > 0) return done(null, results[0]);

        db.query(
          "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
          [name, email, "google-oauth"],
          (err, result) => {
            if (err) return done(err);
            return done(null, { id: result.insertId, name, email });
          }
        );
      });
    }
  )
);

// Facebook Strategy
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      callbackURL: `${process.env.APP_URL}/auth/facebook/callback`,
      profileFields: ["id", "displayName", "emails"],
    },
    (accessToken, refreshToken, profile, done) => {
      const email = profile.emails ? profile.emails[0].value : `${profile.id}@facebook.com`;
      const name = profile.displayName;

      db.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
        if (err) return done(err);
        if (results.length > 0) return done(null, results[0]);

        db.query(
          "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
          [name, email, "facebook-oauth"],
          (err, result) => {
            if (err) return done(err);
            return done(null, { id: result.insertId, name, email });
          }
        );
      });
    }
  )
);


// --- SERIALIZATION ---
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => {
  db.query("SELECT * FROM users WHERE id = ?", [id], (err, results) => {
    if (err) return done(err);
    done(null, results[0]);
  });
});

// ===============================
// 🔹 AUTH ROUTES
// ===============================

// --- Google ---
app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/?login=failed" }),
  (req, res) => res.redirect("/?login=success")
);

// --- Facebook ---
app.get("/auth/facebook", passport.authenticate("facebook", { scope: ["email"] }));
app.get(
  "/auth/facebook/callback",
  passport.authenticate("facebook", { failureRedirect: "/?login=failed" }),
  (req, res) => res.redirect("/?login=success")
);

// --- Logout ---
app.post("/api/logout", (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ message: "Logout failed" });
    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out successfully" });
    });
  });
});

// --- Session User ---
app.get("/api/session-user", (req, res) => {
  res.json({ user: req.user || null });
});

// --- Get Current User ---
app.get("/api/user", (req, res) => {
  if (req.user) {
    res.json({
      email: req.user.email,
      name: req.user.name,
      provider: req.user.provider || "local",
    });
  } else {
    res.status(401).json({ message: "Not logged in" });
  }
});

// ===============================
// 🔹 LOCAL SIGNUP & LOGIN
// ===============================
app.post("/api/signup", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ message: "All fields required" });

  db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (results.length > 0)
      return res.status(400).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    db.query(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      [name, email, hashedPassword],
      (err) => {
        if (err) return res.status(500).json({ message: "Error creating user" });
        res.json({ message: "Account created successfully!" });
      }
    );
  });
});

app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "All fields required" });

  db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (results.length === 0)
      return res.status(400).json({ message: "Invalid email or password" });

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid email or password" });

    req.session.user = { id: user.id, name: user.name, email: user.email };
    res.json({ message: "Login successful!", user: req.session.user });
  });
});

// --- Check Session ---
app.get("/api/check-session", (req, res) => {
  res.json({
    loggedIn: !!(req.session && req.session.user),
    user: req.session?.user || null,
  });
});

// ===============================
// 🔹 PRODUCTS
// ===============================
app.get("/api/products", (req, res) => {
  const { category } = req.query;
  let query = "SELECT * FROM products";
  const params = [];
  if (category) {
    query += " WHERE category = ?";
    params.push(category);
  }
  db.query(query, params, (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    res.json(results);
  });
});

app.get("/api/categories", (req, res) => {
  db.query("SELECT DISTINCT category FROM products", (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    res.json(results.map((r) => r.category));
  });
});

// ===============================
// 🔹 ORDERS
// ===============================
app.get("/api/orders", (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ message: "Email is required" });

  db.query("SELECT * FROM w_neworder WHERE User_email = ?", [email], (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    res.json(results);
  });
});

app.post("/api/neworder", (req, res) => {
  const {
    Status = "Pending",
    Dining_option,
    Product_id,
    list_of_orders,
    Total_Price,
    Amount_of_bill,
    Payment_method,
    Gcash_reference = "",
    User_email,
    User_phone_no = "",
    User_address = "",
    Receipt = "",
  } = req.body;

  if (!Dining_option || !list_of_orders || !Total_Price || !Payment_method || !User_email)
    return res.status(400).json({ message: "⚠️ Missing required fields" });

  const getOrderNoQuery = "SELECT MAX(Order_no) AS lastOrderNo FROM w_neworder";
  db.query(getOrderNoQuery, (err, result) => {
    if (err) return res.status(500).json({ message: "Database query failed" });

    const nextOrderNo = (result[0].lastOrderNo || 0) + 1;
    const insertQuery = `
      INSERT INTO w_neworder 
      (Order_no, Status, Dining_option, Product_id, list_of_orders, Total_Price,
       Amount_of_bill, Payment_method, Gcash_reference, User_email, User_phone_no,
       User_address, Receipt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
      insertQuery,
      [
        nextOrderNo,
        Status,
        Dining_option,
        Product_id || "",
        list_of_orders,
        Total_Price,
        Amount_of_bill,
        Payment_method,
        Gcash_reference,
        User_email,
        User_phone_no,
        User_address,
        Receipt,
      ],  
      (err, result) => {
        if (err) return res.status(500).json({ message: "Database insert failed" });

        res.json({
          message: "✅ Order saved successfully!",
          orderId: result.insertId,
          orderNo: nextOrderNo,
        });
      }
    );
  });
});

// ===============================
// 🔹 FRONTEND & START SERVER
// ===============================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => console.log(`✅ Waco server running at http://localhost:${PORT}`));
