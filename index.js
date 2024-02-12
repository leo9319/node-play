const fs = require("fs/promises");
const express = require("express");
const cors = require("cors");
const _ = require("lodash");

const app = express();

app.get("/outfit", (req, res) => {
    res.send("This is working!");
});

const server = app.listen(3000, () => {
    const { address, port } = server.address();
    console.log(`API server is running at http://${address}:${port}`);
});
