const express = require('express');
const router = express.Router();


router.post('/forgotPassword', async (req, res) => {
  console.log("Body ===>> ", req.body)
  let { password, phoneNumber } = req.body

  if (!phoneNumber || !password) {
      res.statusMessage = "Id/password missing..."
      return res.status(201).json()
  }

  try {
      let result = await user.findOneAndUpdate({ mobileNumber: phoneNumber }, {
          password: Encrypt(password),
          modified_date: new Date
      })

      if (result) {
          res.statusMessage = "Password changed successfully..."
          res.status(200).json({
              Results: result
          })
      }
  }
  catch (err) {
      res.statusMessage = "Password changing Failed..."
      res.status(400).json()
  }
})

module.exports = router;
