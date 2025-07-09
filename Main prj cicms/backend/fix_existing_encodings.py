import firebase_admin
from firebase_admin import credentials, firestore
import base64
import cv2
import numpy as np
import json
from face_utils import detect_face

# Initialize Firebase
cred = credentials.Certificate("serviceAccountKey.json")
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

db = firestore.client()

def fix_employee_encodings():
    """Re-encode all employee faces using dlib method."""
    try:
        employees_ref = db.collection('employees')
        employees = employees_ref.stream()
        
        updated_count = 0
        error_count = 0
        
        for employee_doc in employees:
            employee_data = employee_doc.to_dict()
            employee_id = employee_data.get('employeeID')
            
            print(f"Processing employee: {employee_id}")
            
            # Process main image
            captured_image = employee_data.get('capturedImage')
            if captured_image:
                face_data, message = detect_face(captured_image)
                if face_data:
                    # Update main face encoding
                    employee_doc.reference.update({
                        'face_encoding': face_data['face_encoding'],
                        'face_rect': face_data['face_rect']
                    })
                    
                    # Process additional images
                    additional_images = employee_data.get('additionalImages', [])
                    additional_encodings = []
                    
                    for img in additional_images:
                        if img:
                            add_face_data, _ = detect_face(img)
                            if add_face_data:
                                additional_encodings.append(add_face_data['face_encoding'])
                    
                    # Update additional encodings
                    if additional_encodings:
                        employee_doc.reference.update({
                            'additional_face_encodings': additional_encodings
                        })
                    
                    updated_count += 1
                    print(f"✓ Updated {employee_id}")
                else:
                    error_count += 1
                    print(f"✗ Failed to process {employee_id}: {message}")
            else:
                error_count += 1
                print(f"✗ No image found for {employee_id}")
        
        print(f"\nCompleted: {updated_count} updated, {error_count} errors")
        
    except Exception as e:
        print(f"Error fixing encodings: {e}")

if __name__ == "__main__":
    print("Starting face encoding fix...")
    fix_employee_encodings()
