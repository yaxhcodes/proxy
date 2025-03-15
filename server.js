const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());

app.get("/proxy", async (req, res) => {
    const targetUrl = req.query.url;

    if (!targetUrl) {
        return res.status(400).json({ error: "Missing 'url' query parameter" });
    }

    try {
        const response = await axios.get(targetUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0",
                "Referer": "https://megacloud.club/",
            },
            responseType: "text", // Change from 'stream' to 'text'
        });

        // If it's an M3U8 file, rewrite its contents
        if (targetUrl.endsWith(".m3u8")) {
            let baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf("/") + 1); // Get base URL

            let modifiedM3U8 = response.data.replace(
                /^(?!#)(?!http)([^\n\r]+)/gm, // Match non-comment, non-absolute URLs
                `${baseUrl}$1` // Convert to absolute URL
            );

            res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
            return res.send(modifiedM3U8);
        }

        // For non-M3U8 files, forward as is
        res.set(response.headers);
        res.send(response.data);
    } catch (error) {
        console.error("Error fetching the URL:", error.message);
        res.status(500).json({ error: "Failed to fetch the resource" });
    }
});

app.listen(PORT, () => {
    console.log(`CORS Proxy running at http://localhost:${PORT}`);
});
