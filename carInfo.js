const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

const carData = require('./carInfoDB.json');

app.use(cors());

// 1. Get unique brands
app.get('/brands', (req, res) => {
  const brands = [...new Set(carData.map(car => car.BRAND.trim()))];
  res.json(brands);
});

// 2. Get years for selected brand
app.get('/years', (req, res) => {
  const { brand } = req.query;
  if (!brand) return res.status(400).json({ error: 'brand is required' });

  const years = [...new Set(
    carData
      .filter(car => car.BRAND.trim() === brand)
      .map(car => car.YEAR)
  )];
  res.json(years);
});

// 3. Get models for selected brand and year
app.get('/models', (req, res) => {
  const { brand, year } = req.query;
  if (!brand || !year) return res.status(400).json({ error: 'brand and year are required' });

  const models = [...new Set(
    carData
      .filter(car => car.BRAND.trim() === brand && car.YEAR == year)
      .map(car => car.MARK.trim())
  )];
  res.json(models);
});

// 4. Get specifications for selected brand, year, and model
app.get('/specs', (req, res) => {
  const { brand, year, model } = req.query;
  if (!brand || !year || !model) return res.status(400).json({ error: 'brand, year, and model are required' });

  const specs = [...new Set(
    carData
      .filter(car =>
        car.BRAND.trim() === brand &&
        car.YEAR == year &&
        car.MARK.trim() === model
      )
      .map(car => car.SPECIFICATIONS.trim())
  )];
  res.json(specs);
});

// 5. Get price for selected brand, year, model, and specification
app.get('/price', (req, res) => {
  const { brand, year, model, spec } = req.query;
  if (!brand || !year || !model || !spec) {
    return res.status(400).json({ error: 'brand, year, model, and spec are required' });
  }

  const car = carData.find(car =>
    car.BRAND.trim() === brand &&
    car.YEAR == year &&
    car.MARK.trim() === model &&
    car.SPECIFICATIONS.trim() === spec
  );

  if (!car) return res.status(404).json({ error: 'No matching car found' });

  res.json({ price: car.PRICE });
});

app.listen(PORT, () => {
  console.log(`🚗 Car price API running at http://localhost:${PORT}`);
});
