const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors()); // Enable CORS for all routes

app.get("/proxy", async (req, res) => {
    const targetUrl = req.query.url;

    if (!targetUrl) {
        return res.status(400).json({ error: "Missing 'url' query parameter" });
    }

    try {
        const response = await axios.get(targetUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0", // Some servers block requests without a User-Agent
            },
            responseType: "stream", // Ensures streaming responses (e.g., video)
        });

        res.set(response.headers); // Forward original headers
        response.data.pipe(res); // Pipe the response to the client
    } catch (error) {
        console.error("Error fetching the URL:", error.message);
        res.status(500).json({ error: "Failed to fetch the resource" });
    }
});

app.listen(PORT, () => {
    console.log(`CORS Proxy running at http://localhost:${PORT}`);
});
