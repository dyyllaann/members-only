// Dependencies
const express = require('express');
const router = express.Router();
const multer = require("multer");
const fs = require("fs/promises");
const path = require("path");

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const UPLOAD_METRICS_LOG = path.join(__dirname, "..", "logs", "image-upload-metrics.log");
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_SIZE_BYTES },
  fileFilter: (req, file, callback) => {
    callback(null, file.mimetype.startsWith("image/"));
  }
});

/* POST upload image (naive implementation) */
router.post("/upload-naive", (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: "Not authenticated." });
  }

  imageUpload.single("file")(req, res, (error) => {
    if (error) {
      if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ success: false, error: "Image must be 5 MB or smaller." });
      }
      return next(error);
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: "An image file named 'file' is required." });
    }

    const startedAt = performance.now();
    const imageSource = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

    setTimeout(async () => {
      const memoryUsage = process.memoryUsage();
      const metrics = {
        success: true,
        fileName: req.file.originalname,
        fileSizeInMB: Number((req.file.size / 1024 / 1024).toFixed(2)),
        serverDurationMs: Number((performance.now() - startedAt).toFixed(2)),
        memoryUsedMB: Number((memoryUsage.heapUsed / 1024 / 1024).toFixed(2))
      };

      try {
        await fs.mkdir(path.dirname(UPLOAD_METRICS_LOG), { recursive: true });
        await fs.appendFile(
          UPLOAD_METRICS_LOG,
          `${JSON.stringify({ timestamp: new Date().toISOString(), ...metrics })}\n`
        );
      } catch (logError) {
        console.error("Failed to write image upload metrics:", logError);
      }

      res.json({ ...metrics, imageSource });
    }, 500);
  });
});

module.exports = router;
