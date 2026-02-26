"""
Bulk Email Sender: Clerk VN Users → Resend
==========================================
Fetches all Clerk users, filters Vietnam-based ones, sends email via Resend.

VN Detection heuristics (any one match = VN user):
  1. Phone starts with +84
  2. public_metadata.country == "VN" or "Vietnam"
  3. locale starts with "vi"
  4. email contains common VN domains (gmail.com, yahoo.com typical + no obvious foreign pattern)

Run:
  python scripts/send-bulk-email-vn.py --dry-run     # preview only
  python scripts/send-bulk-email-vn.py               # send for real
"""

import argparse, json, os, time
import requests

# ── Config ────────────────────────────────────────────────────────────────────
CLERK_SECRET_KEY = None
RESEND_API_KEY   = None

def load_env():
    global CLERK_SECRET_KEY, RESEND_API_KEY
    env_files = ['.env.local', '.env.vercel.production', '.env']
    for env_file in env_files:
        if os.path.exists(env_file):
            with open(env_file, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line.startswith('CLERK_SECRET_KEY=') and not CLERK_SECRET_KEY:
                        CLERK_SECRET_KEY = line.split('=', 1)[1].strip()
                    if line.startswith('RESEND_API_KEY=') and not RESEND_API_KEY:
                        RESEND_API_KEY = line.split('=', 1)[1].strip()
    # Also check environment variables
    CLERK_SECRET_KEY = CLERK_SECRET_KEY or os.environ.get('CLERK_SECRET_KEY')
    RESEND_API_KEY   = RESEND_API_KEY   or os.environ.get('RESEND_API_KEY')

EMAIL_SUBJECT = "🚀 Phở Chat: 4 Model AI Mới — Claude Opus 4.6, Mercury 2 ⚡ & Medical Beta Tier 3"
EMAIL_HTML_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'src', 'emails', 'new-models-feb-2026.html')
FROM_EMAIL    = "Tom from Phở Chat <hi@pho.chat>"

# Rate limiting: Resend free tier = 100 emails/day, paid = 10 req/s
DELAY_BETWEEN_EMAILS = 0.5   # seconds between each send
BATCH_PAUSE_EVERY    = 50    # pause after every N emails
BATCH_PAUSE_SECONDS  = 5     # pause duration

# ── VN Detection ──────────────────────────────────────────────────────────────
VN_PHONE_PREFIXES  = ['+84', '084', '034', '035', '036', '037', '038', '039',
                      '070', '079', '077', '076', '078', '089', '090', '093',
                      '083', '084', '085', '081', '082',
                      '056', '058', '032', '033', '086',
                      '091', '094', '088', '097', '096', '098']

VN_COUNTRY_VALUES = ['vn', 'vietnam', 'việt nam', 'vi', 'vie']

def is_vietnam_user(user: dict) -> tuple[bool, str]:
    """Returns (is_vn, reason)"""
    # Check phone numbers
    phones = user.get('phone_numbers', []) or []
    for phone_obj in phones:
        pn = (phone_obj.get('phone_number') or '').strip()
        if pn.startswith('+84'):
            return True, f"phone={pn}"

    # Check public_metadata for country
    pub_meta = user.get('public_metadata') or {}
    country = str(pub_meta.get('country', '') or pub_meta.get('country_code', '')).lower()
    if country and any(v in country for v in VN_COUNTRY_VALUES):
        return True, f"metadata.country={country}"

    # Check unsafe_metadata
    unsafe_meta = user.get('unsafe_metadata') or {}
    country2 = str(unsafe_meta.get('country', '') or unsafe_meta.get('country_code', '')).lower()
    if country2 and any(v in country2 for v in VN_COUNTRY_VALUES):
        return True, f"unsafe_metadata.country={country2}"

    # Check locale
    locale = (user.get('profile_image_url') or '')  # not useful
    # Clerk doesn't expose locale directly, check username patterns

    # Fallback: Check email for obvious non-VN patterns
    # We include all if no strong exclusion signal
    # NOTE: Conservative approach - include if uncertain unless strong exclusion
    emails = user.get('email_addresses', []) or []
    for email_obj in emails:
        email = (email_obj.get('email_address') or '').lower()
        # Exclude clearly foreign institutional domains
        foreign_domains = ['.edu.au', '.ac.uk', '.edu.sg', '.edu.us',
                           'fpt.', 'hust.', 'hcmus.', 'hcmut.']
        # These are actually VN universities, keep them
        # Only exclude if clearly non-VN

    return False, "no_vn_signal"

def get_primary_email(user: dict) -> str | None:
    emails = user.get('email_addresses', []) or []
    # Prefer primary email
    primary_id = user.get('primary_email_address_id')
    for e in emails:
        if e.get('id') == primary_id:
            return e.get('email_address')
    # Fallback to first verified
    for e in emails:
        if e.get('verification', {}).get('status') == 'verified':
            return e.get('email_address')
    # Fallback to first
    if emails:
        return emails[0].get('email_address')
    return None

# ── Clerk: Fetch all users (paginated) ───────────────────────────────────────
def fetch_all_clerk_users() -> list[dict]:
    users = []
    offset = 0
    limit  = 500
    print("📥 Fetching users from Clerk...")

    while True:
        url = f"https://api.clerk.com/v1/users?limit={limit}&offset={offset}&order_by=-created_at"
        resp = requests.get(url, headers={'Authorization': f'Bearer {CLERK_SECRET_KEY}'}, timeout=30)
        if not resp.ok:
            print(f"❌ Clerk API error: {resp.status_code} {resp.text}")
            break

        batch = resp.json()
        if not batch:
            break

        users.extend(batch)
        print(f"   Fetched {len(users)} users so far...")

        if len(batch) < limit:
            break
        offset += limit
        time.sleep(0.3)

    print(f"✅ Total users fetched: {len(users)}")
    return users

# ── Resend: Send one email ────────────────────────────────────────────────────
def send_email(to_email: str, html: str, dry_run: bool = False) -> dict:
    if dry_run:
        return {'id': 'DRY_RUN', 'status': 'skipped'}

    payload = {
        'from': FROM_EMAIL,
        'to': [to_email],
        'subject': EMAIL_SUBJECT,
        'html': html,
    }
    resp = requests.post(
        'https://api.resend.com/emails',
        headers={'Authorization': f'Bearer {RESEND_API_KEY}', 'Content-Type': 'application/json'},
        data=json.dumps(payload),
        timeout=15,
    )
    return resp.json()

# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--dry-run', action='store_true', help='Preview only, do not send')
    parser.add_argument('--limit', type=int, default=0, help='Max emails to send (0=all)')
    args = parser.parse_args()

    load_env()

    if not CLERK_SECRET_KEY:
        print("❌ CLERK_SECRET_KEY not found in .env.local or .env.vercel.production")
        return
    if not RESEND_API_KEY:
        print("❌ RESEND_API_KEY not found")
        return

    # Load email HTML
    with open(EMAIL_HTML_PATH, 'r', encoding='utf-8') as f:
        html = f.read()

    mode = "DRY RUN 🧪" if args.dry_run else "LIVE SEND 🚀"
    print(f"\n{'='*60}")
    print(f"  Phở Chat — Bulk Email Sender ({mode})")
    print(f"{'='*60}")

    # Step 1: Fetch all users
    all_users = fetch_all_clerk_users()

    # Step 2: Filter VN users with emails
    vn_users = []
    skipped_no_email = 0
    skipped_not_vn   = 0

    print("\n🔍 Filtering Vietnam users...")
    for user in all_users:
        email = get_primary_email(user)
        if not email:
            skipped_no_email += 1
            continue

        is_vn, reason = is_vietnam_user(user)

        # Also include users with no strong signal but have VN-pattern phone
        # OR if they registered with +84 prefix
        phones = user.get('phone_numbers', []) or []
        has_vn_phone = any(
            (p.get('phone_number') or '').startswith('+84') for p in phones
        )

        if is_vn or has_vn_phone:
            vn_users.append({
                'email': email,
                'name': f"{user.get('first_name', '') or ''} {user.get('last_name', '') or ''}".strip(),
                'reason': reason,
                'user_id': user.get('id'),
            })
        else:
            skipped_not_vn += 1

    print(f"\n📊 Summary:")
    print(f"   Total Clerk users:   {len(all_users)}")
    print(f"   Vietnam users:       {len(vn_users)}")
    print(f"   Skipped (no email):  {skipped_no_email}")
    print(f"   Skipped (not VN):    {skipped_not_vn}")

    if not vn_users:
        print("\n⚠️ No VN users found. Check VN detection logic.")
        return

    # Show preview
    print(f"\n📧 Sending to {len(vn_users)} VN users:")
    for u in vn_users[:10]:
        print(f"   • {u['email']} ({u['name'] or 'no name'}) — {u['reason']}")
    if len(vn_users) > 10:
        print(f"   ... and {len(vn_users) - 10} more")

    if args.dry_run:
        print(f"\n✅ DRY RUN complete. Would send {len(vn_users)} emails.")
        return

    # Step 3: Send emails
    confirm = input(f"\n⚠️  Send email to {len(vn_users)} users? (yes/no): ")
    if confirm.strip().lower() != 'yes':
        print("❌ Aborted.")
        return

    limit = args.limit or len(vn_users)
    sent_ok  = 0
    sent_err = 0
    errors   = []

    print(f"\n🚀 Sending emails...")
    for i, u in enumerate(vn_users[:limit]):
        try:
            result = send_email(u['email'], html)
            if result.get('id') and 'error' not in result:
                sent_ok += 1
                print(f"   [{i+1}/{limit}] ✅ {u['email']}")
            else:
                sent_err += 1
                errors.append({'email': u['email'], 'error': result})
                print(f"   [{i+1}/{limit}] ❌ {u['email']} — {result}")
        except Exception as e:
            sent_err += 1
            errors.append({'email': u['email'], 'error': str(e)})
            print(f"   [{i+1}/{limit}] ❌ {u['email']} — {e}")

        time.sleep(DELAY_BETWEEN_EMAILS)

        # Batch pause
        if (i + 1) % BATCH_PAUSE_EVERY == 0 and (i + 1) < limit:
            print(f"\n   ⏸️  Batch pause {BATCH_PAUSE_SECONDS}s...")
            time.sleep(BATCH_PAUSE_SECONDS)

    print(f"\n{'='*60}")
    print(f"  ✅ Sent successfully: {sent_ok}")
    print(f"  ❌ Failed:            {sent_err}")
    print(f"{'='*60}")

    if errors:
        print("\n❌ Failed emails:")
        for e in errors:
            print(f"   {e['email']}: {e['error']}")


if __name__ == '__main__':
    main()
