import csv
import sys
import os
import json
# Import the existing function
from send_email_marketing import send_email_marketing

# Adjust path to find users.csv in the project root
# Script location: .agent/skills/send_email_marketing/
# Root location: ../../../
CSV_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../users.csv"))
TEST_EMAIL = "thaohienhomes@gmail.com"

SUBJECT = "Quick question regarding pho.chat?"
HTML_TEMPLATE = """<p>Hi {first_name},</p>
<p>I saw you signed up for <strong>pho.chat</strong> recently – thanks for giving us a look!</p>
<p>I noticed you haven't grabbed the Lifetime Deal yet. I’m writing the roadmap for next month and I’d love to know: <strong>Is there one specific thing holding you back?</strong></p>
<p>(Is it the pricing? The AI models? Or just not sure if it fits your workflow?)</p>
<p>Just hit reply and let me know. As an indie developer, your feedback means the world to me.</p>
<p>Cheers,<br>Tom<br>Founder, pho.chat</p>"""

def get_first_name(row):
    name = row.get("first_name", "").strip()
    return name if name else "there"

def run_test():
    print(f"Looking for CSV at: {CSV_PATH}")
    if not os.path.exists(CSV_PATH):
        print("Error: users.csv not found!")
        return

    users = []
    with open(CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            users.append(row)
    
    # Find the test user or use default
    target_user = next((u for u in users if u['email'] == TEST_EMAIL), None)
    
    if target_user:
        first_name = get_first_name(target_user)
        print(f"Found test user in CSV: {target_user['email']} -> Name: '{first_name}'")
    else:
        first_name = "there"
        print(f"Test user {TEST_EMAIL} not found in CSV. Using fallback name '{first_name}'")

    html_content = HTML_TEMPLATE.format(first_name=first_name)
    
    print(f"\nSending test email to {TEST_EMAIL}...")
    print(f"Subject: {SUBJECT}")
    print("--- Content Preview ---")
    print(html_content)
    print("----------------------")
    
    result = send_email_marketing(TEST_EMAIL, SUBJECT, html_content)
    print("\nAPI Response:", json.dumps(result, indent=2))

if __name__ == "__main__":
    run_test()
