# ALWAYS EXPOSE ON PORT 3000

import os
from threading import Event

print("Frontend process started")
print(f"Backend URL {os.getenv('BACKEND_URL')}")

Event().wait()