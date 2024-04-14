import base64
import math
import os

from PIL import Image
from django.conf import settings


def save_map_img(image_url, user_id, db_id=None):
    image_url = image_url.replace('data:image/png;base64,', '')
    save_path = os.path.join(settings.BASE_DIR, 'web_pv_designer', 'pdf_sources', user_id)
    db_path = os.path.join(settings.MEDIA_ROOT, 'map_images')

    if not os.path.exists(save_path):
        os.makedirs(save_path)

    with open(os.path.join(save_path, 'pv_image.png'), "wb") as fh:
        fh.write(base64.decodebytes(image_url.encode()))

    im = Image.open(os.path.join(save_path, 'pv_image.png'))
    width, height = im.size
    if height > width:
        im = im.rotate(90, expand=True)
    im.save(os.path.join(save_path, 'pv_image.png'))

    if db_id is not None:
        db_path = os.path.join(db_path, f'{db_id}.png')
        im.save(db_path)
        return os.path.relpath(db_path, settings.MEDIA_ROOT)


def rotate_pv_img(angle, slope, original_image_name, rotated_image_name, orientation):
    static_path = os.path.join(settings.BASE_DIR, 'web_pv_designer', 'static', 'images')
    original_image = Image.open(os.path.join(static_path, original_image_name + '.png')).convert("RGBA")
    if orientation == '1':
        print('orientation 1')
        original_image = original_image.rotate(90, expand=True, resample=Image.BICUBIC)
    width, height = original_image.size
    slope = 90 - float(slope)
    new_height = height * math.sin(math.radians(slope))
    original_image = original_image.resize((width, int(new_height)))
    print(height, new_height)

    rotation_angle = float(angle)
    rotated_image = original_image.rotate(rotation_angle, expand=True, resample=Image.BICUBIC)

    angle = str(round(rotation_angle))
    rotated_image.save(static_path + '/' + rotated_image_name + angle + '.png')

    rotated_image.close()
    original_image.close()
    return rotated_image_name + angle



def delete_rotated_images():
    static_path = os.path.join(settings.BASE_DIR, 'web_pv_designer', 'static', 'images')
    for file in os.listdir(static_path):
        if file.startswith('pv_panel_rotated'):
            os.remove(os.path.join(static_path, file))
        if file.startswith('pv_panel_selected_rotated'):
            os.remove(os.path.join(static_path, file))
