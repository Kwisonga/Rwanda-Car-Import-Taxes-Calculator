const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3500;

// Initialize car data
let carData = [];

app.use(cors());
app.use(express.json());

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Load car data from JSON file
async function loadCarData() {
    try {
        const data = await fs.readFile(path.join(__dirname, 'carInfoDB.json'), 'utf8');
        carData = JSON.parse(data);
        console.log('Car data loaded successfully');
    } catch (err) {
        console.error('Error loading car data:', err);
        process.exit(1); // Exit if we can't load the data
    }
}

// Get unique brands
app.get('/brands', (req, res) => {
    try {
        const brands = [...new Set(carData.map(car => car.BRAND?.trim() || '').filter(Boolean))].sort();
        res.json(brands);
    } catch (err) {
        console.error('Error fetching brands:', err);
        res.status(500).json({ error: 'Failed to fetch brands' });
    }
});

// Get years available for a specific brand
app.get('/years', (req, res) => {
    try {
        const { brand } = req.query;
        if (!brand) {
            return res.status(400).json({ error: 'Brand parameter is required' });
        }

        const years = [...new Set(
            carData
                .filter(car => car.BRAND?.trim() === brand.trim())
                .map(car => car.YEAR)
                .filter(year => year != null)
        )].sort((a, b) => b - a); // Sort descending (newest first)

        res.json(years);
    } catch (err) {
        console.error('Error fetching years:', err);
        res.status(500).json({ error: 'Failed to fetch years' });
    }
});

// Get models for a specific brand and year
app.get('/models', (req, res) => {
    try {
        const { brand, year } = req.query;
        if (!brand || !year) {
            return res.status(400).json({ error: 'Brand and year parameters are required' });
        }

        const models = [...new Set(
            carData
                .filter(car => 
                    car.BRAND?.trim() === brand.trim() && 
                    car.YEAR == year
                )
                .map(car => car['MARK']?.trim() || '')
                .filter(Boolean)
        ].sort();

        res.json(models);
    } catch (err) {
        console.error('Error fetching models:', err);
        res.status(500).json({ error: 'Failed to fetch models' });
    }
});

// Get specifications for a specific brand, year, and model
app.get('/specs', (req, res) => {
    try {
        const { brand, year, model } = req.query;
        if (!brand || !year || !model) {
            return res.status(400).json({ error: 'Brand, year, and model parameters are required' });
        }

        const specs = [...new Set(
            carData
                .filter(car => 
                    car.BRAND?.trim() === brand.trim() && 
                    car.YEAR == year && 
                    car['MARK']?.trim() === model.trim()
                )
                .map(car => car.SPEC?.trim() || '')
                .filter(Boolean)
        ].sort();

        res.json(specs.length > 0 ? specs : ['Standard']);
    } catch (err) {
        console.error('Error fetching specs:', err);
        res.status(500).json({ error: 'Failed to fetch specifications' });
    }
});

// Get price for a specific car configuration
app.get('/price', (req, res) => {
    try {
        const { brand, year, model, spec } = req.query;
        if (!brand || !year || !model) {
            return res.status(400).json({ error: 'Brand, year, and model parameters are required' });
        }

        const matchingCars = carData.filter(car => 
            car.BRAND?.trim() === brand.trim() && 
            car.YEAR == year && 
            car['CAR MODEL']?.trim() === model.trim()
        );

        // If spec is provided, try to find exact match
        if (spec) {
            const exactMatch = matchingCars.find(car => 
                car.SPEC?.trim() === spec.trim()
            );
            if (exactMatch) {
                return res.json({ price: exactMatch.PRICE || 0 });
            }
        }

        // Otherwise return the first match (or average if multiple)
        if (matchingCars.length > 0) {
            const avgPrice = matchingCars.reduce((sum, car) => sum + (car.PRICE || 0), 0) / matchingCars.length;
            return res.json({ price: Math.round(avgPrice) });
        }

        res.json({ price: 0 }); // Default price if no match found
    } catch (err) {
        console.error('Error fetching price:', err);
        res.status(500).json({ error: 'Failed to fetch price' });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', dataLoaded: carData.length > 0 });
});

// Start the server after loading data
async function startServer() {
    await loadCarData();
    app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
    });
}

startServer();
