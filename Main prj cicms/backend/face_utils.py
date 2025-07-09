import cv2
import numpy as np
import base64
import json
import dlib
from PIL import Image
import io

# Initialize dlib models (you'll need to download these files)
detector = dlib.get_frontal_face_detector()
shape_predictor = dlib.shape_predictor("shape_predictor_68_face_landmarks.dat")
face_rec_model = dlib.face_recognition_model_v1("dlib_face_recognition_resnet_model_v1.dat")

def detect_face(image_data):
    try:
        # Remove the data URL prefix if present
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        # Decode base64 image
        image_bytes = base64.b64decode(image_data)
        
        # Convert to numpy array for OpenCV
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return None, "Invalid image data"
        
        # Convert to RGB (dlib expects RGB)
        rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        # Detect faces using dlib
        faces = detector(rgb_img)
        
        if len(faces) == 0:
            return None, "No face detected"
        
        # Get the largest face
        largest_face = max(faces, key=lambda rect: rect.width() * rect.height())
        
        # Extract face encoding using dlib
        face_encoding = extract_face_encoding_dlib(rgb_img, largest_face)
        
        if face_encoding is None:
            return None, "Could not extract face encoding"
        
        return {
            "face_rect": [largest_face.left(), largest_face.top(), 
                         largest_face.width(), largest_face.height()],
            "face_encoding": json.dumps(face_encoding.tolist())
        }, "Face detected successfully"
        
    except Exception as e:
        print(f"Error in face detection: {e}")
        return None, str(e)

def extract_face_encoding_dlib(image, face_rect):
    """Extract 128-dimensional face encoding using dlib's ResNet model."""
    try:
        # Get face landmarks
        shape = shape_predictor(image, face_rect)
        
        # Extract face encoding (128-dimensional vector)
        face_encoding = face_rec_model.compute_face_descriptor(image, shape, 1)
        
        # Convert to numpy array
        encoding = np.array(face_encoding)
        
        if len(encoding) != 128:
            return None
            
        return encoding
        
    except Exception as e:
        print(f"Error extracting dlib face encoding: {e}")
        return None

def compare_faces(encoding1, encoding2, threshold=0.6):
    """Compare two face encodings using Euclidean distance."""
    try:
        # Parse JSON strings if needed
        if isinstance(encoding1, str):
            encoding1 = np.array(json.loads(encoding1))
        if isinstance(encoding2, str):
            encoding2 = np.array(json.loads(encoding2))
        
        # Ensure both are numpy arrays
        encoding1 = np.array(encoding1, dtype=np.float64)
        encoding2 = np.array(encoding2, dtype=np.float64)
        
        # Calculate Euclidean distance
        distance = np.linalg.norm(encoding1 - encoding2)
        
        # Return similarity (lower distance = higher similarity)
        similarity = 1.0 - min(distance, 1.0)
        is_match = distance < threshold
        
        return is_match, distance
        
    except Exception as e:
        print(f"Error comparing faces: {e}")
        return False, 1.0
