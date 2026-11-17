import sys
from pathlib import Path

# Add backend directory to python path for package imports
backend_path = Path(__file__).resolve().parent.parent
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from app.main import app  # noqa: F401, E402
