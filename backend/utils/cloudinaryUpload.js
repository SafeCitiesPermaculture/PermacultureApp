const cloudinary = require("cloudinary").v2;
require("dotenv").config();

/**
 * Cloudinary image storage.
 *
 * Replaces the Google Drive service-account approach for completion photos.
 * Service accounts have no Drive storage quota, so Drive uploads 403; Cloudinary
 * gives a real (free-tier) image host with a CDN.
 */

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

const isConfigured = () =>
    Boolean(
        process.env.CLOUDINARY_CLOUD_NAME &&
            process.env.CLOUDINARY_API_KEY &&
            process.env.CLOUDINARY_API_SECRET
    );

/**
 * Upload an in-memory file buffer (multer memoryStorage) to Cloudinary.
 * @param {object} file - req.file from multer ({ buffer, originalname, mimetype })
 * @param {string} folder - Cloudinary folder to organise uploads
 * @returns {Promise<{url: string, publicId: string}>}
 */
const uploadBufferToCloudinary = (file, folder = "permaculture") =>
    new Promise((resolve, reject) => {
        if (!isConfigured()) {
            return reject(new Error("Cloudinary is not configured (missing env vars)"));
        }
        const stream = cloudinary.uploader.upload_stream(
            { folder, resource_type: "image" },
            (error, result) => {
                if (error) return reject(error);
                resolve({ url: result.secure_url, publicId: result.public_id });
            }
        );
        stream.end(file.buffer);
    });

/**
 * Delete an image from Cloudinary by its public_id. Best-effort.
 * @param {string} publicId
 */
const deleteFromCloudinary = async (publicId) => {
    if (!publicId || !isConfigured()) return;
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (err) {
        console.error("Failed to delete Cloudinary image:", err.message);
    }
};

/**
 * Extract the Cloudinary public_id from a delivery URL, so older records that
 * only store the URL (not the id) can still be deleted.
 * e.g. https://res.cloudinary.com/x/image/upload/v123/profile-pics/abc.jpg
 *      -> "profile-pics/abc"
 * Returns null for non-Cloudinary URLs.
 */
const publicIdFromUrl = (url) => {
    if (!url || !url.includes("res.cloudinary.com")) return null;
    const afterUpload = url.split("/upload/")[1];
    if (!afterUpload) return null;
    // Drop a leading version segment (v1234567890/)
    const withoutVersion = afterUpload.replace(/^v\d+\//, "");
    // Drop the file extension
    return withoutVersion.replace(/\.[^/.]+$/, "");
};

module.exports = {
    uploadBufferToCloudinary,
    deleteFromCloudinary,
    isConfigured,
    publicIdFromUrl,
};
