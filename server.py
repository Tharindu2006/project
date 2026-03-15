# server.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import numpy as np

app = Flask(__name__)
CORS(app)

# Load trained model
model = pickle.load(open("exam_model.pkl", "rb"))

@app.route("/")
def home():
    return "AI Marks Predictor Running"

@app.route("/predict", methods=["POST"])
def predict():
    data = request.json
    try:
        # Extract features
        features = [
            float(data["study_hours"]),
            float(data["attendance"]),
            float(data["GPA"]),
            float(data["sleep_hours"]),
            float(data["participation"]),
            float(data["homework_completion"]),
            float(data["extracurricular_hours"]),
            float(data["stress_level"])
        ]
        prediction = model.predict([features])[0]
        return jsonify({"predicted_marks": round(prediction, 1)})
    except Exception as e:
        return jsonify({"error": str(e)})

if __name__ == "__main__":
    app.run(debug=True)