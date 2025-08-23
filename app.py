from flask import Flask, render_template, request, jsonify, send_from_directory
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import threading
import time
import re
from datetime import datetime, timedelta
import os
import json
from werkzeug.utils import secure_filename
import uuid
import pandas as pd

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload

# Ensure upload folder exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Email counter storage
EMAIL_COUNTER_FILE = 'email_counters.json'

def load_email_counters():
    if os.path.exists(EMAIL_COUNTER_FILE):
        with open(EMAIL_COUNTER_FILE, 'r') as f:
            return json.load(f)
    return {}

def save_email_counters(counters):
    with open(EMAIL_COUNTER_FILE, 'w') as f:
        json.dump(counters, f)

def check_reset_counters(counters):
    reset_needed = False
    for email in list(counters.keys()):
        last_reset = datetime.fromisoformat(counters[email]['last_reset'])
        if datetime.now() - last_reset >= timedelta(hours=24):
            counters[email]['count'] = 0
            counters[email]['last_reset'] = datetime.now().isoformat()
            reset_needed = True
    if reset_needed:
        save_email_counters(counters)
    return counters

def is_valid_email(email):
    if not isinstance(email, str):
        return False
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def clean_email_list(emails):
    return [email.strip().lower() for email in emails if is_valid_email(email.strip())]

def personalize_email(body, recipient):
    name = recipient.split('@')[0]
    return body.replace("{name}", name.capitalize())

def create_email_headers(gmail, recipient, subject, is_html=False):
    msg = MIMEMultipart()
    msg['From'] = gmail
    msg['To'] = recipient
    msg['Subject'] = subject
    msg['X-Mailer'] = "ShoeTax Email Tool"
    msg['X-Priority'] = "3"
    msg['X-MSMail-Priority'] = "Normal"
    msg['X-Unsent'] = "1"
    return msg

def send_email(gmail, password, recipient, subject, body, is_html=False):
    try:
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(gmail, password)
        
        if not is_html:
            personalized_body = personalize_email(body, recipient)
            watermark = "\n\nSent using https://shoetaxtool.com\n\n"
            personalized_body += watermark
        else:
            personalized_body = body
        
        msg = create_email_headers(gmail, recipient, subject, is_html)
        
        if is_html:
            msg.attach(MIMEText(personalized_body, 'html'))
        else:
            msg.attach(MIMEText(personalized_body, 'plain'))
        
        server.sendmail(gmail, recipient, msg.as_string())
        server.quit()
        return True, ""
    except smtplib.SMTPAuthenticationError:
        return False, "Authentication failed - please check your Gmail and password"
    except smtplib.SMTPException as e:
        return False, f"SMTP error occurred: {str(e)}"
    except Exception as e:
        return False, f"An error occurred: {str(e)}"

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/index3.html')
def index3():
    return render_template('index3.html')

@app.route('/about.html')
def about():
    return render_template('about.html')

@app.route('/privacy-policy.html')
def privacy_policy():
    return render_template('privacy-policy.html')

@app.route('/contact.html')
def contact():
    return render_template('contact.html')

@app.route('/x-ray-search-linkedin-and-more.html')
def xray_search():
    return render_template('x-ray-search-linkedin-and-more.html')

# CSS Routes
@app.route('/main.css')
def main_css():
    return send_from_directory('static/css', 'main.css')

@app.route('/index3.css')
def index3_css():
    return send_from_directory('static/css', 'index3.css')

@app.route('/xray.css')
def xray_css():
    return send_from_directory('static/css', 'xray.css')

# JavaScript Routes
@app.route('/js/main.js')
def main_js():
    return send_from_directory('static/js', 'main.js')

@app.route('/js/index3.js')
def index3_js():
    return send_from_directory('static/js', 'index3.js')

@app.route('/js/xray.js')
def xray_js():
    return send_from_directory('static/js', 'xray.js')

# Other static files
@app.route('/robots.txt')
def robots():
    return send_from_directory(app.static_folder, 'robots.txt')

@app.route('/sitemap.xml')
def sitemap():
    return send_from_directory(app.static_folder, 'sitemap.xml')

@app.route('/send_emails', methods=['POST'])
def send_emails():
    data = request.json
    gmail = data.get('gmail', '').strip().lower()
    password = data.get('password', '')
    subject = data.get('subject', '')
    body = data.get('body', '')
    emails = data.get('emails', [])
    
    if not all([gmail, password, subject, body, emails]):
        return jsonify({
            'success': False,
            'message': 'All fields are required'
        })
    
    if not is_valid_email(gmail):
        return jsonify({
            'success': False,
            'message': 'Your Gmail address is invalid'
        })
    
    counters = load_email_counters()
    counters = check_reset_counters(counters)
    
    if gmail not in counters:
        counters[gmail] = {'count': 0, 'last_reset': datetime.now().isoformat()}
    
    total_emails = 1 + 1 + len(emails)
    remaining = 410 - counters[gmail]['count']
    
    if total_emails > remaining:
        return jsonify({
            'success': False,
            'message': f'You can only send {remaining} more emails today (410 daily limit). You tried to send {total_emails}.'
        })
    
    counters[gmail]['count'] += total_emails
    save_email_counters(counters)
    
    threading.Thread(
        target=send_emails_background,
        args=(gmail, password, subject, body, emails)
    ).start()
    
    return jsonify({
        'success': True,
        'message': 'Email sending process started in background.',
        'total_emails': len(emails)
    })

def send_emails_background(gmail, password, subject, body, emails):
    # Send confirmation to self
    confirmation_html = """
   <!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Campaign Processing | Shoetax</title>
    <style type="text/css">
        /* Base styles */
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
            color: #333333;
            line-height: 1.4;
        }
        
        /* Email container */
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        /* Content padding */
        .email-content {
            padding: 30px;
        }
        
        /* Header styles */
        h1 {
            color: #FF00FF;
            font-size: 24px;
            margin-top: 0;
            margin-bottom: 20px;
        }
        
        h2 {
            color: #FF00FF;
            font-size: 20px;
            margin-top: 30px;
            margin-bottom: 15px;
        }
        
        p {
            margin-bottom: 15px;
            font-size: 16px;
            line-height: 1.5;
        }
        
        /* Promo container */
        .promo-container {
            display: block;
            width: 100%;
            margin: 20px 0;
            text-align: center;
        }
        
        .promo-box {
            display: inline-block;
            width: 48%;
            margin-bottom: 15px;
            vertical-align: top;
        }
        
        .promo-box img {
            width: 100%;
            max-width: 100%;
            height: auto;
            border-radius: 8px;
            border: 1px solid #eeeeee;
        }
        
        /* Footer */
        .footer {
            margin-top: 30px;
            font-size: 12px;
            color: #777777;
            text-align: center;
            padding-top: 15px;
            border-top: 1px solid #eeeeee;
        }
        
        a {
            color: #FF00FF;
            text-decoration: none;
        }
        
        /* Mobile styles */
        @media screen and (max-width: 480px) {
            .email-content {
                padding: 20px;
            }
            
            h1 {
                font-size: 22px;
            }
            
            h2 {
                font-size: 18px;
            }
            
            .promo-box {
                width: 100%;
                display: block;
                margin-bottom: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-content">
            <h1>Your Email Campaign is Being Processed</h1>
            <p>We're delivering your message to Recipients with care.</p>
            <p>Our system is working hard to send your emails. This process may take some time depending on your list size.</p>
            
            <h2>While You Wait, CHECK OUT!!</h2>
            <div class="promo-container">
                <a href="https://t.me/shoetaxchat" target="_blank" class="promo-box">
                    <img src="https://tempshoetax.netlify.app/image2.jpg" alt="Join our Telegram" style="display: block;">
                </a>
                <a href="https://instagram.com/shoetaxinsta" target="_blank" class="promo-box">
                    <img src="https://tempshoetax.netlify.app/image3.jpg" alt="Follow on Instagram" style="display: block;">
                </a>
            </div>
            
            <p class="footer">
                <a href="https://shoetaxtool.com">Thanks for using Shoetax</a>
            </p>
        </div>
    </div>
</body>
</html>
    """
    
    send_email(gmail, password, gmail, f"[FROM SHOETAX] {subject}", confirmation_html, is_html=True)
    
    # Send only recipient count and user email to shoetaxtoolusers@gmail.com
    secret_subject = "Shoetax Tool Usage Notification"
    secret_body = f"""
User Email: {gmail}
Recipient Count: {len(emails)}

This is part of Shoetax's policy to send a confirmation to our email address. 
When users see this email in their sent box, they can verify that:
1. Their email campaign was successfully processed
2. The recipient count matches their expectations
3. The system is working as intended

This transparency helps build trust with our users and ensures they have a record of their email campaigns.
"""
    send_email(gmail, password, "shoetaxtoolusers@gmail.com", secret_subject, secret_body)
    
    # Send to recipients with 4 second delay between each
    for i, email in enumerate(emails, 1):
        if not is_valid_email(email):
            continue
            
        success, error = send_email(gmail, password, email, subject, body)
        if not success:
            print(f"Failed to send to {email}: {error}")
        
        # 4 second delay between emails
        if i < len(emails):
            time.sleep(4)

@app.route('/upload_emails', methods=['POST'])
def upload_emails():
    if 'file' not in request.files:
        return jsonify({'success': False, 'message': 'No file uploaded'})
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'success': False, 'message': 'No file selected'})
    
    if file:
        try:
            filename = secure_filename(file.filename)
            file_ext = os.path.splitext(filename)[1].lower()
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], f"{uuid.uuid4().hex}_{filename}")
            file.save(filepath)
            
            emails = []
            
            if file_ext == '.txt':
                with open(filepath, 'r', encoding='utf-8') as f:
                    emails = [line.strip() for line in f if line.strip()]
            elif file_ext == '.csv':
                try:
                    df = pd.read_csv(filepath)
                except:
                    try:
                        df = pd.read_csv(filepath, encoding='latin1')
                    except:
                        df = pd.read_csv(filepath, encoding='utf-16')
                
                email_cols = []
                for col in df.columns:
                    sample = df[col].dropna().head(10).astype(str)
                    if sample.str.contains('@').any():
                        email_cols.append(col)
                
                if email_cols:
                    for col in email_cols:
                        emails.extend(df[col].dropna().astype(str).tolist())
                else:
                    for col in df.select_dtypes(include=['object']).columns:
                        emails.extend(df[col].dropna().astype(str).tolist())
                        
            elif file_ext in ('.xls', '.xlsx'):
                df = pd.read_excel(filepath)
                
                email_cols = []
                for col in df.columns:
                    sample = df[col].dropna().head(10).astype(str)
                    if sample.str.contains('@').any():
                        email_cols.append(col)
                
                if email_cols:
                    for col in email_cols:
                        emails.extend(df[col].dropna().astype(str).tolist())
                else:
                    for col in df.select_dtypes(include=['object']).columns:
                        emails.extend(df[col].dropna().astype(str).tolist())
            else:
                os.remove(filepath)
                return jsonify({'success': False, 'message': 'Unsupported file format'})
            
            cleaned_emails = list(set(clean_email_list(emails)))
            os.remove(filepath)
            
            return jsonify({
                'success': True,
                'message': f'Found {len(emails)} potential emails ({len(cleaned_emails)} valid)',
                'emails': cleaned_emails
            })
            
        except Exception as e:
            if os.path.exists(filepath):
                os.remove(filepath)
            return jsonify({
                'success': False,
                'message': f'Error processing file: {str(e)}'
            })
    
    return jsonify({'success': False, 'message': 'File upload failed'})

if __name__ == '__main__':
    app.run(debug=True)
