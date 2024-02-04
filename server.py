from flask import Flask, request, jsonify, render_template, redirect
from flask_minify import Minify
from PIL import Image, ImageDraw, ImageFont
from io import BytesIO
import random
import io

app = Flask(__name__)
Minify(app=app, html=True, js=True, cssless=True)

TEMPLATE_IMAGE_PATH = "template.png"
FONT_PATH = "font.ttf"
FIELDS = {
    "name": ((255,22),(365,975),),
    "address": (305,70),
    "number": ((560,135),(448,350),),
    "issuer": ((305,250),(145,730),(265,1020),),
}


def generate_image_with_text(fields: list[dict], template_image_path: str) -> BytesIO:
    template_image = Image.open(template_image_path)
    draw = ImageDraw.Draw(template_image)
    font = ImageFont.truetype(FONT_PATH, 25)
    
    for field in fields:
        draw.text(field["position"], field["text"], fill=(0,50,150), font=font)
    
    image_stream = io.BytesIO()
    template_image.save(image_stream, format='PNG')
    
    image_stream.seek(0)
    return image_stream


def validate_and_format_data(input_data: dict) -> tuple[list, None] or tuple[None, str]:
    output = []
    for field, position in FIELDS.items():
        if field not in input_data:
            return None, f"Missing field: {field}"
        
        text = input_data[field]
        if field == "number":
            if not isinstance(text, int):
                return None, f"Field 'number' must be an integer"
            text = str(text)
        else:
            if not isinstance(text, str):
                return None, f"Field '{field}' must be a string"
            
        pos = lambda pos: [random.uniform(p-2, p+2) for p in pos]
        if isinstance(position[0], int):
            output.append({"text": text, "position": pos(position)})
        else:    
            for tpos in position:
                output.append({"text": text, "position": pos(tpos)})
        
    return output, None


@app.route('/generate', methods=['POST'])
def generate_image() -> tuple[bytes, int, dict] or jsonify:
    request_data = request.get_json()
    if not request_data:
        return jsonify({"error": "JSON data error"}), 400
    
    request_data["number"] = random.randint(64*64, 512*512)
    data, error = validate_and_format_data(request_data)
    if error:
        return jsonify({"error": error}), 400
    
    image_stream = generate_image_with_text(data, TEMPLATE_IMAGE_PATH)
    return image_stream.getvalue(), 200, {'Content-Type': 'image/png'}


@app.route('/')
def index():
    return render_template('index.html')


@app.errorhandler(404)
def page_not_found(_) -> redirect:
    return redirect("/")


if __name__ == '__main__':
    app.run()
