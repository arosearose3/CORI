import express from 'express';

import dotenv from 'dotenv';
import fs from 'fs';
import nodemailer from 'nodemailer';
import xlsx from 'xlsx';
import multer from 'multer';


// Load environment variables
dotenv.config();

import { BASE_PATH } from '../serverutils.js'; // Adjust the path as necessary

const base = BASE_PATH;
const router = express.Router();





const upload = multer({ dest: 'uploads/' });


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
router.post('/upload', upload.fields([
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

router.post('/check', (req, res) => {
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

router.post('/email', async (req, res) => {
  const { to, subject, html } = req.body;

  const transporter = nodemailer.createTransport({
    host: 'email7412.luxsci.com',
    port: 587,
    secure: false, // Use TLS
    auth: {
      user: 'andrewroselpc@elig.pro',
      pass: process.env.LUXSCIPW
    }
  });
  

  try {
    await transporter.sendMail({ to, subject, html });
    res.json({ message: 'Email sent successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

