# Skillify Credentials Hub

A platform for managing and verifying professional credentials, skills and certificates.

## Getting Started

These instructions will help you set up the project locally for development and testing purposes.

### Prerequisites

- Node.js (v14 or later)
- MongoDB
- Cloudinary account (for image/PDF storage)

### Environment Setup

1. Clone the repository
2. Set up the frontend environment variables:
   - Copy `.env.example` to `.env` in the project root
   - Configure the API port if needed (default is 4000)

3. Set up the backend environment variables:
   - Copy `backend/.env.example` to `backend/.env`
   - Configure MongoDB, Cloudinary, and other settings

### Running the Application

#### Start the backend server

```bash
cd backend
npm install
npm run dev
```

The backend will start on port 4000 by default (configurable via PORT in backend/.env).

#### Start the frontend

```bash
# From the project root
npm install
npm run dev
```

The frontend will start on port 5173 by default (configurable via Vite).

### Handling Different Ports

The application is configured to handle different ports automatically:

- Backend port: Set via PORT in `backend/.env`
- Frontend port: Set automatically by Vite
- API connection: Configured via VITE_API_PORT in `.env`

### Environment Variables

This project uses Vite's environment variable system:
- All frontend environment variables must be prefixed with `VITE_`
- Variables are accessed using `import.meta.env.VITE_VARIABLE_NAME`
- Restart the development server after changing environment variables

## Features

- Credential management and verification
- AI-powered certificate validation
- Public profile sharing
- Skills tracking and visualization
- PDF and image certificate uploads

## License

This project is licensed under the MIT License - see the LICENSE file for details.
