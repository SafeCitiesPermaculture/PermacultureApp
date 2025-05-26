const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

/**
 * Model for storing user account data
 * Add data associated with users to the scheme
 */

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    isVerified: { type: Boolean, default: false },
    userRole: { type: String, enum: ["user", "admin"], default: "user" }, //allows for more roles to be added easily
    isSafeCities: { type: String, default: false },
    profilePicture: { type: String, default: "" },
    farmName: { type: String, default: "" },
    isReported: { type: Boolean, default: false },
    isRemoved: { type: Boolean, default: false },
    removedDate: { type: Date, default: null }, //(to be deleted after 30 days)
});

/**
 * Ensure that the password saved is encrypted
 */

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

/**
 * Add a function to comapre a plain text password to the encrypted password
 */

userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
