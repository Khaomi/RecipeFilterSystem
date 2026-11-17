# ALWAYS EXPOSE ON PORT 3000

from threading import Event
import os

print("Frontend process started")
print(f"Backend URL {os.getenv('BACKEND_URL')}")

Event().wait()
