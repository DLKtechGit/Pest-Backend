// const express = require("express");
// const router = express.Router();
// const multer = require("multer"); // For handling file uploads
// const ReportModel = require("../../Models/AdminSchema/Report");

// // Multer configuration for handling file uploads
// const storage = multer.memoryStorage(); // Storing files in memory
// const upload = multer({ storage: storage });

// // POST route to store report with PDF
// router.post("/upload", upload.single("pdf"), async (req, res) => {
//     try {
//         if (!req.file) {
//             return res.status(400).json({ message: "PDF file is required" });
//         }

//         const { customerName, serviceName } = req.body;

//         const newReport = new ReportModel({
//             customerName: customerName,
//             serviceName: serviceName,
//             pdf: {
//                 data: req.file.buffer,
//                 contentType: req.file.mimetype
//             }
//         });

//         const savedReport = await newReport.save();

//         res.status(201).json({
//             message: "Report with PDF uploaded successfully",
//             data: savedReport
//         });
//     } catch (error) {
//         console.error("Error uploading report:", error);
//         res.status(500).json({ message: "Internal server error" });
//     }
// });

// module.exports = router;
