const express = require("express");
const getLatestDomain = require("./src/getLatestDomain");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

app.use((req, res, next) => {
  console.log(
    `[${new Date().toISOString()}] IR: ${req.method} ${req.originalUrl}`
  );
  next();
});

app.get("/:shortCode", async (req, res) => {
  let shortCode = req.params.shortCode;
  let v = req.query.v;
  let domain = await getLatestDomain();

  if (domain) {
    let parsedShortCode = shortCode;

    parsedShortCode = parsedShortCode.replaceAll("ac-", "amp/c/");
    parsedShortCode = parsedShortCode.replaceAll("bc-", "blog/");
    parsedShortCode = parsedShortCode.replaceAll("lc-", "location/");
    parsedShortCode = parsedShortCode.replaceAll("kc-", "keyword/");
    parsedShortCode = parsedShortCode.replaceAll("c-", "country=");
    parsedShortCode = parsedShortCode.replaceAll("s-", "city=");
    parsedShortCode = parsedShortCode.replaceAll("d-", "district=");
    parsedShortCode = parsedShortCode.replaceAll("p-", "page=");
    parsedShortCode = parsedShortCode.replaceAll("f-", ".");
    parsedShortCode = parsedShortCode.replaceAll("g-", ":");
    parsedShortCode = parsedShortCode.replaceAll("b-", "/");
    parsedShortCode = parsedShortCode.replaceAll("e-", "?");

    let targetUrlObject;
    try {
      let cleanBase = domain.domain.replace(/https?:\/\//, "");
      const baseUrl = `https://${cleanBase}`;
      // Note: The URL constructor handles appending the path correctly
      targetUrlObject = new URL(parsedShortCode, baseUrl);
    } catch (e) {
      console.error("Error creating target URL:", e);
      // Handle error (e.g., return a 500 error)
      return res.status(500).send("Invalid target domain or code.");
    }

    // 3. Append the original query string (req.query) to the new URL
    // In the example request, this is '?v=1761789480'

    let finalUrlString = targetUrlObject.href;

    if (finalUrlString.includes("?")) {
      finalUrlString += "&v=" + v;
    } else {
      finalUrlString += "?v=" + v;
    }

    res.status(301);

    res.set({
      Location: finalUrlString,
      "Content-Length": "0",
      "X-Content-Type-Options": "nosniff",
      "X-XSS-Protection": "1; mode=block",
      "Cache-Control": "no-cache, no-store, max-age=0, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    });

    res.end();
  } else {
    console.log(`\t-> Short code '${shortCode}' not found (Status 404)`);
    res.status(404).send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>404 Not Found</title>
                <style>body{font-family: Arial, sans-serif; text-align: center; padding: 50px;}</style>
            </head>
            <body>
                <h1>404 - Not Found</h1>
            </body>
            </html>
        `);
  }
});

app.get("/", (req, res) => {
  res.status(200).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>URL Shortener</title>
            <style>
                body { font-family: 'Inter', sans-serif; margin: 40px; background-color: #f4f4f9; border-radius: 8px; }
                .container { max-width: 600px; margin: auto; padding: 30px; background: white; box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-radius: 12px; }
                h1 { color: #1a73e8; margin-bottom: 20px; }
                ul { list-style: none; padding: 0; text-align: left; }
                li { margin-bottom: 10px; padding: 8px; border-bottom: 1px solid #eee; }
                code { background: #e6e6e6; padding: 3px 6px; border-radius: 4px; }
                .note { margin-top: 20px; padding: 15px; background: #d4edda; border: 1px solid #c3e6cb; color: #155724; border-radius: 8px; }
            </style>
        </head>
        <body>
          
        </body>
        </html>
    `);
});

// Start the server
app.listen(port, () => {
  console.log(`\n✅ Redirect Service running at http://localhost:${port}`);
});
