const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const PORT = process.env.PORT || 4000;

/* middleware */
const corsOptions = {
    origin: "*",
    credentials: true,
    optionSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json())

const uri = `mongodb+srv://${process.env.DATA_USER}:${process.env.DATA_PASS}@cluster0.guqonkt.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // await client.connect();
        const usersCollection = client.db("flowersShop").collection("users");
        const flowersCollection = client.db("flowersShop").collection("allFlowers");

        /* user crate */
        app.get("/users", async (req, res) => {
            const result = await usersCollection.find().toArray();
            res.send(result);
        });
        app.post("/users", async (req, res) => {
            const user = req.body;
            const query = { email: user.email };
            const existingUser = await usersCollection.findOne(query);
            if (existingUser) {
                return res.send({ message: "You is already access!" });
            }
            const result = await usersCollection.insertOne(user);
            res.send(result);
        });
        /* Flowers post and get or update section  start*/
        app.get("/flowersAll", async (req, res) => {
            const result = await flowersCollection.find().toArray();
            res.send(result);
        })
        app.post("/flowersAll", async (req, res) => {
            const flower = req.body;
            const result = await flowersCollection.insertOne(flower);
            res.send(result)
        })
        app.patch("/flowersAll/:id", async (req, res) => {
            const flower = req.params.id;
            const filter = { _id: new ObjectId(flower) };
            const options = { upsert: true };
            const flowerDetails = req.body;
            const updateDoc = {
                $set: {
                    flowerName: flowerDetails.flowerName,
                    flowerNav: flowerDetails.flowerNav,
                    price: flowerDetails.price,
                    flowerCategory: flowerDetails.flowerCategory,
                    offerPrice: flowerDetails.offerPrice,
                    percent: flowerDetails.percent,
                    flowerImg: flowerDetails.flowerImg,
                }
            }
            const result = await flowersCollection.updateOne(filter, updateDoc, options);
            res.send(result)
        })
        app.delete("/flowersAll/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await flowersCollection.deleteOne(query);
            res.send(result)
        })
        /* Flowers post and get or update section  end*/


        // await client.db("admin").command({ ping: 1 });
        console.log("Slower Shop DataBase is successfully connected to MongoDB!");
    } finally {
        // await client.close();
    }
}
run().catch(console.dir);




app.get("/", (req, res) => {
    res.send("Flowers Server Site is Start")
})
app.listen(PORT, () => {
    console.log(`Flower site is running of PORT a ${PORT}`);
})