const Farm = require("../models/Farm");
const User = require("../models/User");

// List farms. Authenticated users see active farms (for self-selection);
// admins can pass ?all=true to include inactive ones for management.
const getFarms = async (req, res) => {
    try {
        const filter = {};
        const includeInactive = req.query.all === "true" && req.user.userRole === "admin";
        if (!includeInactive) {
            filter.isActive = true;
        }
        const farms = await Farm.find(filter).sort({ name: 1 });
        return res.status(200).json({ message: "Farms retrieved", farms });
    } catch (err) {
        return res.status(500).json({ message: "Server error while fetching farms" });
    }
};

// Admin: create a farm.
const createFarm = async (req, res) => {
    try {
        const name = (req.body.name || "").trim();
        if (!name) {
            return res.status(400).json({ message: "Farm name is required" });
        }

        const existing = await Farm.findOne({ name: new RegExp(`^${name}$`, "i") });
        if (existing) {
            return res.status(409).json({ message: "A farm with that name already exists" });
        }

        const farm = await Farm.create({ name });
        return res.status(201).json({ message: "Farm created", farm });
    } catch (err) {
        return res.status(500).json({ message: "Server error while creating farm" });
    }
};

// Admin: rename a farm or toggle its active state.
const updateFarm = async (req, res) => {
    try {
        const { id } = req.params;
        const update = {};
        if (typeof req.body.name === "string" && req.body.name.trim()) {
            update.name = req.body.name.trim();
        }
        if (typeof req.body.isActive === "boolean") {
            update.isActive = req.body.isActive;
        }

        if (update.name) {
            const clash = await Farm.findOne({
                _id: { $ne: id },
                name: new RegExp(`^${update.name}$`, "i"),
            });
            if (clash) {
                return res.status(409).json({ message: "A farm with that name already exists" });
            }
        }

        const farm = await Farm.findByIdAndUpdate(id, update, {
            new: true,
            runValidators: true,
        });
        if (!farm) {
            return res.status(404).json({ message: "Farm not found" });
        }
        return res.status(200).json({ message: "Farm updated", farm });
    } catch (err) {
        return res.status(500).json({ message: "Server error while updating farm" });
    }
};

// Admin: delete a farm. Any users assigned to it are unassigned first so we
// never leave dangling references.
const deleteFarm = async (req, res) => {
    try {
        const { id } = req.params;
        const farm = await Farm.findById(id);
        if (!farm) {
            return res.status(404).json({ message: "Farm not found" });
        }

        await User.updateMany({ farms: id }, { $pull: { farms: id } });
        await Farm.findByIdAndDelete(id);
        return res.status(200).json({ message: "Farm deleted" });
    } catch (err) {
        return res.status(500).json({ message: "Server error while deleting farm" });
    }
};

module.exports = { getFarms, createFarm, updateFarm, deleteFarm };
