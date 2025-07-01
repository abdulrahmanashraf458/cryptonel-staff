import jwt
import time
import logging
from datetime import datetime, timedelta, UTC
import os
import threading

# إعدادات JWT
JWT_SECRET = os.environ.get('JWT_SECRET', "ClyneDashboardSecretKey2025!@#")  # استخدام متغير بيئي إذا كان متاحًا
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION = 24 * 60 * 60  # 24 ساعة بالثواني
JWT_REFRESH_EXPIRATION = 7 * 24 * 60 * 60  # 7 أيام بالثواني للتجديد

# تخزين التوكنات المنتهية/الملغاة
TOKEN_BLACKLIST = set()
TOKEN_CACHE = {}  # تخزين مؤقت للتحقق من صحة التوكن
TOKEN_CACHE_TTL = 5 * 60  # 5 دقائق بالثواني

# قفل للمزامنة
token_lock = threading.RLock()

def create_token(user_id, discord_id, username, role, **kwargs):
    """
    إنشاء JWT توكن جديد للمستخدم
    """
    now = datetime.now(UTC)
    
    # إعداد البيانات الأساسية
    payload = {
        'sub': user_id,
        'discord_id': discord_id,
        'username': username,
        'role': role,
        'iat': now,  # Issued At Time
        'exp': now + timedelta(seconds=JWT_EXPIRATION),  # Expiration Time
        'jti': f"{user_id}-{int(time.time())}"  # JWT ID: فريد لكل توكن
    }
    
    # إضافة أي بيانات إضافية
    for key, value in kwargs.items():
        if key not in payload:
            payload[key] = value
    
    # توقيع التوكن
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    
    return token, payload

def create_refresh_token(user_id, **kwargs):
    """
    إنشاء توكن تجديد للمستخدم
    """
    now = datetime.now(UTC)
    
    # إعداد البيانات الأساسية
    payload = {
        'sub': user_id,
        'type': 'refresh',
        'iat': now,
        'exp': now + timedelta(seconds=JWT_REFRESH_EXPIRATION),
        'jti': f"refresh-{user_id}-{int(time.time())}"
    }
    
    # إضافة أي بيانات إضافية
    for key, value in kwargs.items():
        if key not in payload:
            payload[key] = value
    
    # توقيع التوكن
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    
    return token, payload

def verify_token(token):
    """
    التحقق من صحة التوكن وإرجاع محتواه
    """
    with token_lock:
        # التحقق مما إذا كان التوكن في القائمة السوداء
        if token in TOKEN_BLACKLIST:
            return None
            
        # التحقق مما إذا كان التوكن في التخزين المؤقت وصالح
        current_time = time.time()
        if token in TOKEN_CACHE:
            cache_data = TOKEN_CACHE[token]
            # التحقق من صلاحية البيانات المخزنة مؤقتًا
            if cache_data["expires"] > current_time:
                return cache_data["data"]
        
        # التوكن ليس في التخزين المؤقت أو منتهي الصلاحية، تحقق منه
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            
            # تخزين في التخزين المؤقت
            TOKEN_CACHE[token] = {
                "data": payload,
                "expires": current_time + TOKEN_CACHE_TTL
            }
            
            return payload
        except jwt.ExpiredSignatureError:
            logging.warning(f"Expired JWT token received")
            return None
        except jwt.InvalidTokenError as e:
            logging.warning(f"Invalid JWT token: {str(e)}")
            return None

def invalidate_token(token):
    """
    إبطال توكن عن طريق إضافته إلى القائمة السوداء
    """
    with token_lock:
        TOKEN_BLACKLIST.add(token)
        
        # إزالة من التخزين المؤقت إذا كان موجودًا
        if token in TOKEN_CACHE:
            del TOKEN_CACHE[token]
            
        # قم بتنظيف القائمة السوداء إذا كانت كبيرة جدًا
        if len(TOKEN_BLACKLIST) > 1000:
            _cleanup_blacklist()
            
def _cleanup_blacklist():
    """
    تنظيف التوكنات القديمة من القائمة السوداء (داخلي)
    """
    # معالجة تنظيف القائمة السوداء هنا
    # في تطبيق إنتاجي كامل، يجب استخدام قاعدة بيانات للقائمة السوداء
    # ومعرفة متى تنتهي صلاحية كل توكن لإزالته
    pass
            
def cleanup_token_cache():
    """
    تنظيف التخزين المؤقت للتوكن
    """
    with token_lock:
        current_time = time.time()
        tokens_to_remove = [token for token, data in TOKEN_CACHE.items() 
                          if data["expires"] <= current_time]
        
        for token in tokens_to_remove:
            del TOKEN_CACHE[token]

def is_token_about_to_expire(payload, threshold_minutes=15):
    """
    التحقق مما إذا كان التوكن على وشك الانتهاء
    """
    if not payload or 'exp' not in payload:
        return True
        
    try:
        token_expiry = datetime.fromtimestamp(payload['exp'], tz=UTC)
        time_until_expiry = token_expiry - datetime.now(UTC)
        
        # إذا كان التوكن سينتهي في أقل من العتبة المحددة، فهو على وشك الانتهاء
        needs_refresh = time_until_expiry < timedelta(minutes=threshold_minutes)
        return needs_refresh
    except:
        return True  # في حالة الشك، أرجع أنه على وشك الانتهاء

# تشغيل تنظيف دوري للتخزين المؤقت
def start_token_cleanup_scheduler():
    """
    بدء مجدول لتنظيف التخزين المؤقت للتوكن
    """
    def cleanup_task():
        cleanup_token_cache()
        # جدولة المهمة التالية
        threading.Timer(600, cleanup_task).start()  # كل 10 دقائق
        
    # تشغيل المجدول
    cleanup_task() 