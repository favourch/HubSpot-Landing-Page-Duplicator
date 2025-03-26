const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const HUBSPOT_TOKEN = process.env.HUBSPOT_TOKEN;
const PORTAL_ID = process.env.HUBSPOT_PORTAL_ID;
const DEFAULT_TEMPLATE_ID = process.env.DEFAULT_TEMPLATE_ID;

// Add debug log
console.log('DEFAULT_TEMPLATE_ID:', DEFAULT_TEMPLATE_ID);

// Add function to fetch teams
async function fetchHubSpotTeams() {
  try {
    const response = await axios.get(
      'https://api.hubapi.com/settings/v3/users/teams',
      {
        headers: {
          Authorization: `Bearer ${HUBSPOT_TOKEN}`
        }
      }
    );
    return response.data.results || [];
  } catch (error) {
    console.error('Error fetching teams:', error);
    return [];
  }
}

// Add function to fetch landing pages
async function fetchLandingPages() {
  try {
    const response = await axios.get(
      'https://api.hubapi.com/cms/v3/pages/landing-pages',
      {
        headers: {
          Authorization: `Bearer ${HUBSPOT_TOKEN}`
        },
        params: {
          limit: 100
        }
      }
    );
    return response.data.results || [];
  } catch (error) {
    console.error('Error fetching pages:', error);
    return [];
  }
}

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// Add this function before the routes
async function fetchLandingPageTemplates() {
  // Only fetch templates if no default template is set
  if (DEFAULT_TEMPLATE_ID) {
    return [];
  }

  try {
    const response = await axios.get(
      'https://api.hubapi.com/cms/v3/pages/landing-pages',
      {
        headers: {
          Authorization: `Bearer ${HUBSPOT_TOKEN}`
        },
        params: {
          limit: 100
        }
      }
    );
    return response.data.results;
  } catch (error) {
    console.error('Error fetching templates:', error);
    return [];
  }
}

// Add this function before the routes
async function checkUserExists(email) {
  try {
    // Use the settings API to get users
    const response = await axios.get(
      'https://api.hubapi.com/settings/v3/users',
      {
        headers: {
          Authorization: `Bearer ${HUBSPOT_TOKEN}`
        }
      }
    );
    
    // Add debug logging
    console.log('Users API Response:', JSON.stringify(response.data, null, 2));
    
    // Find the user with matching email
    const user = response.data.results.find(user => user.email === email);
    return user ? { exists: true, userId: user.id } : { exists: false };
  } catch (error) {
    console.error('Error checking user:', error.response?.data || error);
    return { exists: false };
  }
}

// Add the /assign route to serve the form
app.get('/assign', async (req, res) => {
  const teams = await fetchHubSpotTeams();
  const pages = await fetchLandingPages();
  
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Assign Team Edit Access</title>
    </head>
    <body>
    <style>
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
        background-color: #f5f8fa;
        min-height: 100vh;
        margin: 0;
        padding: 20px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 2rem;
      }

      h1 {
        color: #33475b;
        font-size: clamp(2rem, 5vw, 3rem);
        font-weight: 700;
        text-align: center;
        margin: 0;
        padding: 0;
        letter-spacing: -0.02em;
      }

      form {
        background: white;
        padding: clamp(1rem, 5vw, 2rem);
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        width: min(100%, 400px);
        margin: auto;
      }

      label {
        display: block;
        margin-bottom: 1.5rem;
        color: #33475b;
        font-weight: 500;
      }

      select {
        width: 100%;
        padding: clamp(8px, 2vw, 12px);
        margin-top: 6px;
        border: 1px solid #cbd6e2;
        border-radius: 4px;
        font-size: clamp(14px, 4vw, 16px);
        transition: all 0.2s ease;
        -webkit-appearance: none;
        appearance: none;
        background-color: white;
        cursor: pointer;
        background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23516f90' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
        background-repeat: no-repeat;
        background-position: right 12px center;
        background-size: 16px;
        padding-right: 40px;
      }

      select:hover {
        border-color: #0091ae;
        background-color: #f8fafb;
      }

      select:focus {
        outline: none;
        border-color: #0091ae;
        box-shadow: 0 0 0 3px rgba(0, 145, 174, 0.1);
        background-color: white;
      }

      select option {
        padding: 12px;
        background-color: white;
        color: #33475b;
        font-size: 14px;
      }

      button {
        background-color: #ff7a59;
        color: white;
        border: none;
        padding: clamp(10px, 3vw, 12px) clamp(16px, 5vw, 24px);
        border-radius: 4px;
        font-size: clamp(14px, 4vw, 16px);
        font-weight: 600;
        cursor: pointer;
        width: 100%;
        transition: background-color 0.15s ease;
        -webkit-tap-highlight-color: transparent;
      }

      button:hover {
        background-color: #ff8f73;
      }

      .error-message {
        color: #ff3b30;
        background-color: #fff5f5;
        padding: clamp(8px, 2vw, 12px);
        border-radius: 4px;
        margin-bottom: 1.5rem;
        font-size: clamp(14px, 4vw, 16px);
      }

      .info-text {
        font-size: clamp(12px, 3.5vw, 14px);
        color: #516f90;
        margin-top: 4px;
      }

      @media (max-width: 380px) {
        body {
          padding: 10px;
        }
        
        form {
          padding: 1rem;
        }
        
        label {
          margin-bottom: 1rem;
        }
      }
    </style>
    <h1>Assign Edit Access</h1>
    <form method="POST" action="/clone">
      <label>Select Page:
        <select name="pageId" required>
          <option value="">Choose a page to assign</option>
          ${pages.map(page => `
            <option value="${page.id}">${page.name}</option>
          `).join('')}
        </select>
        <div class="info-text">Select the page you want to grant access to</div>
      </label>

      <label>Select Team:
        <select name="teamId" required>
          <option value="">Choose a team to grant edit access</option>
          ${teams.map(team => `
            <option value="${team.id}">${team.name}</option>
          `).join('')}
        </select>
        <div class="info-text">The selected team will be granted edit access to the page</div>
      </label>

      <button type="submit">Grant Edit Access</button>
    </form>
    </body>
    </html>
  `);
});

// Update the root route to redirect to /assign
app.get('/', (req, res) => {
  res.redirect('/assign');
});

// Update the clone endpoint to handle team assignment to specific page
app.post('/clone', async (req, res) => {
  const { pageId, teamId } = req.body;

  if (!pageId || !teamId) {
    return res.status(400).send('Please select both a page and a team');
  }

  try {
    // First update the page properties
    try {
      // Update page details first
      await axios.patch(
        `https://api.hubapi.com/cms/v3/pages/landing-pages/${pageId}`,
        {
          metaDescription: "Team Access Updated",
          name: `Landing Page - Team ${teamId}`
        },
        {
          headers: {
            Authorization: `Bearer ${HUBSPOT_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Then try to set team access using the team permissions endpoint
      await axios.post(
        `https://api.hubapi.com/cms/v3/permissions/teams/${teamId}/content/${pageId}`,
        {
          role: "EDIT_CONTENT"
        },
        {
          headers: {
            Authorization: `Bearer ${HUBSPOT_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const editUrl = `https://app.hubspot.com/pages/${PORTAL_ID}/edit/${pageId}`;

      res.send(`
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            background-color: #f5f8fa;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            padding: 20px;
          }
          .message-container {
            background: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            width: 100%;
            max-width: 400px;
            text-align: center;
          }
          .success-message {
            color: #00a4bd;
            margin-bottom: 1.5rem;
          }
          .button {
            background-color: #ff7a59;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 4px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            margin: 8px;
            transition: background-color 0.15s ease;
          }
          .button:hover {
            background-color: #ff8f73;
          }
        </style>
        <div class="message-container">
          <h2 class="success-message">Edit Access Granted Successfully!</h2>
          <div>
            <a href="${editUrl}" class="button" target="_blank">View Page</a>
            <a href="/assign" class="button">Assign Another</a>
          </div>
        </div>
      `);
    } catch (error) {
      console.error('Error assigning team:', error);
      res.status(500).send('Error granting edit access to the team');
    }
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    res.status(500).send('Error processing your request');
  }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));


