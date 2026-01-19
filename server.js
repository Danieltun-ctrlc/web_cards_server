import express from "express";
import mysql from "mysql2/promise";
import cors from "cors";

import dotenv from "dotenv";
let port = 3000;
dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 100,
  queueLimit: 0,
};

const app = express();
app.use(express.json());

const allowedOrigins = [
  "http://localhost:3000",
  // "https://YOUR-frontend.vercel.app",
  // "https://YOUR-frontend.onrender.com"
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false,
  }),
);

app.get("/allcards", async (req, res) => {
  try {
    let connection = await mysql.createConnection(dbConfig);
    let [rows] = await connection.execute("SELECT * FROM defaultdb.cardsC");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "errors getting all the scams data" });
  }
});

app.post("/addcard", async (req, res) => {
  try {
    const { card_name, card_img } = req.body;
    let connection = await mysql.createConnection(dbConfig);
    await connection.execute(
      "INSERT INTO defaultdb.cardsC (card_name, card_URL) VALUES (?, ?)",
      [card_name, card_img],
    );
    res.status(201).json({ message: "card" + card_name + "added" });
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

    let connection = await mysql.createConnection(dbConfig);

    let [rows] = await connection.execute(
      "SELECT * FROM defaultdb.cardsC WHERE card_ID = ?",
      [id],
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Card not found" });
    }

    let [result] = await connection.execute(
      "UPDATE defaultdb.cardsC SET card_name = ?, card_URL = ? WHERE card_ID = ?",
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

app.delete("/cards/:id", async (req, res) => {
  try {
    const { id } = req.params;
    let connection = await mysql.createConnection(dbConfig);

    let [result] = await connection.execute(
      "DELETE FROM defaultdb.cardsC WHERE card_ID = ?",
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

app.app.listen(port, () => {
  console.log("server running on the port", port);
});
