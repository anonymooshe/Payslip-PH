from flask import Flask
import os

basedir = os.path.abspath(os.path.dirname(__file__))

app = Flask(__name__, 
            template_folder=os.path.join(basedir, 'templates'),
            static_folder=os.path.join(basedir, 'static'))
app.secret_key = "dev-key"
app.config["JSON_AS_ASCII"] = False
app.config["MAX_CONTENT_LENGTH"] = 50 * 1024
