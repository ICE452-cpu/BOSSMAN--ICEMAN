const express = require("express");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "ISAAC12345";
const ADMIN_TOKEN_SECRET = process.env.ADMIN_TOKEN_SECRET || crypto.randomBytes(32).toString("hex");
const DB = path.join(__dirname, "data.json");

if (!fs.existsSync(DB)) fs.writeFileSync(DB, JSON.stringify({users:[],messages:[],listings:[]}, null, 2));

app.use(express.json());
app.use(express.static(path.join(__dirname)));

function readDB(){ return JSON.parse(fs.readFileSync(DB,"utf8")); }
function writeDB(db){ fs.writeFileSync(DB, JSON.stringify(db,null,2)); }
function hash(p){ return crypto.createHash("sha256").update(p).digest("hex"); }

app.get("/", (req,res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => console.log("Server running on " + PORT));
