const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const createServices = require("../../Models/AdminSchema/CreateServiceModal");

const DIR = "./uploads/";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, DIR);
  },
  filename: (req, file, cb) => {
    const fileName = file.originalname.toLowerCase().split(" ").join("-");
    cb(null, fileName);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === "image/png" ||
      file.mimetype === "image/jpg" ||
      file.mimetype === "image/jpeg"
    ) {
      cb(null, true);
    } else {
      cb(null, false);
      return cb(new Error("Only .png, .jpg, and .jpeg format allowed!"));
    }
  },
});

router.post("/createService", upload.single("serviceImage"), async (req, res) => {
  const { serviceName, mainCategory, subCategory } = req.body;
  // const serviceImage = req.file;

  try {
    if (!serviceName || !mainCategory) {
      return res.status(400).json({ error: "Missing required data" });
    }

    let existingService = await createServices.findOne({ mainCategory });

    if (!existingService) {
      const newServiceData = {
        serviceName: serviceName.split(','),
        mainCategory: mainCategory,
        // serviceImage: serviceImage.filename,
        created_date: new Date(),
      };

      if (subCategory) {
        newServiceData.subCategories = [subCategory];
      }

      const newService = new createServices(newServiceData);
      const result = await newService.save();
      return res.status(200).json({ message: "New service created successfully", data: result });
    }

    if (subCategory) {
      if (!existingService.subCategories.includes(subCategory)) {
        existingService.subCategories.push(subCategory);
      } else {
        return res.status(400).json({ error: "Subcategory already exists" });
      }
    }
    existingService.serviceName = existingService.serviceName.concat(serviceName.split(','));
    // existingService.serviceImage = serviceImage.filename;
    existingService.created_date = new Date();

    // Save the updated service
    const updatedService = await existingService.save();
    return res.status(200).json({ message: "Service updated successfully", data: updatedService });
  } catch (error) {
    console.error("Service creation/update failed:", error);
    return res.status(500).json({ error: "Server error" });
  }
});




router.get("/getServices", async (req, res) => {
  var result = await createServices.find();
  // console.log("result====>", result);
  res.statusMessage = "BootSeat fetched successfully...";
  res.status(200).json({
    Length: result.length,
    Results: result,
  });
});

router.post("/deleteservices/:id", async (req, res) => {
  // console.log("req====>",req.params.id);
  if (!req.params.id) {
    res.statusMessage = "Some required missing...";
    return res.status(201).json({
      error: "Some required missing...",
    });
  }

  try {
    let result = await createServices.findOneAndDelete({ _id: req.params.id });
    if (result) {
      res.statusMessage = "Service deleted successfully...";
      res.status(200).json({
        Results: result,
      });
    }
  } catch (err) {
    res.statusMessage = "Service delete Failed...";
    res.status(400).json({});
  }
});

router.post("/getservice/byname", async (req, res) => {
  let { serviceName } = req.body; // Use req.body to access serviceNames as an array
  try {
    const services = await createServices.find({ serviceName: { $in: serviceName } }); 
    if (services.length > 0) {
      res.statusMessage = "Services fetched successfully";
      res.status(200).json({
        Results: services 
      });
    } else {
      res.status(400).json({
        message: "Services not found" 
      });
    }
  } catch (error) {
    return res.status(500).json({ error: "Server error" });
  }
});
module.exports = router;
