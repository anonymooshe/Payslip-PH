#!/usr/bin/env python3
from app import app
from app.server import *

if __name__ == "__main__":
    print("  PaySlip PH backend running at http://localhost:8080")
    app.run(debug=False, port=8080, host="127.0.0.1")
