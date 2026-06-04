import { Router } from "express";
import {authMiddleware} from "../middleware/authMiddleware.js";
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

// All document routes require authentication
router.use(authMiddleware);

// CRUD
router.get("/", getAllDocuments);
router.get("/:id", getDocumentById);
router.post("/create", createDocument);
router.put("/update/:id", updateDocument);
router.delete("/:id", deleteDocument);

// Sharing
router.post("/:id/share", shareDocument);

// File upload — must come after auth middleware
router.post("/upload", upload.single("file"), uploadDocument);

export default router;
