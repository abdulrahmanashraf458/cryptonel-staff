import time
import logging
import threading
import json
import os
import hashlib
import re
from collections import defaultdict, deque
from functools import wraps
from flask import request, jsonify, abort, session, Blueprint, redirect
import random
import redis

# Initialize Redis client
try:
    redis_client = redis.Redis(host='localhost', port=6379, db=0)
except:
    redis_client = None

# تكوين السجل
logging.basicConfig(
    filename='security.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# ========================= التكوين =========================

# تكوين حدود الطلبات - أكثر صرامة للحماية المعززة
RATE_LIMITS = {
    'default': 30,  # 30 طلب في الدقيقة للمسارات العادية
    'login': 3,     # 3 محاولات تسجيل دخول في الدقيقة
    'sensitive': 10 # 10 طلبات في الدقيقة للمسارات الحساسة
}

# مسارات تسجيل الدخول (حساسة جداً)
LOGIN_PATHS = ['/api/staff/login', '/api/auth/login']

# مسارات حساسة (مثل تحويل الأموال)
SENSITIVE_PATHS = ['/api/wallet/transfer', '/api/user/update', '/api/user/delete']

# نمط IP الصحيح للتحقق من صحة العنوان
IP_PATTERN = re.compile(r'^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$')

# قائمة IP المحظورة
BLACKLISTED_IPS = set()

# قائمة IP المسموح بها دائماً (مثل عناوين المطورين)
WHITELISTED_IPS = {'127.0.0.1', 'localhost', '::1'}  # Added localhost and IPv6 localhost

# العملاء المشبوهين
SUSPICIOUS_AGENTS = [
    'zgrab', 'python-requests', 'go-http-client', 'nikto', 'nmap', 'masscan',
    'scanners', 'bot', 'dirbuster', 'gobuster', 'slowloris', 'slowhttptest'
]

# عتبات الكشف عن الهجمات
DOS_THRESHOLD = 60     # طلبات في الدقيقة من IP واحد
GLOBAL_THRESHOLD = 300 # طلبات في الدقيقة من جميع الـ IPs للكشف عن DDOS

# تحميل قوائم IP المحظورة والمسموح بها
try:
    with open('blacklisted_ips.json', 'r') as f:
        BLACKLISTED_IPS = set(json.load(f))
except:
    pass

try:
    with open('whitelisted_ips.json', 'r') as f:
        WHITELISTED_IPS = set(json.load(f))
except:
    pass

# ========================= هياكل البيانات =========================

# تتبع عدد الطلبات من كل IP والأوقات
ip_request_timestamps = defaultdict(list)
temporarily_blocked = {}  # IP المحظورة مؤقتًا مع وقت انتهاء الحظر
ip_last_activity = {}     # وقت آخر نشاط لكل IP
ip_country_data = {}      # بيانات البلد لكل IP
failed_logins = defaultdict(int)  # عدد محاولات تسجيل الدخول الفاشلة
path_access_count = defaultdict(int)  # عدد الوصول لكل مسار

# تتبع سلوك الطلبات العالمي للكشف عن هجمات DDOS
global_request_timestamps = deque(maxlen=10000)  # تخزين الطوابع الزمنية العامة للطلبات

# قفل للمزامنة
request_lock = threading.RLock()

# Add temporary storage for tracking suspicious behavior
SUSPICIOUS_IPS = {}
REQUEST_HISTORY = {}
PERMANENT_BLACKLIST = set()
BANNED_KEYWORDS = set(['احا', 'كسم', 'نيك', 'طيز', 'عير', 'زبي', 'كس', 'متناك', 'خول'])

# Configure thresholds
REQUESTS_PER_SECOND_LIMIT = 5
BAN_THRESHOLD = 50
WARN_THRESHOLD = 20
PENALTY_MULTIPLIER = 2

# ========================= الوظائف المساعدة =========================

def save_blacklist():
    """حفظ قائمة IP المحظورة إلى ملف"""
    try:
        with open('blacklisted_ips.json', 'w') as f:
            json.dump(list(BLACKLISTED_IPS), f)
    except Exception as e:
        logging.error(f"خطأ في حفظ قائمة IP المحظورة: {e}")

def save_whitelist():
    """حفظ قائمة IP المسموح بها إلى ملف"""
    try:
        with open('whitelisted_ips.json', 'w') as f:
            json.dump(list(WHITELISTED_IPS), f)
    except Exception as e:
        logging.error(f"خطأ في حفظ قائمة IP المسموح بها: {e}")

def is_valid_ip(ip):
    """التحقق من صحة عنوان IP"""
    if not IP_PATTERN.match(ip):
        return False
    
    # التحقق من نطاقات الأرقام
    octets = ip.split('.')
    for octet in octets:
        value = int(octet)
        if value < 0 or value > 255:
            return False
            
    return True

def get_client_ip():
    """الحصول على عنوان IP العميل مع التعامل مع البروكسي"""
    if request.headers.get('X-Forwarded-For'):
        ip = request.headers.get('X-Forwarded-For').split(',')[0].strip()
        if is_valid_ip(ip):
            return ip
            
    return request.remote_addr

def get_path_category(path):
    """تحديد فئة المسار (تسجيل دخول، حساس، عادي)"""
    if any(login_path in path for login_path in LOGIN_PATHS):
        return 'login'
    if any(sensitive_path in path for sensitive_path in SENSITIVE_PATHS):
        return 'sensitive'
    return 'default'

def get_rate_limit(path):
    """الحصول على حد الطلبات المناسب بناءً على المسار"""
    category = get_path_category(path)
    return RATE_LIMITS[category]

def compute_request_signature():
    """حساب توقيع فريد للطلب للكشف عن الطلبات المتماثلة"""
    components = [
        request.path,
        request.method,
        request.headers.get('User-Agent', ''),
        request.headers.get('Accept', ''),
        request.headers.get('Content-Type', '')
    ]
    return hashlib.md5(str(components).encode()).hexdigest()

def is_suspicious_request():
    """Check if the current request is suspicious based on various factors"""
    try:
        # Get client IP and request details
        ip = get_client_ip()
        path = request.path
        method = request.method
        user_agent = request.headers.get('User-Agent', '')
        content = ''
        
        # Check if it's a POST with form data
        if method == 'POST':
            if request.is_json:
                content = str(request.get_json())
            elif request.form:
                content = str(request.form)
        
        # Only block if there's clear evidence of abuse
        if content:
            lowered = content.lower()
            for word in BANNED_KEYWORDS:
                if word in lowered:
                    # Only block if abusive content is found
                    permanently_block_ip(ip)
                    log_attack(ip, path, method, f"Abusive content detected: {word}")
                    return True
        
        # Check request frequency - only block if clearly abusive
        current_time = time.time()
        ip_history = REQUEST_HISTORY.get(ip, [])
        
        # Clean old history (older than 60 seconds)
        ip_history = [t for t in ip_history if current_time - t < 60]
        
        # Add current request
        ip_history.append(current_time)
        REQUEST_HISTORY[ip] = ip_history
        
        # Count requests in the last second
        requests_last_second = sum(1 for t in ip_history if current_time - t < 1)
        
        # Only block if requests are clearly abusive (more than 10 per second)
        if requests_last_second > 10:
            # Increment suspicious score
            SUSPICIOUS_IPS[ip] = SUSPICIOUS_IPS.get(ip, 0) + requests_last_second
            
            # Only block if score is very high (clear abuse)
            if SUSPICIOUS_IPS.get(ip, 0) >= 100:  # Increased threshold
                permanently_block_ip(ip)
                log_attack(ip, path, method, f"Extreme rate abuse: {requests_last_second}/sec")
                return True
                
        return False
    except Exception as e:
        logging.error(f"Error in suspicious request detection: {str(e)}")
        return False

# ========================= الحماية ضد الهجمات =========================

def check_rate_limit(ip, path):
    """التحقق مما إذا كان IP قد تجاوز حدود الطلبات"""
    with request_lock:
        # IP المسموح بها معفاة من فحص الحد
        if ip in WHITELISTED_IPS:
            return True
            
        current_time = time.time()
        limit = get_rate_limit(path)
        
        # تنظيف الطوابع الزمنية القديمة (أقدم من دقيقة واحدة)
        cutoff_time = current_time - 60
        ip_request_timestamps[ip] = [t for t in ip_request_timestamps[ip] if t > cutoff_time]
        
        # إضافة الطابع الزمني الحالي
        ip_request_timestamps[ip].append(current_time)
        
        # حساب الطلبات في النافذة الزمنية
        count = len(ip_request_timestamps[ip])
        
        # تحديث آخر نشاط
        ip_last_activity[ip] = current_time
        
        # زيادة عداد المسار
        path_access_count[path] += 1
        
        # إضافة إلى سجل الطلبات العالمي لكشف DDOS
        global_request_timestamps.append(current_time)
        
        # التنظيف الدوري (بعد 1000 طلب)
        total_requests = sum(len(timestamps) for timestamps in ip_request_timestamps.values())
        if total_requests > 1000:
            cleanup_old_data()
            
        # التحقق من الوصول إلى عتبة حد الطلبات - only block if significantly exceeded
        if count > limit * 2:  # Only block if requests are double the limit
            # زيادة الحظر المؤقت حسب مقدار التجاوز
            duration = min(300 * (count / limit), 3600)  # من 5 دقائق إلى ساعة حسب شدة التجاوز
            temporarily_block_ip(ip, int(duration))
            return False
            
        return True

def detect_ddos_attack():
    """Detect potential DDoS attacks based on request patterns"""
    try:
        # Calculate request rates
        current_time = time.time()
        total_requests = sum(len(times) for times in REQUEST_HISTORY.values())
        active_ips = len(REQUEST_HISTORY)
        
        # Calculate requests in last second across all IPs
        requests_last_second = sum(
            sum(1 for t in times if current_time - t < 1)
            for times in REQUEST_HISTORY.values()
        )
        
        # If extremely high traffic, enable aggressive mode
        if requests_last_second > 100:  # Adjust threshold as needed
            logging.critical(f"Potential DDoS detected: {requests_last_second} requests/sec from {active_ips} IPs")
            
            # Emergency response: block all suspicious IPs
            for ip, score in list(SUSPICIOUS_IPS.items()):
                if score > 10:  # Lower threshold during attack
                    permanently_block_ip(ip)
                    
            return True
            
        return False
    except Exception as e:
        logging.error(f"Error in DDoS detection: {str(e)}")
        return False

def cleanup_old_data():
    """تنظيف البيانات القديمة"""
    with request_lock:
        current_time = time.time()
        cutoff_time = current_time - 60
        day_ago = current_time - 86400  # قبل يوم واحد
        
        # إزالة الطوابع الزمنية القديمة
        for ip in list(ip_request_timestamps.keys()):
            ip_request_timestamps[ip] = [t for t in ip_request_timestamps[ip] if t > cutoff_time]
            if not ip_request_timestamps[ip]:
                del ip_request_timestamps[ip]
        
        # إزالة IP المحظورة مؤقتًا التي انتهت صلاحيتها
        for ip in list(temporarily_blocked.keys()):
            if temporarily_blocked[ip] < current_time:
                del temporarily_blocked[ip]
                
        # إزالة سجلات النشاط القديمة
        for ip in list(ip_last_activity.keys()):
            if ip_last_activity[ip] < day_ago:
                del ip_last_activity[ip]
                if ip in ip_country_data:
                    del ip_country_data[ip]
                
        # إعادة تعيين عدادات الفشل في تسجيل الدخول القديمة
        for ip in list(failed_logins.keys()):
            if ip not in ip_request_timestamps or not ip_request_timestamps[ip]:
                del failed_logins[ip]

def temporarily_block_ip(ip, duration=300):
    """Block an IP address temporarily"""
    try:
        # Only block if not already blocked
        if ip not in temporarily_blocked:
            expiry = time.time() + duration
            
            # Use Redis if available
            if redis_client:
                redis_client.setex(f'blocked_ip:{ip}', duration, '1')
            
            # Also keep in local memory
            temporarily_blocked[ip] = expiry
            
            # Log the block with reason
            logging.warning(f"IP {ip} temporarily blocked for {duration} seconds due to rate limit violation")
            
            # Track in suspicious IPs
            SUSPICIOUS_IPS[ip] = SUSPICIOUS_IPS.get(ip, 0) + 5
    except Exception as e:
        logging.error(f"Error blocking IP {ip}: {str(e)}")

def permanently_block_ip(ip):
    """Permanently block an IP address"""
    try:
        # Only block if not already blocked
        if ip not in PERMANENT_BLACKLIST:
            # Use Redis if available
            if redis_client:
                redis_client.set(f'permanent_blocked_ip:{ip}', '1')
            
            # Add to permanent blacklist
            PERMANENT_BLACKLIST.add(ip)
            
            # Also set in memory just to be sure
            temporarily_blocked[ip] = float('inf')
            
            # Log the permanent block with reason
            logging.warning(f"IP {ip} permanently blocked for abusive behavior")
            
            # Save to persistent storage
            save_blacklist()
    except Exception as e:
        logging.error(f"Error permanently blocking IP {ip}: {str(e)}")

def whitelist_ip(ip):
    """إضافة IP إلى القائمة البيضاء"""
    with request_lock:
        WHITELISTED_IPS.add(ip)
        
        # إزالة من القائمة السوداء إذا كان موجودًا
        if ip in BLACKLISTED_IPS:
            BLACKLISTED_IPS.remove(ip)
            save_blacklist()
        
        # إزالة من الحظر المؤقت إذا كان موجودًا
        if ip in temporarily_blocked:
            del temporarily_blocked[ip]
        
        save_whitelist()
        logging.info(f"تمت إضافة IP {ip} إلى القائمة البيضاء")

def is_ip_blocked(ip):
    """التحقق مما إذا كان IP محظورًا (إما مؤقتًا أو دائمًا)"""
    # IP المسموح بها لا يتم حظرها أبدًا
    if ip in WHITELISTED_IPS:
        return False
        
    # التحقق من القائمة السوداء الدائمة
    if ip in BLACKLISTED_IPS:
        return True
    
    # التحقق من الحظر المؤقت
    current_time = time.time()
    if ip in temporarily_blocked and temporarily_blocked[ip] > current_time:
        return True
    
    return False

def record_login_failure(ip):
    """تسجيل فشل محاولة تسجيل الدخول"""
    with request_lock:
        failed_logins[ip] += 1
        
        # إذا تجاوز عتبة معينة، قم بحظر IP مؤقتًا
        if failed_logins[ip] >= 5:
            temporarily_block_ip(ip, 900)  # حظر لمدة 15 دقيقة بعد 5 محاولات فاشلة
            logging.warning(f"تم حظر IP {ip} مؤقتًا بعد {failed_logins[ip]} محاولات تسجيل دخول فاشلة")
            failed_logins[ip] = 0  # إعادة تعيين العداد

def record_login_success(ip):
    """تسجيل نجاح تسجيل الدخول"""
    with request_lock:
        # إعادة تعيين عداد الفشل
        if ip in failed_logins:
            del failed_logins[ip]

def log_attack(ip, path, method, details=None):
    """تسجيل معلومات الهجوم"""
    try:
        logging.warning(f"تم اكتشاف هجوم محتمل - IP: {ip}, Path: {path}, Method: {method}")
        with open('attack_log.json', 'a') as f:
            log_entry = {
                'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
                'ip': ip,
                'path': path,
                'method': method,
                'user_agent': request.headers.get('User-Agent', 'Unknown'),
                'details': details or {}
            }
            f.write(json.dumps(log_entry) + '\n')
    except Exception as e:
        logging.error(f"خطأ في تسجيل الهجوم: {e}")

# ========================= الميدلوير =========================

def validate_request():
    """التحقق من صحة طلب وارد ضد هجمات DOS/DDOS"""
    client_ip = get_client_ip()
    
    # تسجيل الطلب في السجل لأغراض التتبع
    logging.info(f"طلب من {client_ip}: {request.method} {request.path}")
    
    # التحقق من IP محظور
    if is_ip_blocked(client_ip):
        logging.warning(f"تم رفض الطلب من IP محظور: {client_ip}")
        return False
    
    # التحقق مما إذا كان الطلب مشبوهًا
    if is_suspicious_request():
        # تسجيل الطلب المشبوه
        log_attack(client_ip, request.path, request.method, {'suspicious': True})
        
        # حظر IP إذا كان طلبًا مشبوهًا على مسار حساس
        category = get_path_category(request.path)
        if category in ['login', 'sensitive']:
            temporarily_block_ip(client_ip)
            return False
    
    # الكشف عن هجمات DDOS
    # هذا يمكن أن يكون ثقيلًا، لذا نشغله بشكل دوري فقط (كل 10 طلبات)
    if sum(len(ts) for ts in ip_request_timestamps.values()) % 10 == 0:
        if detect_ddos_attack():
            # لا نحظر جميع الطلبات في حالة DDOS، بل نقوم فقط بمراقبة وحظر أسوأ المصادر
            pass
    
    # التحقق من حدود الطلبات
    if not check_rate_limit(client_ip, request.path):
        # تسجيل محاولة تجاوز الحد
        log_attack(client_ip, request.path, request.method, {'rate_limit': True})
        
        # معالجة خاصة لصفحات تسجيل الدخول
        if get_path_category(request.path) == 'login':
            record_login_failure(client_ip)
        
        return False
    
    return True

def security_middleware():
    """Apply security middleware to Flask app"""
    def decorator(app):
        @app.before_request
        def before_request():
            # Skip for static files
            if request.path.startswith('/static') or request.path.startswith('/assets'):
                return
                
            # Get client IP
            ip = get_client_ip()
            
            # Always allow localhost requests
            if ip in WHITELISTED_IPS:
                return None
                
            # Check if IP is blocked
            if is_ip_blocked(ip):
                # Get the path category to determine response
                if '/api/' in request.path:
                    # API request, return JSON
                    return jsonify({
                        'success': False,
                        'message': 'Your IP address has been blocked due to suspicious activity',
                        'error_code': 'IP_BLOCKED'
                    }), 403
                else:
                    # Browser request, redirect to block page
                    return redirect('/blocked.html')
            
            # Check for DDoS attacks
            if detect_ddos_attack():
                # Activate protection mode
                if random.random() < 0.5:  # Only let 50% of requests through during attack
                    return jsonify({
                        'success': False,
                        'message': 'Server is temporarily under high load',
                        'error_code': 'SERVER_BUSY'
                    }), 429
            
            # Check if this specific request is suspicious
            if is_suspicious_request():
                return jsonify({
                    'success': False,
                    'message': 'Request blocked due to suspicious behavior',
                    'error_code': 'SUSPICIOUS_ACTIVITY'
                }), 403
            
            # Apply regular rate limits based on path
            path_category = get_path_category(request.path)
            rate_limit = get_rate_limit(path_category)
            
            if rate_limit and not check_rate_limit(ip, path_category):
                return jsonify({
                    'success': False,
                    'message': 'Rate limit exceeded. Please try again later.',
                    'rate_limited': True
                }), 429
        
        # Schedule regular cleanup
        def schedule_cleanup():
            def cleanup_job():
                while True:
                    cleanup_old_data()
                    time.sleep(60)  # Run every minute
            
            cleanup_thread = threading.Thread(target=cleanup_job, daemon=True)
            cleanup_thread.start()
        
        # Start cleanup thread
        schedule_cleanup()
        
        return app
    
    return decorator

def setup_security_endpoints(app):
    """إعداد نقاط نهاية إدارة الأمان"""
    
    # استخدام Blueprint للتنظيم
    security_bp = Blueprint('security', __name__)
    
    @security_bp.route('/api/admin/security/blocked-ips', methods=['GET'])
    def get_blocked_ips():
        """الحصول على قائمة IP المحظورة"""
        # يجب حماية نقطة النهاية هذه بالمصادقة
        admin_key = request.headers.get('X-Admin-Key')
        if not admin_key or admin_key != os.environ.get('ADMIN_API_KEY', 'admin_secret_key'):
            abort(403)
        
        # حساب الوقت المتبقي للحظر المؤقت
        current_time = time.time()
        temp_blocks = {
            ip: {
                'expiry': expiry,
                'remaining': int(expiry - current_time)
            }
            for ip, expiry in temporarily_blocked.items()
            if expiry > current_time
        }
            
        return jsonify({
            'success': True,
            'permanent': list(BLACKLISTED_IPS),
            'temporary': temp_blocks,
            'whitelist': list(WHITELISTED_IPS)
        })
    
    @security_bp.route('/api/admin/security/block-ip/<ip>', methods=['POST'])
    def block_ip(ip):
        """حظر IP محدد بشكل دائم"""
        # يجب حماية نقطة النهاية هذه بالمصادقة
        admin_key = request.headers.get('X-Admin-Key')
        if not admin_key or admin_key != os.environ.get('ADMIN_API_KEY', 'admin_secret_key'):
            abort(403)
        
        if not is_valid_ip(ip):
            return jsonify({
                'success': False,
                'message': 'عنوان IP غير صالح'
            }), 400
            
        permanently_block_ip(ip)
        return jsonify({
            'success': True,
            'message': f'تم حظر IP {ip} بشكل دائم'
        })
    
    @security_bp.route('/api/admin/security/unblock-ip/<ip>', methods=['POST'])
    def unblock_ip(ip):
        """إلغاء حظر IP محدد"""
        # يجب حماية نقطة النهاية هذه بالمصادقة
        admin_key = request.headers.get('X-Admin-Key')
        if not admin_key or admin_key != os.environ.get('ADMIN_API_KEY', 'admin_secret_key'):
            abort(403)
        
        if not is_valid_ip(ip):
            return jsonify({
                'success': False,
                'message': 'عنوان IP غير صالح'
            }), 400
            
        if ip in BLACKLISTED_IPS:
            BLACKLISTED_IPS.remove(ip)
            save_blacklist()
            
        if ip in temporarily_blocked:
            del temporarily_blocked[ip]
            
        return jsonify({
            'success': True, 
            'message': f'تم إلغاء حظر IP {ip}'
        })
    
    @security_bp.route('/api/admin/security/whitelist/<ip>', methods=['POST'])
    def add_to_whitelist(ip):
        """إضافة IP إلى القائمة البيضاء"""
        # يجب حماية نقطة النهاية هذه بالمصادقة
        admin_key = request.headers.get('X-Admin-Key')
        if not admin_key or admin_key != os.environ.get('ADMIN_API_KEY', 'admin_secret_key'):
            abort(403)
        
        if not is_valid_ip(ip):
            return jsonify({
                'success': False,
                'message': 'عنوان IP غير صالح'
            }), 400
            
        whitelist_ip(ip)
            
        return jsonify({
            'success': True,
            'message': f'تمت إضافة IP {ip} إلى القائمة البيضاء'
        })
    
    @security_bp.route('/api/admin/security/check-ip/<ip>', methods=['GET'])
    def check_ip(ip):
        """التحقق من حالة IP معين"""
        # يجب حماية نقطة النهاية هذه بالمصادقة
        admin_key = request.headers.get('X-Admin-Key') 
        if not admin_key or admin_key != os.environ.get('ADMIN_API_KEY', 'admin_secret_key'):
            abort(403)
        
        if not is_valid_ip(ip):
            return jsonify({
                'success': False,
                'message': 'عنوان IP غير صالح'
            }), 400
            
        current_time = time.time()
        
        # حساب الوقت المتبقي للحظر المؤقت
        remaining_block_time = 0
        if ip in temporarily_blocked and temporarily_blocked[ip] > current_time:
            remaining_block_time = int(temporarily_blocked[ip] - current_time)
            
        # حساب نشاط الطلبات الحديثة
        recent_requests = len([t for t in ip_request_timestamps.get(ip, [])
                            if t > current_time - 60])  # آخر دقيقة
            
        return jsonify({
            'success': True,
            'ip': ip,
            'status': {
                'blacklisted': ip in BLACKLISTED_IPS,
                'whitelisted': ip in WHITELISTED_IPS,
                'temporarily_blocked': ip in temporarily_blocked and temporarily_blocked[ip] > current_time,
                'remaining_block_time': remaining_block_time,
                'recent_requests': recent_requests,
                'failed_logins': failed_logins.get(ip, 0),
                'last_activity': ip_last_activity.get(ip, 0)
            }
        })
    
    @security_bp.route('/api/admin/security/stats', methods=['GET'])
    def security_stats():
        """الحصول على إحصاءات الأمان"""
        # يجب حماية نقطة النهاية هذه بالمصادقة
        admin_key = request.headers.get('X-Admin-Key')
        if not admin_key or admin_key != os.environ.get('ADMIN_API_KEY', 'admin_secret_key'):
            abort(403)
            
        current_time = time.time()
        minute_ago = current_time - 60
        hour_ago = current_time - 3600
        day_ago = current_time - 86400
        
        # عدد الطلبات في النطاقات الزمنية المختلفة
        requests_last_minute = sum(1 for t in global_request_timestamps if t > minute_ago)
        
        # عدد IP النشطة
        active_ips_minute = sum(1 for ip, timestamps in ip_request_timestamps.items()
                             if any(t > minute_ago for t in timestamps))
        
 # حساب عدد المحظورين
        temp_blocked_count = sum(1 for expiry in temporarily_blocked.values() if expiry > current_time)
        
        # الحصول على أكثر المسارات طلبًا
        top_paths = sorted(
            [(path, count) for path, count in path_access_count.items()],
            key=lambda x: x[1],
            reverse=True
        )[:10]
        
        return jsonify({
            'success': True,
            'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
            'requests': {
                'last_minute': requests_last_minute,
                'rate_per_second': requests_last_minute / 60
            },
            'ips': {
                'active_last_minute': active_ips_minute,
                'blacklisted': len(BLACKLISTED_IPS),
                'whitelisted': len(WHITELISTED_IPS),
                'temporarily_blocked': temp_blocked_count
            },
            'top_paths': dict(top_paths),
            'failed_logins': sum(failed_logins.values())
        })
    
    @security_bp.route('/api/admin/security/reset-failed-logins/<ip>', methods=['POST'])
    def reset_failed_logins(ip):
        """إعادة تعيين عداد تسجيل الدخول الفاشل لـ IP معين"""
        # يجب حماية نقطة النهاية هذه بالمصادقة
        admin_key = request.headers.get('X-Admin-Key')
        if not admin_key or admin_key != os.environ.get('ADMIN_API_KEY', 'admin_secret_key'):
            abort(403)
        
        if not is_valid_ip(ip):
            return jsonify({
                'success': False,
                'message': 'عنوان IP غير صالح'
            }), 400
        
        with request_lock:
            if ip in failed_logins:
                old_value = failed_logins[ip]
                del failed_logins[ip]
                return jsonify({
                    'success': True,
                    'message': f'تمت إعادة تعيين عداد تسجيل الدخول الفاشل من {old_value} إلى 0'
                })
            else:
                return jsonify({
                    'success': False,
                    'message': 'لا توجد محاولات تسجيل دخول فاشلة لهذا IP'
                }), 404
    
    # تسجيل البلوبرنت
    app.register_blueprint(security_bp)
    
    return app 