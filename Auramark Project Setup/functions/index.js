const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
const cheerio = require("cheerio");

admin.initializeApp();

exports.fetchUrlMetadata = functions.https.onCall(async (data, context) => {
  const url = data.url;

  if (!url || typeof url !== 'string') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'The function must be called with a valid URL.'
    );
  }

  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      timeout: 5000 // 5 seconds timeout
    });

    const $ = cheerio.load(response.data);

    let title = $('meta[property="og:title"]').attr('content') ||
                $('meta[name="twitter:title"]').attr('content') ||
                $('title').text();

    let thumbnail = $('meta[property="og:image"]').attr('content') ||
                    $('meta[name="twitter:image"]').attr('content');

    // Fallback for thumbnail: try to find a favicon or a general image
    if (!thumbnail) {
      // Try to find a favicon
      const favicon = $('link[rel="icon"]').attr('href') ||
                      $('link[rel="shortcut icon"]').attr('href');
      if (favicon) {
        // Make favicon URL absolute if it's relative
        try {
          thumbnail = new URL(favicon, url).href;
        } catch (e) {
          // If URL parsing fails, keep it null
          thumbnail = null;
        }
      }
    }

    // Clean up title if it's too long or contains newlines
    if (title) {
      title = title.replace(/\s+/g, ' ').trim(); // Replace multiple spaces/newlines with single space
      if (title.length > 200) { // Truncate if too long
        title = title.substring(0, 197) + '...';
      }
    }

    return {
      title: title || null,
      thumbnail: thumbnail || null,
    };

  } catch (error) {
    console.error("Error fetching URL metadata:", error.message);
    // Provide more specific error messages based on error type
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      throw new functions.https.HttpsError(
        'unavailable',
        `Failed to fetch URL content. Status: ${error.response.status}`
      );
    } else if (error.request) {
      // The request was made but no response was received
      throw new functions.https.HttpsError(
        'deadline-exceeded',
        'No response received from the URL. It might be down or blocked.'
      );
    } else {
      // Something happened in setting up the request that triggered an Error
      throw new functions.https.HttpsError(
        'internal',
        `An unexpected error occurred: ${error.message}`
      );
    }
  }
});