const Report = require("../models/Report");
const User = require("../models/User");
const transporter = require("../utils/transporter");
require("dotenv").config();

const makeReport = async (req, res) => {
    try {
        if (!req.user.isVerified) {
            return res.status(401).json({ message: "Unauthorized: User must be logged in to submit a report." });
        }
        
        if (req.user.timesReported >= 3 || req.user.isRemoved) {
            return res.status(401).json({ message: "Unauthorized: Reported/Removed users cannot report users." });
        }

        const { reported, reportedBy, description } = req.body;

        if (!reported) {
            return res.status(400).json({ message: "Reported id is required." });
        }

        if (!reportedBy) {
            return res.status(400).json({ message: "Id of reporter is required." });
        }

        if(reported.toString() == reportedBy.toString()) {
            return res.status(409).json({ message: "User cannot report themself" });
        }

        if(!description.trim()) {
            return res.status(400).json({ message: "Description is required." });
        }
        
        const reportedUser = await User.findById(reported);

        if (!reportedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        // Prevent the same person reporting someone multiple times
        const existingReport = await Report.findOne({ reported, reportedBy });
        
        if (existingReport) {
            return res.status(409).json({ message: "You have already reported this user" });
        }

        reportedUser.timesReported++;

        const newReport = Report({
            reported,
            reportedBy,
            description: description.trim()
        });
        
        await reportedUser.save();
        const savedReport = await newReport.save();

        try {
            const numReports = reportedUser.timesReported;
            const message = numReports >= 3 ? ` meaning you have lost permissions for the following:</p>
            <ul>
                <li>Posting listings</li>
                <li>Sending chats</li>
                <li>Reporting other users</li>
            </ul>` : `. You may continue to use your account as usual until you reach 3 reports</p>`;
            await transporter.sendMail({
                from: `"AFC Estate App" <${process.env.EMAIL_USERNAME}>`,
                to: reportedUser.email,
                subject: "AFC Estate Account Status",
                html: `
                <p>Hello,</p>
                <p>There have been changes to your AFC Estate Account</p>
                <p>Your account has been <strong>reported</strong>.</p>
                <p>Your accout now has ${numReports} active reports on it${message}
                <p>Contact us at safecitiespermaculture@gmail.com if you have any questions or concerns</p>
                <p>Thank you,</p>
                <p>Safe Cities Team</p>`
            });
        } catch (emailError) {
            console.log("Failed to send verification email");
        }

        res.status(201).json({
            message: "Successfully reported.",
            report: savedReport
        });
    } catch (error) {
        console.error("Error creating report:", error);
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

        const reports = await Report.find().sort({ createdAt: 1 }).populate([
            { path: 'reported', select: 'username' }, 
            { path: 'reportedBy', select: 'username' }
        ]);
        
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
        const report = await Report.findById(reportId).populate([
            { path: 'reported', select: 'username' },
            { path: 'reportedBy', select: 'username' }
        ]);

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
        const report = await Report.findByIdAndDelete(reportId);

        if (!report) {
            return res.status(404).json({ message: "Report not found" });
        }

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

        const id = req.params.id;
        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({ message: "Reported user not found" });
        }

        user.timesReported--;
        await user.save();

        res.status(200).json({ message: "Report dismissed" });
    } catch (error) {
        console.error("Error in dismissReport:", error);
        res.status(500).json({ message: "Error dismissing report", error: error.message});
    }
};

module.exports = { makeReport, getAllReports, getReport, deleteReport, dismissReport };