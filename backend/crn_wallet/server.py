from flask import Flask, request, jsonify, send_from_directory, redirect
from flask_cors import CORS
from pymongo import MongoClient
import os
import sys
from bson.objectid import ObjectId
from datetime import datetime, timedelta, UTC  # إضافة UTC
import configparser
import json
import hashlib
import random
import string
import uuid
import logging
import jwt
import time
import requests  # إضافة مكتبة requests لاستدعاء خدمة IPinfo
from werkzeug.security import generate_password_hash, check_password_hash
import math
import threading

# Import helper functions
try:
    from backend.crn_wallet.helper import get_real_client_ip, get_ip_info
except ImportError:
    # Fallback if module path doesn't work
    try:
        sys.path.append(os.path.dirname(os.path.abspath(__file__)))
        from helper import get_real_client_ip, get_ip_info
    except ImportError as e:
        print(f'Error importing helper functions: {e}')
        # Define emergency fallback function
        def get_real_client_ip():
            return request.remote_addr
        def get_ip_info(ip):
            return {'ip': ip}

# Initialize the new DDOS protection system
try:
    # Import from new location
    from backend.crn_wallet.ddos_protection import initialize
    print('Initializing new DDOS Protection system...')
except ImportError:
    try:
        # Try local import
        sys.path.append(os.path.dirname(os.path.abspath(__file__)))
        from ddos_protection import initialize
        print('Initializing local DDOS Protection system...')
    except ImportError as e:
        print(f'Error importing DDOS protection module: {e}')
        initialize = None

# Import protection systems initializer
try:
    from backend.crn_wallet.initializer import initialize_protection_systems
    initialize_protection_systems()
    print('Protection systems initialized successfully!')
except Exception as e:
    print(f'Error initializing protection systems: {e}')

# Add the current directory to path to ensure imports work
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)

try:
    from transaction_history import transaction_routes
except ImportError:
    print("Warning: transaction_history module not found. User transaction history will be unavailable.")
    transaction_routes = None

# Import honeypot module if available
try:
    from honeypot import setup_honeypot
except ImportError:
    print("Warning: honeypot module not found. Honeypot traps will not be available.")
    setup_honeypot = None

# Import improved JWT manager if available
try:
    from jwt_manager import create_token, verify_token, invalidate_token, is_token_about_to_expire, start_token_cleanup_scheduler
    using_jwt_manager = True
    print("Using improved JWT security manager")
except ImportError:
    print("Warning: JWT manager module not found. Using default JWT handling.")
    using_jwt_manager = False

# Read config file
config = configparser.ConfigParser()
config.read('config.ini')

# Get server configuration
try:
    # Environment settings
    ENV = config.get('Server', 'Environment', fallback='development')
    
    # Server settings
    if ENV == 'production':
        HOST = config.get('Server', 'ProductionHost', fallback='0.0.0.0')
        PORT = int(config.get('Server', 'ProductionPort', fallback='5000'))
        DEBUG = config.getboolean('Server', 'ProductionDebug', fallback=False)
    else:
        HOST = config.get('Server', 'DevelopmentHost', fallback='127.0.0.1')
        PORT = int(config.get('Server', 'DevelopmentPort', fallback='5000'))
        DEBUG = config.getboolean('Server', 'DevelopmentDebug', fallback=True)
        
    # MongoDB settings
    MONGO_URI = config.get('Database', 'MongoURI', fallback='mongodb+srv://abdulrahman:GmsPvw6tspNufsYE@cluster0.pujvbqx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
    
except Exception as e:
    print(f"Error reading config file: {e}")
    # Default settings
    ENV = 'development'
    HOST = '127.0.0.1'
    PORT = 5000
    DEBUG = True
    MONGO_URI = 'mongodb://clyne:clyneisbetterthanprobot@data.clyne.cc:27017/'

app = Flask(__name__, static_folder='../../dist')
CORS(app)

# Initialize DDOS protection with Flask app
if initialize:
    try:
        initialize(app)
        print('DDOS Protection integrated with Flask app successfully!')
    except Exception as e:
        print(f'Error initializing DDOS protection with Flask: {e}')

# MongoDB connection
client = MongoClient(MONGO_URI)
wallet_db = client["cryptonel_wallet"]
mining_db = client["cryptonel_mining"]
staff_db = client["staff"]  # Separate database for staff
users_collection = wallet_db["users"]
transactions_collection = wallet_db["transactions"]
settings_collection = wallet_db["settings"]
team_collection = staff_db["team"]  # Using staff database for team collection
login_logs_collection = staff_db["login_logs"]  # Collection for login logs
activity_logs_collection = staff_db["activity_logs"]  # Collection for activity logs

# Register transaction routes blueprint if available
if transaction_routes:
    app.register_blueprint(transaction_routes)
    print("Transaction routes registered successfully!")
else:
    print("Transaction routes module not available. Skipping registration.")

# Register honeypot traps if available
if setup_honeypot:
    setup_honeypot(app, wallet_db)
    print("Honeypot traps registered successfully!")
else:
    print("Honeypot module not available. Skipping registration.")

# JWT configuration
JWT_SECRET = "ClyneDashboardSecretKey2025!@#"  # In production, use env variables
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION = 24 * 60 * 60  # 24 hours in seconds

# تأكد من استخدام PyJWT بشكل صحيح
try:
    import jwt
    # تجربة الدالة للتأكد من وجودها
    test_token = jwt.encode({"test": "data"}, "test_secret", algorithm="HS256")
except AttributeError:
    # إذا لم تكن الدالة encode موجودة، استخدم التالي
    import sys
    print("JWT module does not have encode method. Installing PyJWT...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "PyJWT"])
    # إعادة استيراد المكتبة بعد التثبيت
    import jwt
except ImportError:
    # إذا لم تكن المكتبة موجودة أصلاً
    import sys
    print("JWT module not found. Installing PyJWT...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "PyJWT"])
    # استيراد المكتبة بعد التثبيت
    import jwt

# Rate limiting configuration
login_attempts = {}  # IP-based attempt tracking
request_rates = {}  # IP-based request rate tracking
MAX_ATTEMPTS = 5
BLOCK_TIME = 15 * 60  # 15 minutes in seconds

# Define whitelisted IPs that bypass rate limiting
WHITELISTED_IPS = ['127.0.0.1', '::1']  # Add any additional trusted IPs as needed

# Function to save rate limit data to database
def save_rate_limit_to_db(ip, attempts, timestamp, is_blocked=False, expiry=None, permanent=False, blocks=0, abuse_detected=False, reason=None):
    """Save rate limit data to database for persistence"""
    try:
        rate_limits_collection = wallet_db["rate_limits"]
        
        # Find existing record
        existing = rate_limits_collection.find_one({"ip": ip})
        
        now = datetime.now(UTC).isoformat()
        
        if existing:
            # Update existing record
            update_data = {
                "attempts": attempts,
                "timestamp": timestamp,
                "is_blocked": is_blocked,
                "updated_at": now
            }
            
            # Add optional fields if provided
            if expiry:
                update_data["expiry"] = expiry
            
            if permanent:
                update_data["permanent_block"] = True
                
            if blocks:
                update_data["blocks"] = blocks
                
            if abuse_detected:
                update_data["abuse_detected"] = True
                
            if reason:
                update_data["block_reason"] = reason
            
            rate_limits_collection.update_one(
                {"ip": ip},
                {"$set": update_data}
            )
        else:
            # Create new record
            record = {
                "ip": ip,
                "attempts": attempts,
                "timestamp": timestamp,
                "is_blocked": is_blocked,
                "created_at": now,
                "updated_at": now
            }
            
            # Add optional fields if provided
            if expiry:
                record["expiry"] = expiry
                
            if permanent:
                record["permanent_block"] = True
                
            if blocks:
                record["blocks"] = blocks
                
            if abuse_detected:
                record["abuse_detected"] = True
                
            if reason:
                record["block_reason"] = reason
            
            rate_limits_collection.insert_one(record)
    except Exception as e:
        logging.error(f"Error saving rate limit data: {str(e)}")

# Function to load rate limits from database
def load_rate_limits_from_db():
    global login_attempts
    try:
        rate_limits_collection = staff_db["rate_limits"]
        current_time = time.time()
        
        # Load active rate limits
        for record in rate_limits_collection.find({"is_blocked": True}):
            ip = record.get("ip")
            timestamp_str = record.get("timestamp")
            
            if ip and timestamp_str:
                try:
                    # Convert ISO timestamp to Unix timestamp
                    timestamp_dt = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
                    timestamp = timestamp_dt.timestamp()
                    
                    # Only load if still in block window
                    if current_time - timestamp < BLOCK_TIME:
                        login_attempts[ip] = {
                            'attempts': MAX_ATTEMPTS,  # Set to max to maintain block
                            'timestamp': timestamp
                        }
                except Exception as e:
                    logging.error(f"Error parsing timestamp for IP {ip}: {e}")
        
        logging.info(f"Loaded {len(login_attempts)} active rate limits from database")
    except Exception as e:
        logging.error(f"Error loading rate limits from database: {e}")

# Load existing rate limits on startup
load_rate_limits_from_db()

# Token verification cache with TTL
token_cache = {}
TOKEN_CACHE_TTL = 5 * 60  # 5 minutes in seconds

# Helper function to find user by Discord ID
def find_user_by_discord_id(user_id):
    return users_collection.find_one({"user_id": user_id})

# Function to log login attempts (success or failure)
def log_login_attempt(username, client_ip, success=False, user_id=None, details=None):
    """Log login attempts"""
    try:
        log = {
            "timestamp": datetime.now(UTC).isoformat(),
            "username": username,
            "client_ip": client_ip,
            "success": success,
            "user_agent": request.headers.get("User-Agent", ""),
            "details": details or {}
        }
        
        if user_id:
            log["user_id"] = user_id
            
        # استخدام قاعدة staff بدلاً من wallet_db
        logs_collection = staff_db["login_logs"]
        logs_collection.insert_one(log)
        
        # Also send to the general logging system
        action_type = "login_success" if success else "login_failure"
        description = f"تسجيل دخول {'ناجح' if success else 'فاشل'} للمستخدم {username}"
        
        log_activity(
            user_id=user_id or "unknown",
            username=username,
            action_type=action_type,
            description=description,
            details={
                "ip": client_ip,
                "success": success,
                **(details or {})
            }
        )
    except Exception as e:
        logging.error(f"Error logging login attempt: {str(e)}")

# Function to log user activity
def log_activity(user_id, username, action_type, description=None, details=None):
    """Log staff activity"""
    log_data = {
        "user_id": user_id,
        "username": username,
        "action_type": action_type,
        "description": description,
        "details": details,
        "timestamp": datetime.now(UTC).isoformat(),
    }
    try:
        activity_logs_collection.insert_one(log_data)
    except Exception as e:
        print(f"Error logging activity: {str(e)}")

# Safe user data - removes sensitive information
def safe_user_data(user):
    if not user:
        return None
    
    return {
        "user_id": user.get("user_id"),
        "username": user.get("username"),
        "dob": user.get("dob"),
        "email": user.get("email"),
        "balance": user.get("balance"),
        "created_at": user.get("created_at"),
        "private_address": user.get("private_address"),
        "public_address": user.get("public_address"),
        "wallet_id": user.get("wallet_id"),
        "2fa_activated": user.get("2fa_activated"),
        "ban": user.get("ban"),
        "verified": user.get("verified"),
        # "vip": user.get("vip"),  # إزالة هذا الحقل
        "staff": user.get("staff"),
        "account_type": user.get("account_type"),
        "membership": user.get("membership"),
        "premium": user.get("premium"),
        "wallet_lock": user.get("wallet_lock"),
        "wallet_limit": user.get("wallet_limit"),
        "frozen": user.get("frozen"),
        "profile_hidden": user.get("profile_hidden"),
        "avatar": user.get("avatar")
    }

# Serve frontend (React app)
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

# API routes prefix
API_PREFIX = '/api'

# User management endpoints
@app.route(f'{API_PREFIX}/users/all', methods=['GET'])
def get_all_users():
    """
    الحصول على قائمة جميع المستخدمين مع دعم الترقيم والتصفية
    يدعم البحث عن طريق اسم المستخدم أو معرف المستخدم
    يدعم التصفية حسب حالة الحساب (نشط، محظور، مقفل) ونوع الحساب (موثق، بريميوم، VIP)
    """
    try:
        # تحليل معلمات الترقيم
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 100))
        search = request.args.get('search', '')
        status_filter = request.args.get('status', 'all')
        account_filter = request.args.get('account', 'all')
        
        # بناء استعلام البحث
        query = {}
        
        # إضافة مرشح البحث إذا تم تقديمه
        if search:
            # البحث في كل من user_id واسم المستخدم
            query['$or'] = [
                {'user_id': {'$regex': search, '$options': 'i'}},
                {'username': {'$regex': search, '$options': 'i'}}
            ]
        
        # إضافة مرشح الحالة إذا تم تقديمه
        if status_filter != 'all':
            if status_filter == 'active':
                query['$and'] = [{'ban': False}, {'wallet_lock': False}]
            elif status_filter == 'locked':
                query['wallet_lock'] = True
            elif status_filter == 'blocked':
                query['ban'] = True
        
        # إضافة مرشح نوع الحساب إذا تم تقديمه
        if account_filter != 'all':
            if account_filter == 'verified':
                query['verified'] = True
            elif account_filter == 'premium':
                query['premium'] = True
            elif account_filter == 'vip':  # تغيير الاستعلام هنا لاستخدام premium بدلاً من vip
                query['premium'] = True  # استخدام premium بدلاً من vip
        
        # حساب إجمالي المستخدمين للترقيم
        total_users = users_collection.count_documents(query)
        total_pages = (total_users + limit - 1) // limit  # ضمان التقريب لأعلى
        
        # الحصول على المستخدمين بالترتيب حسب تاريخ الإنشاء (الأحدث أولاً)
        users = list(users_collection.find(query).sort('created_at', -1).skip((page - 1) * limit).limit(limit))
        
        # تحويل _id إلى نص وإضافة بيانات Discord إذا كانت متاحة
        discord_users_collection = wallet_db["discord_users"]
        for user in users:
            user['_id'] = str(user['_id'])
            
            # محاولة العثور على بيانات Discord المقابلة إذا لم تكن avatar موجودة بالفعل
            if 'avatar' not in user or not user['avatar']:
                discord_user = discord_users_collection.find_one({"user_id": user['user_id']})
                if discord_user and 'avatar' in discord_user:
                    user['avatar'] = f"https://cdn.discordapp.com/avatars/{user['user_id']}/{discord_user['avatar']}.webp"
                    print(f"Added Discord avatar for user {user['username']}: {user['avatar']}")
        
        # الحصول على إحصائيات المستخدمين
        total_count = users_collection.count_documents({})
        active_count = users_collection.count_documents({'$and': [{'ban': False}, {'wallet_lock': False}]})
        banned_count = users_collection.count_documents({'ban': True})
        locked_count = users_collection.count_documents({'wallet_lock': True})
        
        return jsonify({
            'success': True,
            'users': users,
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total_users,
                'pages': total_pages
            },
            'stats': {
                'total': total_count,
                'active': active_count,
                'banned': banned_count,
                'locked': locked_count
            }
        })
        
    except Exception as e:
        logging.error(f"خطأ في الحصول على المستخدمين: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'حدث خطأ في جلب بيانات المستخدمين',
            'error': str(e)
        }), 500

@app.route(f'{API_PREFIX}/users/stats', methods=['GET'])
def get_users_stats():
    """
    الحصول على إحصائيات المستخدمين:
    - إجمالي عدد المستخدمين
    - المستخدمين النشطين (غير محظورين وغير مقفولين)
    - المستخدمين المحظورين
    - المستخدمين ذوي المحافظ المقفولة
    """
    try:
        total_count = users_collection.count_documents({})
        active_count = users_collection.count_documents({'$and': [{'ban': False}, {'wallet_lock': False}]})
        banned_count = users_collection.count_documents({'ban': True})
        locked_count = users_collection.count_documents({'wallet_lock': True})
        
        return jsonify({
            'success': True,
            'stats': {
                'total': total_count,
                'active': active_count,
                'banned': banned_count,
                'locked': locked_count
            }
        })
        
    except Exception as e:
        logging.error(f"خطأ في الحصول على إحصائيات المستخدمين: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'حدث خطأ في جلب إحصائيات المستخدمين',
            'error': str(e)
        }), 500

@app.route(f'{API_PREFIX}/users/toggle-ban', methods=['POST'])
def toggle_user_ban():
    """
    تبديل حالة حظر المستخدم
    """
    try:
        data = request.get_json()
        user_id = data.get('userId')
        ban_status = data.get('banStatus', False)
        
        if not user_id:
            return jsonify({
                'success': False,
                'message': 'معرف المستخدم مطلوب'
            }), 400
        
        # تحديث حالة الحظر
        result = users_collection.update_one(
            {'user_id': user_id},
            {'$set': {'ban': ban_status}}
        )
        
        if result.matched_count == 0:
            return jsonify({
                'success': False,
                'message': 'لم يتم العثور على المستخدم'
            }), 404
        
        return jsonify({
            'success': True,
            'message': 'تم تحديث حالة الحظر بنجاح'
        })
        
    except Exception as e:
        logging.error(f"خطأ في تبديل حالة حظر المستخدم: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'حدث خطأ في تحديث حالة الحظر',
            'error': str(e)
        }), 500

@app.route(f'{API_PREFIX}/wallet/toggle-lock', methods=['POST'])
def toggle_wallet_lock():
    """
    تبديل حالة قفل محفظة المستخدم
    """
    try:
        data = request.get_json()
        user_id = data.get('userId')
        lock_status = data.get('lockStatus', False)
        
        if not user_id:
            return jsonify({
                'success': False,
                'message': 'معرف المستخدم مطلوب'
            }), 400
        
        # تحديث حالة قفل المحفظة
        result = users_collection.update_one(
            {'user_id': user_id},
            {'$set': {'wallet_lock': lock_status}}
        )
        
        if result.matched_count == 0:
            return jsonify({
                'success': False,
                'message': 'لم يتم العثور على المستخدم'
            }), 404
        
        return jsonify({
            'success': True,
            'message': 'تم تحديث حالة قفل المحفظة بنجاح'
        })
        
    except Exception as e:
        logging.error(f"خطأ في تبديل حالة قفل المحفظة: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'حدث خطأ في تحديث حالة قفل المحفظة',
            'error': str(e)
        }), 500

# Wallet transfer endpoint
@app.route(f'{API_PREFIX}/wallet/transfer', methods=['POST'])
def transfer_funds():
    data = request.json
    sender_id = data.get('sender_id')
    receiver_id = data.get('receiver_id')
    amount = float(data.get('amount', 0))
    
    # Validate inputs
    if not sender_id or not receiver_id or amount <= 0:
        return jsonify({"success": False, "message": "Invalid parameters"}), 400
    
    # Find sender and receiver
    sender = find_user_by_discord_id(sender_id)
    receiver = find_user_by_discord_id(receiver_id)
    
    if not sender:
        return jsonify({"success": False, "message": "Sender not found"}), 404
    
    if not receiver:
        return jsonify({"success": False, "message": "Receiver not found"}), 404
    
    # Check if sender has enough balance
    sender_balance = float(sender.get("balance", "0"))
    if sender_balance < amount:
        return jsonify({"success": False, "message": "Insufficient balance"}), 400
    
    # Check if sender's wallet is locked
    if sender.get("wallet_lock", False):
        return jsonify({"success": False, "message": "Sender wallet is locked"}), 400
    
    # Update balances
    new_sender_balance = sender_balance - amount
    new_receiver_balance = float(receiver.get("balance", "0")) + amount
    
    users_collection.update_one(
        {"user_id": sender_id},
        {"$set": {"balance": str(new_sender_balance)}}
    )
    
    users_collection.update_one(
        {"user_id": receiver_id},
        {"$set": {"balance": str(new_receiver_balance)}}
    )
    
    return jsonify({
        "success": True,
        "message": "Transfer successful",
        "new_sender_balance": str(new_sender_balance)
    })

# Ban/Unban user endpoint - تحديث لتخزين معلومات IP
@app.route(f'{API_PREFIX}/user/ban', methods=['POST'])
def ban_user():
    data = request.json
    user_id = data.get('user_id')
    ban_status = data.get('ban_status', True)
    
    if not user_id:
        return jsonify({"success": False, "message": "User ID is required"}), 400
    
    user = find_user_by_discord_id(user_id)
    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404
    
    update_data = {"ban": ban_status}
    
    # إذا كان الإجراء هو حظر (وليس إلغاء حظر)، قم بتخزين معلومات IP
    if ban_status:
        # إنشاء مجموعة banned_ips إذا لم تكن موجودة
        ban_collection = staff_db.get_collection("banned_users")
        
        # الحصول على عنوان IP الحقيقي ومعلوماته
        # لكن لا نحظر IP المسؤول نفسه
        client_ip = get_real_client_ip()
        
        # لا نقوم بحظر IP المسؤول - نقوم فقط بحظر المستخدم
        if not is_staff_ip(client_ip) and client_ip not in WHITELISTED_IPS:
            ip_info = get_ip_info(client_ip)
            
            # إعداد بيانات الحظر
            ban_data = {
                "user_id": user_id,
                "username": user.get("username", "unknown"),
                "ip_address": client_ip,
                "banned_at": datetime.now(UTC).isoformat(),
                "banned_by": request.headers.get('User-Name', 'admin'),
                "reason": data.get('reason', 'No reason provided')
            }
            
            # إضافة معلومات IPinfo إذا كانت متوفرة
            if ip_info:
                ban_data["ip_info"] = ip_info
            
            # تخزين بيانات الحظر في قاعدة البيانات
            ban_collection.update_one(
                {"user_id": user_id},
                {"$set": ban_data},
                upsert=True
            )
            
            print(f"User {user_id} banned with IP: {client_ip}")
        else:
            print(f"User {user_id} banned without IP ban (admin/staff IP)")
    else:
        # إذا كان إلغاء حظر، قم بإزالة السجل من مجموعة banned_users
        staff_db.get_collection("banned_users").delete_one({"user_id": user_id})
        print(f"User {user_id} unbanned")
    
    # تحديث حالة الحظر للمستخدم
    users_collection.update_one(
        {"user_id": user_id},
        {"$set": update_data}
    )
    
    status = "banned" if ban_status else "unbanned"
    return jsonify({
        "success": True,
        "message": f"User {status} successfully"
    })

# Get user information endpoint
@app.route(f'{API_PREFIX}/user/info/<user_id>', methods=['GET'])
def get_user_info(user_id):
    user = find_user_by_discord_id(user_id)
    
    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404
    
    safe_data = safe_user_data(user)
    return jsonify({
        "success": True,
        "user": safe_data
    })

# Get user information by wallet ID
@app.route(f'{API_PREFIX}/user/wallet/<wallet_id>', methods=['GET'])
def get_user_by_wallet_id(wallet_id):
    user = users_collection.find_one({"wallet_id": wallet_id})
    
    if not user:
        return jsonify({"success": False, "message": "User not found with this wallet ID"}), 404
    
    safe_data = safe_user_data(user)
    return jsonify({
        "success": True,
        "user": safe_data
    })

# Delete user endpoint
@app.route(f'{API_PREFIX}/user/delete', methods=['DELETE'])
def delete_user():
    data = request.json
    user_id = data.get('user_id')
    
    if not user_id:
        return jsonify({"success": False, "message": "User ID is required"}), 400
    
    # Delete from wallet database
    wallet_result = users_collection.delete_one({"user_id": user_id})
    
    # Delete from mining database (assuming similar structure)
    mining_result = mining_db["users"].delete_one({"user_id": user_id})
    
    if wallet_result.deleted_count == 0 and mining_result.deleted_count == 0:
        return jsonify({"success": False, "message": "User not found in any database"}), 404
    
    return jsonify({
        "success": True,
        "message": "User deleted successfully",
        "wallet_deleted": wallet_result.deleted_count > 0,
        "mining_deleted": mining_result.deleted_count > 0
    })

# Update user main data endpoint
@app.route(f'{API_PREFIX}/user/update/main', methods=['PUT'])
def update_user_main_data():
    data = request.json
    user_id = data.get('user_id')
    email = data.get('email')
    private_address = data.get('private_address')
    
    if not user_id:
        return jsonify({"success": False, "message": "User ID is required"}), 400
    
    user = find_user_by_discord_id(user_id)
    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404
    
    update_data = {}
    if email:
        update_data["email"] = email
    if private_address:
        update_data["private_address"] = private_address
    
    if not update_data:
        return jsonify({"success": False, "message": "No data to update"}), 400
    
    users_collection.update_one(
        {"user_id": user_id},
        {"$set": update_data}
    )
    
    return jsonify({
        "success": True,
        "message": "User data updated successfully"
    })

# Update account status endpoint
@app.route(f'{API_PREFIX}/user/update/status', methods=['PUT'])
def update_account_status():
    data = request.json
    user_id = data.get('user_id')
    
    # طباعة البيانات المستلمة للتحقق
    print("Data received for update:", data)
    
    if not user_id:
        return jsonify({"success": False, "message": "User ID is required"}), 400
    
    user = find_user_by_discord_id(user_id)
    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404
    
    update_data = {}
    
    # Check which fields to update
    if 'verified' in data:
        update_data["verified"] = data['verified']
    # if 'vip' in data:
    #    update_data["vip"] = data['vip']
    # التعامل مع حقل premium بشكل خاص
    if 'premium' in data:
        update_data["premium"] = bool(data['premium'])  # ضمان أن القيمة هي boolean
        print(f"Setting premium to: {update_data['premium']}")
    if 'account_type' in data:
        update_data["account_type"] = data['account_type']
    if 'membership' in data:
        update_data["membership"] = data['membership']
    # إضافة حقول جديدة للتحكم في حظر التحويلات والتعدين
    if 'transfers_block' in data:
        update_data["transfers_block"] = bool(data['transfers_block'])
        print(f"Setting transfers_block to: {update_data['transfers_block']}")
    if 'mining_block' in data:
        update_data["mining_block"] = bool(data['mining_block'])
        print(f"Setting mining_block to: {update_data['mining_block']}")
    
    if not update_data:
        return jsonify({"success": False, "message": "No status data to update"}), 400
    
    print("Final update data:", update_data)
    
    result = users_collection.update_one(
        {"user_id": user_id},
        {"$set": update_data}
    )
    
    print(f"MongoDB update result: modified {result.modified_count} document(s)")
    
    # إعادة جلب البيانات المُحدثة للتحقق
    updated_user = find_user_by_discord_id(user_id)
    print("User after update:", {
        "premium": updated_user.get("premium"),
        "membership": updated_user.get("membership"),
        "transfers_block": updated_user.get("transfers_block"),
        "mining_block": updated_user.get("mining_block")
    })
    
    return jsonify({
        "success": True,
        "message": "Account status updated successfully"
    })

# إلغاء التحقق الثنائي للمستخدم
@app.route(f'{API_PREFIX}/user/disable2fa', methods=['PUT'])
def disable_2fa():
    data = request.json
    user_id = data.get('user_id')
    
    if not user_id:
        return jsonify({"success": False, "message": "User ID is required"}), 400
    
    user = find_user_by_discord_id(user_id)
    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404
    
    if not user.get('2fa_activated', False):
        return jsonify({"success": False, "message": "2FA is not activated for this user"}), 400
    
    # تحديث 2fa_activated إلى False
    result = users_collection.update_one(
        {"user_id": user_id},
        {"$set": {"2fa_activated": False}}
    )
    
    if result.modified_count == 0:
        return jsonify({"success": False, "message": "Failed to disable 2FA"}), 500
    
    # سجل هذه العملية
    log_activity(
        user_id="admin",  # Default admin user ID
        username=request.headers.get('User-Name', 'admin'),  # Get username from header or use default
        action_type="disable_2fa",
        description=f"تم إلغاء التحقق الثنائي للمستخدم {user_id}",
        details={"previous_status": True, "new_status": False}
    )
    
    return jsonify({
        "success": True,
        "message": "تم إلغاء التحقق الثنائي بنجاح"
    })

# Lock/Unlock wallet endpoint
@app.route(f'{API_PREFIX}/wallet/lock', methods=['PUT'])
def lock_wallet():
    data = request.json
    user_id = data.get('user_id')
    lock_status = data.get('lock_status')
    
    if not user_id or lock_status is None:
        return jsonify({"success": False, "message": "User ID and lock status are required"}), 400
    
    user = find_user_by_discord_id(user_id)
    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404
    
    users_collection.update_one(
        {"user_id": user_id},
        {"$set": {"wallet_lock": lock_status}}
    )
    
    status = "locked" if lock_status else "unlocked"
    return jsonify({
        "success": True,
        "message": f"Wallet {status} successfully"
    })

# Block/Unblock transfers endpoint
@app.route(f'{API_PREFIX}/user/transfers/block', methods=['PUT'])
def block_transfers():
    data = request.json
    user_id = data.get('user_id')
    block_status = data.get('block_status')
    
    if not user_id or block_status is None:
        return jsonify({"success": False, "message": "User ID and block status are required"}), 400
    
    user = find_user_by_discord_id(user_id)
    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404
    
    users_collection.update_one(
        {"user_id": user_id},
        {"$set": {"transfers_block": block_status}}
    )
    
    status = "blocked" if block_status else "unblocked"
    return jsonify({
        "success": True,
        "message": f"Transfers {status} successfully"
    })

# Block/Unblock mining endpoint
@app.route(f'{API_PREFIX}/user/mining/block', methods=['PUT'])
def block_mining():
    data = request.json
    user_id = data.get('user_id')
    block_status = data.get('block_status')
    
    if not user_id or block_status is None:
        return jsonify({"success": False, "message": "User ID and block status are required"}), 400
    
    user = find_user_by_discord_id(user_id)
    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404
    
    users_collection.update_one(
        {"user_id": user_id},
        {"$set": {"mining_block": block_status}}
    )
    
    status = "blocked" if block_status else "unblocked"
    return jsonify({
        "success": True,
        "message": f"Mining {status} successfully"
    })

# Update user balance endpoint
@app.route(f'{API_PREFIX}/wallet/update-balance', methods=['POST'])
def update_balance():
    data = request.json
    user_id = data.get('user_id')
    amount = data.get('amount')
    
    if not user_id or amount is None:
        return jsonify({"success": False, "message": "User ID and amount are required"}), 400
    
    # Try to convert amount to float
    try:
        amount_float = float(amount)
    except (ValueError, TypeError):
        return jsonify({"success": False, "message": "Amount must be a valid number"}), 400
    
    # Find the user
    user = find_user_by_discord_id(user_id)
    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404
    
    # Get current balance and convert to float
    try:
        current_balance = float(user.get("balance", "0"))
    except (ValueError, TypeError):
        return jsonify({"success": False, "message": "Invalid current balance format"}), 500
    
    # Calculate new balance
    new_balance = current_balance + amount_float
    
    # Ensure balance is not negative
    if new_balance < 0:
        return jsonify({"success": False, "message": "Resulting balance cannot be negative"}), 400
    
    # Format the balance to match the existing format (10 decimal places)
    formatted_balance = f"{new_balance:.10f}"
    
    # Update the user's balance
    result = users_collection.update_one(
        {"user_id": user_id},
        {"$set": {"balance": formatted_balance}}
    )
    
    if result.modified_count == 0:
        return jsonify({"success": False, "message": "Failed to update balance"}), 500
    
    # Log the transaction in transactions_collection for record keeping
    transaction_data = {
        "user_id": user_id,
        "amount": str(amount_float),
        "type": "admin_adjustment",
        "timestamp": datetime.now(),
        "previous_balance": user.get("balance", "0"),
        "new_balance": formatted_balance,
        "description": f"Admin {'added' if amount_float > 0 else 'subtracted'} {abs(amount_float)} CRN"
    }
    transactions_collection.insert_one(transaction_data)
    
    return jsonify({
        "success": True,
        "message": f"Balance updated successfully",
        "new_balance": formatted_balance
    })

@app.route(f'{API_PREFIX}/users/top-balances', methods=['GET'])
def get_top_users_by_balance():
    """
    الحصول على أعلى المستخدمين من حيث الرصيد
    يمكن تحديد عدد المستخدمين المراد عرضهم
    مع دعم الصفحات (50 مستخدم في الصفحة الواحدة)
    """
    try:
        limit = int(request.args.get('limit', 50))
        page = int(request.args.get('page', 1))
        
        # حساب التخطي بناءً على رقم الصفحة وحجم الصفحة
        skip = (page - 1) * limit
        
        # الحصول على إجمالي المستخدمين للترقيم
        total_count = users_collection.count_documents({})
        
        # حساب إجمالي الصفحات
        total_pages = (total_count + limit - 1) // limit
        
        # الحصول على المستخدمين مرتبين حسب الرصيد (من الأعلى إلى الأقل)
        # تحويل الرصيد إلى قيمة رقمية للترتيب
        pipeline = [
            {"$addFields": {"numeric_balance": {"$toDouble": "$balance"}}},
            {"$sort": {"numeric_balance": -1}},
            {"$skip": skip},
            {"$limit": limit},
            {"$project": {
                "_id": 0,
                "user_id": 1,
                "username": 1,
                "avatar": 1,
                "balance": 1
            }}
        ]
        
        users = list(users_collection.aggregate(pipeline))
        
        # جلب بيانات المعاملات لكل مستخدم
        for user in users:
            # البحث عن وثيقة معاملات المستخدم في مجموعة user_transactions
            user_transactions_doc = wallet_db["user_transactions"].find_one({"user_id": user["user_id"]})
            if user_transactions_doc:
                user["total_transactions"] = len(user_transactions_doc.get("transactions", []))
            else:
                user["total_transactions"] = 0
                
            # إضافة صورة المستخدم من Discord إذا غير موجودة
            if not user.get("avatar"):
                discord_user = wallet_db["discord_users"].find_one({"user_id": user["user_id"]})
                if discord_user and discord_user.get("avatar"):
                    user["avatar"] = f"https://cdn.discordapp.com/avatars/{user['user_id']}/{discord_user['avatar']}.webp"
        
        return jsonify({
            'success': True,
            'users': users,
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total_count,
                'pages': total_pages
            }
        })
        
    except Exception as e:
        logging.error(f"خطأ في الحصول على أعلى المستخدمين: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'حدث خطأ في جلب أعلى المستخدمين',
            'error': str(e)
        }), 500

@app.route(f'{API_PREFIX}/users/top-transactors', methods=['GET'])
def get_top_transactors():
    """
    الحصول على المستخدمين الأكثر نشاطا من حيث عدد المعاملات
    مع دعم الصفحات (50 مستخدم في الصفحة الواحدة)
    """
    try:
        limit = int(request.args.get('limit', 50))
        page = int(request.args.get('page', 1))
        
        # البحث في مجموعة user_transactions
        user_transactions = wallet_db["user_transactions"].find({})
        
        # حساب عدد المعاملات لكل مستخدم
        transactors = []
        for user_doc in user_transactions:
            transactions_count = len(user_doc.get("transactions", []))
            if transactions_count > 0:
                transactors.append({
                    "user_id": user_doc["user_id"],
                    "transactions_count": transactions_count
                })
        
        # ترتيب المستخدمين حسب عدد المعاملات
        transactors.sort(key=lambda x: x["transactions_count"], reverse=True)
        
        # حساب إجمالي المستخدمين وإجمالي الصفحات
        total_count = len(transactors)
        total_pages = (total_count + limit - 1) // limit if total_count > 0 else 1
        
        # تطبيق الترقيم
        start_idx = (page - 1) * limit
        end_idx = min(start_idx + limit, total_count)
        paginated_transactors = transactors[start_idx:end_idx]
        
        # الحصول على بيانات المستخدمين الأكثر نشاطا
        top_users = []
        for i, transactor in enumerate(paginated_transactors):
            user_id = transactor["user_id"]
            
            # الحصول على بيانات المستخدم
            user = users_collection.find_one({"user_id": user_id}, {
                "_id": 0,
                "user_id": 1,
                "username": 1,
                "avatar": 1
            })
            
            if user:
                # إضافة صورة المستخدم من Discord إذا غير موجودة
                if not user.get("avatar"):
                    discord_user = wallet_db["discord_users"].find_one({"user_id": user_id})
                    if discord_user and discord_user.get("avatar"):
                        user["avatar"] = f"https://cdn.discordapp.com/avatars/{user['user_id']}/{discord_user['avatar']}.webp"
                
                # الحصول على معاملات المستخدم
                user_transactions_doc = wallet_db["user_transactions"].find_one({"user_id": user_id})
                if user_transactions_doc:
                    user["total_transactions"] = len(user_transactions_doc.get("transactions", []))
                    user["transactions"] = user_transactions_doc.get("transactions", [])[:5]  # آخر 5 معاملات فقط
                else:
                    user["total_transactions"] = transactor["transactions_count"]
                    user["transactions"] = []
                
                top_users.append(user)
        
        return jsonify({
            'success': True,
            'users': top_users,
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total_count,
                'pages': total_pages
            }
        })
        
    except Exception as e:
        logging.error(f"خطأ في الحصول على المستخدمين الأكثر نشاطا: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'حدث خطأ في جلب المستخدمين الأكثر نشاطا',
            'error': str(e)
        }), 500

@app.route(f'{API_PREFIX}/mining/violations', methods=['GET'])
def get_mining_violations():
    """
    الحصول على مخالفات التعدين مع دعم الصفحات
    (50 مخالفة في الصفحة الواحدة)
    """
    try:
        limit = int(request.args.get('limit', 50))
        page = int(request.args.get('page', 1))
        
        # حساب التخطي بناءً على رقم الصفحة وحجم الصفحة
        skip = (page - 1) * limit
        
        # محاولة العثور على "mining_violations" في قاعدة البيانات
        collection_names = mining_db.list_collection_names()
        if "mining_violations" not in collection_names:
            # إنشاء مجموعة جديدة إذا لم تكن موجودة
            logging.warning("Mining violations collection not found. Creating a new one.")
            mining_db.create_collection("mining_violations")
            return jsonify({
                'success': True,
                'violations': [],
                'pagination': {
                    'page': page,
                    'limit': limit,
                    'total': 0,
                    'pages': 1
                },
                'message': 'Mining violations collection was not found and has been created'
            })
        
        # حساب إجمالي المخالفات
        total_count = mining_db["mining_violations"].count_documents({})
        
        # حساب إجمالي الصفحات
        total_pages = (total_count + limit - 1) // limit if total_count > 0 else 1
        
        # الحصول على مخالفات التعدين من قاعدة البيانات مع الترقيم
        violations = list(mining_db["mining_violations"].find({}).sort("timestamp", -1).skip(skip).limit(limit))
        
        # تحويل _id إلى نص وتنسيق البيانات
        formatted_violations = []
        for violation in violations:
            try:
                formatted_violation = {
                    "_id": str(violation.get("_id", "")),
                    "user_id": violation.get("user_id", ""),
                    "discord_id": violation.get("discord_id", ""),
                    "reason": violation.get("reason", "Multiple accounts mining from same device/IP"),
                    "timestamp": violation.get("timestamp", datetime.now(UTC).isoformat()),
                    "browser_fingerprint": violation.get("browser_fingerprint", ""),
                    "ip_address": violation.get("ip_address", ""),
                    "previous_user_id": violation.get("previous_user_id", ""),
                    "user_agent": violation.get("user_agent", "")
                }
                formatted_violations.append(formatted_violation)
            except Exception as doc_error:
                logging.error(f"Error formatting violation document: {str(doc_error)}")
                # Skip this document if there's an error
                continue
        
        return jsonify({
            'success': True,
            'violations': formatted_violations,
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total_count,
                'pages': total_pages
            }
        })
        
    except Exception as e:
        logging.error(f"خطأ في الحصول على مخالفات التعدين: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'حدث خطأ في جلب مخالفات التعدين',
            'error': str(e)
        }), 500

@app.route(f'{API_PREFIX}/wallet/stats', methods=['GET'])
def get_wallet_stats():
    """
    الحصول على إحصائيات المحفظة العامة
    """
    try:
        # حساب إجمالي الرصيد في جميع المحافظ
        pipeline = [
            {"$addFields": {"numeric_balance": {"$toDouble": "$balance"}}},
            {"$group": {"_id": None, "total": {"$sum": "$numeric_balance"}}}
        ]
        total_balance_result = list(users_collection.aggregate(pipeline))
        total_balance = str(total_balance_result[0]["total"]) if total_balance_result else "0"
        
        # حساب إجمالي المعاملات
        total_transactions = transactions_collection.count_documents({})
        
        # حساب المعاملات اليومية (آخر 24 ساعة)
        one_day_ago = datetime.now() - timedelta(days=1)
        daily_transactions = transactions_collection.count_documents({
            "timestamp": {"$gte": one_day_ago}
        })
        
        # حساب متوسط قيمة المعاملات
        avg_pipeline = [
            {"$addFields": {"numeric_amount": {"$toDouble": "$amount"}}},
            {"$group": {"_id": None, "average": {"$avg": "$numeric_amount"}}}
        ]
        avg_result = list(transactions_collection.aggregate(avg_pipeline))
        avg_transaction_amount = str(round(avg_result[0]["average"], 2)) if avg_result else "0"
        
        return jsonify({
            'success': True,
            'stats': {
                'totalBalance': total_balance,
                'totalTransactions': total_transactions,
                'dailyTransactions': daily_transactions,
                'avgTransactionAmount': avg_transaction_amount
            }
        })
        
    except Exception as e:
        logging.error(f"خطأ في الحصول على إحصائيات المحفظة: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'حدث خطأ في جلب إحصائيات المحفظة',
            'error': str(e)
        }), 500

@app.route(f'{API_PREFIX}/mining/stats', methods=['GET'])
def get_mining_stats():
    """
    الحصول على إحصائيات التعدين من قاعدة البيانات
    """
    try:
        # حساب إجمالي المعدنين (عدد المستخدمين في مجموعة mining_data)
        total_miners = mining_db["mining_data"].count_documents({})
        
        # حساب عدد المعدنين اليوم (الذين قاموا بالتعدين في آخر 24 ساعة)
        one_day_ago = datetime.now() - timedelta(days=1)
        miners_today = mining_db["mining_data"].count_documents({
            "last_mined": {"$gte": one_day_ago}
        })
        
        # حساب إجمالي CRN المعدنة (مجموع الحقل total_mined)
        pipeline = [
            {"$addFields": {"numeric_total_mined": {"$toDouble": "$total_mined"}}},
            {"$group": {"_id": None, "total": {"$sum": "$numeric_total_mined"}}}
        ]
        result = list(mining_db["mining_data"].aggregate(pipeline))
        total_mined_crn = str(round(result[0]["total"], 1)) if result else "0"
        
        # معدل التعدين اليومي للمستخدمين (متوسط قيمة mining_speed مضروبا في 24)
        speed_pipeline = [
            {"$addFields": {"numeric_mining_speed": {"$toDouble": "$mining_speed"}}},
            {"$group": {"_id": None, "avg_speed": {"$avg": "$numeric_mining_speed"}}}
        ]
        speed_result = list(mining_db["mining_data"].aggregate(speed_pipeline))
        avg_mining_speed = "6" # القيمة الافتراضية كما ذكرت
        
        # الإحصائيات
        stats = {
            "totalMiners": total_miners,
            "minersToday": miners_today,
            "totalMinedCRN": total_mined_crn,
            "dailyMiningRate": avg_mining_speed,
            "lastUpdated": datetime.now().isoformat()
        }
        
        return jsonify({
            'success': True,
            'stats': stats
        })
        
    except Exception as e:
        logging.error(f"خطأ في الحصول على إحصائيات التعدين: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'حدث خطأ في جلب إحصائيات التعدين',
            'error': str(e)
        }), 500

# Staff management endpoints
@app.route(f'{API_PREFIX}/staff/all', methods=['GET'])
def get_all_staff():
    """
    الحصول على قائمة جميع أعضاء الفريق مع دعم الترقيم والتصفية
    """
    try:
        # تحليل معلمات الترقيم
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 20))
        search = request.args.get('search', '')
        role_filter = request.args.get('role', 'all')
        
        # بناء استعلام البحث
        query = {}
        
        # إضافة مرشح البحث إذا تم تقديمه
        if search:
            # البحث في كل من discord_id واسم المستخدم
            query['$or'] = [
                {'discord_id': {'$regex': search, '$options': 'i'}},
                {'username': {'$regex': search, '$options': 'i'}}
            ]
        
        # إضافة مرشح الدور إذا تم تقديمه
        if role_filter != 'all':
            query['role'] = role_filter
        
        # حساب إجمالي أعضاء الفريق للترقيم
        total_staff = team_collection.count_documents(query)
        total_pages = (total_staff + limit - 1) // limit  # ضمان التقريب لأعلى
        
        # الحصول على أعضاء الفريق بالترتيب حسب تاريخ الإضافة (الأحدث أولاً)
        staff_members = list(team_collection.find(query).sort('added_date', -1).skip((page - 1) * limit).limit(limit))
        
        # تحويل _id إلى نص
        discord_users_collection = wallet_db["discord_users"]
        for member in staff_members:
            member['_id'] = str(member['_id'])
            
            # إضافة معلومات الصورة الرمزية من مجموعة discord_users
            discord_user = discord_users_collection.find_one({"user_id": member['discord_id']})
            if discord_user and 'avatar' in discord_user:
                member['avatar'] = discord_user['avatar']
                member['avatar_url'] = f"https://cdn.discordapp.com/avatars/{member['discord_id']}/{discord_user['avatar']}.webp"
        
        return jsonify({
            'success': True,
            'staff': staff_members,
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total_staff,
                'pages': total_pages
            }
        })
        
    except Exception as e:
        logging.error(f"خطأ في الحصول على بيانات الفريق: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'حدث خطأ في جلب بيانات الفريق',
            'error': str(e)
        }), 500

@app.route(f'{API_PREFIX}/staff/add', methods=['POST'])
def add_staff_member():
    """
    إضافة عضو جديد إلى الفريق
    """
    try:
        data = request.get_json()
        discord_id = data.get('discord_id')
        role = data.get('role')
        added_by = data.get('added_by')
        can_login = data.get('can_login', True)  # Default to True if not provided
        
        if not discord_id or not role:
            return jsonify({
                'success': False,
                'message': 'معرف Discord والدور مطلوبان'
            }), 400
        
        # التحقق من وجود المستخدم في قاعدة البيانات
        discord_users_collection = wallet_db["discord_users"]
        discord_user = discord_users_collection.find_one({"user_id": discord_id})
        
        if not discord_user:
            return jsonify({
                'success': False,
                'message': 'لم يتم العثور على مستخدم Discord بهذا المعرف'
            }), 404

        # التحقق مما إذا كان المستخدم موجودًا بالفعل في الفريق
        existing_staff = team_collection.find_one({"discord_id": discord_id})
        if existing_staff:
            return jsonify({
                'success': False,
                'message': 'هذا المستخدم موجود بالفعل في الفريق'
            }), 409
        
        # إنشاء اسم مستخدم وكلمة مرور عشوائية
        username = f"{discord_user.get('username', 'user')}_{random.randint(1000, 9999)}"
        password = ''.join(random.choices(string.ascii_letters + string.digits, k=10))
        
        # إنشاء بصمة فريدة للتعريف
        fingerprint = str(uuid.uuid4())
        
        # تحديد الصلاحيات بناءً على الدور
        permissions = get_permissions_for_role(role)
        
        # إنشاء كائن عضو الفريق الجديد
        new_staff = {
            "discord_id": discord_id,
            "username": username,
            "email": discord_user.get('email'),
            "discord_username": discord_user.get('username'),
            "role": role,
            "permissions": permissions,
            "password": password,  # Store password in plaintext
            "fingerprint": fingerprint,
            "status": "active",
            "added_by": added_by,
            "added_date": datetime.now(UTC).isoformat(),
            "last_active": datetime.now(UTC).isoformat(),
            "can_login": can_login  # Add the can_login field
        }
        
        # إدراج عضو الفريق الجديد
        result = team_collection.insert_one(new_staff)
        new_staff['_id'] = str(result.inserted_id)
        
        # إضافة معلومات الصورة الرمزية
        avatar_info = None
        if discord_user and 'avatar' in discord_user:
            avatar_info = discord_user['avatar']
            new_staff['avatar'] = avatar_info
            new_staff['avatar_url'] = f"https://cdn.discordapp.com/avatars/{discord_id}/{avatar_info}.webp"
        
        return jsonify({
            'success': True,
            'message': 'تمت إضافة عضو الفريق بنجاح',
            'staff': new_staff  # Return complete staff data
        })
        
    except Exception as e:
        logging.error(f"خطأ في إضافة عضو الفريق: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'حدث خطأ في إضافة عضو الفريق',
            'error': str(e)
        }), 500

def get_permissions_for_role(role):
    """
    تحديد الصلاحيات المناسبة بناءً على الدور
    """
    permissions = {
        "founder": ["all_permissions"],
        "general_manager": ["manage_staff", "manage_users", "view_all", "edit_settings"],
        "manager": ["manage_department", "view_department", "edit_settings"],
        "supervisor": ["view_department", "moderate_users"],
        "tech_support": ["view_support", "manage_tickets"],
        "support": ["view_support", "basic_support"],
        "developer": ["view_code", "deploy_updates"],
        "designer": ["manage_design", "upload_assets"],
        "content": ["manage_content", "upload_content"]
    }
    
    return permissions.get(role, [])

@app.route(f'{API_PREFIX}/staff/update', methods=['PUT'])
def update_staff_member():
    """
    تحديث بيانات عضو الفريق
    """
    try:
        data = request.get_json()
        staff_id = data.get('staff_id')
        updates = data.get('updates', {})
        
        if not staff_id:
            return jsonify({
                'success': False,
                'message': 'معرف عضو الفريق مطلوب'
            }), 400
        
        # التحقق من وجود العضو
        staff = team_collection.find_one({"_id": ObjectId(staff_id)})
        if not staff:
            return jsonify({
                'success': False,
                'message': 'لم يتم العثور على عضو الفريق'
            }), 404
        
        # إذا تم تغيير الدور، قم بتحديث الصلاحيات
        if 'role' in updates:
            updates['permissions'] = get_permissions_for_role(updates['role'])
        
        # تحديث بيانات العضو
        result = team_collection.update_one(
            {"_id": ObjectId(staff_id)},
            {"$set": updates}
        )
        
        if result.modified_count == 0:
            return jsonify({
                'success': False,
                'message': 'لم يتم إجراء أي تغييرات'
            }), 400
        
        # الحصول على البيانات المحدثة
        updated_staff = team_collection.find_one({"_id": ObjectId(staff_id)})
        updated_staff['_id'] = str(updated_staff['_id'])
        
        return jsonify({
            'success': True,
            'message': 'تم تحديث بيانات عضو الفريق بنجاح',
            'staff': updated_staff
        })
        
    except Exception as e:
        logging.error(f"خطأ في تحديث بيانات عضو الفريق: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'حدث خطأ في تحديث بيانات عضو الفريق',
            'error': str(e)
        }), 500

@app.route(f'{API_PREFIX}/staff/delete', methods=['DELETE'])
def delete_staff_member():
    """
    حذف عضو من الفريق
    """
    try:
        data = request.get_json()
        staff_id = data.get('staff_id')
        
        if not staff_id:
            return jsonify({
                'success': False,
                'message': 'معرف عضو الفريق مطلوب'
            }), 400
        
        # التحقق من وجود العضو
        staff = team_collection.find_one({"_id": ObjectId(staff_id)})
        if not staff:
            return jsonify({
                'success': False,
                'message': 'لم يتم العثور على عضو الفريق'
            }), 404
        
        # حذف العضو
        result = team_collection.delete_one({"_id": ObjectId(staff_id)})
        
        if result.deleted_count == 0:
            return jsonify({
                'success': False,
                'message': 'فشل في حذف عضو الفريق'
            }), 400
        
        return jsonify({
            'success': True,
            'message': 'تم حذف عضو الفريق بنجاح'
        })
        
    except Exception as e:
        logging.error(f"خطأ في حذف عضو الفريق: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'حدث خطأ في حذف عضو الفريق',
            'error': str(e)
        }), 500

@app.route(f'{API_PREFIX}/staff/discord/<discord_id>', methods=['GET'])
def get_discord_user(discord_id):
    """
    الحصول على بيانات مستخدم Discord باستخدام معرف Discord
    """
    try:
        discord_users_collection = wallet_db["discord_users"]
        discord_user = discord_users_collection.find_one({"user_id": discord_id})
        
        if not discord_user:
            return jsonify({
                'success': False,
                'message': 'لم يتم العثور على مستخدم Discord بهذا المعرف'
            }), 404
        
        discord_user['_id'] = str(discord_user['_id'])
        
        return jsonify({
            'success': True,
            'user': discord_user
        })
        
    except Exception as e:
        logging.error(f"خطأ في الحصول على بيانات مستخدم Discord: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'حدث خطأ في جلب بيانات مستخدم Discord',
            'error': str(e)
        }), 500

# Global rate limiting settings
MAX_ATTEMPTS = 5  # Maximum number of login attempts allowed
BLOCK_TIME = 900  # Block duration in seconds (15 minutes)
MAX_REQUEST_RATE = 40  # Maximum requests per minute
REQUEST_RATE_WINDOW = 60  # Time window in seconds for rate tracking

def is_staff_ip(ip):
    """Check if an IP belongs to a staff member"""
    try:
        # Check if IP is in whitelist
        if ip in WHITELISTED_IPS:
            return True
            
        # Check staff database for IP
        staff_collection = staff_db["staff"]
        staff = staff_collection.find_one({"ip_addresses": ip})
        
        if staff:
            return True
            
        return False
    except Exception as e:
        logging.error(f"Error checking staff IP: {str(e)}")
        return False

# Add middleware to track request rates before Flask routes
@app.before_request
def before_request():
    # Skip middleware for static files and non-login routes
    if request.path.startswith('/static') or request.path.startswith('/assets'):
        return None
        
    client_ip = get_real_client_ip()  # استخدام الدالة الجديدة للحصول على IP الحقيقي
    current_time = time.time()
    path = request.path
    
    # استثناء عناوين IP الخاصة بالمسؤولين (localhost وغيرها)
    if client_ip in WHITELISTED_IPS or is_staff_ip(client_ip):
        # السماح بأي وصول للمسؤولين دون قيود
        return None
        
    # فحص ما إذا كان هذا IP محظوراً في قاعدة بيانات banned_users
    try:
        ban_collection = staff_db.get_collection("banned_users")
        banned_user = ban_collection.find_one({"ip_address": client_ip})
        
        if banned_user:
            # حظر الوصول لنفس عنوان IP إلا إذا كان مسؤول
            logging.warning(f"محاولة وصول من IP محظور: {client_ip} للمستخدم {banned_user.get('user_id')}")
            return jsonify({
                'success': False,
                'message': 'تم حظر عنوان IP الخاص بك',
                'error_code': 'IP_BANNED'
            }), 403
    except Exception as e:
        logging.error(f"خطأ في فحص حظر IP: {e}")
    
    # Extract user_id from path parameters for routes that include user ID
    user_id = None
    
    # Check if this is a user-specific request with an ID in the path
    if '/api/user/info/' in request.path:
        # Extract user_id from path like /api/user/info/{user_id}
        parts = request.path.split('/')
        if len(parts) > 4:
            user_id = parts[4]
    
    # For POST/PUT requests, check if user_id is in the JSON data
    if request.method in ['POST', 'PUT'] and request.is_json:
        try:
            data = request.get_json(silent=True)
            if data and 'user_id' in data:
                user_id = data.get('user_id')
        except:
            pass
    
    # If we have a user_id, check if this user is banned
    # Only block if this specific user is banned, not globally
    if user_id:
        user = users_collection.find_one({"user_id": user_id})
        # Only apply ban for this specific user, not globally
        if user and user.get('ban', False) == True:
            # Return ban message only for API requests for this specific banned user
            return jsonify({
                'success': False,
                'message': 'تم حظر حساب هذا المستخدم',
                'error_code': 'USER_BANNED'
            }), 403
    
    # Check request content for abusive language or spam patterns
    if request.method == 'POST' and request.is_json:
        try:
            data = request.get_json(silent=True)
            if data:
                content = str(data).lower()
                # List of abusive terms to check
                abusive_terms = ['احا', 'كسمك', 'نيك', 'طيز', 'عير', 'زبي', 'كس', 'متناك', 'خول']
                
                # Check for abusive language
                for term in abusive_terms:
                    if term in content:
                        # Log the abuse
                        logging.warning(f"Abusive content detected from IP {client_ip}: {term}")
                        
                        # Permanently block the IP
                        login_attempts[client_ip] = {
                            'attempts': MAX_ATTEMPTS * 2,
                            'timestamp': current_time,
                            'permanent_block': True,
                            'reason': f"Abusive content: {term}"
                        }
                        
                        # Save to database
                        save_rate_limit_to_db(
                            ip=client_ip,
                            attempts=MAX_ATTEMPTS * 2,
                            timestamp=current_time,
                            is_blocked=True,
                            permanent=True,
                            abuse_detected=True,
                            reason=f"Abusive content: {term}"
                        )
                        
                        return jsonify({
                            'success': False,
                            'message': 'Your IP has been blocked due to abusive behavior',
                            'blocked': True,
                            'reason': f"Abusive content detected: {term}"
                        }), 403
        except Exception as e:
            logging.error(f"Error checking request content: {str(e)}")
    
    # Fast request detection (DoS protection)
    if client_ip in login_attempts:
        if 'last_request_time' in login_attempts[client_ip]:
            last_time = login_attempts[client_ip]['last_request_time']
            time_diff = current_time - last_time
            
            # If requests are coming extremely fast (less than 20ms apart)
            if time_diff < 0.02:
                login_attempts[client_ip]['rapid_requests'] = login_attempts[client_ip].get('rapid_requests', 0) + 1
                
                # If too many rapid requests (more than 20)
                if login_attempts[client_ip].get('rapid_requests', 0) > 20:
                    login_attempts[client_ip]['attempts'] = MAX_ATTEMPTS * 2
                    login_attempts[client_ip]['timestamp'] = current_time
                    login_attempts[client_ip]['permanent_block'] = True
                    login_attempts[client_ip]['reason'] = "DoS attempt detected"
                    
                    save_rate_limit_to_db(
                        ip=client_ip,
                        attempts=MAX_ATTEMPTS * 2,
                        timestamp=current_time,
                        is_blocked=True,
                        permanent=True,
                        reason="DoS_attempt"
                    )
                    
                    logging.warning(f"DoS attempt detected from IP {client_ip} - permanently blocked")
                    
                    return jsonify({
                        'success': False,
                        'message': 'IP blocked due to suspicious request patterns',
                        'blocked': True,
                        'reason': "DoS attempt detected"
                    }), 403
        
        login_attempts[client_ip]['last_request_time'] = current_time
    else:
        login_attempts[client_ip] = {
            'attempts': 0,
            'timestamp': current_time,
            'last_request_time': current_time,
            'rapid_requests': 0
        }
    
    # Only apply the rest of the logic to login routes
    if f'{API_PREFIX}/staff/login' in request.path:
        # Check if IP is blocked due to too many attempts
        if client_ip in login_attempts:
            # Check for permanent block
            if login_attempts[client_ip].get('permanent_block', False):
                return jsonify({
                    'success': False,
                    'message': 'Your IP has been permanently blocked due to suspicious activity',
                    'blocked': True
                }), 403
                
            if login_attempts[client_ip]['attempts'] >= MAX_ATTEMPTS:
                block_time = BLOCK_TIME
                
                # For repeat offenders, increase block time
                if login_attempts[client_ip].get('blocks', 0) > 1:
                    # Exponential backoff: double the block time for each previous block
                    block_multiplier = min(10, login_attempts[client_ip].get('blocks', 0))  # Cap at 10x
                    block_time = BLOCK_TIME * block_multiplier
                
                if current_time - login_attempts[client_ip]['timestamp'] < block_time:
                    time_left = int(block_time - (current_time - login_attempts[client_ip]['timestamp']))
                    
                    # Log blocked login attempt
                    log_login_attempt(
                        username="unknown", 
                        client_ip=client_ip,
                        success=False,
                        details={
                            "reason": "ip_blocked", 
                            "time_left": f"{time_left // 60} minutes",
                            "previous_blocks": login_attempts[client_ip].get('blocks', 0)
                        }
                    )
                    
                    # Redirect to the rate limit page for browser requests
                    if 'text/html' in request.headers.get('Accept', ''):
                        return redirect(f'{API_PREFIX}/rate-limit?time_left={time_left}')
                    
                    # JSON response for API requests
                    return jsonify({
                        'success': False,
                        'rate_limited': True,
                        'message': f'Login attempts exceeded. Try again in {time_left // 60} minutes',
                        'time_left': time_left
                    }), 429
                else:
                    # Reset after block time with tracking for repeat offenders
                    login_attempts[client_ip] = {
                        'attempts': 0, 
                        'timestamp': current_time,
                        'blocks': login_attempts[client_ip].get('blocks', 0) + 1,
                        'last_request_time': current_time,
                        'rapid_requests': 0
                    }
                    
                    # Update in database
                    save_rate_limit_to_db(
                        ip=client_ip, 
                        attempts=0, 
                        timestamp=current_time,
                        is_blocked=False,
                        blocks=login_attempts[client_ip].get('blocks', 0)
                    )
    
    return None

def clean_rate_records(current_time):
    """Clean up old rate limiting records to prevent memory growth"""
    ips_to_remove = []
    
    for ip, data in request_rates.items():
        # Keep blocked IPs until their block time expires
        if data.get('blocked', False):
            if current_time - data.get('block_time', 0) > BLOCK_TIME + 60:  # Extra 60s grace period
                ips_to_remove.append(ip)
        # Remove records for IPs we haven't seen in a while
        elif current_time - data.get('window_start', 0) > REQUEST_RATE_WINDOW * 5:
            ips_to_remove.append(ip)
    
    for ip in ips_to_remove:
        del request_rates[ip]

# Function to log login attempts
def log_login_attempt(username, client_ip, success, user_id=None, details=None):
    """
    Log login attempts to track security issues
    """
    try:
        log = {
            "timestamp": datetime.now(UTC).isoformat(),
            "username": username,
            "client_ip": client_ip,
            "success": success,
            "user_agent": request.headers.get("User-Agent", ""),
            "details": details or {}
        }
        
        if user_id:
            log["user_id"] = user_id
            
        logs_collection = staff_db["login_logs"]
        logs_collection.insert_one(log)
        
        # Also send to the general logging system
        action_type = "login_success" if success else "login_failure"
        description = f"تسجيل دخول {'ناجح' if success else 'فاشل'} للمستخدم {username}"
        
        log_activity(
            user_id=user_id or "unknown",
            username=username,
            action_type=action_type,
            description=description,
            details={
                "ip": client_ip,
                "success": success,
                **(details or {})
            }
        )
    except Exception as e:
        logging.error(f"Error logging login attempt: {str(e)}")
        

# Staff login endpoint
@app.route(f'{API_PREFIX}/staff/login', methods=['POST'])
def staff_login():
    """
    تسجيل دخول أعضاء الفريق
    """
    try:
        # Get client IP for rate limiting
        client_ip = request.remote_addr
        
        # Check if IP is blocked due to too many attempts
        current_time = time.time()
        if client_ip in login_attempts:
            if login_attempts[client_ip]['attempts'] >= MAX_ATTEMPTS:
                if current_time - login_attempts[client_ip]['timestamp'] < BLOCK_TIME:
                    time_left = int(BLOCK_TIME - (current_time - login_attempts[client_ip]['timestamp']))
                    
                    # Log blocked login attempt
                    log_login_attempt(
                        username="unknown", 
                        client_ip=client_ip,
                        success=False,
                        details={"reason": "ip_blocked", "time_left": f"{time_left // 60} minutes"}
                    )
                    
                    # تحديث قاعدة البيانات مع معلومات الحظر
                    expiry_time = datetime.fromtimestamp(current_time + time_left, UTC).isoformat()
                    save_rate_limit_to_db(
                        ip=client_ip, 
                        attempts=MAX_ATTEMPTS, 
                        timestamp=login_attempts[client_ip]['timestamp'],
                        is_blocked=True,
                        expiry=expiry_time
                    )
                    
                    # استخدام استجابة JSON للطلبات API ولكن مع الإشارة إلى rate limit
                    if request.headers.get('X-Requested-With') == 'XMLHttpRequest' or request.headers.get('Accept') == 'application/json':
                        return jsonify({
                            'success': False,
                            'rate_limited': True,
                            'message': f'تم تجاوز الحد المسموح للطلبات. يرجى المحاولة مرة أخرى بعد {time_left // 60} دقائق'
                        }), 429
                    else:
                        # توجيه المستخدم إلى صفحة تقييد المعدل
                        return redirect(f'{API_PREFIX}/rate-limit?time_left={time_left}')
                else:
                    # Reset attempts after block time
                    login_attempts[client_ip] = {'attempts': 0, 'timestamp': current_time}
                    
                    # تحديث قاعدة البيانات بإزالة الحظر
                    save_rate_limit_to_db(
                        ip=client_ip, 
                        attempts=0, 
                        timestamp=current_time,
                        is_blocked=False
                    )
        else:
            # Initialize attempt counter for this IP
            login_attempts[client_ip] = {'attempts': 0, 'timestamp': current_time}
        
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            # Log incomplete login attempt
            log_login_attempt(
                username=username or "empty", 
                client_ip=client_ip,
                success=False,
                details={"reason": "missing_credentials"}
            )
            
            # Increment failed attempts even for missing credentials
            login_attempts[client_ip]['attempts'] += 1
            login_attempts[client_ip]['timestamp'] = current_time
            
            # تحديث قاعدة البيانات
            save_rate_limit_to_db(
                ip=client_ip, 
                attempts=login_attempts[client_ip]['attempts'], 
                timestamp=current_time,
                is_blocked=login_attempts[client_ip]['attempts'] >= MAX_ATTEMPTS
            )
            
            return jsonify({
                'success': False,
                'message': 'اسم المستخدم وكلمة المرور مطلوبان',
                'attempts': login_attempts[client_ip]['attempts'],
                'max_attempts': MAX_ATTEMPTS
            }), 400
        
        # Find staff member
        staff_member = team_collection.find_one({"username": username})
        
        if not staff_member:
            # لم يتم العثور على المستخدم
            login_attempts[client_ip]['attempts'] += 1
            login_attempts[client_ip]['timestamp'] = current_time
            
            # تحديث قاعدة البيانات
            is_now_blocked = login_attempts[client_ip]['attempts'] >= MAX_ATTEMPTS
            expiry_time = None
            if is_now_blocked:
                expiry_time = datetime.fromtimestamp(current_time + BLOCK_TIME, UTC).isoformat()
            
            save_rate_limit_to_db(
                ip=client_ip, 
                attempts=login_attempts[client_ip]['attempts'], 
                timestamp=current_time,
                is_blocked=is_now_blocked,
                expiry=expiry_time
            )
            
            # Log failed login attempt
            log_login_attempt(
                username=username, 
                client_ip=client_ip,
                success=False,
                details={
                    "reason": "user_not_found",
                    "attempts": login_attempts[client_ip]['attempts'],
                    "max_attempts": MAX_ATTEMPTS,
                    "is_blocked": is_now_blocked
                }
            )
            
            logging.warning(f"Login attempt: User '{username}' not found in database")
            
            # إذا وصل إلى الحد الأقصى من المحاولات
            if is_now_blocked:
                if request.headers.get('X-Requested-With') == 'XMLHttpRequest' or request.headers.get('Accept') == 'application/json':
                    return jsonify({
                        'success': False,
                        'rate_limited': True,
                        'message': f'تم تجاوز الحد المسموح للطلبات. يرجى المحاولة مرة أخرى بعد {BLOCK_TIME // 60} دقائق'
                    }), 429
                else:
                    # توجيه المستخدم إلى صفحة تقييد المعدل
                    return redirect(f'{API_PREFIX}/rate-limit?time_left={BLOCK_TIME}')
            
            return jsonify({
                'success': False,
                'message': 'معلومات تسجيل الدخول غير صحيحة',
                'attempts': login_attempts[client_ip]['attempts'],
                'max_attempts': MAX_ATTEMPTS
            }), 401
            
        # تحقق من كلمة المرور
        stored_password = staff_member.get('password', '')
        if not stored_password or stored_password != password:
            # كلمة المرور غير صحيحة
            login_attempts[client_ip]['attempts'] += 1
            login_attempts[client_ip]['timestamp'] = current_time
            
            # تحديث قاعدة البيانات
            is_now_blocked = login_attempts[client_ip]['attempts'] >= MAX_ATTEMPTS
            expiry_time = None
            if is_now_blocked:
                expiry_time = datetime.fromtimestamp(current_time + BLOCK_TIME, UTC).isoformat()
            
            save_rate_limit_to_db(
                ip=client_ip, 
                attempts=login_attempts[client_ip]['attempts'], 
                timestamp=current_time,
                is_blocked=is_now_blocked,
                expiry=expiry_time
            )
            
            # Log failed login attempt
            log_login_attempt(
                username=username, 
                client_ip=client_ip,
                success=False,
                details={
                    "reason": "invalid_password",
                    "attempts": login_attempts[client_ip]['attempts'],
                    "max_attempts": MAX_ATTEMPTS,
                    "is_blocked": is_now_blocked
                }
            )
            
            logging.warning(f"Login attempt: Invalid password for user '{username}'")
            
            # إذا وصل إلى الحد الأقصى من المحاولات
            if is_now_blocked:
                if request.headers.get('X-Requested-With') == 'XMLHttpRequest' or request.headers.get('Accept') == 'application/json':
                    return jsonify({
                        'success': False,
                        'rate_limited': True,
                        'message': f'تم تجاوز الحد المسموح للطلبات. يرجى المحاولة مرة أخرى بعد {BLOCK_TIME // 60} دقائق'
                    }), 429
                else:
                    # توجيه المستخدم إلى صفحة تقييد المعدل
                    return redirect(f'{API_PREFIX}/rate-limit?time_left={BLOCK_TIME}')
            
            return jsonify({
                'success': False,
                'message': 'معلومات تسجيل الدخول غير صحيحة',
                'attempts': login_attempts[client_ip]['attempts'],
                'max_attempts': MAX_ATTEMPTS
            }), 401
        
        # Check if account is active
        if staff_member.get('status') != 'active':
            # Log inactive account attempt
            log_login_attempt(
                username=username, 
                client_ip=client_ip,
                success=False,
                user_id=str(staff_member['_id']),
                details={"reason": "inactive_account", "status": staff_member.get('status')}
            )
            
            return jsonify({
                'success': False,
                'message': 'الحساب غير نشط. الرجاء التواصل مع الإدارة'
            }), 403
        
        # Check if the user has permission to login
        if staff_member.get('can_login') == False and staff_member.get('role') != 'founder':
            # Log login denied due to can_login setting
            log_login_attempt(
                username=username, 
                client_ip=client_ip,
                success=False,
                user_id=str(staff_member['_id']),
                details={"reason": "login_not_permitted"}
            )
            
            logging.warning(f"Login attempt: User '{username}' does not have login permission and is not a founder")
            
            return jsonify({
                'success': False,
                'message': 'ليس لديك صلاحية الوصول للوحة التحكم. الرجاء التواصل مع الإدارة'
            }), 403
        
        # Reset login attempts on successful login
        login_attempts[client_ip] = {'attempts': 0, 'timestamp': current_time}
        
        # تحديث قاعدة البيانات بإزالة الحظر
        save_rate_limit_to_db(
            ip=client_ip, 
            attempts=0, 
            timestamp=current_time,
            is_blocked=False
        )
        
        # Log successful login
        log_login_attempt(
            username=username, 
            client_ip=client_ip,
            success=True,
            user_id=str(staff_member['_id']),
            details={"role": staff_member.get('role')}
        )
        
        # Update last active timestamp
        team_collection.update_one(
            {"_id": staff_member["_id"]},
            {"$set": {"last_active": datetime.now(UTC).isoformat()}}
        )
        
        # Convert ObjectID to string for serialization
        staff_member['_id'] = str(staff_member['_id'])
        
        # Get Discord avatar if available
        discord_users_collection = wallet_db["discord_users"]
        discord_id = staff_member.get('discord_id')
        discord_user = discord_users_collection.find_one({"user_id": discord_id})
        
        if discord_user and 'avatar' in discord_user:
            avatar_hash = discord_user.get('avatar')
            staff_member['avatar'] = avatar_hash
            staff_member['avatar_url'] = f"https://cdn.discordapp.com/avatars/{discord_id}/{avatar_hash}.webp"
        else:
            # Set default avatar URL if Discord avatar is not available
            staff_member['avatar_url'] = f"https://ui-avatars.com/api/?name={staff_member.get('username')}&background=random"
            
        # Generate JWT token
        try:
            if using_jwt_manager:
                # Use improved JWT manager
                token, payload = create_token(
                    user_id=staff_member['_id'],
                    discord_id=staff_member.get('discord_id'),
                    username=staff_member.get('username'),
                    role=staff_member.get('role')
                )
            else:
                # Use legacy JWT creation
                payload = {
                    'sub': str(staff_member['_id']),
                    'discord_id': staff_member.get('discord_id'),
                    'username': staff_member.get('username'),
                    'role': staff_member.get('role'),
                    'exp': datetime.now(UTC) + timedelta(seconds=JWT_EXPIRATION)
                }
                
                token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
            
            # If token is None or empty, raise an exception
            if not token:
                raise ValueError("Failed to generate JWT token")
                
            logging.info(f"JWT token successfully generated for user '{username}'")
                
        except Exception as e:
            logging.error(f"JWT generation error: {str(e)}")
            return jsonify({
                'success': False,
                'message': 'حدث خطأ أثناء إنشاء رمز المصادقة'
            }), 500
        
        # Remove password from response for security
        if 'password' in staff_member:
            del staff_member['password']
        
        # Log successful login
        log_login_attempt(
            username=username, 
            client_ip=client_ip,
            success=True,
            user_id=staff_member['_id'],
            details={
                "role": staff_member.get('role'),
                "discord_id": staff_member.get('discord_id')
            }
        )
        
        # Log activity
        log_activity(
            user_id=staff_member['_id'],
            username=username,
            action_type="login",
            description=f"تسجيل دخول ناجح للمستخدم {username}"
        )
        
        return jsonify({
            'success': True,
            'message': 'تم تسجيل الدخول بنجاح',
            'token': token,
            'user': staff_member
        })
        
    except Exception as e:
        logging.error(f"خطأ في تسجيل الدخول: {str(e)}")
        
        # Log error
        try:
            log_login_attempt(
                username=data.get('username') if 'data' in locals() else "unknown", 
                client_ip=request.remote_addr,
                success=False,
                details={"error": str(e)}
            )
        except:
            pass
            
        return jsonify({
            'success': False,
            'message': 'حدث خطأ أثناء تسجيل الدخول',
            'error': str(e)
        }), 500

# Verify JWT token with caching
def verify_token(token):
    # Check if token is in cache and not expired
    current_time = time.time()
    if token in token_cache:
        cache_data = token_cache[token]
        # Check if cached data is still valid
        if datetime.now(UTC) < cache_data["expires"]:
            return cache_data["data"]
    
    # Token not in cache or expired, verify it
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        # Add to cache
        token_cache[token] = {
            "data": payload,
            "expires": datetime.now(UTC) + timedelta(seconds=TOKEN_CACHE_TTL)
        }
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

# Auth verification endpoint
@app.route(f'{API_PREFIX}/staff/verify-token', methods=['POST'])
def verify_auth_token():
    """
    التحقق من صلاحية توكن المصادقة
    """
    try:
        data = request.get_json()
        token = data.get('token')
        client_ip = request.remote_addr
        
        if not token:
            return jsonify({
                'success': False,
                'message': 'توكن المصادقة مطلوب'
            }), 400
        
        # Check if using improved JWT manager
        if using_jwt_manager:
            # التحقق من صحة التوكن باستخدام المدير المُحسّن
            payload = verify_token(token)
            
            if not payload:
                # Log failed token verification
                log_activity(
                    user_id="unknown",
                    username="unknown",
                    action_type="token_verification",
                    description="فشل التحقق من توكن",
                    details={"reason": "invalid_token"}
                )
                
                return jsonify({
                    'success': False,
                    'message': 'توكن المصادقة غير صالح أو منتهي الصلاحية'
                }), 401
            
            # Get updated user info
            staff_member = team_collection.find_one({"_id": ObjectId(payload.get('sub'))})
            
            if not staff_member:
                # Log user not found
                log_activity(
                    user_id=payload.get('sub'),
                    username=payload.get('username', "unknown"),
                    action_type="token_verification",
                    description="فشل التحقق من توكن",
                    details={"reason": "user_not_found"}
                )
                
                return jsonify({
                    'success': False,
                    'message': 'المستخدم غير موجود'
                }), 404
            
            # Only update last active once every 5 minutes to reduce DB writes
            current_time = datetime.now(UTC)
            last_active = datetime.fromisoformat(staff_member.get('last_active', datetime.min.isoformat()))
            if (current_time - last_active).total_seconds() > 300:  # 5 minutes
                team_collection.update_one(
                    {"_id": staff_member["_id"]},
                    {"$set": {"last_active": current_time.isoformat()}}
                )
                
                # Log session activity
                log_activity(
                    user_id=str(staff_member['_id']),
                    username=staff_member.get('username'),
                    action_type="session_activity",
                    description="تحديث وقت آخر نشاط"
                )
            
            # Convert ObjectID to string for serialization
            staff_member['_id'] = str(staff_member['_id'])
            
            # Get Discord avatar if available
            discord_users_collection = wallet_db["discord_users"]
            discord_user = discord_users_collection.find_one({"user_id": staff_member.get('discord_id')})
            
            if discord_user and 'avatar' in discord_user:
                discord_id = staff_member.get('discord_id')
                avatar_hash = discord_user.get('avatar')
                staff_member['avatar'] = avatar_hash
                staff_member['avatar_url'] = f"https://cdn.discordapp.com/avatars/{discord_id}/{avatar_hash}.webp"
            
            # Remove password from response
            if 'password' in staff_member:
                del staff_member['password']
            
            # Check if token is about to expire
            needs_refresh = is_token_about_to_expire(payload)
            
            response_data = {
                'success': True,
                'message': 'توكن المصادقة صالح',
                'user': staff_member,
                'needs_refresh': needs_refresh
            }
            
            return jsonify(response_data)
            
        else:
            # تستخدم التحقق القديم من التوكن
            payload = verify_token(token)
            
            if not payload:
                # Log failed token verification
                log_activity(
                    user_id="unknown",
                    username="unknown",
                    action_type="token_verification",
                    description="فشل التحقق من توكن",
                    details={"reason": "invalid_token"}
                )
                
                return jsonify({
                    'success': False,
                    'message': 'توكن المصادقة غير صالح أو منتهي الصلاحية'
                }), 401
            
            # Get updated user info
            staff_member = team_collection.find_one({"_id": ObjectId(payload.get('sub'))})
            
            if not staff_member:
                # Log user not found
                log_activity(
                    user_id=payload.get('sub'),
                    username=payload.get('username', "unknown"),
                    action_type="token_verification",
                    description="فشل التحقق من توكن",
                    details={"reason": "user_not_found"}
                )
                
                return jsonify({
                    'success': False,
                    'message': 'المستخدم غير موجود'
                }), 404
            
            # Only update last active once every 5 minutes to reduce DB writes
            current_time = datetime.now(UTC)
            last_active = datetime.fromisoformat(staff_member.get('last_active', datetime.min.isoformat()))
            if (current_time - last_active).total_seconds() > 300:  # 5 minutes
                team_collection.update_one(
                    {"_id": staff_member["_id"]},
                    {"$set": {"last_active": current_time.isoformat()}}
                )
                
                # Log session activity
                log_activity(
                    user_id=str(staff_member['_id']),
                    username=staff_member.get('username'),
                    action_type="session_activity",
                    description="تحديث وقت آخر نشاط"
                )
            
            # Convert ObjectID to string for serialization
            staff_member['_id'] = str(staff_member['_id'])
            
            # Get Discord avatar if available
            discord_users_collection = wallet_db["discord_users"]
            discord_user = discord_users_collection.find_one({"user_id": staff_member.get('discord_id')})
            
            if discord_user and 'avatar' in discord_user:
                discord_id = staff_member.get('discord_id')
                avatar_hash = discord_user.get('avatar')
                staff_member['avatar'] = avatar_hash
                staff_member['avatar_url'] = f"https://cdn.discordapp.com/avatars/{discord_id}/{avatar_hash}.webp"
            
            # Remove password from response
            if 'password' in staff_member:
                del staff_member['password']
            
            return jsonify({
                'success': True,
                'message': 'توكن المصادقة صالح',
                'user': staff_member
            })
        
    except Exception as e:
        logging.error(f"خطأ في التحقق من توكن المصادقة: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'حدث خطأ أثناء التحقق من توكن المصادقة',
            'error': str(e)
        }), 500

# Token refresh endpoint
@app.route(f'{API_PREFIX}/staff/refresh-token', methods=['POST'])
def refresh_auth_token():
    """
    تجديد توكن المصادقة
    """
    try:
        data = request.get_json()
        token = data.get('token')
        client_ip = request.remote_addr
        
        if not token:
            return jsonify({
                'success': False,
                'message': 'توكن المصادقة مطلوب'
            }), 400
        
        # Check if using improved JWT manager
        if using_jwt_manager:
            # التحقق من صحة التوكن باستخدام المدير المُحسّن
            payload = verify_token(token)
            
            if not payload:
                return jsonify({
                    'success': False,
                    'message': 'توكن المصادقة غير صالح أو منتهي الصلاحية'
                }), 401
            
            # Get user info
            staff_id = payload.get('sub')
            staff_member = team_collection.find_one({"_id": ObjectId(staff_id)})
            
            if not staff_member:
                return jsonify({
                    'success': False,
                    'message': 'المستخدم غير موجود'
                }), 404
            
            # إبطال التوكن القديم
            invalidate_token(token)
            
            # إنشاء توكن جديد
            new_token, new_payload = create_token(
                user_id=str(staff_member['_id']),
                discord_id=staff_member.get('discord_id'),
                username=staff_member.get('username'),
                role=staff_member.get('role'),
                refresh_count=payload.get('refresh_count', 0) + 1
            )
            
            # تسجيل تجديد التوكن
            log_activity(
                user_id=str(staff_member['_id']),
                username=staff_member.get('username'),
                action_type="token_refresh",
                description=f"تم تجديد توكن المصادقة للمستخدم {staff_member.get('username')}"
            )
            
            return jsonify({
                'success': True,
                'message': 'تم تجديد التوكن بنجاح',
                'token': new_token
            })
        else:
            # استخدام التجديد اليدوي للتوكن بدون مدير JWT
            payload = verify_token(token)
            
            if not payload:
                return jsonify({
                    'success': False,
                    'message': 'توكن المصادقة غير صالح أو منتهي الصلاحية'
                }), 401
            
            # Get user info
            staff_member = team_collection.find_one({"_id": ObjectId(payload.get('sub'))})
            
            if not staff_member:
                return jsonify({
                    'success': False,
                    'message': 'المستخدم غير موجود'
                }), 404
            
            # Generate new JWT token
            refresh_payload = {
                'sub': str(staff_member['_id']),
                'discord_id': staff_member.get('discord_id'),
                'username': staff_member.get('username'),
                'role': staff_member.get('role'),
                'exp': datetime.now(UTC) + timedelta(seconds=JWT_EXPIRATION),
                'refresh_count': payload.get('refresh_count', 0) + 1
            }
            
            new_token = jwt.encode(refresh_payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
            
            # Log token refresh
            log_activity(
                user_id=str(staff_member['_id']),
                username=staff_member.get('username'),
                action_type="token_refresh",
                description=f"تم تجديد توكن المصادقة للمستخدم {staff_member.get('username')}"
            )
            
            return jsonify({
                'success': True,
                'message': 'تم تجديد التوكن بنجاح',
                'token': new_token
            })
        
    except Exception as e:
        logging.error(f"خطأ في تجديد التوكن: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'حدث خطأ أثناء تجديد التوكن',
            'error': str(e)
        }), 500

# Logout endpoint
@app.route(f'{API_PREFIX}/staff/logout', methods=['POST'])
def staff_logout():
    """
    تسجيل خروج عضو الفريق
    """
    try:
        data = request.get_json()
        token = data.get('token')
        
        # Get user info from token
        if token:
            payload = verify_token(token)
            if payload:
                # Log logout activity
                log_activity(
                    user_id=payload.get('sub'),
                    username=payload.get('username'),
                    action_type="logout",
                    description=f"تسجيل خروج للمستخدم {payload.get('username')}"
                )
        
        # Invalidate token on server (add to blacklist if implemented)
        # For now we just acknowledge the logout
        
        return jsonify({
            'success': True,
            'message': 'تم تسجيل الخروج بنجاح'
        })
    except Exception as e:
        logging.error(f"خطأ في تسجيل الخروج: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'حدث خطأ أثناء تسجيل الخروج',
            'error': str(e)
        }), 500

@app.route(f'{API_PREFIX}/staff/logs', methods=['GET'])
def get_staff_logs():
    try:
        page = request.args.get('page', 1, type=int)
        search = request.args.get('search', '')
        log_type = request.args.get('type', 'all')
        
        # Use staff database instead of wallet database
        logs_collection = staff_db["logs"]
        
        # Build query
        query = {}
        if search:
            query['$or'] = [
                {'user_id': {'$regex': search, '$options': 'i'}},
                {'performed_by': {'$regex': search, '$options': 'i'}},
                {'action_type': {'$regex': search, '$options': 'i'}}
            ]
        
        if log_type != 'all':
            query['action_type'] = log_type
            
        # Get total count for pagination
        total = logs_collection.count_documents(query)
        
        # Implement pagination
        per_page = 10
        total_pages = math.ceil(total / per_page)
        skip = (page - 1) * per_page
        
        # Get logs with pagination and sorting
        logs = list(logs_collection.find(
            query,
            {'_id': 0}  # Exclude _id field
        ).sort('timestamp', -1).skip(skip).limit(per_page))
        
        return jsonify({
            'success': True,
            'logs': logs,
            'pagination': {
                'page': page,
                'total_pages': total_pages,
                'total': total,
                'per_page': per_page
            }
        })
    except Exception as e:
        print(f"Error getting logs: {str(e)}")
        return jsonify({'success': False, 'message': 'حدث خطأ أثناء جلب السجلات'}), 500

@app.route(f'{API_PREFIX}/logs/add', methods=['POST'])
def add_log_entry():
    try:
        data = request.get_json()
        required_fields = ['action_type', 'user_id', 'performed_by', 'performed_by_role', 
                         'performed_by_avatar', 'reason', 'details', 'staff_id', 'timestamp']
        
        # Validate required fields
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'message': f'Missing required field: {field}'
                }), 400
        
        # Add log entry to staff database
        log_entry = {
            'action_type': data['action_type'],
            'user_id': data['user_id'],
            'performed_by': data['performed_by'],
            'performed_by_role': data['performed_by_role'],
            'performed_by_avatar': data['performed_by_avatar'],
            'reason': data['reason'],
            'details': data['details'],
            'staff_id': data['staff_id'],
            'timestamp': data['timestamp']
        }
        
        staff_db["logs"].insert_one(log_entry)
        
        return jsonify({
            'success': True,
            'message': 'تم تسجيل العملية بنجاح'
        })
        
    except Exception as e:
        print(f"Error adding log entry: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'حدث خطأ أثناء تسجيل العملية'
        }), 500

# --- Settings Initialization ---
def initialize_default_settings():
    default_settings = {
        "_id": "transfer_settings",
        "maintenance_mode": False,
        "freeze_amount": 100,
        "daily_quota": 200,
        "require_2fa": True,
        "max_transfers_per_hour": 3,
        "cooldown_minutes": 30,
        "tax_rate": 0.05,
        "tax_enabled": True,
        "min_amount": "0.00000001",  # تخزين كنص بدلاً من 1e-8
        "max_amount": "10000",  # تخزين كنص
        "freeze_duration_hours": 24,
        "freeze_enabled": True,  # إضافة إعداد تفعيل تجميد التحويلات
        "premium_enabled": False,  # إعداد لتفعيل ميزات البريميوم
        "premium_settings": {  # إعدادات خاصة بمستخدمي البريميوم
            "tax_exempt": True,  # إعفاء من الضرائب
            "tax_exempt_enabled": True,  # تفعيل الإعفاء الضريبي
            "daily_quota_boost": 50,  # زيادة الحد اليومي بنسبة 50%
            "daily_quota_boost_enabled": True,  # تفعيل زيادة الحد اليومي
            "cooldown_reduction": 50,  # تخفيض وقت الانتظار بنسبة 50%
            "cooldown_reduction_enabled": True  # تفعيل تخفيض وقت الانتظار
        },
        "created_at": datetime.now(UTC).isoformat(),
        "updated_at": datetime.now(UTC).isoformat()
    }
    if not settings_collection.find_one({"_id": "transfer_settings"}):
        settings_collection.insert_one(default_settings)
        print("Default transfer settings initialized in DB.")
    else:
        print("Transfer settings already exist in DB.")

def initialize_mining_settings():
    default_mining_settings = {
        "_id": "mining_settings",
        "maintenance_mode": False,
        "difficulty_level": 50,
        "daily_mining_rate": 100,
        "auto_mining_enabled": True,
        "mining_session_hours": 6,
        "boosted_mining": False,
        "premium_bonus_enabled": True,  # Changed from vip_bonus_enabled to premium_bonus_enabled
        "mining_reward_type": "currency",  # عملة CRN فقط
        "anti_fraud_protection": True,
        "premium_settings": {  # Changed from vip_settings to premium_settings
            "bonus_multiplier": 2,
            "bonus_multiplier_enabled": True,
            "daily_limit_boost": 50,
            "daily_limit_boost_enabled": True,
            "auto_mining_premium": True,  # Changed from auto_mining_vip
            "reduced_difficulty": 25,
            "reduced_difficulty_enabled": True,
            "mining_interval_hours": 3,
            "mining_interval_hours_enabled": True,
            "mining_reward_type": "currency"
        },
        "fraud_protection_settings": {
            "accounts_per_ip": 1,
            "accounts_per_device": 1,
            "accounts_per_ip_enabled": True,
            "accounts_per_device_enabled": True,
            "penalty_type": "warning_then_ban",
            "penalty_enabled": True,
            "protection_level": "medium",
            "protection_level_enabled": True
        },
        "created_at": datetime.now(UTC).isoformat(),
        "updated_at": datetime.now(UTC).isoformat()
    }
    if not settings_collection.find_one({"_id": "mining_settings"}):
        settings_collection.insert_one(default_mining_settings)
        print("Default mining settings initialized in DB.")
    else:
        print("Mining settings already exist in DB.")

def migrate_vip_to_premium_settings():
    """
    تحويل البيانات القديمة من vip_settings إلى premium_settings
    """
    try:
        # البحث عن إعدادات التعدين
        mining_settings = settings_collection.find_one({"_id": "mining_settings"})
        
        if mining_settings and "vip_settings" in mining_settings:
            # نقل البيانات من vip_settings إلى premium_settings
            update_data = {}
            
            # نسخ vip_settings إلى premium_settings إذا لم تكن موجودة
            if "premium_settings" not in mining_settings:
                update_data["premium_settings"] = mining_settings["vip_settings"]
            
            # نسخ vip_bonus_enabled إلى premium_bonus_enabled إذا لم تكن موجودة
            if "vip_bonus_enabled" in mining_settings and "premium_bonus_enabled" not in mining_settings:
                update_data["premium_bonus_enabled"] = mining_settings["vip_bonus_enabled"]
            
            # إزالة الحقول القديمة
            update_data["vip_settings"] = None
            update_data["vip_bonus_enabled"] = None
            
            # تحديث السجل في قاعدة البيانات
            if update_data:
                settings_collection.update_one(
                    {"_id": "mining_settings"},
                    {
                        "$set": update_data,
                        "$unset": {"vip_settings": "", "vip_bonus_enabled": ""}
                    }
                )
                print("Successfully migrated vip_settings to premium_settings")
    except Exception as e:
        print(f"Error migrating vip_settings to premium_settings: {str(e)}")

def migrate_user_vip_to_premium():
    """
    تحويل حقل vip إلى premium في بيانات المستخدمين
    """
    try:
        # البحث عن المستخدمين الذين لديهم حقل vip = true
        vip_users = users_collection.find({"vip": True})
        
        for user in vip_users:
            update_data = {
                "premium": True,  # تعيين premium لنفس قيمة vip
            }
            
            # تحديث المستخدم
            users_collection.update_one(
                {"_id": user["_id"]},
                {
                    "$set": update_data,
                    "$unset": {"vip": ""}  # إزالة حقل vip
                }
            )
        
        # البحث عن المستخدمين الذين لديهم حقل vip ولكن ليس لديهم حقل premium
        users_with_vip = users_collection.find({"vip": {"$exists": True}})
        
        for user in users_with_vip:
            update_data = {
                "premium": user.get("vip", False),  # تعيين premium لنفس قيمة vip
            }
            
            # تحديث المستخدم
            users_collection.update_one(
                {"_id": user["_id"]},
                {
                    "$set": update_data,
                    "$unset": {"vip": ""}  # إزالة حقل vip
                }
            )
        
        print("Successfully migrated user vip field to premium")
    except Exception as e:
        print(f"Error migrating user vip field to premium: {str(e)}")

# Call the initialization functions at startup
initialize_default_settings()
initialize_mining_settings()
migrate_vip_to_premium_settings()  # تشغيل عملية ترحيل البيانات
migrate_user_vip_to_premium()  # تشغيل عملية ترحيل بيانات المستخدمين

@app.route(f'{API_PREFIX}/settings/transfer', methods=['GET'])
def get_transfer_settings():
    """
    جلب إعدادات التحويل من قاعدة البيانات
    """
    settings = settings_collection.find_one({"_id": "transfer_settings"}, {"_id": 0})
    if not settings:
        return jsonify({"success": False, "message": "Settings not found"}), 404
    return jsonify({"success": True, "settings": settings})

@app.route(f'{API_PREFIX}/settings/transfer', methods=['PUT'])
def update_transfer_settings():
    """
    تحديث إعدادات التحويل في قاعدة البيانات
    """
    try:
        data = request.json
        if not data:
            return jsonify({"success": False, "message": "No data provided"}), 400

        # احذف _id لو موجود حتى لا يتغير
        if '_id' in data:
            data.pop('_id')
            
        # معالجة الأرقام العشرية الصغيرة لتخزينها بالصيغة الكاملة
        if 'min_amount' in data:
            # تحويل التدوين العلمي إلى نص عشري كامل
            min_amount = float(data['min_amount'])
            data['min_amount'] = str(min_amount)  # تخزين كنص للحفاظ على الصيغة
            
        if 'max_amount' in data:
            max_amount = float(data['max_amount'])
            data['max_amount'] = str(max_amount)  # تخزين كنص للحفاظ على الصيغة
            
        # أضف timestamp للتحديث
        data['updated_at'] = datetime.now(UTC).isoformat()
        
        # إذا لم يكن الإعداد موجود من قبل، أضف تاريخ الإنشاء
        settings_exists = settings_collection.find_one({"_id": "transfer_settings"})
        if not settings_exists and 'created_at' not in data:
            data['created_at'] = datetime.now(UTC).isoformat()

        result = settings_collection.update_one(
            {"_id": "transfer_settings"},
            {"$set": data},
            upsert=True
        )
        
        return jsonify({
            "success": True,
            "message": "تم تحديث الإعدادات بنجاح",
            "updated": result.modified_count > 0
        })
        
    except Exception as e:
        print(f"Error updating settings: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500

@app.route(f'{API_PREFIX}/settings/mining', methods=['GET'])
def get_mining_settings():
    """
    جلب إعدادات التعدين من قاعدة البيانات
    """
    settings = settings_collection.find_one({"_id": "mining_settings"})
    if not settings:
        return jsonify({"success": False, "message": "Mining settings not found"}), 404
    
    # تحويل _id إلى سلسلة نصية حتى يمكن تحويل المستند إلى JSON
    settings['_id'] = str(settings['_id'])
    
    return jsonify({"success": True, "settings": settings})

@app.route(f'{API_PREFIX}/settings/mining', methods=['PUT'])
def update_mining_settings():
    """
    تحديث إعدادات التعدين في قاعدة البيانات
    """
    try:
        data = request.json
        if not data:
            return jsonify({"success": False, "message": "No data provided"}), 400

        # احذف _id لو موجود حتى لا يتغير
        if '_id' in data:
            data.pop('_id')
            
        # أضف timestamp للتحديث
        data['updated_at'] = datetime.now(UTC).isoformat()
        
        # إذا لم يكن الإعداد موجود من قبل، أضف تاريخ الإنشاء
        settings_exists = settings_collection.find_one({"_id": "mining_settings"})
        if not settings_exists and 'created_at' not in data:
            data['created_at'] = datetime.now(UTC).isoformat()

        result = settings_collection.update_one(
            {"_id": "mining_settings"},
            {"$set": data},
            upsert=True
        )
        
        return jsonify({
            "success": True,
            "message": "تم تحديث إعدادات التعدين بنجاح",
            "updated": result.modified_count > 0
        })
        
    except Exception as e:
        print(f"Error updating mining settings: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500

# Clean up rate limit records periodically
def cleanup_rate_limits():
    current_time = time.time()
    expired_ips = []
    
    # Check memory rate limits
    for ip, data in list(login_attempts.items()):
        if current_time - data['timestamp'] > BLOCK_TIME:
            # Reset attempts for expired blocks
            if data['attempts'] >= MAX_ATTEMPTS:
                login_attempts[ip] = {'attempts': 0, 'timestamp': current_time}
                expired_ips.append(ip)
    
    # Update database for expired blocks
    if expired_ips:
        try:
            rate_limits_collection = staff_db["rate_limits"]
            rate_limits_collection.update_many(
                {
                    "ip": {"$in": expired_ips},
                    "is_blocked": True
                },
                {
                    "$set": {
                        "is_blocked": False, 
                        "attempts": 0,
                        "updated_at": datetime.now(UTC).isoformat()
                    }
                }
            )
            logging.info(f"Cleaned up {len(expired_ips)} expired rate limits")
        except Exception as e:
            logging.error(f"Error updating expired rate limits in database: {e}")

# Run cleanup every few minutes
def schedule_rate_limit_cleanup():
    import threading
    import time
    
    def run_cleanup():
        while True:
            try:
                cleanup_rate_limits()
            except Exception as e:
                logging.error(f"Error in rate limit cleanup: {e}")
            time.sleep(60)  # Run every minute
    
    cleanup_thread = threading.Thread(target=run_cleanup, daemon=True)
    cleanup_thread.start()

# Start the cleanup scheduler
schedule_rate_limit_cleanup()

# API endpoint to get rate limits (for admin only)
@app.route(f'{API_PREFIX}/staff/rate-limits', methods=['GET'])
def get_rate_limits():
    """
    الحصول على قائمة عناوين IP المحظورة وسجلات محاولات تسجيل الدخول
    """
    try:
        # Check for authorization - example only, use proper auth check here
        auth_token = request.headers.get('Authorization')
        if not auth_token or not auth_token.startswith('Bearer '):
            return jsonify({'success': False, 'message': 'غير مصرح بالوصول'}), 401
        
        token = auth_token.split(' ')[1]
        payload = verify_token(token)
        if not payload:
            return jsonify({'success': False, 'message': 'جلسة غير صالحة'}), 401
        
        # Verify admin role
        role = payload.get('role')
        if role not in ['founder', 'general_manager', 'manager']:
            return jsonify({'success': False, 'message': 'غير مصرح بالوصول لهذه البيانات'}), 403
        
        # Get rate limits from database
        rate_limits_collection = staff_db["rate_limits"]
        
        # Get filters
        show_all = request.args.get('all', 'false').lower() == 'true'
        
        # Build query
        query = {}
        if not show_all:
            query["is_blocked"] = True
            
        # Execute query with pagination
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 50))
        skip = (page - 1) * limit
        
        # Get rate limits
        rate_limits = list(rate_limits_collection.find(
            query, 
            {'_id': 0}
        ).sort('updated_at', -1).skip(skip).limit(limit))
        
        # Get total count
        total_count = rate_limits_collection.count_documents(query)
        
        # Add memory state information
        for rate_limit in rate_limits:
            ip = rate_limit.get('ip')
            if ip in login_attempts:
                rate_limit['memory_state'] = {
                    'attempts': login_attempts[ip]['attempts'],
                    'timestamp': datetime.fromtimestamp(login_attempts[ip]['timestamp'], UTC).isoformat()
                }
        
        return jsonify({
            'success': True,
            'rate_limits': rate_limits,
            'total': total_count,
            'page': page,
            'limit': limit,
            'pages': math.ceil(total_count / limit)
        })
    except Exception as e:
        logging.error(f"Error fetching rate limits: {e}")
        return jsonify({'success': False, 'message': f'خطأ: {str(e)}'}), 500

# API endpoint to clear a rate limit block
@app.route(f'{API_PREFIX}/staff/rate-limits/clear', methods=['POST'])
def clear_rate_limit():
    """
    إزالة حظر عن عنوان IP محدد
    """
    try:
        # Check for authorization - example only, use proper auth check here
        auth_token = request.headers.get('Authorization')
        if not auth_token or not auth_token.startswith('Bearer '):
            return jsonify({'success': False, 'message': 'غير مصرح بالوصول'}), 401
        
        token = auth_token.split(' ')[1]
        payload = verify_token(token)
        if not payload:
            return jsonify({'success': False, 'message': 'جلسة غير صالحة'}), 401
        
        # Verify admin role
        role = payload.get('role')
        if role not in ['founder', 'general_manager', 'manager']:
            return jsonify({'success': False, 'message': 'غير مصرح بالوصول لهذه العملية'}), 403
        
        # Get IP from request
        data = request.get_json()
        ip = data.get('ip')
        
        if not ip:
            return jsonify({'success': False, 'message': 'عنوان IP مطلوب'}), 400
        
        # Clear rate limit in memory
        if ip in login_attempts:
            login_attempts[ip] = {'attempts': 0, 'timestamp': time.time()}
        
        # Clear rate limit in database
        rate_limits_collection = staff_db["rate_limits"]
        result = rate_limits_collection.update_one(
            {"ip": ip},
            {
                "$set": {
                    "attempts": 0,
                    "is_blocked": False,
                    "updated_at": datetime.now(UTC).isoformat(),
                    "cleared_by": payload.get('username'),
                    "cleared_at": datetime.now(UTC).isoformat()
                }
            }
        )
        
        # Log the action
        log_activity(
            user_id=payload.get('sub', 'unknown'),
            username=payload.get('username', 'unknown'),
            action_type="rate_limit_cleared",
            description=f"تم إزالة حظر IP بواسطة {payload.get('username')}",
            details={"ip": ip}
        )
        
        return jsonify({
            'success': True,
            'message': f'تم إزالة الحظر عن عنوان IP: {ip}',
            'modified_count': result.modified_count
        })
    except Exception as e:
        logging.error(f"Error clearing rate limit: {e}")
        return jsonify({'success': False, 'message': f'خطأ: {str(e)}'}), 500

@app.route(f'{API_PREFIX}/staff/login-logs', methods=['GET'])
def get_login_logs():
    try:
        page = request.args.get('page', 1, type=int)
        search = request.args.get('search', '')
        status = request.args.get('status', 'all')  # all, success, failure
        
        # Use staff database for login logs
        logs_collection = staff_db["login_logs"]
        
        # Build query
        query = {}
        if search:
            query['$or'] = [
                {'username': {'$regex': search, '$options': 'i'}},
                {'client_ip': {'$regex': search, '$options': 'i'}},
                {'user_id': {'$regex': search, '$options': 'i'}}
            ]
        
        if status != 'all':
            query['success'] = (status == 'success')
            
        # Get total count for pagination
        total = logs_collection.count_documents(query)
        
        # Implement pagination
        per_page = 20
        total_pages = math.ceil(total / per_page)
        skip = (page - 1) * per_page
        
        # Get logs with pagination and sorting
        logs = list(logs_collection.find(
            query,
            {'_id': 0}  # Exclude _id field
        ).sort('timestamp', -1).skip(skip).limit(per_page))
        
        return jsonify({
            'success': True,
            'logs': logs,
            'pagination': {
                'page': page,
                'total_pages': total_pages,
                'total': total,
                'per_page': per_page
            }
        })
    except Exception as e:
        print(f"Error getting login logs: {str(e)}")
        return jsonify({'success': False, 'message': 'حدث خطأ أثناء جلب سجلات تسجيل الدخول'}), 500

def migrate_login_logs():
    """
    Migrate login logs from wallet_db to staff_db
    """
    try:
        # Check if collection exists in wallet_db
        if "login_logs" in wallet_db.list_collection_names():
            # Get count of records in wallet_db
            wallet_logs_count = wallet_db["login_logs"].count_documents({})
            
            if wallet_logs_count > 0:
                # Check how many records already exist in staff_db
                staff_logs_count = staff_db["login_logs"].count_documents({})
                
                print(f"Migrating {wallet_logs_count} login logs from wallet_db to staff_db")
                
                # Move records in batches to handle large volumes
                batch_size = 100
                total_migrated = 0
                
                for i in range(0, wallet_logs_count, batch_size):
                    # Get a batch of records
                    logs_batch = list(wallet_db["login_logs"].find().skip(i).limit(batch_size))
                    
                    if logs_batch:
                        # Remove _id field from records (MongoDB will create new IDs)
                        for log in logs_batch:
                            if '_id' in log:
                                del log['_id']
                        
                        # Insert records into staff_db
                        staff_db["login_logs"].insert_many(logs_batch)
                        
                        total_migrated += len(logs_batch)
                        print(f"Migrated {total_migrated} of {wallet_logs_count} records")
                
                print(f"Login logs migration complete: {total_migrated} records successfully transferred")
                
                # Optional: Delete records from wallet_db after successful migration
                # wallet_db["login_logs"].drop()
                # print("Dropped login_logs collection from wallet_db after successful migration")
                
                return True
            else:
                print("No login logs found in wallet_db to migrate")
                return True
        else:
            print("login_logs collection does not exist in wallet_db")
            return True
    except Exception as e:
        print(f"Error migrating login logs: {str(e)}")
        return False

# استدعاء وظيفة ترحيل سجلات تسجيل الدخول عند بدء التشغيل
if __name__ == '__main__':
    # Initialize settings if not already present
    initialize_default_settings()
    initialize_mining_settings()
    
    # ترحيل سجلات تسجيل الدخول من wallet_db إلى staff_db
    migrate_login_logs()
    
    # Start JWT management if available
    if using_jwt_manager:
        try:
            start_token_cleanup_scheduler()
            print("JWT token management system started")
        except Exception as e:
            print(f"Failed to start JWT management: {e}")
    
    # تجهيز تنظيف سجلات معدل الطلبات
    schedule_rate_limit_cleanup()
    
    print(f"Server starting in {ENV} mode...")
    print(f"Running on http://{HOST}:{PORT} (Press CTRL+C to quit)")
    
    # Fix for Windows socket reuse issue in debug mode
    if sys.platform == 'win32' and DEBUG:
        app.run(host=HOST, port=PORT, debug=DEBUG, use_reloader=False)
    else:
        app.run(host=HOST, port=PORT, debug=DEBUG)

@app.route(f'{API_PREFIX}/rate-limit', methods=['GET'])
def rate_limit_page():
    """
    صفحة مخصصة للمستخدمين الذين تجاوزوا الحد المسموح من محاولات تسجيل الدخول
    """
    time_left = int(request.args.get('time_left', 900))
    minutes = time_left // 60
    seconds = time_left % 60
    
    html_content = f"""
    <!DOCTYPE html>
    <html dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>تم تقييد الوصول</title>
        <style>
            body {{
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background-color: #0f172a;
                color: white;
                margin: 0;
                padding: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                text-align: center;
            }}
            .container {{
                background-color: #1e293b;
                border-radius: 10px;
                padding: 40px;
                max-width: 500px;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
                border: 1px solid #2d3748;
            }}
            h1 {{
                color: #f87171;
                margin-bottom: 20px;
            }}
            p {{
                margin-bottom: 15px;
                font-size: 16px;
                line-height: 1.6;
            }}
            .timer {{
                font-size: 40px;
                font-weight: bold;
                margin: 30px 0;
                color: #f87171;
            }}
            .explanation {{
                background-color: #334155;
                padding: 15px;
                border-radius: 5px;
                margin-top: 20px;
                text-align: right;
            }}
            .return-btn {{
                display: inline-block;
                margin-top: 20px;
                padding: 10px 20px;
                background-color: #4f46e5;
                color: white;
                text-decoration: none;
                border-radius: 5px;
                font-weight: bold;
                transition: background-color 0.3s;
            }}
            .return-btn:hover {{
                background-color: #4338ca;
            }}
            #countdown {{
                font-weight: bold;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <h1>تم تقييد الوصول</h1>
            <p>لقد تجاوزت الحد المسموح من محاولات تسجيل الدخول.</p>
            
            <div class="timer">
                <span id="minutes">{minutes:02d}</span>:<span id="seconds">{seconds:02d}</span>
            </div>
            
            <p>يرجى الانتظار قبل محاولة تسجيل الدخول مرة أخرى.</p>
            
            <div class="explanation">
                <p>يتم تطبيق هذا التقييد لحماية النظام من محاولات الاختراق وتخمين كلمات المرور.</p>
                <p>إذا كنت تعتقد أن هذا خطأ، يرجى التواصل مع مسؤول النظام.</p>
            </div>
            
            <a href="/" class="return-btn">العودة للصفحة الرئيسية</a>
        </div>
        
        <script>
            // تنازلي للوقت المتبقي
            let totalSeconds = {time_left};
            
            function updateTimer() {{
                let minutes = Math.floor(totalSeconds / 60);
                let seconds = totalSeconds % 60;
                
                document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
                document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
                
                if (totalSeconds > 0) {{
                    totalSeconds--;
                    setTimeout(updateTimer, 1000);
                }} else {{
                    window.location.href = '/';
                }}
            }}
            
            // بدء العد التنازلي
            updateTimer();
        </script>
    </body>
    </html>
    """
    
    return html_content, 200, {'Content-Type': 'text/html; charset=utf-8'}