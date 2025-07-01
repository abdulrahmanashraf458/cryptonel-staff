
from flask import request
import logging
import requests
import random

# IP info tokens (replace with your actual tokens if needed)
ipinfo_tokens = [
    '5f9adf4c632001',
    'ec2560bf0ec1b2',
    'b5ea70b8b192d3',
    '5cd1b4773a35c2'
]

def get_ip_info(ip_address):
    """
    Get IP information from IPinfo service using an appropriate token
    """
    if not ipinfo_tokens:
        return None
    
    # Use a random token from the list to distribute usage
    token = random.choice(ipinfo_tokens)
    
    try:
        response = requests.get(f"https://ipinfo.io/{ip_address}?token={token}")
        if response.status_code == 200:
            return response.json()
        else:
            logging.warning(f"IPinfo query failed: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        logging.error(f"Error in IPinfo query: {e}")
        return None

def get_real_client_ip():
    """
    Get the client's real IP address using various sources and IPinfo service
    """
    # Get IP from different headers
    ip_candidates = []
    
    # Try to get IP from different headers in priority order
    if request.headers.get('X-Forwarded-For'):
        forwarded_ips = request.headers.get('X-Forwarded-For').split(',')
        if forwarded_ips:
            ip_candidates.extend([ip.strip() for ip in forwarded_ips])
    
    if request.headers.get('X-Real-IP'):
        ip_candidates.append(request.headers.get('X-Real-IP').strip())
    
    if request.headers.get('CF-Connecting-IP'):  # Cloudflare
        ip_candidates.append(request.headers.get('CF-Connecting-IP').strip())
    
    # Add current request IP
    if request.remote_addr:
        ip_candidates.append(request.remote_addr)
    
    # Remove private and duplicate IPs
    filtered_ips = []
    private_ip_prefixes = ['10.', '172.16.', '172.17.', '172.18.', '172.19.', '172.20.', 
                          '172.21.', '172.22.', '172.23.', '172.24.', '172.25.', '172.26.', 
                          '172.27.', '172.28.', '172.29.', '172.30.', '172.31.', '192.168.']
    
    for ip in ip_candidates:
        if ip and not any(ip.startswith(prefix) for prefix in private_ip_prefixes) and ip != '127.0.0.1' and ip != 'localhost':
            filtered_ips.append(ip)
    
    # If we didn't find any public IP, use the first IP we got
    if not filtered_ips and ip_candidates:
        return ip_candidates[0]
    elif not filtered_ips:
        return request.remote_addr
    
    # Use the first public IP we found and verify with IPinfo
    real_ip = filtered_ips[0]
    
    try:
        ip_info = get_ip_info(real_ip)
        if ip_info and 'ip' in ip_info:
            return ip_info['ip']  # Use IP verified through IPinfo
    except Exception as e:
        logging.error(f"Error verifying IP through IPinfo: {e}")
    
    return real_ip
