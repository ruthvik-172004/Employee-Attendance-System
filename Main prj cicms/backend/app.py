from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import uuid
import base64
import datetime
import json
import firebase_admin
from firebase_admin import credentials, firestore, storage
import cv2
import numpy as np
import io
from PIL import Image
from face_utils import detect_face, compare_faces

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Initialize Firebase Admin SDK
try:
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)
    print("Firebase initialized successfully")
except Exception as e:
    print(f"Error initializing Firebase: {e}")

db = firestore.client()

def generate_employee_id(department):
    try:
        dept_prefix = department[:2].upper()
        timestamp = datetime.datetime.now().strftime("%m%d%H%M")
        random_suffix = str(uuid.uuid4())[:4]
        return f"{dept_prefix}-{timestamp}-{random_suffix}"
    except Exception as e:
        print(f"Error generating employee ID: {e}")
        return f"EMP-{str(uuid.uuid4())[:8]}"

@app.route('/check-phone', methods=['POST'])
def check_phone():
    try:
        data = request.json
        phone = data.get('phone')
        
        if not phone:
            return jsonify({"status": "error", "message": "Phone number is required"}), 400
        
        employees_ref = db.collection('employees')
        query = employees_ref.where('phone', '==', phone).limit(1)
        results = list(query.stream())
        
        exists = len(results) > 0
        
        return jsonify({"exists": exists})
    except Exception as e:
        print(f"Error checking phone: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/update-admin-profile', methods=['POST'])
def update_admin_profile():
    try:
        data = request.json
        
        email = data.get('email')
        first_name = data.get('firstName')
        last_name = data.get('lastName')
        phone = data.get('phone')
        profile_image = data.get('profileImage')
        remove_image = data.get('removeImage', False)
        
        if not email:
            return jsonify({"status": "error", "message": "Email is required"}), 400
        
        admins_ref = db.collection('admins')
        query = admins_ref.where('email', '==', email).limit(1)
        results = list(query.stream())
        
        admin_data = {
            'email': email,
            'firstName': first_name,
            'lastName': last_name,
            'phone': phone,
            'updatedAt': firestore.SERVER_TIMESTAMP
        }
        
        if remove_image:
            admin_data['profileImage'] = None
        elif profile_image and profile_image.startswith('data:'):
            admin_data['profileImage'] = profile_image
        
        if len(results) > 0:
            admin_doc = results[0]
            admin_ref = admins_ref.document(admin_doc.id)
            
            if remove_image and 'profileImage' in admin_doc.to_dict():
                admin_ref.update({
                    'profileImage': firestore.DELETE_FIELD,
                    **{k: v for k, v in admin_data.items() if k != 'profileImage'}
                })
            else:
                admin_ref.update(admin_data)
            
            message = "Admin profile updated successfully"
        else:
            admin_data['createdAt'] = firestore.SERVER_TIMESTAMP
            admin_data['role'] = 'Admin'
            admin_ref = admins_ref.add(admin_data)
            message = "Admin profile created successfully"
        
        return jsonify({
            "status": "success",
            "message": message
        })
    except Exception as e:
        print(f"Error updating admin profile: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/register', methods=['POST'])
def register():
    try:
        data = request.json
        
        fname = data.get('fname')
        lname = data.get('lname')
        email = data.get('email')
        phone = data.get('phone')
        location = data.get('location')
        department = data.get('department')
        position = data.get('position')
        start_date = data.get('startDate')
        captured_image = data.get('capturedImage')
        additional_images = data.get('additionalImages', [])
        status = data.get('status', 'Active')
        
        if not all([fname, lname, email, phone, department, position, start_date, captured_image]):
            return jsonify({"status": "error", "message": "All fields are required"}), 400
        
        if '@' not in email or '.' not in email:
            return jsonify({"status": "error", "message": "Invalid email format"}), 400
        
        if not phone.isdigit() or len(phone) != 10:
            return jsonify({"status": "error", "message": "Phone number must be 10 digits"}), 400
        
        employees_ref = db.collection('employees')
        query = employees_ref.where('phone', '==', phone).limit(1)
        results = list(query.stream())
        if len(results) > 0:
            return jsonify({"status": "error", "message": "Phone number already registered"}), 400
        
        total_images = 1 + len(additional_images)
        if total_images > 5:
            return jsonify({"status": "error", "message": "Maximum 5 images allowed"}), 400
        
        face_data, message = detect_face(captured_image)
        if not face_data:
            return jsonify({"status": "error", "message": message}), 400
        
        face_encodings = []
        if additional_images and len(additional_images) > 0:
            for img in additional_images:
                face_data_additional, _ = detect_face(img)
                if face_data_additional:
                    face_encodings.append(face_data_additional['face_encoding'])
        
        employee_id = generate_employee_id(department)
        
        employee_data = {
            'employeeID': employee_id,
            'fname': fname,
            'lname': lname,
            'email': email,
            'phone': phone,
            'location': location,
            'department': department,
            'position': position,
            'startDate': start_date,
            'capturedImage': captured_image,
            'additionalImages': additional_images,
            'face_rect': face_data['face_rect'],
            'face_encoding': face_data['face_encoding'],
            'additional_face_encodings': face_encodings,
            'status': status,
            'registrationDate': firestore.SERVER_TIMESTAMP
        }
        
        doc_ref = employees_ref.add(employee_data)
        
        return jsonify({
            "status": "success", 
            "message": "Employee registered successfully",
            "employeeID": employee_id
        })
    except Exception as e:
        print(f"Error registering employee: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/employees', methods=['GET'])
def get_employees():
    try:
        employees_ref = db.collection('employees')
        employees = employees_ref.stream()
        
        employee_list = []
        for employee in employees:
            employee_data = employee.to_dict()
            employee_list.append(employee_data)
        
        return jsonify({"status": "success", "employees": employee_list})
    except Exception as e:
        print(f"Error getting employees: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/employee/<id>', methods=['GET'])
def get_employee(id):
    try:
        employees_ref = db.collection('employees')
        query = employees_ref.where('employeeID', '==', id).limit(1)
        results = list(query.stream())
        
        if len(results) == 0:
            return jsonify({"status": "error", "message": "Employee not found"}), 404
        
        employee_data = results[0].to_dict()
        
        return jsonify({"status": "success", "employee": employee_data})
    except Exception as e:
        print(f"Error getting employee: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/employee/<id>', methods=['DELETE'])
def delete_employee(id):
    try:
        employees_ref = db.collection('employees')
        query = employees_ref.where('employeeID', '==', id).limit(1)
        results = list(query.stream())
        
        if len(results) == 0:
            return jsonify({"status": "error", "message": "Employee not found"}), 404
        
        results[0].reference.delete()
        
        return jsonify({"status": "success", "message": "Employee deleted successfully"})
    except Exception as e:
        print(f"Error deleting employee: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/mark-attendance', methods=['POST'])
def mark_attendance():
    """🎯 FIXED: Prevent duplicate attendance for the same day"""
    try:
        data = request.json
        
        employee_id = data.get('employeeID')
        timestamp = data.get('timestamp', datetime.datetime.now().isoformat())
        device = data.get('device', 'manual')
        
        if not employee_id:
            return jsonify({"status": "error", "message": "Employee ID is required"}), 400
        
        # Check if employee exists
        employees_ref = db.collection('employees')
        query = employees_ref.where('employeeID', '==', employee_id).limit(1)
        results = list(query.stream())
        
        if len(results) == 0:
            return jsonify({"status": "error", "message": "Employee not found"}), 404
        
        employee = results[0].to_dict()
        
        # 🎯 FIXED: Check for attendance today (not just 5 minutes)
        today = datetime.datetime.now().date()
        today_start = datetime.datetime.combine(today, datetime.time.min).isoformat()
        today_end = datetime.datetime.combine(today, datetime.time.max).isoformat()
        
        attendance_ref = db.collection('attendance')
        query = attendance_ref.where('employeeID', '==', employee_id).where('timestamp', '>=', today_start).where('timestamp', '<=', today_end).limit(1)
        today_attendance = list(query.stream())
        
        # 🛡️ PREVENT DUPLICATE: If attendance already exists today
        if len(today_attendance) > 0:
            existing_record = today_attendance[0].to_dict()
            return jsonify({
                "status": "warning", 
                "message": "Attendance already marked today",
                "employeeID": employee_id,
                "name": f"{employee.get('fname', '')} {employee.get('lname', '')}",
                "existing_timestamp": existing_record.get('timestamp'),
                "duplicate_prevented": True
            }), 200
        
        # Create NEW attendance record (only if none exists today)
        attendance_data = {
            'employeeID': employee_id,
            'timestamp': timestamp,
            'device': device,
            'department': employee.get('department', ''),
            'position': employee.get('position', ''),
            'location': employee.get('location', ''),
            'name': f"{employee.get('fname', '')} {employee.get('lname', '')}",
            'status': 'Present',
            'recordedAt': firestore.SERVER_TIMESTAMP,
            'daily_date': today.isoformat(),  # Track the date
            'is_duplicate': False
        }
        
        # Add to Firestore
        doc_ref = attendance_ref.add(attendance_data)
        
        print(f"✅ NEW attendance marked for {employee_id} on {today}")
        
        return jsonify({
            "status": "success", 
            "message": "Attendance marked successfully",
            "employeeID": employee_id,
            "name": f"{employee.get('fname', '')} {employee.get('lname', '')}",
            "is_first_today": True
        })
    except Exception as e:
        print(f"Error marking attendance: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/attendance', methods=['GET'])
def get_attendance():
    try:
        date = request.args.get('date')
        employee_id = request.args.get('employeeID')
        department = request.args.get('department')
        
        attendance_ref = db.collection('attendance')
        query = attendance_ref
        
        if date:
            start_date = datetime.datetime.strptime(date, '%Y-%m-%d').isoformat()
            end_date = (datetime.datetime.strptime(date, '%Y-%m-%d') + datetime.timedelta(days=1)).isoformat()
            query = query.where('timestamp', '>=', start_date).where('timestamp', '<', end_date)
        
        if employee_id:
            query = query.where('employeeID', '==', employee_id)
            
        if department:
            query = query.where('department', '==', department)
        
        query = query.order_by('timestamp', direction=firestore.Query.DESCENDING)
        
        attendance_records = query.stream()
        
        records_list = []
        for record in attendance_records:
            record_data = record.to_dict()
            record_data['id'] = record.id
            records_list.append(record_data)
        
        return jsonify({"status": "success", "attendance": records_list})
    except Exception as e:
        print(f"Error getting attendance records: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/departments', methods=['GET'])
def get_departments():
    try:
        departments_ref = db.collection('departments')
        departments_snapshot = departments_ref.stream()
        
        departments_list = []
        for dept in departments_snapshot:
            dept_data = dept.to_dict()
            dept_data['id'] = dept.id
            
            employees_ref = db.collection('employees')
            query = employees_ref.where('department', '==', dept_data.get('name', ''))
            employee_count = len(list(query.stream()))
            
            attendance_rate = 95
            
            dept_data['employeeCount'] = employee_count
            dept_data['attendanceRate'] = attendance_rate
            
            departments_list.append(dept_data)
        
        return jsonify({"status": "success", "departments": departments_list})
    except Exception as e:
        print(f"Error getting departments: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/employee-faces', methods=['GET'])
def get_employee_faces():
    try:
        employees_ref = db.collection('employees')
        employees = employees_ref.stream()
        
        employee_list = []
        for employee in employees:
            employee_data = employee.to_dict()
            
            face_encodings = []
            
            if 'face_encoding' in employee_data:
                encoding = employee_data['face_encoding']
                if isinstance(encoding, str):
                    try:
                        encoding = json.loads(encoding)
                    except:
                        print(f"Error parsing face encoding for {employee_data.get('employeeID')}")
                        continue
                face_encodings.append(encoding)
            
            if 'additional_face_encodings' in employee_data and employee_data['additional_face_encodings']:
                for enc in employee_data['additional_face_encodings']:
                    if isinstance(enc, str):
                        try:
                            enc = json.loads(enc)
                        except:
                            continue
                    face_encodings.append(enc)
            
            if face_encodings:
                employee_data['all_face_encodings'] = face_encodings
                
                if 'capturedImage' in employee_data:
                    employee_data['capturedImage'] = "IMAGE_DATA_REMOVED"
                
                if 'additionalImages' in employee_data:
                    employee_data['additionalImages'] = [f"IMAGE_{i}_REMOVED" for i in range(len(employee_data['additionalImages']))]
                    
                employee_list.append(employee_data)
        
        print(f"Returning {len(employee_list)} employees with valid face encodings")
        return jsonify({"status": "success", "employees": employee_list})
    except Exception as e:
        print(f"Error getting employee faces: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/attendance-stats', methods=['GET'])
def get_attendance_stats():
    """🎯 NEW: Get accurate attendance statistics"""
    try:
        today = datetime.datetime.now().date()
        today_start = datetime.datetime.combine(today, datetime.time.min).isoformat()
        today_end = datetime.datetime.combine(today, datetime.time.max).isoformat()
        
        # Get total employees
        employees_ref = db.collection('employees')
        total_employees = len(list(employees_ref.stream()))
        
        # Get today's UNIQUE attendance (prevent counting duplicates)
        attendance_ref = db.collection('attendance')
        query = attendance_ref.where('timestamp', '>=', today_start).where('timestamp', '<=', today_end)
        today_records = list(query.stream())
        
        # Count UNIQUE employees who marked attendance today
        unique_employees_today = set()
        for record in today_records:
            data = record.to_dict()
            employee_id = data.get('employeeID')
            if employee_id:
                unique_employees_today.add(employee_id)
        
        unique_attendance_count = len(unique_employees_today)
        
        return jsonify({
            "status": "success",
            "stats": {
                "total_employees": total_employees,
                "today_attendance": unique_attendance_count,  # 🎯 FIXED: Unique count
                "total_records_today": len(today_records),    # Total records (may include duplicates)
                "attendance_rate": round((unique_attendance_count / max(total_employees, 1)) * 100, 1),
                "unique_employees_today": list(unique_employees_today),
                "duplicate_prevention": "active"
            }
        })
    except Exception as e:
        print(f"Error getting attendance stats: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/clean-duplicate-attendance', methods=['POST'])
def clean_duplicate_attendance():
    """🧹 UTILITY: Clean duplicate attendance records"""
    try:
        attendance_ref = db.collection('attendance')
        all_records = list(attendance_ref.stream())
        
        # Group by employee and date
        employee_date_records = {}
        duplicates_found = 0
        
        for record in all_records:
            data = record.to_dict()
            employee_id = data.get('employeeID')
            timestamp = data.get('timestamp')
            
            if employee_id and timestamp:
                # Extract date from timestamp
                try:
                    date_obj = datetime.datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                    date_key = date_obj.date().isoformat()
                    
                    key = f"{employee_id}_{date_key}"
                    
                    if key not in employee_date_records:
                        employee_date_records[key] = []
                    
                    employee_date_records[key].append({
                        'doc_id': record.id,
                        'timestamp': timestamp,
                        'data': data
                    })
                except:
                    continue
        
        # Delete duplicates (keep the first record of each day)
        for key, records in employee_date_records.items():
            if len(records) > 1:
                # Sort by timestamp and keep the first one
                records.sort(key=lambda x: x['timestamp'])
                
                # Delete all except the first
                for record in records[1:]:
                    attendance_ref.document(record['doc_id']).delete()
                    duplicates_found += 1
                    print(f"🗑️ Deleted duplicate: {key} - {record['timestamp']}")
        
        return jsonify({
            "status": "success",
            "message": f"Cleaned {duplicates_found} duplicate attendance records",
            "duplicates_removed": duplicates_found
        })
    except Exception as e:
        print(f"Error cleaning duplicates: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "message": "Server is running"})

if __name__ == '__main__':
    print("🚀 Starting Fixed Attendance Backend")
    print("🎯 Duplicate Prevention: Active")
    print("🛡️ One attendance per employee per day")
    app.run(host='0.0.0.0', port=5000, debug=True)
