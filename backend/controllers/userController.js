const User = require("../models/User");
const {
    uploadBufferToCloudinary,
    deleteFromCloudinary,
    publicIdFromUrl,
} = require("../utils/cloudinaryUpload");
require("dotenv").config();

//set the profile picture for the user
const updateProfilePicture = async (req, res) => {
    try {
        //get uploaded data
        const { id } = req.params;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({ error: "Could not find user" });
        }

        //store old picture url for deletion
        const oldPictureUrl = user.profilePicture;

        //upload to Cloudinary
        let publicUrl;
        try {
            const result = await uploadBufferToCloudinary(file, "profile-pics");
            publicUrl = result.url;
        } catch (uploadError) {
            console.error("Profile picture upload failed:", uploadError.message);
            return res.status(500).json({ error: "Image upload failed", reason: uploadError.message });
        }

        //add to user
        user.profilePicture = publicUrl;
        await user.save();

        //attempt to delete old Cloudinary picture (legacy Drive images are left as-is)
        const oldPublicId = publicIdFromUrl(oldPictureUrl);
        if (oldPublicId) {
            await deleteFromCloudinary(oldPublicId);
        }

        res.status(200).json({ url: publicUrl });
    } catch (err) {
        res.status(500).json({ error: "Image upload failed" });
    }
};

const changePassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const id = req.user._id;

    try {
        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (!(await user.comparePassword(oldPassword))) {
            return res.status(401).json({ message: "Old password is incorrect" });
        }

        if (await user.isPreviousPassword(newPassword)) {
            return res.status(400).json({
                message:
                    "Your new password can't be one you've used before. Please choose a different password.",
            });
        }

        user.password = newPassword;
        await user.save();

        return res.status(200).json({ message: "Password reset successfully" });
    } catch (error) {
        return res.status(500);
    }
};


module.exports = { updateProfilePicture, changePassword };
