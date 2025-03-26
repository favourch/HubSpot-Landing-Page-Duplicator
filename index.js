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

app.get('/', async (req, res) => {
  const templates = await fetchLandingPageTemplates();
  const teams = await fetchHubSpotTeams();
  
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Create Student Landing Page</title>
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

      input, select {
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
      }

      select {
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

      input:focus, select:focus {
        outline: none;
        border-color: #0091ae;
        box-shadow: 0 0 0 3px rgba(0, 145, 174, 0.1);
        background-color: white;
      }

      /* Style for select options */
      select option {
        padding: 12px;
        background-color: white;
        color: #33475b;
        font-size: 14px;
      }

      /* Custom dropdown container */
      .select-wrapper {
        position: relative;
        width: 100%;
      }

      .select-wrapper::after {
        content: "";
        position: absolute;
        top: 50%;
        right: 12px;
        transform: translateY(-50%);
        width: 24px;
        height: 24px;
        pointer-events: none;
      }

      /* Disabled state */
      select:disabled {
        background-color: #f5f8fa;
        border-color: #cbd6e2;
        cursor: not-allowed;
        opacity: 0.7;
      }

      /* Error state */
      select.error {
        border-color: #ff3b30;
        background-color: #fff5f5;
      }

      select.error:focus {
        box-shadow: 0 0 0 3px rgba(255, 59, 48, 0.1);
      }

      /* Success state */
      select.success {
        border-color: #00a4bd;
        background-color: #f0fafb;
      }

      select.success:focus {
        box-shadow: 0 0 0 3px rgba(0, 164, 189, 0.1);
      }

      /* Placeholder styling */
      select option[value=""] {
        color: #8f98a3;
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

      @media (hover: none) {
        button:hover {
          background-color: #ff7a59;
        }
        button:active {
          background-color: #ff8f73;
        }
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

      .switch-container {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 1.5rem;
      }

      .switch {
        position: relative;
        display: inline-block;
        width: 50px;
        height: 24px;
      }

      .switch input {
        opacity: 0;
        width: 0;
        height: 0;
      }

      .slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #cbd6e2;
        transition: .4s;
        border-radius: 24px;
      }

      .slider:before {
        position: absolute;
        content: "";
        height: 16px;
        width: 16px;
        left: 4px;
        bottom: 4px;
        background-color: white;
        transition: .4s;
        border-radius: 50%;
      }

      input:checked + .slider {
        background-color: #ff7a59;
      }

      input:checked + .slider:before {
        transform: translateX(26px);
      }

      #teamSelect {
        display: none;
      }

      #teamSelect.visible {
        display: block;
      }
    </style>
    <h1>Tamwood</h1>
    <form method="POST" action="/clone">
      ${templates.length === 0 && !DEFAULT_TEMPLATE_ID ? 
        '<div class="error-message">No templates found. Please check your HubSpot API token.</div>' : 
        ''}
      <label>Student Name: <input type="text" name="studentName" required autocomplete="name" /></label>
      <label>
        Student Email: 
        <input type="email" name="studentEmail" required autocomplete="email" />
        <div class="info-text">The student will receive edit access to their page</div>
      </label>
      ${DEFAULT_TEMPLATE_ID ? 
        `<input type="hidden" name="templateId" value="${DEFAULT_TEMPLATE_ID}"/>` :
        `<label>Template Page:
          <select name="templateId" required>
            <option value="">Select a template</option>
            ${templates.map(template => `
              <option value="${template.id}">${template.name}</option>
            `).join('')}
          </select>
        </label>`
      }
      <label>New Page Title: <input type="text" name="newTitle" required /></label>
      
      <div class="switch-container">
        <label class="switch">
          <input type="checkbox" id="teamToggle" name="assignToTeam">
          <span class="slider"></span>
        </label>
        <span>Assign to Team</span>
      </div>

      <label id="teamSelect">
        Team:
        <select name="teamId">
          <option value="">Select a team</option>
          ${teams.map(team => `
            <option value="${team.id}">${team.name}</option>
          `).join('')}
        </select>
      </label>

      <button type="submit">Create My Page</button>
    </form>

    <script>
      document.getElementById('teamToggle').addEventListener('change', function() {
        const teamSelect = document.getElementById('teamSelect');
        teamSelect.classList.toggle('visible');
        const teamIdSelect = teamSelect.querySelector('select');
        teamIdSelect.required = this.checked;
      });
    </script>
    </body>
    </html>
  `);
});

app.post('/clone', async (req, res) => {
  const { studentName, studentEmail, templateId, newTitle, assignToTeam, teamId } = req.body;

  try {
    // 1. First verify if the user exists in HubSpot
    const userCheck = await checkUserExists(studentEmail);
    
    if (!userCheck.exists) {
      return res.status(400).send(`
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
          .error-container {
            background: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            width: 100%;
            max-width: 400px;
            text-align: center;
          }
          .error-message {
            color: #ff3b30;
            margin-bottom: 1.5rem;
          }
          .error-details {
            background-color: #fff5f5;
            padding: 12px;
            border-radius: 4px;
            margin-bottom: 1.5rem;
            text-align: left;
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
            transition: background-color 0.15s ease;
          }
          .button:hover {
            background-color: #ff8f73;
          }
        </style>
        <div class="error-container">
          <h2 class="error-message">User Not Found</h2>
          <div class="error-details">
            <p>The email address "${studentEmail}" is not registered as a HubSpot user.</p>
            <p>Please make sure:</p>
            <ul>
              <li>The email address is spelled correctly</li>
              <li>The user has been added to your HubSpot account</li>
              <li>The user has accepted their HubSpot invitation</li>
            </ul>
            <p>The landing page was not created. Please add the user to HubSpot first.</p>
          </div>
          <a href="/" class="button">Try Again</a>
        </div>
      `);
    }

    // 2. Fetch the template landing page
    const template = await axios.get(
      `https://api.hubapi.com/cms/v3/pages/landing-pages/${templateId}`,
      {
        headers: {
          Authorization: `Bearer ${HUBSPOT_TOKEN}`
        }
      }
    );

    const templateData = template.data;

    // 3. Prepare clone data
    const newPage = {
      name: `${studentName} - ${newTitle}`,
      slug: `student-${studentName.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
      htmlTitle: newTitle,
      templatePath: templateData.templatePath,
      language: templateData.language || 'en',
      websitePageType: templateData.websitePageType,
      widgets: templateData.widgets,
      layoutSections: templateData.layoutSections,
    };

    // 4. Create the new landing page
    const response = await axios.post(
      `https://api.hubapi.com/cms/v3/pages/landing-pages`,
      newPage,
      {
        headers: {
          Authorization: `Bearer ${HUBSPOT_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const newPageId = response.data.id;
    const editUrl = `https://app.hubspot.com/pages/${PORTAL_ID}/edit/${newPageId}`;

    // Send success response with the edit URL and manual assignment instructions
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
        .info-message {
          color: #ff7a59;
          margin: 1rem 0;
          padding: 12px;
          background-color: #fff5f5;
          border-radius: 4px;
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
        .secondary-button {
          background-color: #cbd6e2;
        }
        .secondary-button:hover {
          background-color: #b4c2d3;
        }
      </style>
      <div class="message-container">
        <h2 class="success-message">Landing Page Created</h2>
        <p>A new landing page has been created for ${studentName}</p>
        <p class="info-message">
          Note: The page was created but there was an issue granting access to ${studentEmail}.<br>
          You may need to add them manually through the HubSpot interface.
        </p>
        <div>
          <a href="${editUrl}" class="button" target="_blank">Edit Your Page</a>
          <a href="/" class="button secondary-button">Create Another</a>
        </div>
      </div>
    `);

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    
    // Send a formatted error page with more specific error messages
    res.status(500).send(`
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
        .error-container {
          background: white;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          width: 100%;
          max-width: 400px;
          text-align: center;
        }
        .error-message {
          color: #ff3b30;
          margin-bottom: 1.5rem;
        }
        .error-details {
          background-color: #fff5f5;
          padding: 12px;
          border-radius: 4px;
          margin-bottom: 1.5rem;
          text-align: left;
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
          transition: background-color 0.15s ease;
        }
        .button:hover {
          background-color: #ff8f73;
        }
      </style>
      <div class="error-container">
        <h2 class="error-message">Error Creating Landing Page</h2>
        <div class="error-details">
          ${error.response?.data?.message || error.message}
        </div>
        <a href="/" class="button">Try Again</a>
      </div>
    `);
  }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));


