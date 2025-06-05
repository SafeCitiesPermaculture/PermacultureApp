const Report = require("../models/Report");
const User = require("../models/User");

const makeReport = async (req, res) => {
    try {
        if (!req.user.isVerified) {
            return res.status(401).json({ message: "Unauthorized: User must be logged in to submit a report." });
        }
        
        if (req.user.timesReported >= 3 || req.user.isRemoved) {
            return res.status(401).json({ message: "Unauthorized: Reported/Removed users cannot report users." });
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
        
        const reportedUser = await User.findOne({ username: reportedUsername });

        if (!reportedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        // Prevent the same person reporting someone multiple times
        const existingReport = await Report.findOne({ reportedUsername: reportedUsername, reportedByUsername: reportedByUsername });
        
        if (existingReport) {
            return res.status(409).json({ message: "You have already reported this user" });
        }

        reportedUser.timesReported++;

        const newReport = Report({
            reportedUsername: reportedUsername.trim(),
            reportedByUsername: reportedByUsername.trim(),
            description: description.trim()
        });
        
        await reportedUser.save();
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
        if (req.user?.userRole !== 'admin') {
            return res.status(401).json({ message: "Unauthorized: Only admins are permitted to see reports" });
        }

        const reports = await Report.find().sort({ createdAt: 1 });
        res.status(200).json({ message: "Reports fetched successfully.", reports: reports });
    } catch (error) {
        console.error("Error in getAllReports:", error);
        res.status(500).json({ message: "Error retrieving listings", error: error.message });
    }
};

const getReport = async (req, res) => {
    try {
        if (req.user?.userRole !== 'admin') {
            return res.status(401).json({ message: "Unauthorized: Only admins are permitted to see reports" });
        }

        const reportId = req.params.reportId;
        const report = await Report.findById(reportId);

        if (!report) {
            return res.status(404).json({ message: "Report not found"});
        }

        res.status(200).json({ message: "Report retrieved successfully", report: report });
    } catch (error) {
        console.error("Error in getReport:", error);
        res.status(500).json({ error: error.message, message: "Error retrieving report"});
    }
};

const deleteReport = async (req, res) => {
    try {
        if (req.user?.userRole !== 'admin') {
            return res.status(401).json({ message: "Unauthorized: Only admins are permitted to handle reports" });
        }

        const reportId = req.params.reportId;
        const report = await Report.findById(reportId);

        if (!report) {
            return res.status(404).json({ message: "Report not found" });
        }

        await Report.findByIdAndDelete(reportId);
        return res.status(200).json({ message: "Report deleted" });
    } catch (error) {
        console.error("Error in deleteReport:", error);
        res.status(500).json({ message: "Error removing report", error: error.message });
    }
};

const dismissReport = async (req, res) => {
    try {
        if (req.user.userRole !== 'admin') {
            return res.status(401).json({ message: "Unauthorized: Only admins can dismiss reports" });
        }

        const username = req.params.username;
        const user = await User.findOne({ username: username });

        user.timesReported--;
        await user.save();

        res.status(200).json({ message: "Report dismissed" });
    } catch (error) {
        console.error("Error in dismissReport:", error);
        res.status(500).json({ message: "Error dismissing report", error: error.message});
    }
};

module.exports = { makeReport, getAllReports, getReport, deleteReport, dismissReport };