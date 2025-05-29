const express = require("express");
const router = express.Router();
const listingController = require("../controllers/listingController");


router.post("/post", listingController.createListing);
router.get("/get", listingController.getListings);

module.exports = router;
