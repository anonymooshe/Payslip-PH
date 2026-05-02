from flask import Flask
import os

# Get absolute path of app directory
basedir = os.path.abspath(os.path.dirname(__file__))

# Initialize Flask with template and static folders
app = Flask(__name__, 
            template_folder=os.path.join(basedir, 'templates'),
            static_folder=os.path.join(basedir, 'static'))
app.secret_key = os.environ.get("PAYSLIP_SECRET_KEY", "dev-key-only")  # Secret for sessions
app.config["JSON_AS_ASCII"] = False  # Allow non-ASCII JSON
app.config["MAX_CONTENT_LENGTH"] = 50 * 1024  # 50KB max upload
