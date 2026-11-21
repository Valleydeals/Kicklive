exports.handler = async function (event) {

  const API_KEY = process.env.RUNFLIX_API_KEY;

  const matchId = event.queryStringParameters?.id;

  if (!API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "API key is not configured"
      })
    };
  }

  if (!matchId) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: "Match ID is required"
      })
    };
  }

  try {

    const response = await fetch(
      `https://apimovie.runflix.name.ng/v1/football/match/${encodeURIComponent(matchId)}/stream`,
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
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    };

  } catch (error) {

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Unable to retrieve stream"
      })
    };

  }

};