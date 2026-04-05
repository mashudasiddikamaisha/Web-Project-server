const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 3000;

// middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.4qczscf.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

app.get('/', (req, res) => {
    res.send('server is running')
})

async function run() {
    try {
        // await client.connect();

        const db = client.db("travelEase_db");
        const vehiclesCollection = db.collection('vehicles');
        const bookingsCollection = db.collection('bookings');

        app.get('/vehicles', async (req, res) => {
            const { userEmail } = req.query;
            let query = {};
            if (userEmail) {
                query = { userEmail: userEmail };
            }

            const result = await vehiclesCollection.find(query).toArray();
            res.send(result);

        });

        app.post("/vehicles", async (req, res) => {
            const newVehicleData = req.body;
            const result = await vehiclesCollection.insertOne(newVehicleData);
            res.send(result);
        });

        app.delete("/vehicles/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await vehiclesCollection.deleteOne(query);
            res.send(result);
        });

        app.patch('/vehicles/:id', async (req, res) => {
            const id = req.params.id;
            const updatedVehicle = req.body;
            const query = { _id: new ObjectId(id) };
            const update = {
                $set: {
                    vehicleName: updatedVehicle.vehicleName,
                    owner: updatedVehicle.owner,
                    category: updatedVehicle.category,
                    pricePerDay: updatedVehicle.pricePerDay,
                    coverImage: updatedVehicle.coverImage,
                    location: updatedVehicle.location
                }
            }

            const result = await vehiclesCollection.updateOne(query, update);
            res.send(result);
        })

        app.get('/latest-vehicles', async (req, res) => {
            const cursor = vehiclesCollection.find().sort({ created_at: -1 }).limit(6);
            const result = await cursor.toArray();
            res.send(result);
        })

        app.get("/vehicles/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await vehiclesCollection.findOne(query);
            res.send({ result });
        });

        app.post("/bookings", async (req, res) => {
            try {
                const bookingData = req.body;
                if (!bookingData.userEmail) {
                    return res.status(400).send({ message: "User email is required" });
                }
                bookingData.createdAt = new Date();
                const result = await bookingsCollection.insertOne(bookingData);
                res.send({ message: "Booking successful", result });
            }
            catch (error) {
                res.send({ message: "Booking Failed", error })

            }
        });

        app.get("/bookings", async (req, res) => {
            try {
                const userEmail = req.query.email || req.query.userEmail;
                if (!userEmail) return res.status(400).send({ message: "User email is required" });

                const result = await bookingsCollection.find({ userEmail }).toArray();
                res.send(result);
            } catch (error) {
                res.status(500).send({ message: "Failed to fetch bookings", error });
            }
        });



        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
    }
}
run().catch(console.dir);

app.listen(port, () => {
    console.log(`server is running on port ${port}`)
})