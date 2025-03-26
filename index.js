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
  
  // Generate dynamic OG image SVG
  const ogImageSvg = `
    <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="630" fill="#f5f8fa"/>
      <text x="50%" y="45%" text-anchor="middle" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif" font-size="72" font-weight="bold" fill="#33475b">Tamwood</text>
      <text x="50%" y="60%" text-anchor="middle" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif" font-size="36" fill="#516f90">Student Landing Page Creator</text>
    </svg>
  `;

  // Convert SVG to base64
  const ogImageBase64 = Buffer.from(ogImageSvg).toString('base64');
  const ogImageUrl = `data:image/svg+xml;base64,${ogImageBase64}`;
  
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="description" content="Create and manage student landing pages for Tamwood using HubSpot templates">
      <meta name="keywords" content="Tamwood, HubSpot, Landing Pages, Student Portal">
      <meta name="author" content="Tamwood">
      <meta name="theme-color" content="#f5f8fa">
      
      <!-- Open Graph / Facebook -->
      <meta property="og:type" content="website">
      <meta property="og:url" content="${req.protocol}://${req.get('host')}${req.originalUrl}">
      <meta property="og:title" content="Tamwood Student Landing Page Creator">
      <meta property="og:description" content="Create and manage student landing pages for Tamwood using HubSpot templates">
      <meta property="og:image" content="${ogImageUrl}">

      <!-- Twitter -->
      <meta property="twitter:card" content="summary_large_image">
      <meta property="twitter:url" content="${req.protocol}://${req.get('host')}${req.originalUrl}">
      <meta property="twitter:title" content="Tamwood Student Landing Page Creator">
      <meta property="twitter:description" content="Create and manage student landing pages for Tamwood using HubSpot templates">
      <meta property="twitter:image" content="${ogImageUrl}">

      <!-- Favicon -->
      <link rel="icon" type="image/svg+xml" href="data:image/svg+xml;base64,${Buffer.from(`
        <svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="32" fill="#ff7a59"/>
          <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-family="system-ui" font-size="20" font-weight="bold" fill="white">T</text>
        </svg>
      `).toString('base64')}">
      
      <title>Create Student Landing Page | Tamwood</title>
    </head>
    <body>
    <style>
      :root {
        --primary-color: #ff7a59;
        --primary-hover: #ff8f73;
        --text-primary: #33475b;
        --text-secondary: #516f90;
        --bg-primary: #f5f8fa;
        --bg-secondary: #fff;
        --border-color: #cbd6e2;
        --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.1);
        --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.15);
        --radius-sm: 4px;
        --radius-md: 8px;
        --space-xs: 0.5rem;
        --space-sm: 1rem;
        --space-md: 1.5rem;
        --space-lg: 2rem;
      }

      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
        background-color: var(--bg-primary);
        min-height: 100vh;
        margin: 0;
        padding: var(--space-sm);
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: center;
        gap: var(--space-md);
        padding-top: max(var(--space-lg), 5vh);
      }

      .header-container {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
        margin-bottom: var(--space-sm);
      }

      h1 {
        color: var(--text-primary);
        font-size: clamp(1.5rem, 6vw, 2.5rem);
        font-weight: 700;
        text-align: center;
        letter-spacing: -0.02em;
      }

      .info-button {
        background: none;
        border: none;
        cursor: pointer;
        padding: var(--space-xs);
        color: var(--text-secondary);
        transition: all 0.2s ease;
        border-radius: 50%;
      }

      .info-button:hover {
        color: var(--text-primary);
        background-color: rgba(81, 111, 144, 0.1);
      }

      .info-button:focus {
        outline: none;
        box-shadow: 0 0 0 2px var(--primary-color);
      }

      .info-button svg {
        width: clamp(20px, 5vw, 24px);
        height: clamp(20px, 5vw, 24px);
      }

      .modal-overlay {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 1000;
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
        padding: var(--space-sm);
      }

      .modal-overlay.visible {
        display: flex;
        justify-content: center;
        align-items: center;
      }

      .info-card {
        background: var(--bg-secondary);
        padding: var(--space-lg);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-md);
        width: min(90%, 400px);
        position: relative;
        animation: slideIn 0.3s ease;
        max-height: 90vh;
        overflow-y: auto;
        margin: auto;
        scrollbar-width: thin;
        scrollbar-color: var(--border-color) transparent;
      }

      .info-card::-webkit-scrollbar {
        width: 6px;
      }

      .info-card::-webkit-scrollbar-track {
        background: transparent;
      }

      .info-card::-webkit-scrollbar-thumb {
        background-color: var(--border-color);
        border-radius: 3px;
      }

      @keyframes slideIn {
        from {
          transform: translate(-50%, -50%) scale(0.95);
          opacity: 0;
        }
        to {
          transform: translate(-50%, -50%) scale(1);
          opacity: 1;
        }
      }

      .close-button {
        position: absolute;
        top: 1rem;
        right: 1rem;
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px;
        color: var(--text-secondary);
        transition: color 0.2s ease;
      }

      .close-button:hover {
        color: var(--text-primary);
      }

      .close-button svg {
        width: 20px;
        height: 20px;
      }

      .info-card h2 {
        color: var(--text-primary);
        font-size: 1.2rem;
        margin-bottom: 1rem;
      }

      .info-card ol {
        color: var(--text-secondary);
        padding-left: 1.5rem;
        margin-bottom: 1rem;
      }

      .info-card li {
        margin-bottom: 0.5rem;
        line-height: 1.4;
      }

      .info-card .note {
        font-size: 0.9rem;
        color: var(--primary-color);
        padding: 0.75rem;
        background: #fff5f5;
        border-radius: 4px;
        margin-top: 0.5rem;
      }

      form {
        background: var(--bg-secondary);
        padding: var(--space-md);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-sm);
        width: min(100%, 400px);
        margin: 0 auto;
        transition: transform 0.3s ease;
      }

      form:focus-within {
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
      }

      label {
        display: block;
        margin-bottom: var(--space-md);
        color: var(--text-primary);
        font-weight: 500;
        font-size: 0.95rem;
      }

      input, select {
        width: 100%;
        padding: 0.75rem;
        margin-top: var(--space-xs);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-sm);
        font-size: 1rem;
        transition: all 0.2s ease;
        background-color: var(--bg-secondary);
      }

      input:hover, select:hover {
        border-color: var(--text-secondary);
      }

      input:focus, select:focus {
        outline: none;
        border-color: var(--primary-color);
        box-shadow: 0 0 0 3px rgba(255, 122, 89, 0.1);
      }

      .info-text {
        font-size: 0.85rem;
        color: var(--text-secondary);
        margin-top: var(--space-xs);
      }

      button[type="submit"] {
        background-color: var(--primary-color);
        color: white;
        border: none;
        padding: 0.875rem var(--space-md);
        border-radius: var(--radius-sm);
        font-size: 1rem;
        font-weight: 600;
        width: 100%;
        cursor: pointer;
        transition: all 0.2s ease;
        margin-top: var(--space-md);
      }

      button[type="submit"]:hover {
        background-color: var(--primary-hover);
        transform: translateY(-1px);
      }

      button[type="submit"]:active {
        transform: translateY(0);
      }

      .switch-container {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
        margin-bottom: var(--space-md);
        padding: var(--space-sm) 0;
      }

      /* Add styles for team select visibility */
      #teamSelect {
        display: none;
        opacity: 0;
        height: 0;
        margin: 0;
        transition: opacity 0.3s ease, margin 0.3s ease;
        overflow: hidden;
      }

      #teamSelect.visible {
        display: block;
        opacity: 1;
        height: auto;
        margin-bottom: var(--space-md);
      }

      /* Update switch styles */
      .switch {
        position: relative;
        display: inline-block;
        width: 44px;
        height: 22px;
        flex-shrink: 0;
      }

      .slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: var(--border-color);
        transition: .4s;
        border-radius: 22px;
      }

      .slider:before {
        position: absolute;
        content: "";
        height: 18px;
        width: 18px;
        left: 2px;
        bottom: 2px;
        background-color: white;
        transition: .4s;
        border-radius: 50%;
      }

      input:checked + .slider {
        background-color: var(--primary-color);
      }

      input:checked + .slider:before {
        transform: translateX(22px);
      }

      @media (min-width: 768px) {
        body {
          padding: var(--space-lg);
          gap: var(--space-lg);
        }

        form {
          padding: var(--space-lg);
        }

        .header-container {
          margin-bottom: var(--space-lg);
        }

        input, select {
          font-size: 1rem;
          padding: 0.875rem;
        }

        .info-text {
          font-size: 0.9rem;
        }
      }

      @media (max-width: 380px) {
        body {
          padding: var(--space-sm);
        }
        
        form {
          padding: var(--space-md);
        }
        
        label {
          margin-bottom: var(--space-sm);
        }

        .info-card {
          padding: var(--space-md);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        * {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
          scroll-behavior: auto !important;
        }
      }
    </style>
    <div class="header-container">
      <h1>Tamwood</h1>
      <button type="button" class="info-button" aria-label="Show information" id="showInfo">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
    </div>

    <div class="modal-overlay" id="infoModal">
      <div class="info-card">
        <button type="button" class="close-button" aria-label="Close information" id="closeInfo">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h2>How it works</h2>
        <ol>
          <li>Enter the student's name for the landing page title</li>
          <li>Validate their HubSpot email to ensure they have an account</li>
          <li>Choose a template (if no default is set)</li>
          <li>Set a title for their new page</li>
          <li>Optionally assign to a team</li>
        </ol>
        <div class="note">
          Note: After creation, if you prefer you'll need to manually assign landing page access to the team/student through HubSpot's interface if you want to restrict access.
        </div>
      </div>
    </div>

    <form method="POST" action="/clone">
      ${templates.length === 0 && !DEFAULT_TEMPLATE_ID ? 
        '<div class="error-message">No templates found. Please check your HubSpot API token.</div>' : 
        ''}
      <label>Student Name: <input type="text" name="studentName" required autocomplete="name" /></label>
      <label>
        Validate Student Email: 
        <input type="email" name="studentEmail" required autocomplete="email" />
        <div class="info-text">Student must have an existing HubSpot account</div>
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
        
        // Add smooth transition when showing/hiding
        if (this.checked) {
          teamSelect.style.display = 'block';
          // Use setTimeout to ensure the display: block has taken effect
          setTimeout(() => {
            teamSelect.style.opacity = '1';
            teamSelect.style.height = 'auto';
          }, 10);
        } else {
          teamSelect.style.opacity = '0';
          teamSelect.style.height = '0';
          // Wait for transition to complete before hiding
          setTimeout(() => {
            teamSelect.style.display = 'none';
          }, 300);
        }
      });

      // Add modal functionality
      const showInfo = document.getElementById('showInfo');
      const closeInfo = document.getElementById('closeInfo');
      const infoModal = document.getElementById('infoModal');

      showInfo.addEventListener('click', () => {
        infoModal.classList.add('visible');
        document.body.style.overflow = 'hidden';
      });

      closeInfo.addEventListener('click', () => {
        infoModal.classList.remove('visible');
        document.body.style.overflow = '';
      });

      infoModal.addEventListener('click', (e) => {
        if (e.target === infoModal) {
          infoModal.classList.remove('visible');
          document.body.style.overflow = '';
        }
      });

      // Close on escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && infoModal.classList.contains('visible')) {
          infoModal.classList.remove('visible');
          document.body.style.overflow = '';
        }
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


