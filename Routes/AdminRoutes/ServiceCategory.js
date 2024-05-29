const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const ServiceCategory = require("../../Models/AdminSchema/ServiceCatoegoryModal");

router.post('/createServiceCategory', async (req, res) => {
    const { category, categoryType } = req.body;
    try {
        if (!category) {
            return res.status(400).json({ error: "Missing required data" });
        }

        const serviceCategory = await ServiceCategory.findOne({
            category: category,
        });

        if (serviceCategory) {
            return res
                .status(403)
                .json({
                    message: "Service already exists. Please choose another name.",
                });
        }

        const newServiceCategory = new ServiceCategory({
            category: category,
            categoryType: categoryType,
            created_date: new Date(),
        });
        //   console.log("new->", newService);
        const result = await newServiceCategory.save();

        if (result) {
            return res
                .status(200)
                .json({ message: "New service created successfully", data: result });
        }
    } catch (error) {
        console.error("Service creation failed:", error);
        return res.status(500).json({ error: "Server error" });
    }
}
);

router.get("/getCategory", async (req, res) => {
    var result = await ServiceCategory.find();
    // console.log("result====>", result);
    res.statusMessage = "Category fetched successfully...";
    res.status(200).json({
        Length: result.length,
        Results: result,
    });
});


router.post("/deleteCategory/:id", async (req, res) => {
    // console.log("req====>",req.params.id);
    if (!req.params.id) {
        res.statusMessage = "Some required missing...";
        return res.status(201).json({
            error: "Some required missing...",
        });
    }

    try {
        let result = await ServiceCategory.findOneAndDelete({ _id: req.params.id });
        if (result) {
            res.statusMessage = "Category deleted successfully...";
            res.status(200).json({
                Results: result,
            });
        }
    } catch (err) {
        res.statusMessage = "Category delete Failed...";
        res.status(400).json({});
    }
});

module.exports = router;
