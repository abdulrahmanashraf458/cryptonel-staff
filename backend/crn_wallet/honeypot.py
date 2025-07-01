"""
وحدة مصائد العسل (Honeypot) للكشف عن المتسللين ومحاولات الاختراق

هذا الملف يحتوي على تعريفات لصفحات ومسارات وهمية تستخدم كفخاخ
للمهاجمين. إذا تم الوصول إلى أي من هذه المسارات، فهذا مؤشر على
وجود محاولة اختراق محتملة، لأن هذه المسارات لا تظهر في الواجهة
العادية للتطبيق.
"""

import logging
import time
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify, redirect, url_for, render_template
from functools import wraps
from pymongo import MongoClient
import os

# تكوين الاتصال بقاعدة البيانات - يجب تعديله حسب إعدادات التطبيق
try:
    # Get MongoDB URI from config if available, otherwise use default
    from configparser import ConfigParser
    config = ConfigParser()
    config.read(os.path.join('backend', 'config.ini'))
    MONGO_URI = config.get('Database', 'MongoURI', fallback='mongodb://localhost:27017/')
except:
    MONGO_URI = 'mongodb://localhost:27017/'

# إعداد الاتصال بقاعدة البيانات
client = MongoClient(MONGO_URI)
staff_db = client["staff"]  # نفس قاعدة البيانات المستخدمة في server.py

# إنشاء Blueprint للـ Honeypot
honeypot_bp = Blueprint('honeypot', __name__)

# المسارات المعروفة التي يستهدفها المهاجمون
COMMON_ATTACK_PATHS = [
    '/wp-login.php',
    '/wp-admin',
    '/admin',
    '/administrator',
    '/phpmyadmin',
    '/manager/html',
    '/.env',
    '/config.php',
    '/login.php',
    '/shell.php',
    '/c99.php',
    '/r57.php',
    '/webshell.php',
    '/cmd.php',
    '/db.php',
    '/db/phpmyadmin',
    '/dbadmin',
    '/mysql',
    '/myadmin',
    '/php-my-admin',
    '/sqlmanager',
    '/installed',
    '/xmlrpc.php',
    '/portal',
    '/community',
    '/_ignition/execute-solution',
    '/api/jsonws/invoke',
    '/solr/',
    '/vendor/phpunit/phpunit/src/Util/PHP/eval-stdin.php',
    '/vendor/',
    '/actuator/health',
    '/console/',
    '/jenkins/',
    '/wp-content/plugins/',
    '/cgi-bin/',
    '/debug/pprof/',
    '/owa/',
    '/boaform/',
    '/hudson',
    '/style/',
    '/stalker_portal/',
    '/streams/live.php',
    '/vmware/csp/poc/thirdparty/jquery/'
]

# قائمة IP المحظورة
BLOCKED_IPS = set()

# سجل محاولات الوصول للفخاخ
HONEYPOT_ACCESS_LOG = []

# الحد الأقصى لحجم سجل الوصول
MAX_LOG_SIZE = 1000

# الحد الأقصى لعدد المحاولات قبل الحظر
MAX_ATTEMPTS_BEFORE_BLOCK = 3

# مدة الحظر بالثواني (24 ساعة)
BLOCK_DURATION = 86400

# تتبع محاولات الوصول حسب عنوان IP
ip_access_attempts = {}

# متغير عام لقاعدة البيانات
db = None

def setup_honeypot(app, wallet_db=None):
    """
    إعداد مصائد العسل وتسجيلها مع التطبيق
    """
    global db
    db = wallet_db
    
    def log_honeypot_access(ip, path, method, user_agent):
        """تسجيل محاولة الوصول إلى فخ العسل"""
        timestamp = datetime.now(timezone.utc).isoformat()
        log_entry = {
            'timestamp': timestamp,
            'ip': ip,
            'path': path,
            'method': method,
            'user_agent': user_agent
        }
        
        # إضافة إلى السجل المحلي
        HONEYPOT_ACCESS_LOG.append(log_entry)
        
        # تقليص السجل إذا تجاوز الحد الأقصى
        if len(HONEYPOT_ACCESS_LOG) > MAX_LOG_SIZE:
            HONEYPOT_ACCESS_LOG.pop(0)
        
        # تسجيل في سجل التطبيق
        logging.warning(f"Honeypot access: {ip} accessed {path} using {method}")
        
        # تسجيل في قاعدة البيانات إذا كانت متاحة
        if db is not None:
            try:
                honeypot_collection = db["honeypot_logs"]
                honeypot_collection.insert_one(log_entry)
            except Exception as e:
                logging.error(f"Failed to log honeypot access to database: {e}")
        
        # تتبع محاولات الوصول لكل IP
        current_time = time.time()
        if ip not in ip_access_attempts:
            ip_access_attempts[ip] = {
                'attempts': 1,
                'first_attempt': current_time,
                'last_attempt': current_time
            }
        else:
            # إعادة ضبط العداد إذا مر وقت طويل منذ آخر محاولة (يوم كامل)
            if current_time - ip_access_attempts[ip]['last_attempt'] > 86400:
                ip_access_attempts[ip] = {
                    'attempts': 1,
                    'first_attempt': current_time,
                    'last_attempt': current_time
                }
            else:
                ip_access_attempts[ip]['attempts'] += 1
                ip_access_attempts[ip]['last_attempt'] = current_time
        
        # فحص ما إذا كان يجب حظر عنوان IP
        if ip_access_attempts[ip]['attempts'] >= MAX_ATTEMPTS_BEFORE_BLOCK:
            BLOCKED_IPS.add(ip)
            logging.warning(f"IP {ip} blocked for accessing honeypot paths repeatedly")
            # إضافة إلى قاعدة البيانات إذا كانت متاحة
            if db is not None:
                try:
                    blocked_ips_collection = db["blocked_ips"]
                    blocked_ips_collection.insert_one({
                        'ip': ip,
                        'blocked_at': timestamp,
                        'reason': f"Accessed honeypot paths {ip_access_attempts[ip]['attempts']} times",
                        'expires_at': datetime.fromtimestamp(current_time + BLOCK_DURATION, timezone.utc).isoformat()
                    })
                except Exception as e:
                    logging.error(f"Failed to save blocked IP to database: {e}")
    
    def honeypot_check(view_func):
        """وسيط لفحص ما إذا كان طلب API من مصدر محظور"""
        @wraps(view_func)
        def decorated_function(*args, **kwargs):
            client_ip = request.remote_addr
            
            # التحقق من أن عنوان IP ليس محظوراً
            if client_ip in BLOCKED_IPS:
                current_time = time.time()
                # فحص ما إذا انتهت مدة الحظر
                if client_ip in ip_access_attempts and current_time - ip_access_attempts[client_ip]['last_attempt'] > BLOCK_DURATION:
                    BLOCKED_IPS.remove(client_ip)
                    if client_ip in ip_access_attempts:
                        del ip_access_attempts[client_ip]
                else:
                    logging.warning(f"Blocked request from IP: {client_ip}")
                    return jsonify({'error': 'Access denied'}), 403
            
            return view_func(*args, **kwargs)
        return decorated_function
    
    # تسجيل وسيط التحقق من الحظر مع التطبيق
    app.before_request(lambda: honeypot_check(lambda: None)())
    
    # إنشاء مسارات فخاخ العسل لمنصات مختلفة
    def create_honeypot_handler(specific_path):
        """Create a unique handler function for each honeypot path"""
        def handler_func():
            client_ip = request.remote_addr
            user_agent = request.headers.get('User-Agent', 'Unknown')
            
            # تسجيل محاولة الوصول
            log_honeypot_access(client_ip, specific_path, request.method, user_agent)
            
            # محاكاة استجابة مناسبة بناءً على المسار
            if 'wp-' in specific_path or 'wordpress' in specific_path:
                return "<!DOCTYPE html><html><head><title>WordPress &rsaquo; Error</title></head><body><p>There has been a critical error on this website.</p></body></html>", 500
            elif 'admin' in specific_path or 'login' in specific_path:
                return redirect('/login')
            elif 'php' in specific_path:
                return "", 404
            else:
                return "", 404
        
        # Set a unique name for the function to avoid conflicts
        handler_func.__name__ = f'honeypot_handler_{hash(specific_path) & 0xffffffff}'
        return handler_func
    
    # تسجيل مسارات فخاخ العسل باستخدام add_url_rule
    for path in COMMON_ATTACK_PATHS:
        unique_handler = create_honeypot_handler(path)
        honeypot_bp.add_url_rule(path, unique_handler.__name__, unique_handler, methods=['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'])
    
    # إنشاء صفحة وهمية لصفحة تسجيل الدخول الزائفة
    @honeypot_bp.route('/fake-admin', methods=['GET', 'POST'])
    def fake_admin_login():
        client_ip = request.remote_addr
        user_agent = request.headers.get('User-Agent', 'Unknown')
        
        # تسجيل محاولة الوصول
        log_honeypot_access(client_ip, '/fake-admin', request.method, user_agent)
        
        if request.method == 'POST':
            # تسجيل محاولة تسجيل الدخول - هذه الصفحة مجرد فخ
            username = request.form.get('username', '')
            password = request.form.get('password', '')
            
            # تسجيل البيانات المدخلة
            if db is not None:
                try:
                    credentials_collection = db["captured_credentials"]
                    credentials_collection.insert_one({
                        'timestamp': datetime.now(timezone.utc).isoformat(),
                        'ip': client_ip,
                        'username': username,
                        'password': password,
                        'user_agent': user_agent,
                        'path': '/fake-admin'
                    })
                except Exception as e:
                    logging.error(f"Failed to log captured credentials: {e}")
            
            # إعادة توجيه المستخدم إلى صفحة خطأ
            return "<h1>Authentication failed. Please try again later.</h1>", 401
        
        # عرض نموذج تسجيل دخول وهمي
        return """
        <!DOCTYPE html>
        <html>
        <head>
            <title>Admin Login</title>
            <style>
                body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; height: 100vh; }
                .login-container { background: white; padding: 20px; border-radius: 5px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); width: 320px; }
                .login-container h2 { margin-top: 0; color: #333; }
                input[type="text"], input[type="password"] { width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ddd; border-radius: 3px; box-sizing: border-box; }
                button { background: #4285f4; color: white; border: none; padding: 10px 15px; border-radius: 3px; cursor: pointer; width: 100%; }
                button:hover { background: #3b78e7; }
            </style>
        </head>
        <body>
            <div class="login-container">
                <h2>Admin Login</h2>
                <form method="post">
                    <input type="text" name="username" placeholder="Username" required>
                    <input type="password" name="password" placeholder="Password" required>
                    <button type="submit">Login</button>
                </form>
            </div>
        </body>
        </html>
        """
    
    # تسجيل نقطة نهاية API وهمية
    @honeypot_bp.route('/api/v1/admin/users', methods=['GET'])
    def fake_api_users():
        client_ip = request.remote_addr
        user_agent = request.headers.get('User-Agent', 'Unknown')
        
        # تسجيل محاولة الوصول
        log_honeypot_access(client_ip, '/api/v1/admin/users', request.method, user_agent)
        
        # محاكاة استجابة API
        return jsonify({'error': 'Unauthorized access', 'code': 401}), 401
    
    # تقرير عن محاولات الوصول (للمسؤولين فقط)
    @honeypot_bp.route('/admin/security/honeypot-report', methods=['GET'])
    def honeypot_report():
        # هذا المسار يجب أن يكون محميًا بالمصادقة في الاستخدام الفعلي
        report = {
            'total_accesses': len(HONEYPOT_ACCESS_LOG),
            'blocked_ips': list(BLOCKED_IPS),
            'recent_accesses': HONEYPOT_ACCESS_LOG[-20:],  # آخر 20 محاولة وصول
            'ip_attempts': ip_access_attempts
        }
        return jsonify(report)
    
    # تسجيل مسارات فخاخ العسل مع التطبيق
    app.register_blueprint(honeypot_bp)
    
    # تنظيف دوري للبيانات
    def cleanup_old_records():
        """تنظيف السجلات القديمة وإزالة IP المحظورة بعد انتهاء مدة الحظر"""
        current_time = time.time()
        ips_to_unblock = set()
        
        for ip in BLOCKED_IPS:
            if ip in ip_access_attempts and current_time - ip_access_attempts[ip]['last_attempt'] > BLOCK_DURATION:
                ips_to_unblock.add(ip)
                if ip in ip_access_attempts:
                    del ip_access_attempts[ip]
        
        # إزالة الحظر عن العناوين التي انتهت مدة حظرها
        BLOCKED_IPS.difference_update(ips_to_unblock)
        
        # إذا كانت قاعدة البيانات متاحة، تحديث سجلات الحظر
        if db is not None and ips_to_unblock:
            try:
                blocked_ips_collection = db["blocked_ips"]
                # تحديث حالة السجلات لتظهر أن الحظر انتهى
                blocked_ips_collection.update_many(
                    {'ip': {'$in': list(ips_to_unblock)}},
                    {'$set': {'status': 'expired'}}
                )
            except Exception as e:
                logging.error(f"Failed to update expired blocks in database: {e}")
    
    # بدء عملية التنظيف
    import threading
    cleanup_thread = threading.Thread(target=cleanup_old_records)
    cleanup_thread.daemon = True
    cleanup_thread.start()
    
    # تشغيل التنظيف دوريًا
    from apscheduler.schedulers.background import BackgroundScheduler
    scheduler = BackgroundScheduler()
    scheduler.add_job(cleanup_old_records, 'interval', hours=1)
    scheduler.start()
    
    logging.info(f"Honeypot system initialized with {len(COMMON_ATTACK_PATHS)} trap paths")
    return True 