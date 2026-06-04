import { prisma } from "../lib/prisma.js";
import path from "path";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns true if the user owns the document OR is listed as a collaborator.
 */
const hasAccess = async (docId, userId) => {
  const doc = await prisma.document.findUnique({
    where: { id: docId },
    include: { collaborators: true },
  });

  if (!doc) return { allowed: false, doc: null, role: null };

  if (doc.ownerId === userId) {
    return { allowed: true, doc, role: "OWNER" };
  }

  const collab = doc.collaborators.find((c) => c.userId === userId);
  if (collab) {
    return { allowed: true, doc, role: collab.role };
  }

  return { allowed: false, doc: null, role: null };
};

// ---------------------------------------------------------------------------
// Controllers
// ---------------------------------------------------------------------------

/**
 * GET /api/docs
 * Returns documents owned by the authenticated user AND documents shared with them.
 */
export const getAllDocuments = async (req, res) => {
  try {
    const userId = req.user.id;

    const documents = await prisma.document.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { collaborators: { some: { userId } } },
        ],
      },
      include: {
        owner: { select: { id: true, email: true, name: true } },
        collaborators: {
          include: { user: { select: { id: true, email: true, name: true } } },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return res.status(200).json({ documents });
  } catch (err) {
    console.error("getAllDocuments error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
};

/**
 * GET /api/docs/:id
 * Returns a single document if the user is the owner or a collaborator.
 */
export const getDocumentById = async (req, res) => {
  try {
    const { id } = req.params;

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, email: true, name: true } },
        collaborators: {
          include: { user: { select: { id: true, email: true, name: true } } },
        },
      },
    });

    if (!document) {
      return res.status(404).json({ error: "Document not found." });
    }

    let role = "VIEWER";
    if (req.user) {
      if (document.ownerId === req.user.id) {
        role = "OWNER";
      } else {
        const collab = document.collaborators.find((c) => c.userId === req.user.id);
        if (collab) {
          role = collab.role;
        }
      }
    }

    return res.status(200).json({ document, role });
  } catch (err) {
    console.error("getDocumentById error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
};

/**
 * POST /api/docs
 * Creates a new document. The authenticated user becomes the owner.
 */
export const createDocument = async (req, res) => {
  try {
    const { title, content } = req.body;
    const userId = req.user.id;

    if (!title) {
      return res.status(400).json({ error: "title is required." });
    }

    const document = await prisma.document.create({
      data: {
        title,
        content: content || "",
        ownerId: userId,
      },
    });

    return res.status(201).json({ message: "Document created.", document });
  } catch (err) {
    console.error("createDocument error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
};

/**
 * PUT /api/docs/:id
 * Updates a document's title and/or content.
 * Only the owner or an EDITOR collaborator can update.
 */
export const updateDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { title, content } = req.body;

    const { allowed, role } = await hasAccess(id, userId);
    if (!allowed) {
      return res.status(404).json({ error: "Document not found or access denied." });
    }
    if (role === "VIEWER") {
      return res.status(403).json({ error: "Viewers cannot edit this document." });
    }

    const data = {};
    if (title !== undefined) data.title = title;
    if (content !== undefined) data.content = content;

    const document = await prisma.document.update({
      where: { id },
      data,
    });

    return res.status(200).json({ message: "Document updated.", document });
  } catch (err) {
    console.error("updateDocument error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
};

/**
 * POST /api/docs/:id/share
 * Shares a document with another user.
 * Body: { email: string, role: 'EDITOR' | 'VIEWER' }
 * Only the document owner can share.
 */
export const shareDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { email, role } = req.body;

    // Validation
    if (!email || !role) {
      return res.status(400).json({ error: "email and role are required." });
    }
    if (!["EDITOR", "VIEWER"].includes(role)) {
      return res.status(400).json({ error: "role must be 'EDITOR' or 'VIEWER'." });
    }

    // Only the owner can share
    const doc = await prisma.document.findUnique({ where: { id } });
    if (!doc) {
      return res.status(404).json({ error: "Document not found." });
    }
    if (doc.ownerId !== userId) {
      return res.status(403).json({ error: "Only the document owner can share." });
    }

    // Find the target user
    const targetUser = await prisma.user.findUnique({ where: { email } });
    if (!targetUser) {
      return res.status(404).json({ error: "No user found with that email." });
    }
    if (targetUser.id === userId) {
      return res.status(400).json({ error: "You cannot share a document with yourself." });
    }

    // Upsert collaborator (update role if already shared)
    const collaborator = await prisma.collaborator.upsert({
      where: { docId_userId: { docId: id, userId: targetUser.id } },
      update: { role },
      create: { docId: id, userId: targetUser.id, role },
    });

    return res.status(200).json({
      message: `Document shared with ${email} as ${role}.`,
      collaborator,
    });
  } catch (err) {
    console.error("shareDocument error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
};

/**
 * POST /api/docs/upload
 * Accepts a .txt or .md file upload, extracts the text content,
 * and creates a new Document from it.
 */
export const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    const userId = req.user.id;
    const originalName = req.file.originalname;
    const title = path.basename(originalName, path.extname(originalName));
    const content = req.file.buffer.toString("utf-8");

    const document = await prisma.document.create({
      data: { title, content, ownerId: userId },
    });

    return res.status(201).json({ message: "Document uploaded.", document });
  } catch (err) {
    console.error("uploadDocument error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
};

/**
 * DELETE /api/docs/:id
 * Deletes a document. Only the owner can delete.
 */
export const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const doc = await prisma.document.findUnique({ where: { id } });
    if (!doc) {
      return res.status(404).json({ error: "Document not found." });
    }
    if (doc.ownerId !== userId) {
      return res.status(403).json({ error: "Only the document owner can delete." });
    }

    await prisma.document.delete({ where: { id } });

    return res.status(200).json({ message: "Document deleted successfully." });
  } catch (err) {
    console.error("deleteDocument error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
};
