const fs = require("fs");
const express = require("express");
const app = express();
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config();
const PORT = process.env.PORT;
const DB_URL = process.env.DATABASE_LOCAL;
const Picture = require("./model/imageSchema");
const multer = require("multer");

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static("public"));

mongoose.connect(DB_URL).then(() => {
  console.log("database connected successfully");
});

app.get("/", function (req, res) {
  Picture.find({}).then((images) => {
    res.render("index", { images: images });
  });
});

app.get("/upload", function (req, res) {
  res.render("upload");
});

// set image storage path
const storage = multer.diskStorage({
  destination: "./public/uploads/images/",
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    checkFileType(file, cb);
  },
});

// check file type
function checkFileType(file, cb) {
  const fileTypes = /jpeg|png|jpg|gif/;
  const extensionName = fileTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  if (extensionName) {
    return cb(null, true);
  } else {
    cb("Error: Unknown file type");
  }
}

// upload single image
app.post(
  "/uploadSingle",
  upload.single("singleImage"),
  function (req, res, next) {
    const file = req.file;
    if (!file) {
      throw new Error("Please select image to upload");
      return;
    }
    // console.log(file.path);
    // res.redirect("/");
    const url = file.path.replace("public", "");
    Picture.findOne({ imageUrl: url })
      .then((image) => {
        if (image) {
          console.log("Duplicate image found!");
          return res.redirect("/upload");
        }
        Picture.create({ imageUrl: url }).then((image) => {
          console.log("Image saved to database");
          res.redirect("/");
        });
      })
      .catch((err) => {
        throw new Error("Something went wrong");
      });
  }
);

// upload multiple files

app.post(
  "/uploadmultiple",
  upload.array("multipleImages"),
  function (req, res, next) {
    const files = req.files;
    if (!files) {
      throw new Error("Please select images to upload");
      return;
    }
    files.forEach((file) => {
      const url = file.path.replace("public", "");
      Picture.findOne({ imageUrl: url })
        .then(async (image) => {
          if (image) {
            console.log("Duplicate image found!");
            return res.redirect("/upload");
          }
          await Picture.create({ imageUrl: url });
        })
        .catch((error) => {
          console.log("Something went wrong", error);
        });
    });
    res.redirect("/");
  }
);

app.post("/delete/:id", function (req, res) {
  const searchId = { _id: req.params.id };
  Picture.findOne(searchId)
    .then((image) => {
      fs.unlink(__dirname + "/public" + image.imageUrl, (error) => {
        if (error) return consle.log(error);
        Picture.deleteOne(searchId).then((image) => {
          res.redirect("/");
        });
      });
    })
    .catch((error) => {
      console.log(error);
    });
});

app.listen(PORT, () => {
  console.log(`server is running at port ${PORT}`);
});
