exports.handler = async function () {
  const API_KEY = process.env.RUNFLIX_API_KEY;

  if (!API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "API key is not configured in Netlify"
      })
    };
  }

  try {
    const response = await fetch(
      "http://apimovie.runflix.name.ng/v1/football/live",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          Accept: "application/json"
        }
      }
    );

    const responseText = await response.text();

    return {
      statusCode: response.status,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=30"
      },
      body: JSON.stringify({
        api_status: response.status,
        api_response: responseText
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message
      })
    };
  }
};