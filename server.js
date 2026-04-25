const express = require('express');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');
const fetch = require('node-fetch');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files from "public"
app.use(express.static(path.join(__dirname, 'public')));

// Serve HTML pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// API endpoint
app.post('/generate-questions', async (req, res) => {
  const { text: inputText, type, role, experience } = req.body;

  let prompt = '';

  if (type === 'resume') {
    prompt = `You are an expert interviewer. Based on the following resume, desired role, and experience, generate 5 relevant technical and 5 behavioral interview questions.

Desired Role: ${role}
Experience: ${experience}

Resume Text:
${inputText}

with good spacing between each question`;
  } else if (type === 'jd') {
    prompt = `You are an expert interviewer. Based on the following job description, desired role, and experience, generate 5 relevant technical and 5 behavioral interview questions that test the required skills and responsibilities.

Desired Role: ${role}
Experience: ${experience}

Job Description:
${inputText}

Interview Questions:
1.`;
  } else {
    return res.status(400).json({ error: "Invalid type provided. Must be 'resume' or 'jd'." });
  }

  try {
    const cohereResponse = await fetch('https://api.cohere.ai/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.COHERE_API_KEY}`,
        'Content-Type': 'application/json',
        'Cohere-Version': '2022-12-06'
      },
      body: JSON.stringify({
        model: 'command',
        prompt: prompt,
        max_tokens: 500,
        temperature: 0.7
      })
    });

    const data = await cohereResponse.json();
    const rawOutput = data.generations?.[0]?.text?.trim();

    if (!rawOutput) {
      return res.json({ questions: "⚠️ No questions generated. Try using a more detailed description." });
    }

    res.json({ questions: rawOutput });

  } catch (err) {
    console.error("Error from Cohere:", err);
    res.status(500).json({ questions: "❌ Failed to generate questions due to a server or API error." });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
