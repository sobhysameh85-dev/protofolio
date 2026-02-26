const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const app = express();

app.use(cors());
app.use(express.json());

/* =========================
    اتصال بقاعدة البيانات
========================= */

mongoose.connect("mongodb+srv://seif2:seif1234@cluster0.6wcaacl.mongodb.net/schoolDB")
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));


/* =========================
    موديل الجدول
========================= */

const scheduleSchema = new mongoose.Schema({
    day: String,
    subject: String,
    time: String,
    grade: String
});

const Schedule = mongoose.model("Schedule", scheduleSchema);


/* =========================
    موديل الفيديوهات
========================= */

const videoSchema = new mongoose.Schema({
    title: String,
    link: String,
    grade: String
});

const Video = mongoose.model("Video", videoSchema);


/* =========================
    موديل الأدمن
========================= */

const adminSchema = new mongoose.Schema({
  username: String,
  password: String
});

const Admin = mongoose.model("Admin", adminSchema);


/* =========================
    إنشاء أدمن مرة واحدة
========================= */

app.get("/create-admin", async (req, res) => {
  const hashedPassword = await bcrypt.hash("123456", 10);

  const admin = new Admin({
    username: "admin",
    password: hashedPassword
  });

  await admin.save();
  res.send("Admin Created");
});


/* =========================
    تسجيل الدخول
========================= */

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const admin = await Admin.findOne({ username });
  if (!admin) return res.status(400).send("User not found");

  const isMatch = await bcrypt.compare(password, admin.password);
  if (!isMatch) return res.status(400).send("Wrong password");

  const token = jwt.sign({ id: admin._id }, "secretKey", {
    expiresIn: "1d"
  });

  res.json({ token });
});


/* =========================
    حماية الروابط
========================= */

function verifyToken(req, res, next) {
  const token = req.headers.authorization;
  if (!token) return res.status(401).send("Access Denied");

  try {
    jwt.verify(token, "secretKey");
    next();
  } catch {
    res.status(400).send("Invalid Token");
  }
}


/* =========================
    API الجدول
========================= */

app.get("/api/schedule/:grade", async (req, res) => {
    const data = await Schedule.find({ grade: req.params.grade });
    res.json(data);
});


app.post("/api/schedule", verifyToken, async (req, res) => {
    const newRow = new Schedule(req.body);
    await newRow.save();
    res.json(newRow);
});

app.delete("/api/schedule/:id", verifyToken, async (req, res) => {
    await Schedule.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
});


/* =========================
    API الفيديوهات
========================= */

app.get("/api/videos/:grade", async (req, res) => {
    const data = await Video.find({ grade: req.params.grade });
    res.json(data);
});

app.put("/api/schedule/:id", verifyToken, async (req, res) => {
    const updated = await Schedule.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
    );
    res.json(updated);
});



app.post("/api/videos", verifyToken, async (req, res) => {
    const newVideo = new Video(req.body);
    await newVideo.save();
    res.json(newVideo);
});

app.delete("/api/videos/:id", verifyToken, async (req, res) => {
    await Video.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
});
app.use(express.static(__dirname));


app.listen(3000, () => {
    console.log("Server running on port 3000");
});