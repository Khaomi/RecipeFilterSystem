# ALWAYS EXPOSE ON PORT 3000
import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

print("Frontend process started")
print(f"Backend URL {os.getenv('BACKEND_URL')}")

os.chdir(os.path.dirname(os.path.abspath(__file__)))  # serve files from src/
ThreadingHTTPServer(("0.0.0.0", 3000), SimpleHTTPRequestHandler).serve_forever()