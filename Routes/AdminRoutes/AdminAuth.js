const express = require('express');
const router = express.Router();
const Admin = require('../../Models/AdminSchema/AdminAuthModal');
const nodemailer = require ('nodemailer')
const randomstring = require('randomstring')

const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: "pestcontrol633@gmail.com",
      pass: "acof axql bhdv yats",
    },
  });

  const ResetLink = 'http://localhost:3004'

  router.post("/forgot", async (req, res) => { 
    const { email } = req.body;
    try {
      const admin = await Admin.findOne({ email });
  
      if (!admin) {
        return res.status(400).json({ error: "Admin not found" });
      }
  
      const randomString = randomstring.generate({
        length: 10,
        charset: "alphanumeric",
      });
      console.log("randomString", randomString);
  
      const expirationTimestamp = Date.now() + 2 * 60 * 1000;
      console.log("expirationTimestamp", expirationTimestamp);
  
      const resetlink = `${ResetLink}/reset-password/${randomString}/${expirationTimestamp}`;
  
      const mailOptions = {
        from: "dlktechnologiesreact@gmail.com",
        to: email,
        subject: "Password Reset",
        html: `<p>You are receiving this email because you (or someone else) has requested a password reset.</p>
               <p>Click <a href="${resetlink}">here</a> to reset your password. ${email}</p>`,
      };
  
      await transporter.sendMail(mailOptions);
  
      admin.randomString = randomString;
      await admin.save();
  
      res.status(200).json({ message: "Reset email sent successfully." });
    } catch (error) {
      console.error("Error sending reset email:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  

  router.post("/reset/password/:randomString/:expirationTimestmpa", async (req, res) => {
    const { newPassword, confirmPassword } = req.body;
    try {
      const { randomString, expirationTimestamp } = req.params;
  
      const admin = await Admin.findOne({ randomString });
  
      if (!admin || admin.randomString !== randomString) {
        return res.status(400).json({
          message: "Invalid Random String",
        });
      }
  
      if (expirationTimestamp < Date.now()) {
        return res.status(400).json({
          message: "Reset link has expired. Please request a new reset link.",
        });
      }
  
      if (!newPassword || !confirmPassword) {
        return res.status(400).json({
          message: "New password and confirm password are required.",
        });
      }
  
      if (newPassword !== confirmPassword) {
        return res.status(401).json({
          message: "Password and Confirm password do not match",
        });
      }
  
      admin.password = newPassword;
      admin.randomString = null;
      await admin.save();
  
      res.status(200).json({
        message: "Password reset successful",
      });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ error: "Server Error" });
    }
  });
  


router.post('/register/superadmin', async (req, res) => {
    try {
        // Check if super admin already exists
        const existingSuperAdmin = await Admin.findOne({ role: 'superadmin' });
        if (existingSuperAdmin) {
            return res.status(400).json({ message: 'Super admin already exists' });
        }

        const { email, password } = req.body;
        // Create super admin
        const superAdmin = new Admin({ email, password, role: 'superadmin' });
        await superAdmin.save();

        res.status(200).json({ message: 'Super admin registered successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Admin registration
router.post('/registeradmin', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if an admin with the same email already exists
        const existingAdmin = await Admin.findOne({ email });

        if (existingAdmin) {
            return res.status(400).json({ message: 'An admin with this email already exists' });
        }

        // Check the number of existing admins
        const adminCount = await Admin.countDocuments({ role: 'admin' });

        if (adminCount >= 4) {
            return res.status(400).json({ message: 'Maximum admin limit reached' });
        }

        // Create a new admin
        const admin = new Admin({ email, password, role: 'childadmin' });
        let result = await admin.save();

        res.status(200).json({ message: 'Admin registered successfully', data: result });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server Error' });
    }
});


router.post('/login/admin', async (req, res) => {
    try {
        const { email, password } = req.body;
        // Find admin by email
        const admin = await Admin.findOne({ email });

        // If admin not found
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        // Check if password matches
        if (admin.password !== password) {
            return res.status(401).json({ message: 'Incorrect password' });
        }

        // If login successful
        res.status(200).json({ message: 'Admin logged in successfully', admin });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Super admin login
router.post('/login/superadmin', async (req, res) => {
    // Logic for super admin login
});

router.get('/getAllAdmins', async (req, res) => {
    var result = await Admin.find();
    // console.log("result====>", result);
    res.statusMessage = "Company Data fetched successfully..."
    res.status(200).json({
        Length: result.length,
        Results: result
    })
})


router.post('/admindelete/:id', async (req, res) => {
    // console.log("req====>",req.params.id);
    if (!req.params.id) {
        res.statusMessage = "Some required missing..."
        return res.status(201).json({
            error: 'Some required missing...'
        })
    }

    try {
        let result = await Admin.findOneAndDelete({ _id: req.params.id })
        if (result) {
            res.statusMessage = "Service deleted successfully..."
            res.status(200).json({
                Results: result
            })
        }
    }

    catch (err) {
        res.statusMessage = "Service delete Failed..."
        res.status(400).json({
        })
    }
})

router.get('/admin/count', async(req,res)=>{
    try {
        const adminCount = await Admin.countDocuments({role:"childadmin"})
        // console.log('admin============>',adminCount);
        res.status(200).json({
            Admins:adminCount
        })
    } catch (error) {
        console.error('Error counting tasks by status:', error);
        res.status(500).json({ error: 'Server error' });
    }
})
 

module.exports = router;