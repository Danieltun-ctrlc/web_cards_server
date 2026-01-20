import express from "express";
import mysql from "mysql2/promise";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://card-app-starter-pi.vercel.app/",
  // add your deployed frontend later
];


const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false,
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

app.get("/", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/allcards", async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute("SELECT * FROM defaultdb.cardsC");
    await connection.end();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "errors getting all the scams data" });
  }
});

app.post("/addcard", async (req, res) => {
  try {
    const { card_name, card_img } = req.body;

    const connection = await mysql.createConnection(dbConfig);
    await connection.execute(
      "INSERT INTO defaultdb.cardsC (card_name, card_URL) VALUES (?, ?)",
      [card_name, card_img],
    );
    await connection.end();

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

    const connection = await mysql.createConnection(dbConfig);

    const [rows] = await connection.execute(
      "SELECT * FROM defaultdb.cardsC WHERE card_ID = ?",
      [id],
    );

    if (rows.length === 0) {
      await connection.end();
      return res.status(404).json({ error: "Card not found" });
    }

    const [result] = await connection.execute(
      "UPDATE defaultdb.cardsC SET card_name = ?, card_URL = ? WHERE card_ID = ?",
      [card_name, card_img, id],
    );

    await connection.end();

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

    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute(
      "DELETE FROM defaultdb.cardsC WHERE card_ID = ?",
      [id],
    );
    await connection.end();

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
