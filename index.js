const express = require('express');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Replace with your MongoDB Atlas connection string
const mongoURI = process.env.MONGODB_CONNECT_URI;

// Create a new MongoClient
const client = new MongoClient(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });

let database;

async function connectToDatabase() {
  try {
    await client.connect();
    database = client.db('Hava');
    console.log('Connected to MongoDB Atlas');
  } catch (err) {
    console.error('Error connecting to MongoDB Atlas', err);
    process.exit(1);
  }
}

// Middleware to check database connection
function ensureDbConnection(req, res, next) {
  if (!database) {
    return res.status(500).send('Database connection not established');
  }
  next();
}

// Define the GET endpoint
app.get('/airport', ensureDbConnection, async (req, res) => {
  const iata_code = req.query.iata_code;

  if (!iata_code) {
    console.error('Missing iata_code parameter');
    return res.status(400).send('Missing iata_code parameter');
  }

  try {
    console.log('Fetching airport data for IATA code:', iata_code);

    const collection = database.collection('data');
    const cityCollection = database.collection('city');
    const countryCollection = database.collection('country');
    const airport = await collection.findOne({ iata_code });

    if (!airport) {
      console.error('Airport not found for IATA code:', iata_code);
      return res.status(404).send('Airport not found');
    }

    let city_data1 = { data: null };
    let country_data1 = { data: null };

    if (airport.city_id) {
      console.log('Fetching city data for city_id:', airport.city_id);

      const city_data = await cityCollection.findOne({ id: airport.city_id });

      if (city_data) {
        city_data1 = {
          id: city_data.id,
          name: city_data.name,
          country_id: city_data.country_id,
          is_active: city_data.is_active,
          lat: city_data.lat,
          long: city_data.long
        };

        console.log('Fetching country data for country_id:', city_data.country_id);

        const country_data = await countryCollection.findOne({ id: city_data.country_id });

        if (country_data) {
          country_data1 = {
            id: country_data.id,
            name: country_data.name,
            country_code_two: country_data.country_code_two,
            country_code_three: country_data.country_code_three,
            mobile_code: country_data.mobile_code,
            continent_id: country_data.continent_id
          };
        } else {
          console.error('Country data not found for country_id:', city_data.country_id);
        }
      } else {
        console.error('City data not found for city_id:', airport.city_id);
      }
    }

    const response = {
      airport: {
        id: airport.id,
        icao_code: airport.icao_code,
        iata_code: airport.iata_code,
        name: airport.name,
        type: airport.type,
        latitude_deg: airport.latitude_deg,
        longitude_deg: airport.longitude_deg,
        elevation_ft: airport.elevation_ft,
        city: city_data1,
        country: country_data1
      }
    };

    console.log('Sending response:', response);
    res.json(response);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).send('Internal server error');
  }
});

// Default route
app.get('/', (req, res) => {
  res.send("Copy and Paste /airport?iata_code=HYD in hosted URL");
});

// Start the server after successful database connection
connectToDatabase().then(() => {
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}).catch(err => {
  console.error('Failed to connect to database:', err);
});
