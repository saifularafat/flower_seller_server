const express = require("express");
const app = express();
const cors = require("cors");
const SSLCommerzPayment = require("sslcommerz-lts");
const axios = require("axios");
const jwt = require("jsonwebtoken")
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require("dotenv").config();
const stripe = require("stripe")(process.env.PAYMENT_SECRET_KEY)
const PORT = process.env.PORT || 4000;

/* middleware */
const corsOptions = {
    origin: "*",
    credentials: true,
    optionSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json())

const verifyJWT = (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
        return res
            .status(401)
            .send({ error: true, message: "unauthorized access" });
    }
    const token = authorization.split(" ")[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
        if (error) {
            return res
                .status(401)
                .send({ error: true, message: "unauthorized access" });
        }
        req.decoded = decoded;
        next();
    })
}

const uri = `mongodb+srv://${process.env.DATA_USER}:${process.env.DATA_PASS}@cluster0.guqonkt.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});


/* SSLCommerz api key */
const store_id = process.env.STORE_ID
const store_passwd = process.env.STORE_PASS
const is_live = false //true for live, false for sandbox


async function run() {
    try {
        // await client.connect();
        const usersCollection = client.db("flowersShop").collection("users");
        const flowersCollection = client.db("flowersShop").collection("allFlowers");
        const bookMarkFlowerCollection = client.db("flowersShop").collection("bookMarkFlower");
        const offerTextCollection = client.db("flowersShop").collection("offerText");
        const sliderCollection = client.db("flowersShop").collection("sliderChange");
        const bannerCollection = client.db("flowersShop").collection("bannerChange");
        const leftRightCollection = client.db("flowersShop").collection("leftRightChange");
        const footerChangeCollection = client.db("flowersShop").collection("footerChange");
        const paymentCollection = client.db("flowersShop").collection("payments");
        const emailCollection = client.db("flowersShop").collection("emails");

        /* JWT TOKEN */
        app.post("/jwt", (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: "1d",
            })
            res.send({ token })
        })
        /* verify Admin  */
        const verifyAdmin = async (req, res, next) => {
            const email = req.decoded.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            if (user?.role !== "admin") {
                return res
                    .status(403)
                    .send({ error: true, message: " forbidden messages" })
            };
            next();
        }

        /* user crate */
        app.get("/users", async (req, res) => {
            const result = await usersCollection.find().toArray();
            res.send(result);
        });
        app.get("/users/:email", async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const result = await usersCollection.find(query).toArray();
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
        app.get("/user", async (req, res) => {
            const email = req.query.email;
            const query = { email: email };

            const result = await usersCollection.findOne(query);
            res.send(result);
        });
        app.patch("/updateProfile", async (req, res) => {
            const email = req.query.email;
            const data = req.body;
            const query = { email: email };
            const options = { upsert: true };
            const doc = {
                $set: {
                    name: data.name,
                    gender: data.gender,
                    address: data.address,
                    phoneNumber: data.phoneNumber,
                    image: data.image,
                },
            };
            const result = await usersCollection.updateOne(query, doc, options);
            res.send(result);
        });

        app.get("/users/admin/:email", verifyJWT, async (req, res) => {
            const email = req.params.email;
            if (req.decoded?.email !== email) {
                return res.send({ admin: false })
            }
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            const result = { admin: user?.role === "admin" };
            res.send(result)
        });
        app.patch("/users/admin/:id", verifyJWT, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updateUser = {
                $set: {
                    role: "admin",
                }
            };
            const result = await usersCollection.updateOne(filter, updateUser);
            res.send(result);
        })
        app.delete("/users/admin/:id", verifyJWT, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await usersCollection.deleteOne(query);
            res.send(result)
        })
        /* Flowers post and get or update section  start*/
        app.get("/flowersAll", async (req, res) => {
            let query = {};
            if (req.query?.email) {
                query = { email: req.query.email }
            }
            const result = await flowersCollection.find(query).toArray();
            res.send(result);
        })
        app.post("/flowersAll", async (req, res) => {
            const flower = req.body;
            const result = await flowersCollection.insertOne(flower);
            res.send(result)
        })
        app.get("/flowersAll/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await flowersCollection.findOne(query);
            res.send(result)
        })
        app.patch("/flowersAll/:id", async (req, res) => {
            const flower = req.params.id;
            const filter = { _id: new ObjectId(flower) };
            const options = { upsert: true };
            const flowerInfo = req.body;
            const updateDoc = {
                $set: {
                    flowerName: flowerInfo.flowerName,
                    recipient: flowerInfo.recipient,
                    price: flowerInfo.price,
                    flowerCategory: flowerInfo.flowerCategory,
                    offerPrice: flowerInfo.offerPrice,
                    percent: flowerInfo.percent,
                    flowerImg: flowerInfo.flowerImg,
                    color: flowerInfo.color,
                    flowerDetails: flowerInfo.flowerDetails
                }
            }
            const result = await flowersCollection.updateOne(filter, updateDoc, options);
            res.send(result)
        })
        app.delete("/flowersAll/:id", verifyJWT, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await flowersCollection.deleteOne(query);
            res.send(result)
        })

        /*  all flower is price low to High and High to Low*/
        app.get("/ascendingPrice", async (req, res) => {
            const result = await flowersCollection
                .find()
                .sort({ price: 1 })
                .toArray();
            res.send(result)
        })
        app.get("/descendingPrice", async (req, res) => {
            const result = await flowersCollection
                .find()
                .sort({ price: -1 })
                .toArray();
            res.send(result)
        })
        /* search the flower  */
        app.get("/searchFiledFlower/:text", async (req, res) => {
            const searchText = req.params.text;
            const result = await flowersCollection.find({
                $or: [
                    { flowerName: { $regex: searchText, $options: "i" } },
                    { color: { $regex: searchText, $options: "i" } },
                ]
            }).toArray();
            res.send(result)
        })
        /* Flowers post and get or update section  end*/

        /* book mark flower start */
        app.get("/bookmarkFlower", async (req, res) => {
            let query = {};
            if (req.query?.email) {
                query = { email: req.query.email }
            }
            const result = await bookMarkFlowerCollection.find(query).toArray();
            res.send(result)
        })
        app.post("/bookmarkFlower", async (req, res) => {
            const item = req.body;
            const result = await bookMarkFlowerCollection.insertOne(item)
            res.send(result)
        })
        app.delete("/bookmarkFlower/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await bookMarkFlowerCollection.deleteOne(query);
            res.send(result)
        })
        /* book mark flower end */

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

        /* stripe PAYMENT API */
        app.post("/create-payment-intent", async (req, res) => {
            const price = req.body;
            const amount = price * 100;
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: "usd",
                payment_method_types: ["card"],
            });
            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        })
        /* payment client*/
        app.post("/payment", async (req, res) => {
            const pay = req.body;
            const result = await paymentCollection.insertOne(pay);
            res.send(result);
        })
        /* payment Admin approve */
        app.patch("/payment/admin/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatePay = {
                $set: {
                    payStatus: "success",
                }
            };
            const result = await paymentCollection.updateOne(filter, updatePay);
            res.send(result);
        });
        app.patch("/payment/admin/cancel/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatePay = {
                $set: {
                    payStatus: "cancel",
                    cancelType: "No receive",
                }
            };
            const result = await paymentCollection.updateOne(filter, updatePay);
            res.send(result);
        });
        /* users option */
        app.patch("/payment/user/cancel/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updatedFlower = req.body;
            const updatePay = {
                $set: {
                    payStatus: "cancel",
                    cancelType: updatedFlower.cancelType,
                    cancelMessage: updatedFlower.cancelMessage
                }
            };
            const result = await paymentCollection.updateOne(filter, updatePay, options);
            res.send(result);
        });
        app.patch("/payment/user/retune/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updatedFlower = req.body;
            const updatePay = {
                $set: {
                    payStatus: "retune",
                    cancelType: updatedFlower.cancelType,
                    cancelMessage: updatedFlower.cancelMessage
                }
            };
            const result = await paymentCollection.updateOne(filter, updatePay, options);
            res.send(result);
        });
        app.get("/payments", async (req, res) => {
            const pay = await paymentCollection.find().toArray();
            res.send(pay)
        });
        app.get('/payment/user', async (req, res) => {
            let query = {};
            if (req.query?.email) {
                query = { email: req.query.email }
            }
            const result = await paymentCollection.find(query).toArray();
            res.send(result);
        })

        /* SSLCommerz Payment api  */
        const transition_id = new ObjectId().toString();
        app.post("/sslPayment", async (req, res) => {
            const payment = await flowersCollection.findOne({
                _id: new ObjectId(req.body)
            })
            const orderInfo = req.body;
            console.log(orderInfo);
            const data = {
                total_amount: orderInfo?.price,
                currency: 'USD',
                tran_id: transition_id, // use unique tran_id for each api call
                success_url: (`http://localhost:4000/payment/success/${transition_id}`),
                fail_url: `http://localhost:4000/payment/fail/${transition_id}`,
                cancel_url: 'http://localhost:4000/cancel',
                ipn_url: 'http://localhost:3030/ipn',
                shipping_method: 'Courier',
                product_name: orderInfo?.name,
                product_category: payment?.flowerCategory,
                product_profile: 'general',
                cus_name: orderInfo?.userName,
                cus_email: orderInfo?.email,
                cus_add1: orderInfo?.currentAddress,
                cus_add2: 'Dhaka',
                cus_city: 'Dhaka',
                cus_state: 'Dhaka',
                cus_postcode: '1000',
                cus_country: 'Bangladesh',
                cus_phone: orderInfo?.PhoneNumber,
                cus_fax: '01711111111',
                ship_name: orderInfo?.userName,
                ship_add1: 'Dhaka',
                ship_add2: 'Dhaka',
                ship_city: 'Dhaka',
                ship_state: 'Dhaka',
                ship_postcode: 1000,
                ship_country: 'Bangladesh',
            };
            const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live)
            sslcz.init(data).then(apiResponse => {
                // Redirect the user to payment gateway
                let GatewayPageURL = apiResponse.GatewayPageURL
                res.send({ url: GatewayPageURL })

                const confirmOrder = {
                    image: payment?.flowerImg,
                    name: payment?.flowerName,
                    price: payment?.price,
                    totalPrice: orderInfo?.totalPrice,
                    charge: orderInfo?.charge,
                    currentAddress: orderInfo?.currentAddress,
                    PhoneNumber: orderInfo?.PhoneNumber,
                    email: orderInfo?.email,
                    userName: orderInfo?.userName,
                    date: new Date(),
                    paymentType: "SSL CommerZ",
                    duration: "Delivery Duration Time is 7 Day!",
                    payStatus: "success",
                    paidStatus: false,
                    transition_id
                };
                const result = paymentCollection.insertOne(confirmOrder);
                console.log('Redirecting to: ', GatewayPageURL)
            });

            app.post("/payment/success/:transition", async (req, res) => {
                console.log(req.params.transition);
                const result = await paymentCollection.updateOne(
                    { transition_id: req.params.transition },
                    {
                        $set: {
                            paidStatus: true,
                        }
                    },
                );
                if (result.modifiedCount > 0) {
                    res.redirect(`http://localhost:5173/payment/success/${req.params.transition}`)
                };
            });

            app.post("/payment/fail/:transition", async (req, res) => {
                const result = await paymentCollection.deleteOne(
                    { transition_id: req.params.transition }
                )
                if (result.deletedCount) {
                    res.redirect(`http://localhost:5173/payment/fail/${req.params.transition}`)
                }
            })

            console.log(data);
        })

        /* Email API Start */
        app.get("/allEmail", async (req, res) => {
            const email = await emailCollection.find().toArray();
            res.send(email)
        })
        app.post("/emailPost", async (req, res) => {
            const email = req.body;
            const result = await emailCollection.insertOne(email);
            res.send(result)
        })
        app.patch("/emailDelete/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatePay = {
                $set: {
                    emailStatus: "delete",
                }
            };
            const result = await emailCollection.updateOne(filter, updatePay);
            res.send(result);
        });
        app.patch("/emailStarred/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatePay = {
                $set: {
                    starred: "start",
                }
            };
            const result = await emailCollection.updateOne(filter, updatePay);
            res.send(result);
        });
        app.delete("/emailDelete/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await emailCollection.deleteOne(query);
            res.send(result)
        })
        /* Email API End */

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
    console.log(`Flower site is running of PORT ${PORT}`);
})