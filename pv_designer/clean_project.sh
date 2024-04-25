#!/bin/bash

# Remove __pycache__ directories if they exist
if [ -d "__pycache__" ]; then
    rm -rf __pycache__
    echo "Removed __pycache__"
fi
if [ -d "pv_designer/__pycache__" ]; then
    rm -rf pv_designer/__pycache__
    echo "Removed pv_designer/__pycache__"
fi
if [ -d "web_pv_designer/__pycache__" ]; then
    rm -rf web_pv_designer/__pycache__
    echo "Removed web_pv_designer/__pycache__"
fi

# Remove all images from ./media/map_images (Keep the directory)
if [ -d "media/map_images" ]; then
    rm -r media/map_images/*
    echo "Removed all images from media/map_images"
fi

# Remove db.sqlite3
if [ -f "db.sqlite3" ]; then
    rm db.sqlite3
    echo "Removed db.sqlite3"
fi

# Remove migrations
if [ -d "web_pv_designer/migrations" ]; then
    rm -rf web_pv_designer/migrations
    echo "Removed web_pv_designer/migrations"
fi

# Remove all folders in web_pv_designer/pdf_sources
if [ -d "web_pv_designer/pdf_sources" ]; then
    rm -rf web_pv_designer/pdf_sources/*
    echo "Removed all folders in web_pv_designer/pdf_sources"
fi

# Remove venv directory
if [ -d "venv" ]; then
    rm -rf venv
    echo "Removed venv"
fi
if [ -d "../venv" ]; then
    rm -rf ../venv
    echo "Removed ../venv"
fi

