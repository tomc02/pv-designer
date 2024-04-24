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

    with open(os.path.join(save_path, 'pv_image.png'), 'wb') as fh:
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


def rotate_pv_img(angle: float, slope: float, original_image_name: str, rotated_image_name: str, orientation: str,
                  ratio: float):
    static_path = os.path.join(settings.BASE_DIR, 'web_pv_designer', 'static', 'images')
    original_image = Image.open(os.path.join(static_path, original_image_name + '.png')).convert('RGBA')

    # rotate image according to the orientation
    if orientation == '1':
        original_image = original_image.rotate(90, expand=True, resample=Image.BICUBIC)

    # resize original image to match the ratio
    width, height = original_image.size
    if width / height > ratio:
        new_width = height * ratio
        original_image = original_image.resize((int(new_width), height))
    else:
        new_height = width / ratio
        original_image = original_image.resize((width, int(new_height)))

    # resize image according to the slope
    width, height = original_image.size
    slope = 90 - slope
    new_height = height * math.sin(math.radians(slope))
    original_image = original_image.resize((width, int(new_height)))

    # rotate image to the desired angle
    rotated_image = original_image.rotate(angle, expand=True, resample=Image.BICUBIC)

    angle = str(round(angle*100)/100)  # Using this way of rounding to make it consistent with the frontend
    # If there is 0 after the decimal point, remove it (Consistency with the frontend again)
    if angle.endswith('.0'):
        angle = angle[:-2]
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
