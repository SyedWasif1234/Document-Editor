import multer from "multer";
import path from "path";


const upload = multer({
  storage: multer.memoryStorage(),
  // Reduced to 1MB (1MB is huge for raw text. Adjust if needed)
  limits: { fileSize: 1 * 1024 * 1024 }, 
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype;

    // Validate BOTH extension and MIME type
    const isAllowedExt = ext === ".txt" || ext === ".md";
    const isAllowedMime =
      mime === "text/plain" ||
      mime === "text/markdown" ||
      mime === "text/x-markdown" ||
      mime === "application/octet-stream"; // browsers often use this for .md

    if (isAllowedExt && isAllowedMime) {
      cb(null, true);
    } else {
      // Create a custom error that is easy to identify in the global handler
      const error = new Error("Only .txt and .md files are allowed.");
      error.isMulterFilterError = true; 
      cb(error, false);
    }
  },
});

export default upload;