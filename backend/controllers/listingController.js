const Listing = require("../models/Listing");
const {
    uploadBufferToCloudinary,
    deleteFromCloudinary,
    publicIdFromUrl,
} = require("../utils/cloudinaryUpload");

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

        // A photo is required for every new listing.
        if (!req.file) {
            return res.status(400).json({ message: "A photo is required." });
        }

        let imageUrl = "";
        try {
            const result = await uploadBufferToCloudinary(req.file, "marketplace");
            imageUrl = result.url;
        } catch (uploadError) {
            console.error("Error uploading listing image:", uploadError.message);
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
                // Archived ("deleted") listings never show in the marketplace.
                $match: { isArchived: { $ne: true } }
            },
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
        const listings = await Listing.find({ postedBy: req.user._id, isArchived: { $ne: true } }).sort({ createdAt: -1 }).populate({
            path: 'postedBy', select: 'username profilePicture'
        });
        res.status(200).json({
            message: 'Listings retrieved successfully.',
            listings: listings
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch my listings.",
            error: error.message
        });
    }
};

// The user's archived (soft-deleted) listings, so they can restore or
// permanently delete them.
const getArchivedListings = async (req, res) => {
    if (!req.user.isVerified) {
        return res
            .status(401)
            .json({ message: "Unauthorized: User not authenticated." });
    }

    try {
        const listings = await Listing.find({ postedBy: req.user._id, isArchived: true }).sort({ updatedAt: -1 }).populate({
            path: 'postedBy', select: 'username profilePicture'
        });
        res.status(200).json({
            message: 'Archived listings retrieved successfully.',
            listings: listings
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch archived listings.",
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

        // Soft delete: archive the listing (photo included) so the owner can
        // restore it later from the Archived tab.
        listing.isArchived = true;
        await listing.save();
        res.status(200).json({ message: "Listing archived." });
    } catch (error) {
        console.error("Error in removeListing: ", error);
        res.status(500).json({
            message: "Failed to delete listing.",
            error: error.message
        });
    }
};

// Bring an archived listing back to the marketplace.
const restoreListing = async (req, res) => {
    try {
        if (!req.user.isVerified) {
            return res.status(401).json({ message: "Unauthorized: User not authenticated." });
        }

        const listing = await Listing.findById(req.params.id);
        if (!listing) {
            return res.status(404).json({ message: "Listing not found." });
        }
        if (listing.postedBy.toString() != req.user._id.toString() && req.user.userRole !== 'admin') {
            return res.status(403).json({ message: "You cannot restore this listing." });
        }

        listing.isArchived = false;
        await listing.save();
        res.status(200).json({ message: "Listing restored.", listing });
    } catch (error) {
        console.error("Error in restoreListing: ", error);
        res.status(500).json({
            message: "Failed to restore listing.",
            error: error.message
        });
    }
};

// Permanently delete a listing (and its Cloudinary image). Used from the
// Archived tab; there is no undo.
const destroyListing = async (req, res) => {
    try {
        if (!req.user.isVerified) {
            return res.status(401).json({ message: "Unauthorized: User not authenticated." });
        }

        const listing = await Listing.findById(req.params.id);
        if (!listing) {
            return res.status(404).json({ message: "Listing not found." });
        }
        if (listing.postedBy.toString() != req.user._id.toString() && req.user.userRole !== 'admin') {
            return res.status(403).json({ message: "You cannot delete this listing." });
        }

        // Delete the listing image from Cloudinary (legacy Drive images are just
        // left in place — the Drive client was removed from this controller).
        const publicId = publicIdFromUrl(listing.picture);
        if (publicId) {
            await deleteFromCloudinary(publicId);
        }

        await Listing.findByIdAndDelete(listing._id);
        res.status(200).json({ message: "Listing permanently deleted." });
    } catch (error) {
        console.error("Error in destroyListing: ", error);
        res.status(500).json({
            message: "Failed to delete listing.",
            error: error.message
        });
    }
};

const updateListing = async (req, res) => {
    try {
        if (!req.user.isVerified) {
            return res.status(401).json({ message: "Unauthorized: User not authenticated." });
        }

        const { id } = req.params;
        const listing = await Listing.findById(id);
        if (!listing) {
            return res.status(404).json({ message: "Listing not found." });
        }

        // Only the owner or an admin may edit.
        if (listing.postedBy.toString() !== req.user._id.toString() && req.user.userRole !== "admin") {
            return res.status(403).json({ message: "You cannot edit this listing." });
        }

        const { title, price, location, description } = req.body;

        if (title !== undefined) {
            if (!title.trim()) {
                return res.status(400).json({ message: "Title must be a non-empty string." });
            }
            listing.title = title.trim();
        }
        if (location !== undefined) {
            if (!location.trim()) {
                return res.status(400).json({ message: "Location must be a non-empty string." });
            }
            listing.location = location.trim();
        }
        if (price !== undefined) {
            if (isNaN(price) || price < 0) {
                return res.status(400).json({ message: "Price must be a non-negative number." });
            }
            listing.price = price;
        }
        if (description !== undefined) {
            listing.description = description ? description.trim() : "";
        }

        // Optional new image: upload the new one and remove the old from Cloudinary.
        if (req.file) {
            try {
                const result = await uploadBufferToCloudinary(req.file, "marketplace");
                const oldPublicId = publicIdFromUrl(listing.picture);
                listing.picture = result.url;
                if (oldPublicId) await deleteFromCloudinary(oldPublicId);
            } catch (uploadError) {
                console.error("Error uploading listing image:", uploadError.message);
                return res.status(500).json({ message: "Failed to upload image.", error: uploadError.message });
            }
        }

        const saved = await listing.save();
        return res.status(200).json({ message: "Listing updated.", listing: saved });
    } catch (error) {
        if (error.name === "ValidationError") {
            const errors = Object.values(error.errors).map((e) => e.message);
            return res.status(400).json({ message: "Validation failed", errors });
        }
        console.error("Error in updateListing: ", error);
        return res.status(500).json({ message: "Failed to update listing.", error: error.message });
    }
};

module.exports = { createListing, getAllListings, getMyListings, getArchivedListings, removeListing, restoreListing, destroyListing, getListing, updateListing };
