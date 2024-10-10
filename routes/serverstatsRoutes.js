
import { auth, healthcare, PROJECT_ID, LOCATION, DATASET_ID, FHIR_STORE_ID, handleBlobResponse } from '../serverutils.js';
import { BASE_PATH } from '../serverutils.js'; // Adjust the path as necessary

import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables

const router = express.Router();

router.get('/serverstats', (req, res) => {
    // Get the server stats asynchronously
    osUtils.cpuUsage(function(cpuUsage) {
        osUtils.freemem(function(freeMem) {
            const serverStats = {
                processUptime: process.uptime(), // Uptime of the Node.js process in seconds
                systemUptime: osUtils.sysUptime(), // Uptime of the system in hours
                totalMemory: osUtils.totalmem(), // Total system memory in MB
                freeMemory: freeMem, // Free system memory in MB
                usedMemory: osUtils.totalmem() - freeMem, // Used memory in MB
                cpuUsage: (cpuUsage * 100).toFixed(2) // CPU usage as a percentage
            };
            
            // Send the stats in JSON format
            res.json(serverStats);
        });
    });
});

export default router;

