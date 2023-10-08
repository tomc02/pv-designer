directory="./pv_designer/web_pv_designer/static/images/"

# Delete files matching the pattern
rm -f "${directory}pv_panel_rotated"*.png
rm -f "${directory}pv_panel_selected_rotated"*.png

# Display a message
echo "Deleted files: ${directory}pv_panel_rotated*.png"
echo "Deleted files: ${directory}pv_panel_selected_rotated*.png"
