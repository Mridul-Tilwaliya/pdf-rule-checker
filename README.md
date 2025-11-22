# PDF Rule Checker

A full-stack web application that checks PDF documents against user-defined rules using LLM (Large Language Model) analysis.

**Repository:** [https://github.com/Mridul-Tilwaliya/pdf-rule-checker](https://github.com/Mridul-Tilwaliya/pdf-rule-checker)

## Features

- 📄 Upload PDF files (2-10 pages recommended)
- ✍️ Define up to 3 custom rules to check
- 🤖 AI-powered rule validation using OpenAI GPT
- 📊 Detailed results with:
  - PASS/FAIL status for each rule
  - Evidence sentences from the document
  - Reasoning explanations
  - Confidence scores (0-100)

## Tech Stack

- **Frontend:** React + Vite
- **Backend:** Node.js + Express
- **PDF Processing:** pdf-parse
- **LLM:** OpenAI GPT (configurable)

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Mridul-Tilwaliya/pdf-rule-checker.git
   cd pdf-rule-checker
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```
   
   Or install separately:
   ```bash
   npm install
   cd server && npm install
   cd ../client && npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the `server` directory:
   ```bash
   cd server
   cp .env.example .env
   ```
   
   Edit `server/.env` and add your OpenAI API key:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   OPENAI_MODEL=gpt-4o-mini
   PORT=5000
   ```

## Running the Application

### Development Mode (Both Frontend and Backend)

From the root directory:
```bash
npm run dev
```

This will start:
- Backend server on `http://localhost:5000`
- Frontend app on `http://localhost:3000`

### Running Separately

**Backend only:**
```bash
cd server
npm run dev
```

**Frontend only:**
```bash
cd client
npm run dev
```

## Usage

1. **Open the application** in your browser at `http://localhost:3000`

2. **Upload a PDF** by clicking the upload area or selecting a file

3. **Enter up to 3 rules** in the input fields. Examples:
   - "The document must have a purpose section."
   - "The document must mention at least one date."
   - "The document must define at least one term."
   - "The document must mention who is responsible."
   - "The document must list any requirements."

4. **Click "Check Document"** to analyze the PDF

5. **View results** in the table showing:
   - Status (PASS/FAIL)
   - Evidence from the document
   - Reasoning for the decision
   - Confidence score

## API Endpoints

### POST `/api/check-pdf`

Checks a PDF against provided rules.

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Body:
  - `pdf`: PDF file
  - `rules`: JSON array of rule strings

**Response:**
```json
{
  "results": [
    {
      "rule": "The document must mention a date.",
      "status": "pass",
      "evidence": "Found in page 1: 'Published 2024'",
      "reasoning": "Document includes a publication year.",
      "confidence": 92
    }
  ]
}
```

### GET `/health`

Health check endpoint.

## Project Structure

```
pdf-rule-checker/
├── server/
│   ├── index.js          # Express server and API endpoints
│   ├── package.json
│   ├── .env.example
│   └── uploads/          # Temporary PDF storage (auto-created)
├── client/
│   ├── src/
│   │   ├── App.jsx       # Main React component
│   │   ├── App.css       # Styles
│   │   ├── main.jsx      # React entry point
│   │   └── index.css     # Global styles
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── package.json          # Root package.json with scripts
└── README.md
```

## Configuration

### OpenAI Model

You can change the OpenAI model in `server/.env`:
- `gpt-4o-mini` (default, cost-effective)
- `gpt-4o` (more accurate, higher cost)
- `gpt-3.5-turbo` (alternative option)

### File Size Limit

Default limit is 10MB. Modify in `server/index.js`:
```javascript
limits: { fileSize: 10 * 1024 * 1024 } // 10MB
```

## Troubleshooting

### "OPENAI_API_KEY is not set"
- Make sure you've created `server/.env` file
- Verify the API key is correct and has credits

### "Failed to extract text from PDF"
- Ensure the PDF contains extractable text (not just images)
- Try a different PDF file

### CORS errors
- Make sure backend is running on port 5000
- Check that frontend proxy is configured correctly in `vite.config.js`
