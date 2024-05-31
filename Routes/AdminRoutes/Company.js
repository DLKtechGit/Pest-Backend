const express = require("express");
const router = express.Router();
const Company = require("../../Models/AdminSchema/CompanySchema");
const DeletedCustomer = require("../../Models/AdminSchema/DeletedCustomer");
const { route } = require("./CreateService");

router.post("/createCompany", async (req, res) => {
  const { name, address, email, country, state, city, phoneNumber } = req.body;

  if (!name || !address || !email || !country || !state || !city || !phoneNumber) {
    res.statusMessage = "Missing some required data.";
    return res.status(400).json({ message: "Missing some required data." });
  }

  try {

    let existingCompany = await Company.findOne({ email: email });
    if (existingCompany) {
      return res.status(409).json({ message: "Company email already found. Try another email." });
    }

    const newCompany = new Company({
      name: name,
      address: address,
      email: email,
      country: country,
      state: state,
      city: city,
      phoneNumber: phoneNumber,
      role: "Customer",
      created_date: new Date(),
    });

    let result = await newCompany.save();

    res.status(201).json({
      message: "Customer created successfully.",
      data: result,
    });

  } catch (err) {
    console.error("Error creating company:", err);
    res.statusMessage = "Service creation failed.";
    res.status(500).json({ message: "Service creation failed. Please try again later." });
  }
});

router.post("/editCompany/:id", async (req, res) => {
  const companyId = req.params.id;
  const { name, address, email, country, state, city, phoneNumber } = req.body;

  try {
    let company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    if (name) {
      company.name = name;
    }
    if (address) {
      company.address = address;
    }
    if (email) {
      company.email = email;
    }
    if (country) {
      company.country = country;
    }
    if (state) {
      company.state = state;
    }
    if (city) {
      company.city = city;
    }
    if (phoneNumber) {
      company.phoneNumber = phoneNumber;
    }

    // Save the updated company
    await company.save();

    return res.status(200).json({ message: 'Company details updated successfully', company });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});


router.get("/getCompany", async (req, res) => {
  var result = await Company.find({role:"Customer",deleted:false});
  // console.log("result====>", result);
  res.statusMessage = "Company Data fetched successfully...";
  res.status(200).json({
    Length: result.length,
    Results: result,
  });
});

router.get("/getCompany/:id", async (req, res) => {
  try {
    const companyId = req.params.id; // Use req.params.id to extract the company ID
    const result = await Company.findOne({ _id: companyId, role: "Customer", deleted: false });
    
    if (!result) {
      return res.status(404).json({ message: "Company not found" });
    }

    res.status(200).json({
      Result: result,
    });
  } catch (error) {
    console.error("Error fetching company:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/getmoreCompany", async (req, res) => {
  try {
    const companyIds = req.query.ids; // Retrieve the IDs from query parameters
    const idsArray = companyIds.split(","); // Split the IDs into an array
    
    const results = await Company.find({ _id: { $in: idsArray }, role: "Customer", deleted: false });
    
    if (!results || results.length === 0) {
      return res.status(404).json({ message: "Companies not found" });
    }

    res.status(200).json({
      Results: results,
    });
  } catch (error) {
    console.error("Error fetching companies:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});



router.post("/customerdelete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const company = await Company.findById(id);

    if (!company) {
      return res.status(404).json({ error: "Company not found." });
    }

    company.deleted = !company.deleted; // Toggle the deleted field
    await company.save();

    res.status(200).json({ message: `Company ${company.deleted ? 'marked as deleted' : 'restored'} successfully.` });
  } catch (error) {
    console.error("Error deleting company:", error);
    res.status(500).json({ error: "Server error" });
  }
});


router.get("/getall/deletedcompany", async (req, res) => {
  try {
    const DeletedCustomers = await Company.find({ deleted: true,role: "Customer"}); // Filter only deleted companies
    if (DeletedCustomers?.length > 0) {
      res.status(200).json({
        success: true,
        message: 'All deleted Companies fetched Successfully',
        data: DeletedCustomers
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'No deleted companies found'
      });
    }
  } catch (error) {
    console.error("Error fetching deleted companies:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

router.post("/deletedcompany/restore/:id", async (req, res) => {
  const _id = req.params.id;
  try {
    const restoredCompany = await Company.findByIdAndUpdate(_id, { deleted: false }, { new: true });
    if (restoredCompany) {
      res.status(200).json({ message: "Company restored successfully." });
    } else {
      res.status(404).json({ error: "Deleted company not found." });
    }
  } catch (error) {
    console.error("Error restoring company:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


router.get('/totalcompany', async (req, res) => {
  try {
    const totalCustomers = await Company.countDocuments({role:"Customer", deleted:false});
    res.json({ totalCustomers });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/totalTechnician', async (req, res) => {
  try {
    const totalCustomers = await Company.countDocuments({role:"Technician",deleted:false});
    res.json({ totalCustomers });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

