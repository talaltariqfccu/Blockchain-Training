import userModel from "../models/user.js";
import fs from "fs";
import dotenv from "dotenv";
import multer from "multer";

dotenv.config();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, `${file.fieldname}-${Date.now()}.jpg`); // File naming convention
  },
});
const upload = multer({ storage });

async function uploadFile(req, res, next) {

  console.log(req);
  try {
    await upload.single("file")(req, res, function (error) {
      if (error instanceof multer.MulterError) {
        console.error("Multer Error:", error.message);
        return res.status(500).json({ error: "Failed to upload file" });
      } else if (error) {
        console.error("Error:", error.message);
        return res.status(500).json({ error: "Failed to upload file" });
      } else console.log(`File Uploaded successfully`);
      next();
    });
  } catch (error) {
    console.log(`File Upload Erreo: ${error}`);
  }
}

export { uploadFile };
