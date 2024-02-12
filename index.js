const fs = require("fs/promises");
const express = require("express");
const cors = require("cors");
const _ = require("lodash");

const app = express();

app.get("/outfit", (req, res) => {
    res.send("This is working!");
});

app.listen(3000, () => console.log("API server is running"));