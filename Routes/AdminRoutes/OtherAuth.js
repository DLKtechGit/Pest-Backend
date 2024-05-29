const express = require("express");
const router = express.Router();
const Auth = require("../../Models/AdminSchema/CompanySchema");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");

// Create a Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: "pestcontrol633@gmail.com",
    pass: "acof axql bhdv yats",
  },
});

// Generate a JWT token with the customer's email
const generateToken = (email) => {
  return jwt.sign({ email }, "your-secret-key", { expiresIn: "1h" });
  
};

// API endpoint to send reset link to customer's email
router.post("/forgotpasswordLink", async (req, res) => {
  const { email } = req.body;

  try {
    // Check if the customer exists
    const customer = await Auth.findOne({  email,registered:'true',deleted:'false'  });
    if (!customer) {
      return res.status(404).json({ error: "User not found" });
    }

    // Generate a reset token
    const token = generateToken(email);

    // Compose email message
    const mailOptions = {
      from: "dlktechnologiesreact@gmail.com",
      to: email,
      subject: "Password Reset",
      html: `<p>You are receiving this email because you (or someone else) has requested a password reset.</p>
               <p>Click <a href="http://localhost:3003/reset-password">here</a> to reset your password. ${email}</p>`,
    };

    // Send email
    await transporter.sendMail(mailOptions);
    console.log("Reset email sent successfully.");

    // Send response to client
    res.status(200).json({ message: "Reset email sent successfully." });
  } catch (error) {
    console.error("Error sending reset email:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/reset-password", async (req, res) => {
  const {email, newPassword, confirmpassword } = req.body;

  try {
    const user = await Auth.findOne({ email});
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.password = newPassword;
    user.confirmpassword = confirmpassword;
    await user.save();

    // Send response to client
    res.status(200).json({ message: "Password reset successfully." });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const { id } = req.params;
    const existingAdmin = await Auth.findOneAndUpdate(
      { email },
      { $set: { password,  registered: true } }
    );

    res.status(200).json({ message: "Customer registered successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server Error" });
  }
});

router.get("/GetregisteredCustomers", async (req, res) => {
  // console.log("res==============>",req);
  try {
    const RegisteredCustomers = await Auth.find({
      registered: true,
      role: "Customer",
      deleted: false,
    });
    // console.log("RegisteredCustomers", RegisteredCustomers);
    if (RegisteredCustomers?.length > 0) {
      res.status(200).json({
        success: true,
        message: "All Registered Companies fetched Successfully",
        data: RegisteredCustomers,
      });
    } else {
      res.status(404).json({
        success: false,
        message: "No Registered companies found",
      });
    }
  } catch (error) {
    console.error("Error fetching Registered companies:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

router.post("/resetPassword", async (req, res) => {
  let { email, password, confirmpassword } = req.body;

  if (!email || !password || !confirmpassword) {
    return res
      .status(400)
      .json({ message: "Email or password or confirmPassword missing" });
  }

  if (password !== confirmpassword) {
    return res
      .status(400)
      .json({ message: "Password and confirmPassword do not match" });
  }

  try {
    // Find the user by email
    let user = await Auth.findOne({ email, role: "Customer" });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.password = password;
    user.modified_date = new Date();

    // Save the updated user
    await user.save();

    return res.status(200).json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ message: "Password changing failed" });
  }
});

// technician
router.post("/login", async (req, res) => {
  let { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Email and password are required." });
  }

  try {
    let result = await Auth.findOne({ email: email,deleted:false });
    if (!result) {
      return res.status(400).json({ message: "Technician not found." });
    }

    if (password !== result.password) {
      return res.status(400).json({ message: "Incorrect password." });
    }

    // Assuming role is stored in the result
    res.status(200).json({ status: 200, result: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error." });
  }
});

router.get("/getregisteredTechnician", async (req, res) => {
  try {
    const RegisteredCustomers = await Auth.find({
      registered: true,
      role: "Technician",
    });
    if (RegisteredCustomers?.length > 0) {
      res.status(200).json({
        success: true,
        message: "All Registered Technician fetched Successfully",
        data: RegisteredCustomers,
      });
    } else {
      res.status(404).json({
        success: false,
        message: "No Registered Technician found",
      });
    }
  } catch (error) {
    // console.error("Error fetching Registered Technician:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

router.post("/resetPassword/tech", async (req, res) => {
  let { email, password, confirmpassword } = req.body;

  if (!email || !password || !confirmpassword) {
    return res
      .status(400)
      .json({ message: "Email or password or confirmPassword missing" });
  }

  if (password !== confirmpassword) {
    return res
      .status(400)
      .json({ message: "Password and confirmPassword do not match" });
  }

  try {
    // Find the user by email
    let user = await Auth.findOne({ email, role: "Technician" });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.password = password;
    user.modified_date = new Date();

    // Save the updated user
    await user.save();

    return res.status(200).json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ message: "Password changing failed" });
  }
});


module.exports = router;
