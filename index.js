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
        const offerTextCollection = client.db("flowersShop").collection("offerText");
        const sliderCollection = client.db("flowersShop").collection("sliderChange");
        const bannerCollection = client.db("flowersShop").collection("bannerChange");
        const leftRightCollection = client.db("flowersShop").collection("leftRightChange");
        const footerChangeCollection = client.db("flowersShop").collection("footerChange");

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

        //admin editor section
        /* offer TExt api info start */
        app.get("/offerText", async (req, res) => {
            const result = await offerTextCollection.find().toArray();
            res.send(result)
        })
        app.post("/offerText", async (req, res) => {
            const text = req.body;
            const result = await offerTextCollection.insertOne(text);
            res.send(result);
        })
        app.get("/offerText/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await offerTextCollection.findOne(query);
            res.send(result)
        })
        app.patch("/offerText/:id", async (req, res) => {
            const text = req.params.id;
            const filter = { _id: new ObjectId(text) };
            const options = { upsert: true };
            const content = req.body;
            const updateDoc = {
                $set: {
                    topBestOffer: content.topBestOffer,
                    topBestOfferLink: content.topBestOfferLink,
                }
            };
            const result = await offerTextCollection.updateOne(filter, updateDoc, options);
            res.send(result)
        })
        /* text content info end */
        /* slider api info start */
        app.get("/sliderImage", async (req, res) => {
            const result = await sliderCollection.find().toArray();
            res.send(result)
        })
        app.post("/sliderImage", async (req, res) => {
            const text = req.body;
            const result = await sliderCollection.insertOne(text);
            res.send(result);
        })
        app.patch("/sliderImage/:id", async (req, res) => {
            const text = req.params.id;
            const filter = { _id: new ObjectId(text) };
            const options = { upsert: true };
            const content = req.body;
            const updateDoc = {
                $set: {
                    image: content.image
                }
            };
            const result = await sliderCollection.updateOne(filter, updateDoc, options);
            res.send(result)
        })
        app.delete("/sliderImage/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await sliderCollection.deleteOne(query)
            res.send(result)
        })
        /* slider content info end */
        /* banner api info start */
        app.get("/bannerImage", async (req, res) => {
            const result = await bannerCollection.find().toArray();
            res.send(result)
        })
        app.post("/bannerImage", async (req, res) => {
            const text = req.body;
            const result = await bannerCollection.insertOne(text);
            res.send(result);
        })
        app.get("/bannerImage/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            console.log(id);
            const result = await bannerCollection.findOne(query);
            res.send(result)
        })
        app.patch("/bannerImage/:id", async (req, res) => {
            const text = req.params.id;
            const filter = { _id: new ObjectId(text) };
            const options = { upsert: true };
            const content = req.body;
            const updateDoc = {
                $set: {
                    bannerLink: content.bannerLink,
                }
            };
            const result = await bannerCollection.updateOne(filter, updateDoc, options);
            res.send(result)
        })
        app.delete("/bannerImage/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await bannerCollection.deleteOne(query);
            res.send(result);
        })
        /* banner content info end */
        /* banner api info start */
        app.get("/leftRightImage", async (req, res) => {
            const result = await leftRightCollection.find().toArray();
            res.send(result)
        })
        app.post("/leftRightImage", async (req, res) => {
            const text = req.body;
            const result = await leftRightCollection.insertOne(text);
            res.send(result);
        })
        app.get("/leftRightImage/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await leftRightCollection.findOne(query);
            res.send(result);
        })
        app.patch("/leftRightImage/:id", async (req, res) => {
            const text = req.params.id;
            const filter = { _id: new ObjectId(text) };
            const options = { upsert: true };
            const content = req.body;
            const updateDoc = {
                $set: {
                    leftRightContent: content.leftRightContent,
                    leftRightLink: content.leftRightLink
                }
            };
            const result = await leftRightCollection.updateOne(filter, updateDoc, options);
            res.send(result)
        })
        app.delete("/leftRightImage/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await leftRightCollection.deleteOne(query);
            res.send(result)
        })
        /* banner content info end */
        /* Footer api start*/
        app.get("/footerChange", async (req, res) => {
            const result = await footerChangeCollection.find().toArray();
            res.send(result)
        })
        app.post("/footerChange", async (req, res) => {
            const footer = req.body;
            const result = await footerChangeCollection.insertOne(footer);
            res.send(result)
        })
        app.get("/footerChange/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await footerChangeCollection.findOne(query);
            res.send(result);
        })
        app.patch("/footerChange/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const footerBody = req.body;
            const updateDoc = {
                $set: {
                    ftName1: footerBody.ftName1,
                    ftUrl1: footerBody.ftUrl1,
                    ftName2: footerBody.ftName2,
                    ftUrl2: footerBody.ftUrl2,
                    ftName3: footerBody.ftName3,
                    ftUrl3: footerBody.ftUrl3,
                    ftName4: footerBody.ftName4,
                    ftUrl4: footerBody.ftUrl4,
                    ftName5: footerBody.ftName5,
                    ftUrl5: footerBody.ftUrl5,
                    ftName6: footerBody.ftName6,
                    ftUrl6: footerBody.ftUrl6,
                    ftName7: footerBody.ftName7,
                    ftUrl7: footerBody.ftUrl7,
                    ftName8: footerBody.ftName8,
                    ftUrl8: footerBody.ftUrl8,
                    footerSocket: footerBody.footerSocket,
                    developerURL: footerBody.developerURL
                }
            }
            const result = await footerChangeCollection.updateOne(filter, updateDoc, options);
            res.send(result)
        })
        /* Footer api end*/

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