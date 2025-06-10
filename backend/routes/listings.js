const express = require("express");
const router = express.Router();
const listingController = require("../controllers/listingController");
const multer = require("multer");

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
        cb(null, true);
    } else {
        cb(new Error("Only image files are allowed!"), false);
    }
};
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter
 });


router.post("/post", upload.single('image'), listingController.createListing);
router.get("/get", listingController.getAllListings);
router.get("/get-my-listings", listingController.getMyListings);
router.get("/get/:id", listingController.getListing);
router.delete("/remove/:id", listingController.removeListing);

module.exports = router;
