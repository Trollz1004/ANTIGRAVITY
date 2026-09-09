# Claude CLI Integration Prompt for Your Apps

Copy and paste this prompt to Claude CLI (Opus) to integrate any of your apps with the Youandinotai Lead Generation CRM.

---

## PROMPT TO PASTE:

```
I need to integrate my app with the Youandinotai Lead Generation CRM. Here's the API details:

## CRM API Endpoint
POST https://civic-marketplace-1.preview.emergentagent.com/api/platforms/ingest

## Authentication
Query parameter: api_key=YOUR_PLATFORM_API_KEY

## Request Body (JSON)
{
  "name": "Lead Name",
  "email": "lead@email.com",
  "city": "City Name",
  "phone": "+1234567890",  // optional
  "interests": ["Environmental", "Education", "Health"]  // optional array
}

## Available Interest Categories
Environmental, Education, Health, Animal Welfare, Homelessness, Food Security, Youth Programs, Senior Care, Disaster Relief, Community Development, Arts & Culture, Mental Health

## My Platform API Keys:
- Youandinotai.com: yai_[GET_FROM_PLATFORM_HUB]
- Recycle.org: rec_[GET_FROM_PLATFORM_HUB]
- AI-Solutions.store: ais_[GET_FROM_PLATFORM_HUB]
- Aidiesitall.website: aid_[GET_FROM_PLATFORM_HUB]

## What I Need:
1. Add lead capture to my [APP_NAME] app
2. When a user signs up/submits a form, send their data to the CRM
3. Handle success/error responses
4. Log the lead_id returned for tracking

## Example Response (Success):
{
  "message": "Lead ingested successfully",
  "lead_id": "uuid-here",
  "platform": "Youandinotai.com"
}

## My App's Tech Stack: [SPECIFY: Node.js / Python / React / etc.]

Please write the integration code for my app.
```

---

## CODE SNIPPETS FOR EACH PLATFORM

### Node.js / Express
```javascript
const axios = require('axios');

const CRM_API = 'https://civic-marketplace-1.preview.emergentagent.com/api/platforms/ingest';
const API_KEY = 'YOUR_PLATFORM_API_KEY'; // Get from Platform Hub

async function sendLeadToCRM(leadData) {
  try {
    const response = await axios.post(`${CRM_API}?api_key=${API_KEY}`, {
      name: leadData.name,
      email: leadData.email,
      city: leadData.city || 'Unknown',
      phone: leadData.phone,
      interests: leadData.interests || []
    });
    
    console.log('Lead sent to CRM:', response.data.lead_id);
    return response.data;
  } catch (error) {
    console.error('CRM Error:', error.response?.data || error.message);
    throw error;
  }
}

// Usage in your signup/form handler:
app.post('/signup', async (req, res) => {
  // Your existing signup logic...
  
  // Send to CRM
  await sendLeadToCRM({
    name: req.body.name,
    email: req.body.email,
    city: req.body.city,
    interests: req.body.interests
  });
  
  res.json({ success: true });
});
```

### Python / FastAPI
```python
import httpx

CRM_API = "https://civic-marketplace-1.preview.emergentagent.com/api/platforms/ingest"
API_KEY = "YOUR_PLATFORM_API_KEY"  # Get from Platform Hub

async def send_lead_to_crm(lead_data: dict):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{CRM_API}?api_key={API_KEY}",
            json={
                "name": lead_data.get("name"),
                "email": lead_data.get("email"),
                "city": lead_data.get("city", "Unknown"),
                "phone": lead_data.get("phone"),
                "interests": lead_data.get("interests", [])
            }
        )
        response.raise_for_status()
        return response.json()

# Usage:
@app.post("/signup")
async def signup(data: SignupRequest):
    # Your existing signup logic...
    
    # Send to CRM
    result = await send_lead_to_crm({
        "name": data.name,
        "email": data.email,
        "city": data.city
    })
    
    return {"success": True, "crm_lead_id": result["lead_id"]}
```

### cURL (for testing)
```bash
curl -X POST "https://civic-marketplace-1.preview.emergentagent.com/api/platforms/ingest?api_key=YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "city": "New York",
    "interests": ["Environmental", "Education"]
  }'
```

### React / Frontend
```javascript
const CRM_API = 'https://civic-marketplace-1.preview.emergentagent.com/api/platforms/ingest';
const API_KEY = 'YOUR_PLATFORM_API_KEY';

async function submitToCRM(formData) {
  const response = await fetch(`${CRM_API}?api_key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: formData.name,
      email: formData.email,
      city: formData.city,
      interests: formData.interests
    })
  });
  
  if (!response.ok) throw new Error('CRM submission failed');
  return response.json();
}
```

---

## GET YOUR API KEYS

1. Go to: https://civic-marketplace-1.preview.emergentagent.com/platforms
2. Find your platform card
3. Click "Copy" next to the API key
4. Replace `YOUR_PLATFORM_API_KEY` in the code above

---

## WHAT HAPPENS AFTER A LEAD IS SENT

1. Lead is created in the CRM with automatic scoring
2. Automation rules trigger (welcome emails, tags, etc.)
3. AI qualification runs (if enabled)
4. Lead appears in the Lead CRM dashboard
5. Smart notifications alert you about hot leads

---

## ZAPIER INTEGRATION (When Ready)

1. Create a Zap with "Webhooks by Zapier" trigger (Catch Hook)
2. Copy the webhook URL
3. Go to Automation Center in the CRM
4. Create a rule:
   - Trigger: "Status Changes" → "qualified"
   - Action: "Send Webhook" → paste your Zapier URL
5. Now qualified leads automatically trigger your Zap!
