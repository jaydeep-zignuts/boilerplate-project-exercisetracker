const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

require("dotenv").config();

app.use(cors());
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("connected to mongoose");
  })
  .catch((err) => {
    console.log("Error in connecting mongoose", err);
  });

// database schemas
const UserSchema = mongoose.Schema({
  username: { type: String },
});
const User = mongoose.model("UserSchema", UserSchema);

const ExerciseSchema = mongoose.Schema({
  description: { type: String },
  duration: { type: Number },
  date: { type: String },
  username: { type: String },
});
const Exercise = mongoose.model("ExerciseSchema", ExerciseSchema);

const LogSchema = mongoose.Schema({
  count: { type: Number },
  user: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  log: [{ type: mongoose.Schema.Types.ObjectId, ref: "Exercise" }],
});

const Log = mongoose.model("LogSchema", LogSchema);

// routes and controller

app.post("/api/users", async (req, res) => {
  const user = new User({
    username: req.body.username,
  });
  await user.save();
  return res.json(user);
});

app.get("/api/users", async (req, res) => {
  const users = await User.find({});
  return res.json(users);
});

app.post("/api/users/:_id/exercises", async (req, res) => {
  const user = await User.findOne({ _id: req.params._id });
  const exercises = new Exercise({
    username: user.username,
    description: req.body.description,
    duration: Number(req.body.duration),
    date: req.body.date
      ? new Date(req.body.date).toDateString()
      : new Date().toDateString(),
    user: req.params._id,
  });
  await exercises.save();
  console.log(exercises);

  console.log(exercises.date);
  return res.json({
    _id: user._id,
    username: user.username,
    date: exercises.date,
    duration: exercises.duration,
    description: exercises.description,
  });
});

app.get("/api/users/:_id/logs", async (req, res) => {
  const { from, to, limit } = req.query;

  const user = await User.findOne({ _id: req.params._id });
  const exercises = await Exercise.find({ username: user.username });
  console.log("exercises", exercises);
  let eData = exercises.map((exc) => {
    return {
      date: new Date(exc.date).toDateString(),
      description: exc.description.toString(),
      duration: Number(exc.duration),
    };
  });
  if (from) {
    const fromDate = new Date(from);
    const toDate = new Date(to);

    eData = eData.filter(
      (exe) => new Date(exe.date) > fromDate || new Date(exe.date) < toDate
    );
  }

  if (limit) {
    eData = eData.slice(0, limit);
  }
  let data = {
    username: user.username,
    count: exercises.length,
    _id: user._id,
    log: eData.length === 0 ? [eData] : eData,
  };

  return res.json(data);
});
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
