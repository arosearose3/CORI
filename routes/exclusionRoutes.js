const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const xlsx = require('xlsx');
const fs = require('fs');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());

// In-memory storage
let staffData = [];
let samData = [];
let oigData = [];
let coData = [];

// Helper functions
const parseCSV = (file) => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(file.path)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
};

const parseXLSX = (file) => {
  const workbook = xlsx.readFile(file.path);
  const sheetName = workbook.SheetNames[0];
  return xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
};

// Endpoints
app.post('/api/upload', upload.fields([
  { name: 'staff', maxCount: 1 },
  { name: 'sam', maxCount: 1 },
  { name: 'oig', maxCount: 1 },
  { name: 'co', maxCount: 1 }
]), async (req, res) => {
  try {
    staffData = await parseCSV(req.files.staff[0]);
    samData = await parseCSV(req.files.sam[0]);
    oigData = await parseCSV(req.files.oig[0]);
    coData = await parseXLSX(req.files.co[0]);
    res.json({ message: 'Files uploaded and processed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/check', (req, res) => {
  const results = staffData.map(staff => {
    const [firstName, lastName] = staff[0].split(' ');
    const npi = staff[3];
    const dob = staff[2];

    const samMatch = samData.some(sam => 
      sam.firstName.toLowerCase() === firstName.toLowerCase() && 
      sam.lastName.toLowerCase() === lastName.toLowerCase()
    );

    const oigMatch = oigData.some(oig => 
      oig.firstName.toLowerCase() === firstName.toLowerCase() && 
      oig.lastName.toLowerCase() === lastName.toLowerCase() &&
      oig.npi === npi && 
      oig.dob === dob
    );

    const coMatch = coData.some(co => co.npi === npi);

    return {
      name: `${firstName} ${lastName}`,
      samMatch,
      oigMatch,
      coMatch
    };
  });

  res.json(results);
});

app.post('/api/email', async (req, res) => {
  const { to, subject, html } = req.body;

  const transporter = nodemailer.createTransport({
    // Configure your email service here
    service: 'gmail',
    auth: {
      user: 'your-email@gmail.com',
      pass: 'your-password'
    }
  });

  try {
    await transporter.sendMail({ to, subject, html });
    res.json({ message: 'Email sent successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

