import csv
import sys
import os
import time
import json
# Import the existing function
from send_email_marketing import send_email_marketing

# Adjust path to find users.csv in the project root
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

def run_campaign():
    print(f"Reading CSV from: {CSV_PATH}")
    if not os.path.exists(CSV_PATH):
        print("Error: users.csv not found!")
        return

    users = []
    with open(CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            users.append(row)
    
    total_users = len(users)
    print(f"Found {total_users} users in CSV.")
    
    sent_count = 0
    skipped_count = 0
    error_count = 0

    for i, user in enumerate(users):
        email = user.get('email', '').strip()
        
        if not email:
            print(f"Skipping row {i+1}: No email found.")
            skipped_count += 1
            continue

        # Skip the test email, or send it? User said "send to all other users".
        if email == TEST_EMAIL:
            print(f"Skipping {email} (already sent as test).")
            skipped_count += 1
            continue
            
        first_name = get_first_name(user)
        html_content = HTML_TEMPLATE.format(first_name=first_name)
        
        print(f"Sending to {email} ({i+1}/{total_users})...")
        
        try:
            result = send_email_marketing(email, SUBJECT, html_content)
            
            if "error" in result:
                print(f"  [ERROR] Failed to send to {email}: {result['error']}")
                error_count += 1
            else:
                print(f"  [SUCCESS] ID: {result.get('id')}")
                sent_count += 1
                
        except Exception as e:
            print(f"  [EXCEPTION] {str(e)}")
            error_count += 1
            
        # Respectful delay
        time.sleep(1)

    print("\n--- Campaign Finished ---")
    print(f"Total Sent: {sent_count}")
    print(f"Skipped: {skipped_count}")
    print(f"Errors: {error_count}")

if __name__ == "__main__":
    run_campaign()
