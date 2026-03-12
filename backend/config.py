import os

# FRONTEND_URL: The URL where your React frontend is hosted.
# This is used for CORS configuration.
# 
# Local Development: http://localhost:3000
# Production: https://your-app-name.netlify.app (example)

FRONTEND_URL = os.getenv("FRONTEND_URL", "https://qc-financetracker.netlify.app")
