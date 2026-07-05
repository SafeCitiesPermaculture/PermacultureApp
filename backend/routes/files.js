const express = require("express");
const router = express.Router();
const filesController = require("../controllers/filesController");
const multer = require("multer");
const { adminAuthMiddleware } = require("../middleware/auth");

//configure local storage
const storage = multer.memoryStorage();

// Only document types the site can preview are accepted: PDF and Word (.docx).
// The extension check backs up the mimetype, which some browsers report
// generically (e.g. application/octet-stream).
const ALLOWED_UPLOAD_TYPES = new Set([
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const name = (file.originalname || "").toLowerCase();
        if (
            ALLOWED_UPLOAD_TYPES.has(file.mimetype) ||
            name.endsWith(".pdf") ||
            name.endsWith(".docx")
        ) {
            return cb(null, true);
        }
        cb(new Error("Only PDF and Word (.docx) files can be uploaded"));
    },
});

router.post(
    "/upload",
    adminAuthMiddleware,
    (req, res, next) =>
        upload.single("file")(req, res, (err) =>
            err ? res.status(400).json({ error: err.message }) : next()
        ),
    filesController.handleUpload
);
router.get("/storage", filesController.getStorageUsage);
router.get("/list", filesController.listFiles);
router.patch("/:id/flags", adminAuthMiddleware, filesController.setFileFlags);
// Any logged-in user can save one of their own AI conversations to Documents.
// (Must be registered before the "/:id" catch-all below.)
router.post("/save-conversation", filesController.saveConversation);
router.post("/:id", filesController.getFileById);
router.delete("/delete/:id", adminAuthMiddleware, filesController.deleteFile);
router.post(
    "/folder/create",
    adminAuthMiddleware,
    filesController.createFolder
);
router.delete("/purge", adminAuthMiddleware, filesController.purgeDrive);

module.exports = router;
