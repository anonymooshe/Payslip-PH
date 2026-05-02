#!/usr/bin/env python3
import os
from app import app
from app.server import *

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    host = os.environ.get("HOST", "127.0.0.1")
    app.run(debug=False, port=port, host=host)
