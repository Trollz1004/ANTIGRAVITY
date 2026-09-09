import requests
import sys
import time
from datetime import datetime

# Use the public endpoint
BASE_URL = "https://civic-marketplace-1.preview.emergentagent.com/api"

class APITester:
    def __init__(self):
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.template_id = None
        self.campaign_id = None
        self.sequence_id = None
        self.capture_id = None
        self.lead_id = None
        
    def test(self, name, method, endpoint, expected_status=200, data=None, params=None):
        """Run a single API test"""
        url = f"{BASE_URL}{endpoint}"
        self.tests_run += 1
        
        print(f"\n{'='*60}")
        print(f"Test {self.tests_run}: {name}")
        print(f"{'='*60}")
        print(f"Method: {method} | Endpoint: {endpoint}")
        
        try:
            if method == "GET":
                response = requests.get(url, params=params, timeout=30)
            elif method == "POST":
                response = requests.post(url, json=data, timeout=30)
            elif method == "PATCH":
                response = requests.patch(url, json=data, timeout=30)
            else:
                print(f"❌ FAILED - Unsupported method: {method}")
                self.failed_tests.append({"test": name, "reason": f"Unsupported method: {method}"})
                return False, None
            
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == expected_status:
                self.tests_passed += 1
                print(f"✅ PASSED")
                try:
                    return True, response.json()
                except:
                    return True, response.text
            else:
                print(f"❌ FAILED - Expected {expected_status}, got {response.status_code}")
                print(f"Response: {response.text[:300]}")
                self.failed_tests.append({
                    "test": name,
                    "reason": f"Expected {expected_status}, got {response.status_code}",
                    "response": response.text[:300]
                })
                return False, None
                
        except Exception as e:
            print(f"❌ FAILED - Exception: {str(e)}")
            self.failed_tests.append({"test": name, "reason": str(e)})
            return False, None
    
    def print_summary(self):
        """Print test summary"""
        print(f"\n{'='*60}")
        print(f"TEST SUMMARY")
        print(f"{'='*60}")
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.failed_tests:
            print(f"\n{'='*60}")
            print(f"FAILED TESTS DETAILS")
            print(f"{'='*60}")
            for i, failure in enumerate(self.failed_tests, 1):
                print(f"\n{i}. {failure['test']}")
                print(f"   Reason: {failure['reason']}")
                if 'response' in failure:
                    print(f"   Response: {failure['response']}")
        
        return self.tests_run == self.tests_passed

def main():
    tester = APITester()
    
    print("="*60)
    print("YOUANDINOTAI LEAD GENERATION CRM API TESTS")
    print("="*60)
    print(f"Base URL: {BASE_URL}")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # ==================== BASIC ENDPOINTS ====================
    print("\n" + "="*60)
    print("SECTION 1: BASIC ENDPOINTS")
    print("="*60)
    
    # Test 1: Root endpoint
    tester.test("Root API Endpoint", "GET", "/")
    
    # Test 2: Get categories
    success, categories_data = tester.test("Get Categories", "GET", "/categories")
    
    # Test 3: Get cities
    success, cities_data = tester.test("Get All Cities", "GET", "/cities")
    if success and cities_data:
        print(f"   → Returned {len(cities_data)} cities")
    
    # Test 4: Get city stats
    success, city_stats = tester.test("Get City Statistics", "GET", "/cities/stats")
    if success and city_stats:
        print(f"   → Total cities: {city_stats.get('total_cities')}")
    
    # ==================== SEED DATA ====================
    print("\n" + "="*60)
    print("SECTION 2: SEED SAMPLE DATA")
    print("="*60)
    
    print("\n⏳ Seeding sample data (this may take a few seconds)...")
    success, seed_result = tester.test("Seed Sample Data", "POST", "/seed")
    if success and seed_result:
        print(f"   → Groups created: {seed_result.get('groups_created')}")
        print(f"   → Leads created: {seed_result.get('leads_created')}")
        print(f"   → Templates created: {seed_result.get('templates_created')}")
        print(f"   → Sequences created: {seed_result.get('sequences_created')}")
    
    time.sleep(1)
    
    # ==================== LEAD MANAGEMENT ====================
    print("\n" + "="*60)
    print("SECTION 3: LEAD MANAGEMENT")
    print("="*60)
    
    # Test: Get all leads
    success, leads_data = tester.test("Get All Leads", "GET", "/leads")
    if success and leads_data:
        print(f"   → Returned {len(leads_data)} leads")
    
    # Test: Get lead stats overview
    success, lead_stats = tester.test("Get Lead Stats Overview", "GET", "/leads/stats/overview")
    if success and lead_stats:
        print(f"   → Total leads: {lead_stats.get('total')}")
        print(f"   → By status: {lead_stats.get('by_status')}")
        print(f"   → Score ranges: {lead_stats.get('score_ranges')}")
        print(f"   → Conversion rate: {lead_stats.get('conversion_rate')}%")
    
    # Test: Create a new lead
    new_lead = {
        "name": "Test User CRM",
        "email": "testcrm@example.com",
        "city": "New York",
        "interests": ["Environmental", "Education"],
        "source": "website",
        "phone": "+12125551234"
    }
    success, created_lead = tester.test("Create New Lead", "POST", "/leads", data=new_lead, expected_status=200)
    if success and created_lead:
        tester.lead_id = created_lead.get('id')
        print(f"   → Lead ID: {tester.lead_id}")
        print(f"   → Lead score: {created_lead.get('score')}")
        print(f"   → Status: {created_lead.get('status')}")
    
    # Test: Get single lead
    if tester.lead_id:
        tester.test("Get Single Lead", "GET", f"/leads/{tester.lead_id}")
    
    # Test: Update lead
    if tester.lead_id:
        update_data = {
            "status": "contacted",
            "notes": "Test note"
        }
        tester.test("Update Lead", "PATCH", f"/leads/{tester.lead_id}", data=update_data)
    
    # Test: Get leads with filters
    tester.test("Get Leads by City", "GET", "/leads", params={"city": "New York"})
    tester.test("Get Leads by Status", "GET", "/leads", params={"status": "new"})
    tester.test("Get Leads by Min Score", "GET", "/leads", params={"min_score": 50})
    
    # ==================== EMAIL TEMPLATES ====================
    print("\n" + "="*60)
    print("SECTION 4: EMAIL TEMPLATES")
    print("="*60)
    
    # Test: Get all templates
    success, templates_data = tester.test("Get All Templates", "GET", "/templates")
    if success and templates_data:
        print(f"   → Returned {len(templates_data)} templates")
        if templates_data:
            tester.template_id = templates_data[0].get('id')
            print(f"   → First template ID: {tester.template_id}")
    
    # Test: Create a new template
    new_template = {
        "name": "Test Template",
        "subject": "Test Subject - {{name}}",
        "html_content": "<div>Hello {{name}}, this is a test email!</div>",
        "category": "general",
        "variables": ["name"]
    }
    success, created_template = tester.test("Create Email Template", "POST", "/templates", data=new_template)
    if success and created_template:
        if not tester.template_id:
            tester.template_id = created_template.get('id')
        print(f"   → Template ID: {created_template.get('id')}")
        print(f"   → Template name: {created_template.get('name')}")
    
    # Test: Get single template
    if tester.template_id:
        tester.test("Get Single Template", "GET", f"/templates/{tester.template_id}")
    
    # Test: Get templates by category
    tester.test("Get Templates by Category", "GET", "/templates", params={"category": "onboarding"})
    
    # ==================== EMAIL CAMPAIGNS ====================
    print("\n" + "="*60)
    print("SECTION 5: EMAIL CAMPAIGNS")
    print("="*60)
    
    # Test: Get all campaigns
    success, campaigns_data = tester.test("Get All Campaigns", "GET", "/campaigns")
    if success and campaigns_data:
        print(f"   → Returned {len(campaigns_data)} campaigns")
    
    # Test: Create a new campaign
    if tester.template_id:
        new_campaign = {
            "name": "Test Campaign",
            "template_id": tester.template_id,
            "target_segment": {
                "city": "New York",
                "min_score": 30
            }
        }
        success, created_campaign = tester.test("Create Email Campaign", "POST", "/campaigns", data=new_campaign)
        if success and created_campaign:
            tester.campaign_id = created_campaign.get('id')
            print(f"   → Campaign ID: {tester.campaign_id}")
            print(f"   → Campaign status: {created_campaign.get('status')}")
    
    # Test: Send campaign
    if tester.campaign_id:
        print("\n⏳ Sending campaign (this may take a few seconds)...")
        success, send_result = tester.test("Send Campaign", "POST", f"/campaigns/{tester.campaign_id}/send")
        if success and send_result:
            print(f"   → Sent to {send_result.get('sent_count')} leads")
    
    # Test: Get campaign stats
    if tester.campaign_id:
        tester.test("Get Campaign Stats", "GET", f"/campaigns/{tester.campaign_id}/stats")
    
    # Test: Get campaigns by status
    tester.test("Get Campaigns by Status", "GET", "/campaigns", params={"status": "completed"})
    
    # ==================== DRIP SEQUENCES ====================
    print("\n" + "="*60)
    print("SECTION 6: DRIP SEQUENCES")
    print("="*60)
    
    # Test: Get all sequences
    success, sequences_data = tester.test("Get All Drip Sequences", "GET", "/sequences")
    if success and sequences_data:
        print(f"   → Returned {len(sequences_data)} sequences")
        if sequences_data:
            tester.sequence_id = sequences_data[0].get('id')
            print(f"   → First sequence ID: {tester.sequence_id}")
            print(f"   → Active: {sequences_data[0].get('active')}")
    
    # Test: Get active sequences only
    tester.test("Get Active Sequences Only", "GET", "/sequences", params={"active_only": True})
    
    # Test: Toggle sequence
    if tester.sequence_id:
        success, toggle_result = tester.test("Toggle Drip Sequence", "PATCH", f"/sequences/{tester.sequence_id}/toggle")
        if success and toggle_result:
            print(f"   → New active status: {toggle_result.get('active')}")
    
    # Test: Create a new sequence
    if tester.template_id:
        new_sequence = {
            "name": "Test Sequence",
            "trigger": "new_lead",
            "steps": [
                {"delay_days": 0, "template_id": tester.template_id},
                {"delay_days": 3, "template_id": tester.template_id}
            ]
        }
        success, created_sequence = tester.test("Create Drip Sequence", "POST", "/sequences", data=new_sequence)
        if success and created_sequence:
            print(f"   → Sequence ID: {created_sequence.get('id')}")
            print(f"   → Steps: {len(created_sequence.get('steps', []))}")
    
    # ==================== SOCIAL CAPTURE ====================
    print("\n" + "="*60)
    print("SECTION 7: SOCIAL LEAD CAPTURE")
    print("="*60)
    
    # Test: Get all social captures
    success, captures_data = tester.test("Get All Social Captures", "GET", "/social-capture")
    if success and captures_data:
        print(f"   → Returned {len(captures_data)} captures")
    
    # Test: Create a new social capture
    new_capture = {
        "platform": "facebook",
        "campaign_name": "Test Facebook Campaign",
        "form_fields": ["name", "email", "city"],
        "redirect_url": "https://youandinotai.com/thank-you"
    }
    success, created_capture = tester.test("Create Social Capture", "POST", "/social-capture", data=new_capture)
    if success and created_capture:
        tester.capture_id = created_capture.get('id')
        print(f"   → Capture ID: {tester.capture_id}")
        print(f"   → Platform: {created_capture.get('platform')}")
        print(f"   → Active: {created_capture.get('active')}")
    
    # Test: Get social captures by platform
    tester.test("Get Social Captures by Platform", "GET", "/social-capture", params={"platform": "facebook"})
    
    # Test: Submit lead via social capture
    if tester.capture_id:
        lead_submission = {
            "name": "Social Lead Test",
            "email": "socialtest@example.com",
            "city": "Los Angeles"
        }
        success, submit_result = tester.test("Submit Social Lead", "POST", f"/social-capture/{tester.capture_id}/submit", data=lead_submission)
        if success and submit_result:
            print(f"   → Lead ID: {submit_result.get('lead_id')}")
            print(f"   → Redirect URL: {submit_result.get('redirect_url')}")
    
    # ==================== DASHBOARD ====================
    print("\n" + "="*60)
    print("SECTION 8: DASHBOARD STATS")
    print("="*60)
    
    # Test: Get dashboard stats
    success, dash_stats = tester.test("Get Dashboard Stats", "GET", "/dashboard/stats")
    if success and dash_stats:
        print(f"   → Total leads: {dash_stats.get('total_leads')}")
        print(f"   → Hot leads: {dash_stats.get('hot_leads')}")
        print(f"   → Total campaigns: {dash_stats.get('total_campaigns')}")
        print(f"   → Total sequences: {dash_stats.get('total_sequences')}")
        print(f"   → Lead funnel: {dash_stats.get('lead_funnel')}")
        print(f"   → Email stats: {dash_stats.get('email_stats')}")
    
    # ==================== GROUPS (Legacy) ====================
    print("\n" + "="*60)
    print("SECTION 9: GROUPS (Legacy Feature)")
    print("="*60)
    
    # Test: Get groups
    success, groups_data = tester.test("Get All Groups", "GET", "/groups")
    if success and groups_data:
        print(f"   → Returned {len(groups_data)} groups")
    
    # Test: Get trending groups
    tester.test("Get Trending Groups", "GET", "/groups/trending")
    
    # ==================== AUTOMATION RULES ====================
    print("\n" + "="*60)
    print("SECTION 10: AUTOMATION RULES")
    print("="*60)
    
    # Test: Get all automation rules
    success, rules_data = tester.test("Get All Automation Rules", "GET", "/automation/rules")
    if success and rules_data:
        print(f"   → Returned {len(rules_data)} rules")
        if rules_data:
            tester.rule_id = rules_data[0].get('id')
            print(f"   → First rule ID: {tester.rule_id}")
    
    # Test: Create a new automation rule
    new_rule = {
        "name": "Test Automation Rule",
        "trigger_type": "score_threshold",
        "trigger_value": 80,
        "action_type": "tag_add",
        "action_value": "vip-lead"
    }
    success, created_rule = tester.test("Create Automation Rule", "POST", "/automation/rules", data=new_rule)
    if success and created_rule:
        if not hasattr(tester, 'rule_id'):
            tester.rule_id = created_rule.get('id')
        print(f"   → Rule ID: {created_rule.get('id')}")
        print(f"   → Active: {created_rule.get('active')}")
    
    # Test: Toggle automation rule
    if hasattr(tester, 'rule_id') and tester.rule_id:
        success, toggle_result = tester.test("Toggle Automation Rule", "PATCH", f"/automation/rules/{tester.rule_id}/toggle")
        if success and toggle_result:
            print(f"   → New active status: {toggle_result.get('active')}")
    
    # Test: Get active rules only
    tester.test("Get Active Automation Rules", "GET", "/automation/rules", params={"active_only": True})
    
    # ==================== LANDING PAGES ====================
    print("\n" + "="*60)
    print("SECTION 11: LANDING PAGES")
    print("="*60)
    
    # Test: Get all landing pages
    success, pages_data = tester.test("Get All Landing Pages", "GET", "/landing-pages")
    if success and pages_data:
        print(f"   → Returned {len(pages_data)} landing pages")
        if pages_data:
            tester.page_slug = pages_data[0].get('slug')
            tester.page_id = pages_data[0].get('id')
            print(f"   → First page slug: {tester.page_slug}")
    
    # Test: Create a new landing page
    new_page = {
        "name": "Test Landing Page",
        "slug": f"test-page-{int(time.time())}",
        "headline": "Join Our Community",
        "subheadline": "Make a difference today",
        "cta_text": "Sign Up Now",
        "form_fields": ["name", "email", "city"],
        "background_color": "#4A7B59",
        "text_color": "#FFFFFF"
    }
    success, created_page = tester.test("Create Landing Page", "POST", "/landing-pages", data=new_page)
    if success and created_page:
        if not hasattr(tester, 'page_slug'):
            tester.page_slug = created_page.get('slug')
            tester.page_id = created_page.get('id')
        print(f"   → Page ID: {created_page.get('id')}")
        print(f"   → Slug: {created_page.get('slug')}")
    
    # Test: Get landing page by slug
    if hasattr(tester, 'page_slug') and tester.page_slug:
        success, page_data = tester.test("Get Landing Page by Slug", "GET", f"/landing-pages/{tester.page_slug}")
        if success and page_data:
            print(f"   → Visits: {page_data.get('visits')}")
            print(f"   → Conversions: {page_data.get('conversions')}")
    
    # Test: Submit landing page form
    if hasattr(tester, 'page_slug') and tester.page_slug:
        form_submission = {
            "name": "Landing Page Lead",
            "email": "landingtest@example.com",
            "city": "San Francisco"
        }
        success, submit_result = tester.test("Submit Landing Page Form", "POST", f"/landing-pages/{tester.page_slug}/submit", data=form_submission)
        if success and submit_result:
            print(f"   → Lead ID: {submit_result.get('lead_id')}")
    
    # Test: Get landing page stats
    if hasattr(tester, 'page_id') and tester.page_id:
        success, page_stats = tester.test("Get Landing Page Stats", "GET", f"/landing-pages/{tester.page_id}/stats")
        if success and page_stats:
            print(f"   → Visits: {page_stats.get('visits')}")
            print(f"   → Conversions: {page_stats.get('conversions')}")
            print(f"   → Conversion rate: {page_stats.get('conversion_rate')}%")
    
    # ==================== PLATFORM HUB ====================
    print("\n" + "="*60)
    print("SECTION 12: MULTI-PLATFORM HUB")
    print("="*60)
    
    # Test: Get all platforms
    success, platforms_data = tester.test("Get All Platforms", "GET", "/platforms")
    if success and platforms_data:
        print(f"   → Returned {len(platforms_data)} platforms")
        if platforms_data:
            tester.platform_api_key = platforms_data[0].get('api_key')
            tester.platform_id = platforms_data[0].get('id')
            print(f"   → First platform API key: {tester.platform_api_key[:20]}...")
    
    # Test: Create a new platform
    new_platform = {
        "name": "Test Platform App",
        "webhook_url": "https://example.com/webhook"
    }
    success, created_platform = tester.test("Create Platform", "POST", "/platforms", data=new_platform)
    if success and created_platform:
        if not hasattr(tester, 'platform_api_key'):
            tester.platform_api_key = created_platform.get('api_key')
            tester.platform_id = created_platform.get('id')
        print(f"   → Platform ID: {created_platform.get('id')}")
        print(f"   → API Key: {created_platform.get('api_key')[:20]}...")
    
    # Test: Ingest lead from platform
    if hasattr(tester, 'platform_api_key') and tester.platform_api_key:
        platform_lead = {
            "name": "Platform Lead Test",
            "email": "platformtest@example.com",
            "city": "Chicago",
            "interests": ["Health", "Education"]
        }
        success, ingest_result = tester.test("Ingest Lead from Platform", "POST", f"/platforms/ingest?api_key={tester.platform_api_key}", data=platform_lead)
        if success and ingest_result:
            print(f"   → Lead ID: {ingest_result.get('lead_id')}")
            print(f"   → Platform: {ingest_result.get('platform')}")
    
    # Test: Get platform stats
    if hasattr(tester, 'platform_id') and tester.platform_id:
        success, platform_stats = tester.test("Get Platform Stats", "GET", f"/platforms/{tester.platform_id}/stats")
        if success and platform_stats:
            print(f"   → Total leads: {platform_stats.get('total_leads')}")
            print(f"   → Conversion rate: {platform_stats.get('conversion_rate')}%")
            print(f"   → Avg score: {platform_stats.get('avg_score')}")
    
    # ==================== AI LEAD QUALIFICATION ====================
    print("\n" + "="*60)
    print("SECTION 13: AI LEAD QUALIFICATION")
    print("="*60)
    
    # Test: AI qualify lead
    if tester.lead_id:
        print("\n⏳ Running AI qualification (this may take a few seconds)...")
        success, ai_result = tester.test("AI Qualify Lead", "POST", f"/leads/{tester.lead_id}/ai-qualify")
        if success and ai_result:
            print(f"   → Lead name: {ai_result.get('lead_name')}")
            print(f"   → Current score: {ai_result.get('current_score')}")
            ai_analysis = ai_result.get('ai_analysis', {})
            if ai_analysis:
                print(f"   → Qualification: {ai_analysis.get('qualification', 'N/A')}")
                print(f"   → Recommended action: {ai_analysis.get('recommended_action', 'N/A')}")
    
    # ==================== REPORTS & ANALYTICS ====================
    print("\n" + "="*60)
    print("SECTION 14: REPORTS & ANALYTICS")
    print("="*60)
    
    # Test: Get daily report
    success, daily_report = tester.test("Get Daily Report", "GET", "/reports/daily")
    if success and daily_report:
        summary = daily_report.get('summary', {})
        print(f"   → Total leads: {summary.get('total_leads')}")
        print(f"   → Converted: {summary.get('converted')}")
        print(f"   → Conversion rate: {summary.get('conversion_rate')}%")
        print(f"   → Leads by source: {daily_report.get('leads_by_source')}")
    
    # Test: Get lead quality report
    success, quality_report = tester.test("Get Lead Quality Report", "GET", "/reports/lead-quality")
    if success and quality_report:
        score_dist = quality_report.get('score_distribution', {})
        print(f"   → Hot leads: {score_dist.get('hot')}")
        print(f"   → Warm leads: {score_dist.get('warm')}")
        print(f"   → Cold leads: {score_dist.get('cold')}")
    
    # ==================== NOTIFICATIONS ====================
    print("\n" + "="*60)
    print("SECTION 15: SMART NOTIFICATIONS")
    print("="*60)
    
    # Test: Get notifications
    success, notifications_data = tester.test("Get Smart Notifications", "GET", "/notifications")
    if success and notifications_data:
        print(f"   → Returned {len(notifications_data)} notifications")
        if notifications_data:
            print(f"   → First notification type: {notifications_data[0].get('type')}")
            print(f"   → Priority: {notifications_data[0].get('priority')}")
    
    # Print summary
    all_passed = tester.print_summary()
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    sys.exit(main())
