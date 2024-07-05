const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();
const port = 3000;

// Replace with your MongoDB Atlas connection string
const mongoURI = 'mongodb+srv://nithin20891a05e5:rcAKsBsAseJ62gxA@cluster0.09fvtah.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

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

// Define the GET endpoint
app.get('/airport', async (req, res) => {
  const iata_code = req.query.iata_code;

  if (!iata_code) {
    return res.status(400).send('Missing iata_code parameter');
  }

  try {
    const collection = database.collection('data');
    const cityCollection = database.collection('city');
    const countryCollection = database.collection('country');
    const airport = await collection.findOne({ iata_code });

    if (!airport) {
      return res.status(404).send('Airport not found');
    }

    let city_data1 = { data: null };
    let country_data1 = { data: null };

    if (airport.city_id) {
      // Find city data by city_id from airport
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

        // Find country data by country_id from city_data
        const country_data = await countryCollection.findOne({ id: city_data.country_id });
        console.log(country_data)
        if (country_data) {
          country_data1 = {
            id: country_data.id,
            name: country_data.name,
            country_code_two: country_data.country_code_two,
            country_code_three: country_data.country_code_three,
            mobile_code: country_data.mobile_code,
            continent_id: country_data.continent_id
          };
          console.log(country_data1)
        }
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

    res.json(response);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).send('Internal server error');
  }
});

// Start the server and connect to the database
app.listen(port, async () => {
  await connectToDatabase();
  console.log(`Server is running on http://localhost:${port}`);
});
