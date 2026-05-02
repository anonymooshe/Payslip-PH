from flask import Flask
import os

# Get the absolute path of the app directory
app_dir = os.path.dirname(os.path.abspath(__file__))

app = Flask(__name__, 
            template_folder=os.path.join(app_dir, 'templates'),
            static_folder=os.path.join(app_dir, 'static'),
            static_url_path='/static')
app.secret_key = "dev-key"
app.config["JSON_AS_ASCII"] = False
app.config["MAX_CONTENT_LENGTH"] = 50 * 1024
