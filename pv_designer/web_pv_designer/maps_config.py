# Load the API key from an environment variable or secure source
import os

GOOGLE_MAPS_API_KEY = os.getenv('GOOGLE_MAPS_API_KEY')
MAPY_CZ_API_KEY = os.getenv('MAPY_CZ_API_KEY')

GOOGLE_MAPS_API_RATE_LIMIT = '10/m'
MAPY_CZ_API_RATE_LIMIT = '500/s'

INITIAL_LATITUDE = 49.83137
INITIAL_LONGITUDE = 18.16086