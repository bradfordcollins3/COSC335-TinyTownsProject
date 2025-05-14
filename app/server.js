import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import cors from "cors";
import admin from "firebase-admin";
import dotenv from "dotenv";



dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));


const serviceAccount = JSON.parse(
  fs.readFileSync(path.join(__dirname, "serviceAccountKey.json"))
);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();



const app = express();
app.use(cors());
app.use(express.json());


app.post("/save-game", async (req, res) => {
  const idToken = req.headers.authorization?.split("Bearer ")[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const { board, winner, timestamp } = req.body;
    console.log(`save-game params ${uid}  ${board}  ${winner}  ${timestamp}`);

    await db.collection("games").add({
      uid,
      board,
      winner,
      timestamp: timestamp || new Date().toISOString(),
    });

    res.status(200).send({ success: true });
  } catch (error) {
    console.error("Failed to save game:", error);
    res.status(500).send({ error: "Failed to save game" });
  }
});



const PORT = process.env.VITE_BACKEND_PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
