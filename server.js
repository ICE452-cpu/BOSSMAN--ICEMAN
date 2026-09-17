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
app.use(express.static(path.join(__dirname, "public")));

function readDB(){ return JSON.parse(fs.readFileSync(DB,"utf8")); }
function writeDB(db){ fs.writeFileSync(DB, JSON.stringify(db,null,2)); }
function hash(p){ return crypto.createHash("sha256").update(p).digest("hex"); }
function adminToken(){
  const payload = Buffer.from(JSON.stringify({role:"admin",exp:Date.now()+24*60*60*1000})).toString("base64url");
  const sig = crypto.createHmac("sha256", ADMIN_TOKEN_SECRET).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}
function requireAdmin(req,res,next){
  const token=String(req.headers.authorization||"").replace(/^Bearer\s+/i,"");
  const [payload,sig]=token.split(".");
  if(!payload||!sig) return res.status(401).json({error:"Admin authentication required."});
  const expected=crypto.createHmac("sha256", ADMIN_TOKEN_SECRET).update(payload).digest("base64url");
  if(!crypto.timingSafeEqual(Buffer.from(sig),Buffer.from(expected))) return res.status(401).json({error:"Invalid admin token."});
  try { const data=JSON.parse(Buffer.from(payload,"base64url").toString("utf8")); if(data.role!=="admin"||data.exp<Date.now()) throw Error(); } catch { return res.status(401).json({error:"Expired or invalid admin token."}); }
  next();
}

app.post("/api/register",(req,res)=>{
  const {username,email,password}=req.body||{};
  if(!username||!email||!password) return res.status(400).json({error:"Username, email and password are required."});
  if(password.length < 6) return res.status(400).json({error:"Password must be at least 6 characters."});
  const db=readDB();
  if(db.users.some(u=>u.username.toLowerCase()===username.toLowerCase() || u.email.toLowerCase()===email.toLowerCase()))
    return res.status(409).json({error:"Username or email already exists."});
  db.users.push({id:crypto.randomUUID(),username,email,passwordHash:hash(password),createdAt:new Date().toISOString()});
  writeDB(db);
  res.json({ok:true,message:"Account created. Welcome to ICEMAN EFOOTBALL STORE."});
});

app.post("/api/login",(req,res)=>{
  const {email,password}=req.body||{};
  const db=readDB();
  const user=db.users.find(u=>u.email.toLowerCase()===String(email||"").toLowerCase() && u.passwordHash===hash(String(password||"")));
  if(!user) return res.status(401).json({error:"Invalid email or password."});
  res.json({ok:true,user:{username:user.username,email:user.email}});
});

app.post("/api/chat",(req,res)=>{
  const {username,message}=req.body||{};
  if(!message || String(message).trim().length>500) return res.status(400).json({error:"Enter a message."});
  const db=readDB();
  db.messages.push({id:crypto.randomUUID(),username:username||"Visitor",message:String(message).trim(),createdAt:new Date().toISOString()});
  writeDB(db);
  res.json({ok:true});
});

app.get("/api/chat",(req,res)=>{
  const db=readDB();
  res.json(db.messages.slice(-50));
});

app.post("/api/admin/login",(req,res)=>{
  if(String(req.body?.password||"")!==ADMIN_PASSWORD) return res.status(401).json({error:"Invalid admin password."});
  res.json({ok:true,token:adminToken()});
});

app.get("/api/admin/messages",requireAdmin,(req,res)=>res.json(readDB().messages.slice(-100)));
app.get("/api/listings",(req,res)=>res.json(readDB().listings));

app.post("/api/listings",requireAdmin,(req,res)=>{
  const {title,description,price}=req.body||{};
  if(!title||!description||!price) return res.status(400).json({error:"Title, description and price are required."});
  const db=readDB();
  db.listings.push({id:crypto.randomUUID(),title,description,price,createdAt:new Date().toISOString()});
  writeDB(db);
  res.json({ok:true});
});

app.listen(PORT,()=>console.log(`ICEMAN EFOOTBALL STORE running on port ${PORT}`));
