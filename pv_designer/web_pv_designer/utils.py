import os

from PIL import Image, ImageOps

def rotate_pv_img(angle):
    original_image_path = '/static/images/pv_panel.png'
    rotated_image_path = '/static/images/pv_panel_rotated.png'
    file_path = os.path.dirname(os.path.relpath(__file__))
    original_image = Image.open(file_path + original_image_path).convert("RGBA")

    rotation_angle = float(angle)  # Change this to your desired angle
    rotated_image = original_image.rotate(rotation_angle, expand=True, resample=Image.BICUBIC)

    canvas_width = int(rotated_image.width * 1.5)
    canvas_height = int(rotated_image.height * 1.5)
    canvas = Image.new('RGBA', (canvas_width, canvas_height), (0, 0, 0, 0))
    paste_x = (canvas_width - rotated_image.width) // 2
    paste_y = (canvas_height - rotated_image.height) // 2
    canvas.paste(rotated_image, (paste_x, paste_y), rotated_image)

    rotated_image.save(file_path + rotated_image_path)
