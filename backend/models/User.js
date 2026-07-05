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
    // Farms the user belongs to (empty = unassigned / "N/A"). Source of truth.
    // A user can belong to multiple farms.
    farms: [{ type: mongoose.Schema.Types.ObjectId, ref: "Farm" }],
    profilePicture: { type: String, default: "" },
    // Legacy fields kept for migration + backward compatibility. Superseded by `farm`.
    isSafeCities: { type: Boolean, default: false },
    farmName: { type: String, default: "" },
    timesReported: { type: Number, default: 0 },
    isRemoved: { type: Boolean, default: false },
    removedDate: { type: Date, default: null }, //(to be deleted after 30 days)
    resetPasswordToken: { type: String, default: "" },
    resetPasswordExpires: { type: Date, default: new Date() },
    // Hashes of the user's most recent previous passwords (newest first), so a
    // password change/reset can refuse reuse. Maintained by the pre-save hook.
    passwordHistory: { type: [String], default: [] }
});

// How many previous passwords are remembered (and blocked from reuse).
const PASSWORD_HISTORY_SIZE = 5;

/**
 * Ensure that the password saved is encrypted, and archive the outgoing hash
 * into passwordHistory so recent passwords can't be reused.
 */

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    if (!this.isNew) {
        const prev = await this.constructor
            .findById(this._id)
            .select("password");
        if (prev && prev.password) {
            this.passwordHistory = [
                prev.password,
                ...(this.passwordHistory || []),
            ].slice(0, PASSWORD_HISTORY_SIZE);
        }
    }
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

/**
 * Whether a candidate password matches the current password or any remembered
 * previous one. Used to block reuse on change/reset.
 */

userSchema.methods.isPreviousPassword = async function (candidatePassword) {
    if (await bcrypt.compare(candidatePassword, this.password)) return true;
    for (const oldHash of this.passwordHistory || []) {
        if (await bcrypt.compare(candidatePassword, oldHash)) return true;
    }
    return false;
};

module.exports = mongoose.model("User", userSchema);
