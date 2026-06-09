/**
 * One-time migration: convert the legacy `farmName` string + `isSafeCities`
 * boolean into Farm documents and a `farm` reference on each user.
 *
 * Run once after deploying the Farm model:  node scripts/migrateFarms.js
 *
 * Idempotent: re-running will not create duplicate farms and will only set
 * `farm` on users that don't already have one.
 */
const mongoose = require("mongoose");
require("dotenv").config();

const User = require("../models/User");
const Farm = require("../models/Farm");

const SAFE_CITIES = "Safe Cities";

const findOrCreateFarm = async (name, cache) => {
    const trimmed = name.trim();
    if (!trimmed) return null;
    const key = trimmed.toLowerCase();
    if (cache[key]) return cache[key];

    let farm = await Farm.findOne({ name: new RegExp(`^${trimmed}$`, "i") });
    if (!farm) {
        farm = await Farm.create({ name: trimmed });
        console.log(`Created farm: ${trimmed}`);
    }
    cache[key] = farm;
    return farm;
};

const migrate = async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const cache = {};
    const users = await User.find({});
    let updated = 0;

    for (const user of users) {
        if (user.farms && user.farms.length) continue; // already migrated

        let farm = null;
        if (user.isSafeCities) {
            farm = await findOrCreateFarm(SAFE_CITIES, cache);
        } else if (user.farmName && user.farmName.trim()) {
            farm = await findOrCreateFarm(user.farmName, cache);
        }

        if (farm) {
            user.farms = [farm._id];
            await user.save();
            updated++;
            console.log(`Assigned ${user.username} -> ${farm.name}`);
        }
    }

    console.log(`Migration complete. Updated ${updated} user(s).`);
    await mongoose.disconnect();
};

migrate().catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
});
