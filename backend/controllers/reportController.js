const Report = require("../models/Report");

const makeReport = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized: User must be logged in to submit a report." });
        }
        
        

        const { reportedUsername, reportedByUsername, description } = req.body;

        if (!reportedUsername.trim()) {
            return res.status(400).json({ message: "Reported username is required." });
        }

        if (!reportedByUsername.trim()) {
            return res.status(400).json({ message: "Username of reporter is required." });
        }

        if(reportedUsername == reportedByUsername) {
            return res.status(401).json({ message: "User cannot report themself" });
        }

        if(!description.trim()) {
            return res.status(400).json({ message: "Description is required." });
        }

        const newReport = Report({
            reportedUsername: reportedUsername.trim(),
            reportedByUsername: reportedByUsername.trim(),
            description: description.trim()
        });

        const savedReport = await newReport.save();

        res.status(201).json({
            message: "Successfully reported.",
            report: savedReport
        });
    } catch (error) {
        console.error("Error creating report:", error);

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
            message: "Failed to create report.",
            error: error.message,
        });
    }
};

const getAllReports = async (req, res) => {
    try {
        if (req.user.userRole !== 'admin') {
            return res.status(401).json({ message: "Unauthorized: Only admins are permitted to see reports" });
        }

        const reports = await Report.find().sort({ createdAt: 1 });
        res.status(200).json({ message: "Reports fetched successfully.", reports: reports });
    } catch (error) {
        console.error("Error in getAllReports:", error);
        res.status(500).json({ message: "Error retrieving listings", error: error.message });
    }
};

module.exports = { makeReport, getAllReports };