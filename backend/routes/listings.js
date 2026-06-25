const express = require("express");
const router = express.Router();
const listingController = require("../controllers/listingController");
const multer = require("multer");

// Accept images by MIME type OR by file extension. Phones (esp. HEIC) often
// send "application/octet-stream" or an empty type, so relying on MIME alone
// rejects valid photos. Cloudinary (resource_type: image) is the final guard.
const IMAGE_EXT = /\.(jpe?g|png|gif|webp|heic|heif|bmp|tiff?|avif|svg)$/i;
const fileFilter = (req, file, cb) => {
    const mime = file.mimetype || "";
    if (mime.startsWith("image/") || IMAGE_EXT.test(file.originalname || "")) {
        cb(null, true);
    } else {
        cb(new Error("Only image files are allowed!"), false);
    }
};
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 25 * 1024 * 1024
    },
    fileFilter
 });


router.post("/post", upload.single('image'), listingController.createListing);
router.get("/get", listingController.getAllListings);
router.get("/get-my-listings", listingController.getMyListings);
router.get("/get/:id", listingController.getListing);
router.put("/update/:id", upload.single('image'), listingController.updateListing);
router.delete("/remove/:id", listingController.removeListing);

module.exports = router;
