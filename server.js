import express from "express";
import mysql from "mysql2/promise";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();
app.use(express.json());

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const DEMO_USER = {
  id: 1,
  username: "admin",
  password: "admin123",
};

const JWT_SECRET = process.env.JWT_SECRET;

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (username !== DEMO_USER.username || password !== DEMO_USER.password) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign(
    { id: DEMO_USER.id, username: DEMO_USER.username },
    JWT_SECRET,
    { expiresIn: "1h" },
  );
  res.json({ token });
});

app.get("/", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/allcards", async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM cardsC");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "errors getting all the cards data" });
  }
});

app.post("/addcard", async (req, res) => {
  try {
    const { card_name, card_img } = req.body;

    const [result] = await pool.execute(
      "INSERT INTO cardsC (card_name, card_URL) VALUES (?, ?)",
      [card_name, card_img],
    );

    res.status(201).json({ message: "Card added successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "adding unsuccessful" });
  }
});

app.patch("/editcard/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { card_name, card_img } = req.body;

    if (!card_name || !card_img) {
      return res
        .status(400)
        .json({ error: "card_name and card_img are required" });
    }

    const [result] = await pool.execute(
      "UPDATE cardsC SET card_name = ?, card_URL = ? WHERE card_ID = ?",
      [card_name, card_img, id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Card not found" });
    }

    res.json({ message: "Card updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "edit unsuccessful" });
  }
});

app.delete("/deletecard/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.execute(
      "DELETE FROM cardsC WHERE card_ID = ?",
      [id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Card not found" });
    }

    res.json({ message: "Card deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Delete unsuccessful" });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("server running on port", port);
});
