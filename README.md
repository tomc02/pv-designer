# Photovoltaic calculator

Short description of your project.

## Table of Contents

- [About](#about)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Usage](#usage)

## About
A brief description of your project.

## Getting Started

### Prerequisites

Before you begin, ensure you have met the following requirements:

- You have installed Python 3.x.
- You have installed pip.

### Installation

1. Create a Python virtual environment (optional, but recommended): 
   ```bash
    python3 -m venv venv
    source venv/bin/activate
   ```
2. Install the required packages:
   ```bash
    pip install -r requirements.txt
    ```
3. Change the working directory to the `pv_designer` folder:
    ```bash
     cd pv_designer
     ```
4. Put your API keys into config.env file
5. Make migrations:
    ```bash
    ./manage.py makemigrations web_pv_designer
    ```
6. Apply database migrations(You will be prompted to enter the name of the file containing the list of panels. You can use the file `solar_panels.csv` provided in the repository as an example.):
    ```bash
    ./manage.py migrate
    ```
7. Create a superuser:
    ```bash
    ./manage.py createsuperuser
    ```

## Usage

1. Make sure you are using the virtual environment(If you have created one):
    ```bash
    source venv/bin/activate
    ```
2. Load the configuration using the script `load_config.sh`:
    ```bash
    source load_config.sh
    ```
3. Run the Django application:
    ```bash
    ./manage.py runserver
    ```
4. Open the browser and go to the address `http://localhost:8000/`.

