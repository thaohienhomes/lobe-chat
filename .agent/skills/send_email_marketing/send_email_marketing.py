import requests
import json
import argparse
import sys

def send_email_marketing(to_email, subject, html_content):
    """
    Sends marketing emails via Resend API.
    Args:
        to_email (str): The recipient's email address.
        subject (str): The subject line.
        html_content (str): The HTML body of the email.
    """
import os

    # API Key Configuration
    # NOTE: It is recommended to use environment variables for API keys in production.
    resend_api_key = os.environ.get("RESEND_API_KEY")

    if not resend_api_key:
        return {"error": "RESEND_API_KEY environment variable is not set"}

    url = "https://api.resend.com/emails"

    headers = {
        "Authorization": f"Bearer {resend_api_key}",
        "Content-Type": "application/json"
    }

    payload = {
        "from": "Tom from Phở Chat <hi@pho.chat>",
        "to": [to_email],
        "subject": subject,
        "html": html_content
    }

    try:
        response = requests.post(url, headers=headers, data=json.dumps(payload))
        return response.json()
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Send marketing email via Resend.')
    parser.add_argument('to_email', help='Recipient email address')
    parser.add_argument('subject', help='Email subject')
    parser.add_argument('html_content', help='HTML content of the email')
    
    args = parser.parse_args()
    
    result = send_email_marketing(args.to_email, args.subject, args.html_content)
    print(json.dumps(result, indent=2))
