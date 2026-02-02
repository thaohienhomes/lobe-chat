---
name: send_email_marketing
description: Send marketing emails via Resend API using a Python script.
---

# Send Email Marketing

## Description

This skill allows you to send marketing emails using the Resend API. It uses a Python script located in this directory.

## Usage

To send an email, run the `send_email_marketing.py` script with the following arguments:

1. `to_email`: The recipient's email address
2. `subject`: The subject line
3. `html_content`: The HTML body/content of the email

### Example Command

```bash
python .agent/skills/send_email_marketing/send_email_marketing.py "user@example.com" "Welcome!" "<h1>Hello</h1>"
```

## Dependencies

- python3
- requests (`pip install requests`)
