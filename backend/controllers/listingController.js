const Listing = require("../models/Listing");
const { google } = require("googleapis");
const { Readable } = require("stream");
const path = require("path");

//set up google drive api
const auth = new google.auth.GoogleAuth({
    keyFile: path.join(
        __dirname,
        "../credentials/google_drive_credentials.json"
    ),
    scopes: ["https://www.googleapis.com/auth/drive"],
});
const drive = google.drive({ version: "v3", auth });

const uploadImageToDrive = async (file) => {
    const bufferStream = Readable.from(file.buffer);

    const response = await drive.files.create({
        requestBody: {
            name: file.originalname,
            mimeType: file.mimetype,
        },
        media: {
            mimeType: file.mimetype,
            body: bufferStream,
        },
        fields: "id",
    });

    const fileId = response.data.id;

    //make file public
    await drive.permissions.create({
        fileId,
        requestBody: {
            role: "reader",
            type: "anyone",
        },
    });

    //share with main safe cities gmail
    await drive.permissions.create({
        fileId,
        requestBody: {
            type: "user",
            role: "writer",
            emailAddress: "safecitiespermaculture@gmail.com",
        },
    });

    const publicUrl = `https://drive.google.com/uc?id=${fileId}`;
    return publicUrl;
};

const createListing = async (req, res) => {
    try {
        // Verify user
        if (!req.user.isVerified) {
            return res
                .status(401)
                .json({ message: "Unauthorized: User not authenticated" });
        }

        if (req.user.timesReported >= 3) {
            return res.status(401).json({ message: "Unauthorized: Reported users cannot make new listings" });
        }

        if (req.user.isRemoved) {
            return res.status(401).json({ message: "Unauthorized: Removed users cannot make new listings" });
        }

        const postedBy = req.user._id;

        // Validate listing data
        const { title, price, location, description } = req.body;

        if (!title) {
            return res.status(400).json({ message: "Title is required." });
        }

        if (title.trim().length === 0) {
            return res
                .status(400)
                .json({ message: "Title must be a non-empty string." });
        }

        if (!location.trim()) {
            return res.status(400).json({ message: "Location must be a non-empty string" });
        }

        if (!price) {
            return res.status(400).json({ message: "Price is required." });
        }

        if (isNaN(price) || price < 0) {
            return res
                .status(400)
                .json({ message: "Price must be a non-negative number." });
        }

        let imageUrl = "";
        try {
            imageUrl = await uploadImageToDrive(req.file);
        } catch (uploadError) {
            console.error("Error in uploadImageToDrive:", uploadError);
            return res.status(500).json({ message: "Failed to upload image.", error: uploadError.message });
        }

        const newListing = Listing({
            title: title.trim(),
            price,
            location: location.trim(),
            description: description ? description.trim() : "",
            postedBy,
            picture: imageUrl
        });

        const savedListing = await newListing.save();

        res.status(201).json({
            message: "Listing successfully posted.",
            listing: savedListing,
        });
    } catch (error) {
        console.error("Error in posting listing ", error);

        // Handle mongoose validation errors
        if (error.name === "ValidationError") {
            const errors = Object.values(error.errors).map(
                (err) => err.message
            );
            return res
                .status(400)
                .json({ message: "Validation failed", errors });
        }
        res.status(500).json({
            message: "Failed to create listing.",
            error: error.message,
        });
    }
};

const getAllListings = async (req, res) => {
    try{
        //const listings = await Listing.find().sort({ createdAt: -1 }).populate('postedBy', 'username');

        const listings = await Listing.aggregate([
            {
                $lookup: { // Find user from postedBy field
                    from: 'users',
                    localField: 'postedBy',
                    foreignField: '_id',
                    as: 'postedByUser'
                }
            },
            { // Flatten postedByUser array
                $unwind: '$postedByUser' 
            },
            {
                $match: { // Only select users with less than 3 active reports
                    'postedByUser.timesReported': { $lt: 3} 
                }
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $project: {
                    postedBy: {
                        _id: '$postedByUser._id',
                        username: '$postedByUser.username',
                        profilePicture: '$postedByUser.profilePicture'
                    },
                    title: 1,
                    price: 1,
                    location: 1,
                    description: 1,
                    createdAt: 1,
                    picture: 1
                }
            }
        ]);

        res.status(200).json({
            message: 'Listings retrieved successfully.',
            listings: listings
        });
    } catch (error) {
        console.error("Error in getListings: ", error);
        res.status(500).json({
            message: "Failed to fetch listings.",
            error: error.message
        });
    }
};

const getMyListings = async (req, res) => {
    // Verify user
    if (!req.user.isVerified) {
        return res
            .status(401)
            .json({ message: "Unauthorized: User not authenticated." });
    }

    try{
        const listings = await Listing.find({ postedBy: req.user._id }).sort({ createdAt: -1 }).populate({
            path: 'postedBy', select: 'username profilePicture'
        });
        res.status(200).json({
            message: 'Listings retrieved successfully.',
            listings: listings
        });
    } catch (error) {
        console.error("Error in getMyListings: ", error);
        res.status(500).json({
            message: "Failed to fetch my listings.",
            error: error.message
        });
    }
};

const getListing = async(req, res) => {
    try {
         // Validate user
         if (!req.user.isVerified){
            return res.status(401).json({ message: "Unauthorized: User not authenticated."});
        }

        // Get listing
        const id = req.params.id;
        const listing = await Listing.findById(id).populate([
            { path: 'postedBy', select: 'username profilePicture'}
        ]);
        if (!listing) {
            return res.status(404).json({ message: "Listing not found." });
        }

        res.status(200).json({ 
            message: "Listing retrieved successfully.", 
            listing: listing
        });
    } catch (error) {
        console.error("Error in getListing: ", error);
        res.status(500).json({
            message: "Failed to get listing.",
            error: error.message
        });
    }
};

const removeListing = async(req, res) => {
    try {
        // Validate user
        if (!req.user.isVerified){
            return res.status(401).json({ message: "Unauthorized: User not authenticated."});
        }
        
        const id = req.params.id;
        const listing = await Listing.findById(id);
        if (!listing) {
            return res.status(404).json({ message: "Listing not found." });
        }

        if (listing.postedBy.toString() != req.user._id.toString() && req.user.userRole !== 'admin') {
            return res.status(403).json({ message: "You cannot remove this listing." });
        }

        // Delete image from google drive
        if (listing.picture && listing.picture.includes("drive.google.com")) {
            const match = listing.picture.match(/id=([^&]+)/);
            const fileId = match ? match[0].substring(3) : null;

            if (fileId) {
                try {
                    await drive.files.delete({ fileId });
                } catch (driveError) {
                    console.error("Failed to delete image from drive:", driveError);
                }
            }
        }

        await Listing.findByIdAndDelete(id);
        res.status(200).json({ message:"Listing deleted." });
    } catch (error) {
        console.error("Error in removeListing: ", error);
        res.status(500).json({
            message: "Failed to delete listing.",
            error: error.message
        });
    }
};

module.exports = { createListing, getAllListings, getMyListings, removeListing, getListing };
