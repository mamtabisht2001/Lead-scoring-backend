# 🎯 Lead Scoring Backend

AI-powered lead scoring backend service that combines rule-based logic with OpenAI's GPT-4 for intelligent buyer intent classification.

## 🚀 Live Demo

**Base URL:** `https://lead-scoring-backend-usz6.onrender.com` (Update after deployment)

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [API Documentation](#api-documentation)
- [Scoring Logic](#scoring-logic)
- [Testing](#testing)
- [Deployment](#deployment)

## ✨ Features

✅ Rule-based scoring (0-50 points) based on:
- Role relevance (decision maker/influencer detection)
- Industry match (ICP alignment)
- Data completeness

✅ AI-powered intent classification (0-50 points) using OpenAI GPT-4
✅ RESTful API with comprehensive error handling
✅ CSV upload and export support
✅ Unit tests for scoring logic
✅ Docker support for containerized deployment

## 🛠 Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **AI Integration:** OpenAI API (GPT-4o-mini)
- **CSV Processing:** csv-parser, csv-writer
- **File Upload:** Multer
- **Testing:** Jest, Supertest
- **Deployment:** Railway / Render / Vercel

## 🏃 Quick Start

### Prerequisites

- Node.js 18+ installed
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

### Local Setup

1. **Clone the repository:**

```bash
git clone https://github.com/mamtabisht2001/Lead-scoring-backend.git
cd Lead-scoring-backend
```

2. **Install dependencies:**

```bash
npm install
```

3. **Configure environment variables:**

```bash
# Create .env file
echo "OPENAI_API_KEY=your_openai_api_key" > .env
echo "PORT=5000" >> .env
echo "DATABASE=your_postgres_database_url" >> .env
```

4. **Start the server:**

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

5. **Verify it's running:**

```bash
curl http://localhost:5000/
```

You should see:

```json
{
  "status": "true",
  "message": "Lead Scoring Backend running"
}
```

## 📚 API Documentation

### Base URL

````
http://localhost:5000 (local)
https://lead-scoring-backend-usz6.onrender.com (production)


### Endpoints

#### 1. Health Check
```http
GET /
````

**Response:**

```json
{
  "status": "true",
  "message": "Lead Scoring Backend running"
}
```

---

#### 2. Submit Offer/Product Information

```http
POST /offer
Content-Type: application/json
```

**Request Body:**

```json
{
  "name": "AI Outreach Automation",
  "value_props": [
    "24/7 automated outreach",
    "6x more meetings booked",
    "Personalized at scale"
  ],
  "ideal_use_cases": ["B2B SaaS mid-market", "Sales teams 10-50 people"]
}
```

**Response:**

```json
{
  "message": "Offer data saved successfully",
  "offer": {
    "id": "83af0925-ea20-41e8-8a83-f4b3da1571fc",
    "name": "Marketing Manager",
    "value_props": ["24/7 outreach", "6x more meetings"],
    "ideal_use_cases": ["B2B SaaS mid-market"],
    "createdAt": "2025-10-31T06:27:02.630Z",
    "updatedAt": "2025-10-31T06:27:02.630Z"
  }
}
```

**cURL Example:**

```bash
curl -X POST http://localhost:5000/offer \
  -H "Content-Type: application/json" \
  -d '{
    "name": "AI Outreach Automation",
    "value_props": ["24/7 outreach", "6x more meetings"],
    "ideal_use_cases": ["B2B SaaS mid-market"]
  }'
```

---

#### 3. Upload Lead CSV

```http
POST /leads/upload
Content-Type: multipart/form-data
```

**CSV Format:**

```csv
name,role,company,industry,location,linkedin_bio
Ava Patel,Head of Growth,FlowMetrics,B2B SaaS,San Francisco,Growth leader with 10+ years scaling SaaS companies
John Smith,VP Sales,TechCorp,Enterprise Software,New York,Sales executive focused on revenue growth
```

**Response:**

```json
{
  "message": "Leads uploaded successfully",
    "count": 10,
    "leads": [
        {
            "id": "d859ed9b-a50b-4b68-857a-f4039e3ed81a",
            "name": "Rohan Mehta",
            "role": "Marketing Manager",
            "company": "TechNova",
            "industry": "B2B SaaS",
            "location": "Bangalore",
            "linkedin_bio": "Experienced marketing leader passionate about demand generation and automation tools.",
            "offerId": "83af0925-ea20-41e8-8a83-f4b3da1571fc",
            "createdAt": "2025-10-31T06:27:29.116Z",
            "updatedAt": "2025-10-31T06:27:29.116Z"
        },
        ...]
}
```

**cURL Example:**

```bash
curl -X POST http://localhost:5000/leads/upload \
  -F "file=@leads.csv"
```

---

#### 4. Run Scoring Pipeline

```http
POST /score
```

**Response:**

```json
{
  "message": "Scoring completed successfully",
  "total": 10,
  "summary": {
    "high": 0,
    "medium": 4,
    "low": 6,
    "averageScore": "35.00"
  }
}
```

**cURL Example:**

```bash
curl -X POST http://localhost:5000/score
```

---

#### 5. Get Scored Results

```http
GET /results
```

**Response:**

```json
{ "message": "result generated successfully",
    "results": [
        {
            "name": "Ankit Raj",
            "role": "Head of Sales",
            "company": "AutoIQ",
            "industry": "Automotive SaaS",
            "location": "Pune",
            "intent": "Medium",
            "score": 50,
            "reasoning": "AI classification unavailable - defaulted to low intent"
        },
...]
}
```

**cURL Example:**

```bash
curl http://localhost:5000/results
```

---

#### 6. Export Results as CSV (Bonus)

```http
GET /results/export
```

**Response:**
Downloads `scored_leads.csv` file with all results.

**cURL Example:**

```bash
curl http://localhost:5000/results/export -o scored_leads.csv
```

## 🧮 Scoring Logic

### Total Score: 0-100 points

#### Rule-Based Layer (0-50 points)

1. **Role Relevance (0-20 points)**

   - Decision Maker: 20 points
     - Keywords: CEO, CTO, CFO, COO, Chief, President, VP, Director, Founder, Owner, Partner
   - Influencer: 10 points
     - Keywords: Manager, Lead, Senior, Principal, Architect, Specialist
   - Other: 0 points

2. **Industry Match (0-20 points)**

   - Exact ICP match: 20 points
   - Adjacent industry: 10 points
   - No match: 0 points

3. **Data Completeness (0-10 points)**
   - All fields present: 10 points
   - Missing fields: 0 points

#### AI Layer (0-50 points)

OpenAI GPT-4o-mini analyzes:

- Role authority and decision-making power
- Industry alignment with product value props
- LinkedIn bio signals (pain points, needs, priorities)
- Overall buying intent likelihood

**Intent Mapping:**

- High Intent: 50 points
- Medium Intent: 30 points
- Low Intent: 10 points

### Final Classification

Based on total score (rule + AI):

- **High Intent:** Score ≥ 70
- **Medium Intent:** Score 40-69
- **Low Intent:** Score < 40

### AI Prompt Example

```
You are a B2B sales qualification expert. Analyze this prospect against our product offering.

PRODUCT/OFFER:
Name: AI Outreach Automation
Value Propositions: 24/7 outreach, 6x more meetings
Ideal Use Cases: B2B SaaS mid-market

PROSPECT:
Name: Ava Patel
Role: Head of Growth
Company: FlowMetrics
Industry: B2B SaaS
Location: San Francisco
LinkedIn Bio: Growth leader with 10+ years scaling SaaS companies

TASK:
1. Classify the prospect's buying intent as High, Medium, or Low
2. Provide 1-2 sentences explaining your classification

Consider:
- Does their role indicate decision-making authority?
- Does their industry align with our ideal use cases?
- Does their LinkedIn bio suggest pain points our product solves?
- Would they benefit from our value propositions?

Respond in this exact format:
Intent: [High/Medium/Low]
Reasoning: [Your 1-2 sentence explanation]
```



### Run Unit Tests

```bash
# Run all tests
npm test

```

### Test Coverage

The test suite covers:
- ✅ Role scoring logic (decision makers, influencers, others)
- ✅ Industry matching (exact, adjacent, no match)
- ✅ Data completeness scoring
- ✅ Total score calculations
- ✅ Edge cases (null values, case sensitivity, missing data)

### Sample Test Output

```
PASS  test/scoring.test.js
  Rule-Based Scoring Logic
    Role Scoring
      ✓ should award 20 points for CEO role (5ms)
      ✓ should award 20 points for Head of Growth (2ms)
      ✓ should award 10 points for Senior Manager role (1ms)
      ✓ should award 0 points for non-decision maker roles (1ms)
    Industry Scoring
      ✓ should award 20 points for exact ICP match (2ms)
      ✓ should award 10 points for adjacent industry (1ms)
      ✓ should award 0 points for non-matching industry (1ms)
    Data Completeness Scoring
      ✓ should award 10 points when all fields are present (1ms)
      ✓ should award 0 points when fields are missing (1ms)

Tests: 17 passed, 17 total
Coverage: 95% statements, 92% branches
```

## 🐳 Docker Support (Bonus)

### Build and Run with Docker

```bash
# Build image
docker build -t lead-scoring-backend .

# Run container
docker run -p 5000:5000 --env-file .env lead-scoring-backend
```

### Docker Compose

```bash
docker-compose up
```

## 🚢 Deployment

### Render Deployment

1. Connect your GitHub repository
2. Create new Web Service
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Add environment variable: `OPENAI_API_KEY`
6. Deploy!

### Environment Variables

Required:
```
OPENAI_API_KEY=sk-...
```

Optional:
```
PORT=3000 (defaults to 3000)
```
### Setup Postgres Database

Create new render postgres database


## 📊 Complete Workflow Example

```bash
# 1. Submit your product/offer
curl -X POST http://localhost:5000/offer \
  -H "Content-Type: application/json" \
  -d '{
    "name": "AI Outreach Automation",
    "value_props": ["24/7 outreach", "6x more meetings"],
    "ideal_use_cases": ["B2B SaaS mid-market"]
  }'

# 2. Upload lead CSV
curl -X POST http://localhost:5000/leads/upload \
  -F "file=@leads.csv"

# 3. Run scoring
curl -X POST http://localhost:5000/score

# 4. Get results
curl http://localhost:5000/results

# 5. Export as CSV (optional)
curl http://localhost:5000/results/export -o scored_leads.csv
```

## 📁 Project Structure

```
Lead-scoring-backend/
├── prisma/
│   ├── migrations/            # Auto-generated migration files
│   ├── prisma.js              # Exports PrismaClient instance
│   └── schema.prisma          # Database schema definition
│
├── src/
│   ├── config/
│   │   └── openAi.js          # OpenAI or Gemini configuration & API setup
│   │
│   ├── controllers/
│   │   ├── lead.controller.js # Handles /leads routes logic
│   │   └── offer.controller.js# Handles /offer routes logic
│   │
│   ├── helpers/
│   │   └── lead.helper.js     # Lead parsing, scoring, CSV logic, etc.
│   │
│   ├── routes/
│   │   ├── index.js           # Combines and exports all routes
│   │   ├── lead.routes.js     # Lead-related routes (/leads/upload, /leads/score)
│   │   └── offer.routes.js    # Offer-related routes (/offer)
│   │
│   │
│   └── server.js              # Main entry point — starts the server
│
├── .dockerignore
├── Dockerfile                 #docker file to dockerize the app
├── test 
│    └──scoring.test.js
├── jest.config.js  
├── .env                       # Environment variables (API keys, DB URL, etc.)
├── .gitignore                 # Git ignore rules
├── package.json               # Dependencies & scripts
├── README.md                  # Setup instructions & API usage



## 🐛 Troubleshooting

### Common Issues

**Issue: OpenAI API errors**

```
Solution: Check your API key is valid and has credits
$ echo $OPENAI_API_KEY
```

**Issue: CSV upload fails**

```
Solution: Ensure CSV has correct headers:
name,role,company,industry,location,linkedin_bio
```

**Issue: Port already in use**

```
Solution: Change port in .env or kill existing process
$ lsof -ti:5000 | xargs kill -9
```