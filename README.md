# Student Landing Page Tool

A Node.js application that simplifies the process of creating student landing pages in HubSpot. This tool allows you to quickly create landing pages from templates and manage student access.

## Features

- Create landing pages from existing HubSpot templates
- Support for default template configuration
- Student page creation with custom titles
- Manual access management through HubSpot interface
- Team assignment capability
- Responsive and user-friendly interface

## Prerequisites

- Node.js (v12 or higher)
- HubSpot CMS account with appropriate permissions
- HubSpot API key with necessary access

## Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd student-landing-page-tool
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
PORT=3000
HUBSPOT_TOKEN=your_hubspot_api_token
HUBSPOT_PORTAL_ID=your_hubspot_portal_id
DEFAULT_TEMPLATE_ID=your_default_template_id  # Optional
```

## Environment Variables

- `PORT`: The port number for the application (default: 3000)
- `HUBSPOT_TOKEN`: Your HubSpot API token
- `HUBSPOT_PORTAL_ID`: Your HubSpot portal ID
- `DEFAULT_TEMPLATE_ID`: (Optional) ID of the default template to use for all pages

## Usage

1. Start the application:
```bash
npm start
```

2. Open your browser and navigate to `http://localhost:3000`

3. Fill in the form with:
   - Student Name
   - Student Email
   - Page Title
   - Template (if no default template is set)
   - Team Assignment (optional)

4. Click "Create My Page" to generate the landing page

5. After creation, manually assign access to students through the HubSpot interface

## API Endpoints

### GET /
- Displays the main form for creating landing pages
- Shows available templates and teams

### POST /clone
- Creates a new landing page based on form submission
- Parameters:
  - `studentName`: Name of the student
  - `studentEmail`: Student's email address
  - `templateId`: ID of the template to use
  - `newTitle`: Title for the new page
  - `assignToTeam`: Whether to assign to a team (optional)
  - `teamId`: ID of the team to assign (optional)

## Error Handling

The application includes comprehensive error handling for:
- Invalid API credentials
- Missing templates
- Network issues
- User permission errors

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 