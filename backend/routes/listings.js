const express = require("express");
const router = express.Router();
const listingController = require("../controllers/listingController");


router.post("/post", listingController.createListing);
router.get("/get", listingController.getAllListings);
router.get("/get-my-listings", listingController.getMyListings);
router.get("/get/:id", listingController.getListing);
router.delete("/remove/:id", listingController.removeListing);

module.exports = router;
