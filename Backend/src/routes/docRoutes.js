import { Router } from "express";
import { authMiddleware, optionalAuthMiddleware } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import {
  getAllDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  shareDocument,
  uploadDocument,
  deleteDocument,
} from "../controllers/docController.js";

const router = Router();

// Publicly accessible document view with optional auth to detect role
router.get("/:id", optionalAuthMiddleware, getDocumentById);

// All other document routes require authentication
router.use(authMiddleware);

// CRUD
router.get("/", getAllDocuments);
router.post("/create", createDocument);
router.put("/update/:id", updateDocument);
router.delete("/:id", deleteDocument);

// Sharing
router.post("/:id/share", shareDocument);

// File upload — must come after auth middleware
router.post("/upload", upload.single("file"), uploadDocument);

export default router;
