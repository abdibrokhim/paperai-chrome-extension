require('dotenv').config();
const fetch = require('node-fetch');

let accessToken = null;
let tokenExpiry = null;
let isFetchingToken = false;
let fetchTokenPromise = null;

/**
 * Fetches a new access token using the IBM API key.
 */
const fetchNewAccessToken = async () => {
  const apiKey = process.env.NEXT_PUBLIC_IBM_API_KEY;
  const tokenUrl = process.env.NEXT_PUBLIC_IBM_TOKEN_URL;

  if (!apiKey || !tokenUrl) {
    throw new Error('Missing IBM_API_KEY or IBM_TOKEN_URL in environment variables.');
  }

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ibm:params:oauth:grant-type:apikey',
      apikey: apiKey,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch access token: ${errorText}`);
  }

  const data = await response.json();

  accessToken = data.access_token;
  // Set token expiry 60 seconds before actual expiry to account for network delays
  if (data.expires_in) {
    tokenExpiry = Date.now() + (data.expires_in - 60) * 1000; // Convert to milliseconds
  }

  return accessToken;
};

/**
 * Retrieves the current access token, fetching a new one if expired or missing.
 * Implements a lock to prevent concurrent token fetches.
 */
const getAccessToken = async () => {
  if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
    return accessToken;
  }

  if (isFetchingToken && fetchTokenPromise) {
    // Wait for the ongoing token fetch to complete
    return fetchTokenPromise;
  }

  isFetchingToken = true;
  fetchTokenPromise = fetchNewAccessToken()
    .then((token) => {
      isFetchingToken = false;
      fetchTokenPromise = null;
      return token;
    })
    .catch((error) => {
      isFetchingToken = false;
      fetchTokenPromise = null;
      throw error;
    });

  return fetchTokenPromise;
};

module.exports = { getAccessToken };