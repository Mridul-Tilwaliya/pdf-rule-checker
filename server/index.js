import express from 'express';
import cors from 'cors';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
});

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Main endpoint: Check PDF against rules
app.post('/api/check-pdf', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    // Parse rules from FormData (comes as JSON string)
    let rules;
    try {
      rules = typeof req.body.rules === 'string' 
        ? JSON.parse(req.body.rules) 
        : req.body.rules;
    } catch (e) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Invalid rules format' });
    }

    if (!rules || !Array.isArray(rules) || rules.length === 0) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'At least one rule is required' });
    }

    // Extract text from PDF
    const pdfBuffer = fs.readFileSync(req.file.path);
    const pdfData = await pdfParse(pdfBuffer);
    const pdfText = pdfData.text;

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    if (!pdfText || pdfText.trim().length === 0) {
      return res.status(400).json({ error: 'Could not extract text from PDF' });
    }

    // Check each rule using LLM
    const results = await Promise.all(
      rules.map(async (rule) => {
        if (!rule || rule.trim().length === 0) {
          return {
            rule: rule || 'Empty rule',
            status: 'fail',
            evidence: 'No rule provided',
            reasoning: 'Rule is empty or invalid',
            confidence: 0
          };
        }

        return await checkRuleWithLLM(pdfText, rule);
      })
    );

    res.json({ results });
  } catch (error) {
    console.error('Error processing PDF:', error);
    
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({ 
      error: 'Failed to process PDF', 
      message: error.message 
    });
  }
});

// Function to check a single rule using LLM
async function checkRuleWithLLM(pdfText, rule) {
  try {
    const prompt = `You are analyzing a document to check if it follows a specific rule.

RULE TO CHECK: "${rule}"

DOCUMENT TEXT:
${pdfText.substring(0, 12000)}${pdfText.length > 12000 ? '...' : ''}

Please analyze the document and determine if it PASSES or FAILS the rule. Provide your response in the following JSON format:
{
  "status": "pass" or "fail",
  "evidence": "One specific sentence or phrase from the document that supports your decision (or 'Not found' if failing)",
  "reasoning": "Brief explanation (1-2 sentences) of why it passes or fails",
  "confidence": A number between 0-100 representing your confidence in this assessment
}

IMPORTANT: 
- Return ONLY valid JSON, no additional text
- Evidence should be an exact quote from the document if possible
- Confidence should reflect how certain you are (higher for clear cases, lower for ambiguous ones)
- If the rule is not met, status must be "fail"`;

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a document analysis assistant. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 500,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0].message.content;
    let result = JSON.parse(content);

    // Validate and format the response
    return {
      rule: rule,
      status: (result.status || 'fail').toLowerCase(),
      evidence: result.evidence || 'No evidence found',
      reasoning: result.reasoning || 'Unable to determine',
      confidence: Math.max(0, Math.min(100, parseInt(result.confidence) || 0))
    };
  } catch (error) {
    console.error('Error checking rule with LLM:', error);
    return {
      rule: rule,
      status: 'fail',
      evidence: 'Error processing rule',
      reasoning: `Failed to analyze: ${error.message}`,
      confidence: 0
    };
  }
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Make sure OPENAI_API_KEY is set in your .env file`);
});

