const express = require('express');
const mongoose = require('mongoose');
const csv = require('csv-parser'); 
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json()); 

// MongoDB connection setup
mongoose.set('strictQuery', false);
const MONGODB_URI = 'mongodb+srv://riju:riju@cluster0.s4hmv.mongodb.net/property-data';
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const propertySchema = new mongoose.Schema({
    id: Number,
    forr: String,
    name: String,
    email: String,
    mobile: String,
    date: Date,
    latitude: Number,
    longitude: Number,
    property_type: String,
    postFor: String,
    iam: String,
    project_name: String,
    locality: String,
    city: String,
    exp_price: Number,
    monthly_rent: String,
    bedroom: String,
    bathroom: String,
    washrooms: String,
    area_unit: String,
    carpet_area: String,
    super_area: String,
    plot_length: String,
    plot_breadth: String,
    prop_availability: String,
    ownership_status: String,
    open_side: String,
    img: String,
    isShortlisted: Number,
});

const PropertyModel = mongoose.model('Property', propertySchema);


// CSV to JSON conversion
app.get('/api/csv-to-json', (req, res) => {
    try {
        const properties = [];

        const csvFilePath = path.join(__dirname, 'property.csv');

        fs.createReadStream(csvFilePath, 'utf-8')
            .pipe(csv())
            .on('data', (row) => {
                properties.push(row);
            })
            .on('end', () => {
                const jsonFilePath = path.join(__dirname, 'property.json');
                fs.writeFileSync(jsonFilePath, JSON.stringify(properties, null, 2));
                res.status(200).json({
                    message: `${properties.length} CSV to JSON conversion successful.`, jsonFilePath, data: properties
                });
            });
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred');
    }
});


// Route to insert JSON data into the database
app.get('/api/insert-json', async (req, res) => {
    try {
        const data = await fs.promises.readFile('property.json', 'utf8');
        const jsonData = JSON.parse(data);

        const insertedData = await DataModel.insertMany(jsonData);
        res.status(200).json({
            message: `${insertedData.length} Data inserted successfully.`, data: insertedData });
    } catch (error) {
        console.error('Error inserting data into MongoDB:', error);
        res.status(500).json({ error: 'Error inserting data into MongoDB' });
    }
});


// Route to get all properties
app.get('/api/properties', async (req, res) => {
    try {
        const properties = await PropertyModel.find();
        res.status(200).json({
            message: `Total property is ${properties.length} .`, data: properties
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred');
    }
});





// Route to get recommendations based on city, locality, and bedroom
app.post('/api/recommendations', async (req, res) => {
    try {
        const { city, locality, bedroom } = req.body;

        // Get all properties from the database
        const allProperties = await PropertyModel.find();

        // Create an array to store recommendations
        const recommendations = [];

        // If no input provided, get random properties
        if (!city && !locality && !bedroom) {
            while (recommendations.length < 10) {
                const randomIndex = Math.floor(Math.random() * allProperties.length);
                const randomProperty = allProperties[randomIndex];
                if (!recommendations.includes(randomProperty)) {
                    recommendations.push(randomProperty);
                }
            }
        } else {
            // Find exact matches of city, locality, and bedroom
            for (const property of allProperties) {
                if (
                    property.city === city &&
                    property.locality === locality &&
                    property.bedroom === bedroom
                ) {
                    recommendations.push(property);
                    if (recommendations.length === 10) {
                        break;
                    }
                }
            }

            // Find additional matches of bedroom and city
            if (recommendations.length < 10) {
                for (let i = allProperties.length - 1; i >= 0; i--) {
                    const property = allProperties[i];

                    if (recommendations.length === 10) {
                        break;
                    }

                    if (
                        property.city === city &&
                        property.bedroom === bedroom &&
                        !recommendations.includes(property)
                    ) {
                        recommendations.push(property);
                    }
                }
            }

            // Find exact matches of bedroom and locality
            if (recommendations.length < 10) {
                for (const property of allProperties) {
                    if (
                        property.locality === locality &&
                        property.bedroom === bedroom &&
                        !recommendations.includes(property)
                    ) {
                        recommendations.push(property);
                        if (recommendations.length === 10) {
                            break;
                        }
                    }
                }
            }

            // Find exact matches of city and locality
            if (recommendations.length < 10) {
                for (const property of allProperties) {
                    if (
                        property.city === city &&
                        property.locality === locality &&
                        !recommendations.includes(property)
                    ) {
                        recommendations.push(property);
                        if (recommendations.length === 10) {
                            break;
                        }
                    }
                }
            }

            // Find matches by bedroom if needed
            if (recommendations.length < 10) {
                for (const property of allProperties) {
                    if (
                        property.bedroom === bedroom &&
                        !recommendations.includes(property)
                    ) {
                        recommendations.push(property);
                        if (recommendations.length === 10) {
                            break;
                        }
                    }
                }
            }

            // Find matches by city if needed
            if (recommendations.length < 10) {
                for (const property of allProperties) {
                    if (
                        property.city === city &&
                        !recommendations.includes(property)
                    ) {
                        recommendations.push(property);
                        if (recommendations.length === 10) {
                            break;
                        }
                    }
                }
            }
        }

        // If no recommendations found yet, get random properties
        while (recommendations.length < 10) {
            const randomIndex = Math.floor(Math.random() * allProperties.length);
            const randomProperty = allProperties[randomIndex];
            if (!recommendations.includes(randomProperty)) {
                recommendations.push(randomProperty);
            }
        }

        res.status(200).json({
            message: `${recommendations.length} Property recommendations found.`,
            data: recommendations,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred');
    }
});







const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
