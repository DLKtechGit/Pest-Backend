const express = require('express');
const router = express.Router();
const Customer = require("../../Models/AdminSchema/CompanySchema");
const Task = require("../../Models/AdminSchema/TaskSchema");
const Issue = require("../../Models/AdminSchema/IssuesSchema");

router.post('/issues', async (req, res) => {
    try {
        const { technicianId, issueDetails } = req.body;
        // console.log("Issue Details received:", issueDetails); // Log issueDetails
        
        const task = await Task.findOne({
            "technicians.technicianId": technicianId,
        });

        const technicianDetails = await Customer.findById(technicianId);

        if (!task) {
            return res.status(404).json({ error: 'Technician not found for the given ID' });
        }
       
        if (!technicianDetails) {
            return res.status(404).json({ error: 'Technician details not found' });
        }

        const { description, priority } = issueDetails;

        const newIssue = new Issue({
            technicianId,
            technicianDetails,
            issueDetails: {
                description, 
                priority: priority || 'Open'
            },            
        });
        await newIssue.save();

        res.status(200).json({ message: 'Issue created and stored successfully' });
    } catch (error) {
        console.error("Error creating and storing issue:", error);
        res.status(500).json({ error: "Server error" });
    }
});

router.post('/update-priority', async (req, res) => {
    try {
        const { technicianId, issueId, priority } = req.body;

        // Find the issue by ID and technician ID
        const issue = await Issue.findOne({
            _id: issueId,
            technicianId: technicianId
        });

        if (!issue) {
            return res.status(404).json({ error: 'Issue not found for the given technician ID' });
        }

        // Update the priority of the issue
        issue.issueDetails.priority = priority;

        // Save the updated issue
        await issue.save();

        res.status(200).json({ message: 'Issue priority updated successfully' });
    } catch (error) {
        console.error("Error updating issue priority:", error);
        res.status(500).json({ error: "Server error" });
    }
});


router.get('/getIssues', async (req, res) => {
    try {
        const issues = await Issue.find();
        res.status(200).json(issues);
    } catch (error) {
        console.error("Error fetching issues:", error);
        res.status(500).json({ error: "Server error" });
    }
});


router.get('/getIssuesById/:technicianId', async (req, res) => {
    try {
        const technicianId = req.params.technicianId;

        const issues = await Issue.find({ technicianId });

        res.status(200).json(issues);
    } catch (error) {
        console.error("Error fetching issues:", error);
        res.status(500).json({ error: "Server error" });
    }
});


module.exports = router;
