const express = require("express");
const router = express.Router();
const puppeteer = require("puppeteer");

router.get("/getpdf", async (req, res) => {
  try {
    const header = `<!DOCTYPE html><html><head><title>Page Title</title><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"><link href="https://fonts.googleapis.com/css?family=Poppins" rel="stylesheet"><style>html {-webkit-print-color-adjust: exact;}body{font-family: "Poppins";margin:0}.heading {background-color:#3A3A3A;color:white;font-weight:bold;z-index: 1000;top:0;left:0;right:0}.heading td{padding-left:10px;}.logo{ text-align:end;padding-right:10px;}.date_head {font-size:14px;font-weight:normal;}.body_content{margin:10px;}.footer{background-color:#3A3A3A;color:white;padding:10px;left:0;right:0;bottom:0px;}.address{text-align:end; width:450px;text-align:left;}.mobile{width:250px;}.mail{width:300px;} .remarks{max-width: 150px;line-break: anywhere;}</style></head><body><table width="100%" cellpadding="0" cellspacing="0"><tr class="heading"><td>SERVICE REPORT <br /><span class="date_head">frefefefegf</span></td><td class="logo"><img src="http://localhost:4000/images/logo.png" /></td></tr><tr><td></td><td class="logo"><img src="http://localhost:4000/images/pest.svg" width="100px" /><img src="http://localhost:4000/images/BPCA.png" width="50px" /></td></tr></table>`;

        const body = `<center><table border="1" cellpadding="5" cellspacing="0" class="body_content" width="95%"><tr><th colspan=2>CUSTOMER INFORMATION</th><tr><tr><td><b>Name</b></td><td>xsaxaxasx</td></tr><tr><td><b>Address</b></td><td>saecscacacacacacacacin</td></tr><tr><td><b>Mobile Number</b></td><td>cacacacacacac</td></tr> <tr><td><b>Service Type</b></td><td height="80px">cacacacac</td></tr><tr><td><b>Chemical Used</b></td><td height="80px">cacacacacac</td></tr><tr><td><b>Start Time</b></td><td>cacacacac</td></tr><tr><td><b>End Time</b></td><td>cacaccac</td></tr><tr><td><table><tr><td><div><b>Customer Sign</b></div><br /><div>cacacacacac"N/A" :</div><div><b>Name:</b>  cacaccc</div></td></table></td><td><table><tr><td><div><b>Technician Sign</b></div><br /><div><img src="data:image/png;base64,cacaccacacc" width="150px" /></div><div><b>Name:</b>   cacacacssa</div><div><b>Other Technician:</b>caccac</div></td> </tr></table></td></tr><tr><td><b>Recommendation / Remarks</b></td><td height="150px" class="remarks">afcsafcsafcafcafceewaflkwahflkahfkqhfckhacsac,ancndkjancdkjakcddhfkjhfkj3qhfkjhfkjhfkjhfkjhfkjhfkjhfkjhfkjhfkjfhkjfhkjehfkjwhfkafcsafcsafcafcafceewaflkwahflkahfkqhfckhacsac,ancndkjancdkjwhfk</td></tr></table></center>`;
        const footer =
            '<table width="100%"  cellpadding="0" cellspacing="0" class="footer"><tr><td class="mobile"><i class="fa fa-phone"></i> +973 17720648</td><td class="mail"><i class="fa fa-envelope" aria-hidden="true"></i> info@pestpatrolbh.com</td><td class="address"><i class="fa fa-map-marker" aria-hidden="true"></i> Flat 1, Building 679,Road 3519, Block 335. Um Al Hassam CR.No. 3121-6</td></tr></table></body></html>';
        const html = header + body + footer;

        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.setContent(html);
        await page.addStyleTag({
            content: `
        .watermark {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            opacity: 0.1;
            pointer-events: none;
            background-image: url('http://localhost:4000/images/logo_back.png');
            background-repeat: no-repeat;
            background-size: 50%;
            background-position: center;
        }
      `,
        });

    // Inject watermark div onto the page
    await page.evaluate(() => {
      const watermarkDiv = document.createElement("div");
      watermarkDiv.className = "watermark";
      document.body.appendChild(watermarkDiv);
    });
    const pdfBuffer = await page.pdf();
    await browser.close();

    // res.setHeader("Content-Type", "application/pdf");
    // res.setHeader("Content-Disposition", 'attachment; filename="output.pdf"');
    res.send(html);
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
