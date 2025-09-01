import sys
import os

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app import app

# This is the entry point for Vercel serverless functions
def handler(event, context):
    return app(event, context)

# For direct Flask app access
if __name__ == '__main__':
    app.run()