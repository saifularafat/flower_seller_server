const express = require("express");
const app = express();
const PORT = 5000

app.get("/", (req, res) => {
    res.send("Flowers Server Site is Start")
})
app.listen(PORT, () => {
    console.log(`Flower site is running now ${PORT}`);
})