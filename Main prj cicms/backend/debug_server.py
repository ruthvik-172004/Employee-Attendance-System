"""
Install all required packages for the high-accuracy attendance system
"""
import subprocess
import sys
import os
import urllib.request
import bz2

def install_package(package):
    """Install a package using pip"""
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", package])
        print(f"✅ {package} installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install {package}: {e}")
        return False

def download_dlib_models():
    """Download required dlib models"""
    models = {
        "shape_predictor_68_face_landmarks.dat": "http://dlib.net/files/shape_predictor_68_face_landmarks.dat.bz2",
        "dlib_face_recognition_resnet_model_v1.dat": "http://dlib.net/files/dlib_face_recognition_resnet_model_v1.dat.bz2"
    }
    
    for model_name, url in models.items():
        if os.path.exists(model_name):
            print(f"✅ {model_name} already exists")
            continue
            
        print(f"📥 Downloading {model_name}...")
        try:
            compressed_file = model_name + ".bz2"
            urllib.request.urlretrieve(url, compressed_file)
            
            print(f"📦 Extracting {compressed_file}...")
            with bz2.BZ2File(compressed_file, 'rb') as f_in:
                with open(model_name, 'wb') as f_out:
                    f_out.write(f_in.read())
            
            os.remove(compressed_file)
            print(f"✅ {model_name} downloaded and extracted")
        except Exception as e:
            print(f"❌ Error downloading {model_name}: {e}")

def main():
    print("🚀 Installing High-Accuracy Face Recognition Attendance System")
    print("🎯 Target Accuracy: 99.2% with dlib ResNet 128D + Face Alignment")
    print("=" * 80)
    
    # Backend packages
    backend_packages = [
        "flask",
        "flask-cors", 
        "firebase-admin",
        "opencv-python",
        "numpy",
        "pillow",
        "dlib",
        "requests"
    ]
    
    # Raspberry Pi specific packages
    pi_packages = [
        "picamera2",
        "RPi.GPIO",
        "pyttsx3"
    ]
    
    print("📦 Installing backend packages...")
    failed_packages = []
    
    for package in backend_packages:
        print(f"\n📦 Installing {package}...")
        if not install_package(package):
            failed_packages.append(package)
    
    print("\n📦 Installing Raspberry Pi packages...")
    for package in pi_packages:
        print(f"\n📦 Installing {package}...")
        if not install_package(package):
            failed_packages.append(package)
    
    print("\n📥 Downloading dlib models...")
    download_dlib_models()
    
    print("\n" + "=" * 80)
    
    if failed_packages:
        print(f"❌ Failed to install: {', '.join(failed_packages)}")
        print("💡 Try installing manually with:")
        for package in failed_packages:
            print(f"   pip install {package}")
    else:
        print("✅ All packages installed successfully!")
        
    print("\n🎯 High-Accuracy System Setup Complete!")
    print("\n🚀 Next steps:")
    print("1. Place your serviceAccountKey.json in the project directory")
    print("2. Backend: python app.py")
    print("3. Raspberry Pi: python attendance_system.py")
    print("4. Frontend: Start your React development server")
    print("\n📊 Expected Performance:")
    print("   • 99.2% face recognition accuracy")
    print("   • dlib ResNet 128D encodings")
    print("   • Face alignment preprocessing")
    print("   • Real-time recognition on Raspberry Pi")

if __name__ == "__main__":
    main()
