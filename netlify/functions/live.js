exports.handler = async function () {

  const API_KEY = process.env.RUNFLIX_API_KEY;

  if (!API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "API key is not configured"
      })
    };
  }

  try {

    const response = await fetch(
      "https://apimovie.runflix.name.ng/v1/football/live",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          Accept: "application/json"
        }
      }
    );

    const data = await response.json();

    return {
      statusCode: response.status,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=30"
      },
      body: JSON.stringify(data)
    };

  } catch (error) {

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Unable to connect to live sports API"
      })
    };

  }

};