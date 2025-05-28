const express = require("express");
const router = express.Router();
const listingController = require("../controllers/listingController");
const { model } = require("mongoose");

router.post("/post", listingController.createListing);

module.exports = router;
