const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all routes with more options
app.use(cors({
    origin: '*',
    methods: ['GET', 'HEAD'],
    credentials: true,
    optionsSuccessStatus: 204
}));

app.get("/proxy", async (req, res) => {
    const targetUrl = req.query.url;

    if (!targetUrl) {
        return res.status(400).json({ error: "Missing 'url' query parameter" });
    }

    console.log(`Proxying request for: ${targetUrl}`);

    try {
        const headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            "Referer": "https://megacloud.club/",
            "Origin": "https://megacloud.club",
            "Accept": "*/*",
            "Accept-Language": "en-US,en;q=0.9",
            "Connection": "keep-alive",
        };

        // Determine the appropriate responseType
        let responseType = 'arraybuffer';  // Default for binary content
        if (targetUrl.endsWith('.m3u8') || targetUrl.endsWith('.vtt')) {
            responseType = 'text';  // For text-based formats
        }

        const response = await axios({
            method: 'get',
            url: targetUrl,
            headers: headers,
            responseType: responseType,
            maxRedirects: 5,
            timeout: 30000,
        });

        // Process m3u8 files to ensure all URLs are absolute and proxied
        if (targetUrl.endsWith(".m3u8")) {
            const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf("/") + 1);
            
            let m3u8Content = response.data;
            
            // Replace relative URLs with absolute URLs
            m3u8Content = m3u8Content.replace(
                /^(?!#)(?!https?:\/\/)([^\n\r]+)/gm,
                (match) => `${baseUrl}${match}`
            );
            
            // Set appropriate headers
            res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
            return res.send(m3u8Content);
        }
        
        // For binary responses (video segments, images, etc.)
        if (responseType === 'arraybuffer') {
            // Forward the content type and other relevant headers
            if (response.headers['content-type']) {
                res.setHeader('Content-Type', response.headers['content-type']);
            }
            
            if (response.headers['content-length']) {
                res.setHeader('Content-Length', response.headers['content-length']);
            }
            
            // Send the binary data
            return res.send(Buffer.from(response.data));
        }

        // For text-based responses
        if (response.headers['content-type']) {
            res.setHeader('Content-Type', response.headers['content-type']);
        }
        res.send(response.data);
    } catch (error) {
        console.error("Error fetching the URL:", error.message);
        if (error.response) {
            console.error(`Status: ${error.response.status}, Data:`, error.response.data);
        }
        res.status(500).json({ 
            error: "Failed to fetch the resource", 
            message: error.message,
            url: targetUrl 
        });
    }
});

app.listen(PORT, () => {
    console.log(`CORS Proxy running at http://localhost:${PORT}`);
});