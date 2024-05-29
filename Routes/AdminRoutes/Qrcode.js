const express = require('express');
const router = express.Router();
const Qrcode = require('../../Models/AdminSchema/QrcodeSchema');
const qrcode = require('../../Models/AdminSchema/TaskSchema');
const Customer = require('../../Models/AdminSchema/CompanySchema')

router.post('/createQr', async (req, res) => {
    const { qrTitle, serviceName, titles, customerId, startDate, customerName, format, width, height, numQRCodes } = req.body;
    if (!qrTitle || !titles || !serviceName || !customerId || !customerName || !startDate || !format || !width || !height || !numQRCodes) {
        return res.status(400).json({
            message: 'Missing some required data.'
        });
    }

    try {
        // Check if the QR code title already exists
        const existingQrcode = await Qrcode.findOne({ 'qrTitle': qrTitle });
        if (existingQrcode) {
            return res.status(409).json({
                message: 'QR code title already exists.'
            });
        }

        // Fetch customer details using customerId 
        const customer = await Customer.findById(customerId);
        if (!customer) {
            return res.status(404).json({
                message: 'Customer not found.'
            });
        }

        // Check if the customer already has a QR code for the same service name
        const existingServiceQrcode = await Qrcode.findOne({ customerId, serviceName });
        if (existingServiceQrcode) {
            return res.status(409).json({
                message: `A QR code for the service '${serviceName}' already exists for this customer.`
            });
        }

        // Create a new QR code document with customer details
        const newQrcode = new Qrcode({
            qrTitle,
            titles,
            customerName,
            customerId,
            serviceName,
            startDate,
            format,
            width,
            height,
            numQRCodes,
            created_date: new Date()
        });

        // Save the new QR code document
        const savedQrcode = await newQrcode.save();

        // Update the available field to 'YES'
        savedQrcode.available = 'YES';
        await savedQrcode.save();

        res.status(201).json({
            message: 'QR code created successfully.',
            data: savedQrcode
        });

    } catch (error) {
        console.error('Error creating QR code:', error);
        res.status(500).json({
            message: 'Internal server error.'
        });
    }   
}); 

router.get("/getQrcode", async (req, res) => {
    try {
        const Qrcodes = await Qrcode.find()
        if (Qrcodes?.length > 0) {
            res.status(200).json({
                Length: Qrcodes.length,
                success: true,
                message: 'All Registered Technician fetched Successfully',
                data: Qrcodes
            })
        }
        else {
            res.status(404).json({
                success: false,
                message: 'No Registered Technician found'
            })
        }
    } catch (error) {
        console.error("Error fetching Registered Technician:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
})

router.post('/deleteQrcode/:id', async (req, res) => {
    if (!req.params.id) {
        res.statusMessage = "Some required missing..."
        return res.status(201).json({
            error: 'Some required missing...'
        })
    }

    try {
        let result = await Qrcode.findOneAndDelete({ _id: req.params.id })
        if (result) {
            res.statusMessage = "Qrcode deleted successfully..."
            res.status(200).json({
                Results: result
            })
        }
    }
    catch (err) {
        res.statusMessage = "Qrcode delete Failed..."
        res.status(400).json({
        })
    }
})

router.get('/totalQrcodes', async (req, res) => {
    try {
      const totalQrcode = await Qrcode.countDocuments();
      res.json({ totalQrcode });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

//   router.post('/deleteQrcodes/:id', async (req, res) => {
//     const { id } = req.params;
//     const { titles } = req.body;

//     if (!id || !titles) {
//         return res.status(400).json({ error: 'Missing required data.' });
//     }

//     try {
//         const result = await Qrcode.findByIdAndUpdate(
//             id,
//             { $pull: { titles: titles } },
//             { new: true }
//         );

//         if (!result) {
//             return res.status(404).json({ error: 'QR code not found.' });
//         }

//         res.status(200).json({ message: 'QR code title deleted successfully.', data: result });
//     } catch (error) {
//         console.error('Error deleting QR code title:', error);
//         res.status(500).json({ error: 'Internal server error.' });
//     }
// });



router.post('/deleteTitle', async (req, res) => {
    const { qrId, titleId } = req.body;

    try {
        // Find the QRCode document by its ID
        const qrCode = await Qrcode.findById(qrId);

        if (!qrCode) {
            return res.status(404).json({
                message: 'QR code not found.'
            });
        }

        // Pull the title object with the given titleId from the titles array
        qrCode.titles.pull({ _id: titleId });

        // Check if titles array is empty after deletion
        if (qrCode.titles.length === 0) {
            // If titles array is empty, delete the QR code document
            await Qrcode.findByIdAndDelete(qrId);
            return res.status(200).json({
                message: 'QR code and title deleted successfully.'
            });
        } else {
            // Save the updated QRCode document if titles array is not empty
            await qrCode.save();
            return res.status(200).json({
                message: 'Title deleted successfully.',
                data: qrCode  // Send the updated QR code details in the response
            });
        }
    } catch (error) {
        console.error('Error deleting title:', error);
        res.status(500).json({
            message: 'Internal server error.'
        });
    }
});




router.get('/getQrcodeById/:id', async (req, res) => {


    try {
        const qrcode = await Qrcode.findById({_id:req.params.id});
        
        if (!qrcode) {
            return res.status(404).json({ error: 'QR code not found.' });
        }

        res.status(200).json({ message: 'QR code fetched successfully.', data: qrcode });
    } catch (error) {
        console.error('Error fetching QR code by ID:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});



module.exports = router;


// please validate the logic which is i need one customer can have only one general pest control qr and one rodend qr if one customer trys to create more then one rodent or genterl canot able to create then throuth error catogary already exist 