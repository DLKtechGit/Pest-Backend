const express = require('express');
const router = express.Router();
const createChemicals = require("../../Models/AdminSchema/CreateChemicalsSchema")

router.post('/createChemicals', async (req, res) => {

    let { chemicalsName } = req.body

    if (!chemicalsName ) {
        res.statusMessage = "Missing some required Data....."
        return res.status(201).json()
    }

    try {
        let CheckchemicalsName = await createChemicals.findOne({ chemicalsName: chemicalsName })
        if (CheckchemicalsName) {          
            res.status(403).json({ message: "Chemicals Already Found... Try another Name" })
        } else {
            const newChemicals = new createChemicals({
                chemicalsName: chemicalsName,
                created_date: new Date,
            })
            let result = await newChemicals.save()

            if (result) {
                res.statusMessage = "New Chemicals created Successfully..."
                res.status(200).json({
                    data: result
                })
            }
        }
    }
    catch (err) {
        console.log("err",err);
        res.statusMessage = "Chemicals creation Failed..."
        res.status(400).json({
        })
    }
})

router.get('/getChemicals', async (req, res) => {
    var result = await createChemicals.find()
    // console.log("result====>", result);
    res.statusMessage = "Chemicals fetched successfully..."
    res.status(200).json({
        Length: result.length,
        Results: result
    })
})

router.post('/deleteChemicals/:id', async (req, res) => {
    // console.log("req====>",req.params.id);
    if (!req.params.id) {
        res.statusMessage = "Some required missing..."
        return res.status(201).json({
            error: 'Some required missing...'
        })
    }

    try {
        let result = await createChemicals.findOneAndDelete({ _id: req.params.id })
        if (result) {
            res.statusMessage = "Chemicals deleted successfully..."
            res.status(200).json({
                Results: result
            })
        }
    }

    catch (err) {
        res.statusMessage = "Chemicals delete Failed..."
        res.status(400).json({
        })
    }
})

module.exports = router;