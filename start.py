import os
import subprocess
import sys
import time
import configparser
import webbrowser
import requests
import threading
import socket
import importlib.util
from datetime import datetime
import shutil
import inspect

def print_header(text):
    """Print a styled header text"""
    print("\n" + "=" * 50)
    print(f"  {text}")
    print("=" * 50 + "\n")

def log(message):
    """Print a message with timestamp"""
    print(f"[{time.strftime('%H:%M:%S')}] {message}")

def print_status(text, status="success"):
    """Print a status message with appropriate color"""
    if status == "success":
        color = "\033[92m"  # Green
    elif status == "warning":
        color = "\033[93m"  # Yellow
    elif status == "error":
        color = "\033[91m"  # Red
    elif status == "info":
        color = "\033[94m"  # Blue
    else:
        color = "\033[0m"  # Default
    
    end_color = "\033[0m"
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"[{timestamp}] {color}{text}{end_color}")

def run_command(command, cwd=None):
    """Run a command and return its success status"""
    try:
        subprocess.run(command, check=True, cwd=cwd)
        return True
    except Exception as e:
        log(f"Error running command: {e}")
        return False

def check_npm_installed():
    """Check if npm is installed and accessible"""
    npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
    
    try:
        # Try with npm.cmd for Windows
        subprocess.run([npm_cmd, "--version"], 
                      stdout=subprocess.DEVNULL, 
                      stderr=subprocess.DEVNULL, 
                      check=True)
        return True
    except:
        # If failed, try with global npm path on Windows
        if sys.platform == "win32":
            try:
                # Check common npm locations on Windows
                possible_paths = [
                    r"C:\Program Files\nodejs\npm.cmd",
                    r"C:\Program Files (x86)\nodejs\npm.cmd",
                    os.path.expanduser("~\\AppData\\Roaming\\npm\\npm.cmd")
                ]
                
                for path in possible_paths:
                    if os.path.exists(path):
                        log(f"Found npm at {path}")
                        return True
            except:
                pass
        return False

def show_npm_installation_instructions():
    """Show instructions for installing Node.js and npm"""
    print_header("Node.js and npm Installation Instructions")
    log("You need to install Node.js and npm to run this application.")
    log("Please follow these steps:")
    log("")
    log("1. Download Node.js from https://nodejs.org/")
    log("2. Run the installer and follow the installation instructions")
    log("3. Restart your computer after installation")
    log("4. Run this script again")
    log("")
    log("After installation, you should be able to run 'npm --version' in your terminal")

def check_port_in_use(port):
    """Check if a port is already in use"""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) == 0

def wait_for_port_to_be_available(port, timeout=10):
    """Wait for a port to become available"""
    start_time = time.time()
    while check_port_in_use(port):
        if time.time() - start_time > timeout:
            return False
        print_status(f"Port {port} is in use. Waiting for it to be available...", "warning")
        time.sleep(1)
    return True

# دالة جديدة للتحقق من وجود ودمج أنظمة ddos و memory_manager
def check_and_integrate_systems():
    """Check for ddos and memory_manager systems and integrate them"""
    result = {
        "ddos": False,
        "memory_manager": False
    }
    
    # Check for DDOS protection system - first check new ddos_protection
    if os.path.exists("backend/crn_wallet/ddos_protection"):
        print_status("New DDOS Protection system found...", "info")
        try:
            # Create config directory if it doesn't exist
            config_dir = os.path.join("backend", "config")
            if not os.path.exists(config_dir):
                os.makedirs(config_dir)
                
            # Create ddos.yaml config file if it doesn't exist
            config_path = os.path.join(config_dir, "ddos.yaml")
            if not os.path.exists(config_path):
                with open(config_path, "w") as f:
                    f.write("""# DDOS Protection Configuration
enabled: true
bypass_on_error: true
integration_mode: middleware

# Detector configuration with Cloudflare integration
detector:
  whitelist:
    - 127.0.0.1
    - ::1
    - 10.0.0.0/8
    - 172.16.0.0/12
    - 192.168.0.0/16
    - 104.16.0.0/12  # Cloudflare IPs
    - 104.24.0.0/14  # Cloudflare IPs
    - 172.64.0.0/13  # Cloudflare IPs
""")
            
            # Create storage directory if it doesn't exist
            storage_dir = os.path.join("backend", "crn_wallet", "ddos_protection", "storage")
            if not os.path.exists(storage_dir):
                os.makedirs(storage_dir)

            # Create empty JSON storage files if they don't exist
            storage_files = ["banned_ips.json", "behavior_tracking.json", "challenge_tokens.json", 
                            "geo_blocks.json", "rate_limits.json", "trusted_ips.json"]
            
            for file in storage_files:
                file_path = os.path.join(storage_dir, file)
                if not os.path.exists(file_path):
                    with open(file_path, "w") as f:
                        f.write("{}")
            
            print_status("New DDOS Protection system configured successfully!", "success")
            result["ddos"] = True
        except Exception as e:
            print_status(f"Error integrating new DDOS system: {e}", "error")
    # Check for old DDOS system as fallback
    elif os.path.exists("ddos"):
        print_status("Legacy DDOS Protection system found...", "info")
        try:
            # Copy DDOS system files to appropriate folder
            ddos_module_path = os.path.join("backend", "crn_wallet", "ddos_protection")
            
            # Create directory if it doesn't exist
            if not os.path.exists(ddos_module_path):
                os.makedirs(ddos_module_path)
            
            # Copy all DDOS module files
            for item in os.listdir("ddos"):
                src_path = os.path.join("ddos", item)
                dst_path = os.path.join(ddos_module_path, item)
                if os.path.isfile(src_path):
                    shutil.copy2(src_path, dst_path)
                elif os.path.isdir(src_path):
                    shutil.copytree(src_path, dst_path, dirs_exist_ok=True)
            
            # Create __init__.py if it doesn't exist
            init_file = os.path.join(ddos_module_path, "__init__.py")
            if not os.path.exists(init_file):
                with open(init_file, "w") as f:
                    f.write("# DDOS Protection Module\n")
                    f.write("def initialize():\n")
                    f.write("    print('DDOS Protection system initialized')\n")
                    f.write("    return True\n")
            
            print_status("Legacy DDOS Protection system integrated successfully!", "success")
            result["ddos"] = True
        except Exception as e:
            print_status(f"Error integrating legacy DDOS system: {e}", "error")
    
    # Check for Memory Manager system
    if os.path.exists("memory_manager"):
        print_status("Memory Manager system found...", "info")
        try:
            # Copy Memory Manager system files to appropriate folder
            mm_module_path = os.path.join("backend", "crn_wallet", "memory_manager")
            
            # Create directory if it doesn't exist
            if not os.path.exists(mm_module_path):
                os.makedirs(mm_module_path)
            
            # Copy all Memory Manager module files
            for item in os.listdir("memory_manager"):
                src_path = os.path.join("memory_manager", item)
                dst_path = os.path.join(mm_module_path, item)
                if os.path.isfile(src_path):
                    shutil.copy2(src_path, dst_path)
                elif os.path.isdir(src_path):
                    shutil.copytree(src_path, dst_path, dirs_exist_ok=True)
            
            # Create __init__.py if it doesn't exist
            init_file = os.path.join(mm_module_path, "__init__.py")
            if not os.path.exists(init_file):
                with open(init_file, "w") as f:
                    f.write("# Memory Management Module\n")
                    f.write("def initialize():\n")
                    f.write("    print('Memory Manager system initialized')\n")
                    f.write("    return True\n")
            
            print_status("Memory Manager system integrated successfully!", "success")
            result["memory_manager"] = True
        except Exception as e:
            print_status(f"Error integrating Memory Manager system: {e}", "error")
    
    # If neither system was found
    if not result["ddos"] and not result["memory_manager"]:
        print_status("No DDOS or Memory Manager systems found. Make sure the directories exist in the root folder.", "warning")
    
    return result

def build_frontend():
    """Build the frontend for production"""
    print_header("Building Frontend")
    
    # Check if npm is installed
    if not check_npm_installed():
        log("Error: npm is not installed or not in PATH")
        show_npm_installation_instructions()
        return False
    
    # Check if package.json exists
    if not os.path.exists("package.json"):
        log("Error: package.json not found")
        return False
    
    # Install dependencies if needed
    if not os.path.exists("node_modules"):
        log("Installing dependencies...")
        
        # For Windows, explicitly use npm.cmd
        npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
        
        if not run_command([npm_cmd, "install"]):
            log("Error installing dependencies")
            return False
    
    # Build frontend
    log("Building frontend...")
    
    # For Windows, explicitly use npm.cmd
    npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
    
    if not run_command([npm_cmd, "run", "build"]):
        log("Error building frontend")
        return False
    
    # Check if dist directory was created
    if not os.path.exists("dist"):
        log("Error: Build directory (dist) not found after build")
        return False
    
    log("Frontend built successfully!")
    return True

def test_mongodb_connection(mongo_uri):
    """Test the MongoDB connection"""
    print_status("Testing MongoDB connection...", "info")
    try:
        # Try to import pymongo
        import pymongo
        
        # Extract just the MongoDB server URI (without database name)
        uri_parts = mongo_uri.split("/")
        server_uri = "/".join(uri_parts[:-1]) + "/"
        if server_uri.endswith("//"):
            server_uri = server_uri[:-1]
        
        # Connect to MongoDB server
        client = pymongo.MongoClient(server_uri, serverSelectionTimeoutMS=5000)
        client.server_info()  # This will raise an exception if cannot connect
        
        # Check if the required databases exist
        databases = client.list_database_names()
        required_dbs = ["cryptonel_wallet", "cryptonel_mining"]
        missing_dbs = [db for db in required_dbs if db not in databases]
        
        if missing_dbs:
            print_status(f"Warning: The following required databases are missing: {', '.join(missing_dbs)}", "warning")
            return False
        
        # Check if the users collection exists in cryptonel_wallet
        if "users" not in client["cryptonel_wallet"].list_collection_names():
            print_status("Warning: The 'users' collection is missing in 'cryptonel_wallet' database", "warning")
            return False
            
        print_status("MongoDB connection successful", "success")
        return True
    except ImportError:
        print_status("Python module 'pymongo' not installed. Cannot test MongoDB connection.", "error")
        return False
    except Exception as e:
        print_status(f"Failed to connect to MongoDB: {e}", "error")
        return False

def update_config(env):
    """Update config.ini to set the environment"""
    config = configparser.ConfigParser()
    config_path = os.path.join("backend", "config.ini")
    
    # Read existing config
    if os.path.exists(config_path):
        config.read(config_path)
    
    # Ensure sections exist
    if not config.has_section('Server'):
        config.add_section('Server')
    
    if not config.has_section('Database'):
        config.add_section('Database')
    
    # Add a new section for integrated systems
    if not config.has_section('IntegratedSystems'):
        config.add_section('IntegratedSystems')
        
    # Get MongoDB URI
    mongo_uri = config.get('Database', 'MongoURI', fallback='mongodb+srv://abdulrahman:GmsPvw6tspNufsYE@cluster0.pujvbqx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
    
    # Update environment
    config.set('Server', 'Environment', env)
    
    # Backend server ports
    backend_port = 5000
    
    # Get backend port from config or use default
    if env == 'development':
        backend_port = int(config.get('Server', 'DevelopmentPort', fallback='5000'))
    else:
        backend_port = int(config.get('Server', 'ProductionPort', fallback='5000'))

    # Check if port is available
    if check_port_in_use(backend_port):
        print_status(f"Warning: Port {backend_port} is already in use. Backend might not start correctly.", "warning")
    
    # Check and integrate DDOS and Memory Manager systems
    systems_result = check_and_integrate_systems()
    
    # Update config with integration results
    config.set('IntegratedSystems', 'UseDDOSProtection', str(systems_result["ddos"]))
    config.set('IntegratedSystems', 'UseMemoryManager', str(systems_result["memory_manager"]))
    
    # Write back to file
    with open(config_path, 'w') as configfile:
        config.write(configfile)
    
    print_status(f"Config updated to {env} environment with integrated systems", "success")
    
    # Test MongoDB connection
    test_mongodb_connection(mongo_uri)
    
    return backend_port

def create_helper_files():
    """Create necessary helper files for the system to work properly"""
    print_status("Creating helper files...", "info")
    
    # Create helper.py file with IP detection functions
    helper_path = os.path.join("backend", "crn_wallet", "helper.py")
    
    with open(helper_path, "w", encoding="utf-8") as f:
        f.write("""
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
    \"\"\"
    Get IP information from IPinfo service using an appropriate token
    \"\"\"
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
    \"\"\"
    Get the client's real IP address using various sources and IPinfo service
    \"\"\"
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
""")
    
    print_status("Created helper.py with IP detection functions", "success")
    return True

def start_backend():
    """Start the backend Flask server"""
    print_header("Starting Backend Server")
    
    # Server script path with absolute path
    current_dir = os.getcwd()
    server_path = os.path.abspath(os.path.join(current_dir, "backend", "crn_wallet", "server.py"))
    
    # Print path for debugging
    print(f"Absolute server path: {server_path}")
    
    # Check if file exists
    if not os.path.exists(server_path):
        log(f"Error: Server file not found at {server_path}")
        return None
    
    # Create helper files
    create_helper_files()
    
    # Create initializer.py to initialize DDOS and memory_manager systems
    try:
        initializer_path = os.path.join("backend", "crn_wallet", "initializer.py")
        
        with open(initializer_path, "w") as f:
            f.write("""
# This file initializes integrated protection systems
import os
import sys
import logging
import importlib
import configparser
import inspect

def initialize_protection_systems():
    print("Initializing protection systems...")
    try:
        # Read config to check which systems to initialize
        config = configparser.ConfigParser()
        config_path = os.path.join("backend", "config.ini")
        
        if os.path.exists(config_path):
            config.read(config_path)
            use_ddos = config.getboolean('IntegratedSystems', 'UseDDOSProtection', fallback=False)
            use_memory = config.getboolean('IntegratedSystems', 'UseMemoryManager', fallback=False)
            
            # Initialize DDOS protection if enabled
            if use_ddos:
                try:
                    # First try to import the module directly
                    from backend.crn_wallet.ddos_protection import initialize
                    print("DDOS Protection system found, initializing...")
                    initialize()
                    print("DDOS Protection system initialized successfully!")
                except ImportError:
                    # If no initialize function, try to find any Python files and import them
                    ddos_path = os.path.join("backend", "crn_wallet", "ddos_protection")
                    print(f"Scanning {ddos_path} for Python files...")
                    
                    if os.path.exists(ddos_path):
                        py_files = [f for f in os.listdir(ddos_path) if f.endswith('.py') and f != '__init__.py']
                        print(f"Found Python files: {py_files}")
                        
                        # Import each Python file
                        for py_file in py_files:
                            module_name = py_file[:-3]  # Remove .py extension
                            try:
                                module = importlib.import_module(f"backend.crn_wallet.ddos_protection.{module_name}")
                                print(f"Imported {module_name} from DDOS protection system")
                                
                                # Try to find initialization functions
                                for name, obj in inspect.getmembers(module):
                                    if name.lower() in ('initialize', 'init', 'start', 'setup') and callable(obj):
                                        print(f"Found initialization function {name} in {module_name}")
                                        obj()
                                        print(f"Called {name}() successfully")
                            except Exception as e:
                                print(f"Error importing {module_name}: {e}")
                    else:
                        print(f"DDOS protection directory does not exist: {ddos_path}")
                except Exception as e:
                    print(f"Error initializing DDOS Protection: {e}")
            
            # Initialize Memory Manager if enabled
            if use_memory:
                try:
                    # First try to import the module directly
                    from backend.crn_wallet.memory_manager import initialize
                    print("Memory Manager system found, initializing...")
                    initialize()
                    print("Memory Manager system initialized successfully!")
                except ImportError:
                    # If no initialize function, try to find any Python files and import them
                    mm_path = os.path.join("backend", "crn_wallet", "memory_manager")
                    print(f"Scanning {mm_path} for Python files...")
                    
                    if os.path.exists(mm_path):
                        py_files = [f for f in os.listdir(mm_path) if f.endswith('.py') and f != '__init__.py']
                        print(f"Found Python files: {py_files}")
                        
                        # Import each Python file
                        for py_file in py_files:
                            module_name = py_file[:-3]  # Remove .py extension
                            try:
                                module = importlib.import_module(f"backend.crn_wallet.memory_manager.{module_name}")
                                print(f"Imported {module_name} from Memory Manager system")
                                
                                # Try to find initialization functions
                                for name, obj in inspect.getmembers(module):
                                    if name.lower() in ('initialize', 'init', 'start', 'setup') and callable(obj):
                                        print(f"Found initialization function {name} in {module_name}")
                                        obj()
                                        print(f"Called {name}() successfully")
                            except Exception as e:
                                print(f"Error importing {module_name}: {e}")
                    else:
                        print(f"Memory Manager directory does not exist: {mm_path}")
                except Exception as e:
                    print(f"Error initializing Memory Manager: {e}")
                    
        else:
            print("Config file not found. Protection systems will not be initialized.")
            
    except Exception as e:
        print(f"Error in initializer: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    initialize_protection_systems()
""")
        
        log("Created initializer for protection systems")
        
        # Modify server.py to add initializer import and fix missing function
        try:
            with open(server_path, "r", encoding="utf-8") as f:
                server_content = f.read()
            
            # Check for the get_real_client_ip function
            if "def get_real_client_ip()" not in server_content:
                # Add import for helper module
                import_section_end = server_content.find("# Add the current directory to path")
                if import_section_end == -1:
                    import_section_end = server_content.find("app = Flask")
                
                # Add helper import at the top of imports
                if "from backend.crn_wallet.helper import get_real_client_ip, get_ip_info" not in server_content:
                    updated_content = server_content[:import_section_end] + "\n# Import helper functions\ntry:\n    from backend.crn_wallet.helper import get_real_client_ip, get_ip_info\nexcept ImportError:\n    # Fallback if module path doesn't work\n    try:\n        sys.path.append(os.path.dirname(os.path.abspath(__file__)))\n        from helper import get_real_client_ip, get_ip_info\n    except ImportError as e:\n        print(f'Error importing helper functions: {e}')\n        # Define emergency fallback function\n        def get_real_client_ip():\n            return request.remote_addr\n        def get_ip_info(ip):\n            return {'ip': ip}\n\n" + server_content[import_section_end:]
                    
                    server_content = updated_content
            
            # Check if import already exists for initializer
            if "from backend.crn_wallet.initializer import initialize_protection_systems" not in server_content:
                import_section_end = server_content.find("# Add the current directory to path")
                if import_section_end == -1:
                    import_section_end = server_content.find("app = Flask")
                
                # Add initializer import
                updated_content = server_content[:import_section_end] + "\n# Import protection systems initializer\ntry:\n    from backend.crn_wallet.initializer import initialize_protection_systems\n    initialize_protection_systems()\n    print('Protection systems initialized successfully!')\nexcept Exception as e:\n    print(f'Error initializing protection systems: {e}')\n\n" + server_content[import_section_end:]
                
                with open(server_path, "w", encoding="utf-8") as f:
                    f.write(updated_content)
                
                log("Updated server.py to initialize protection systems and fixed missing functions")
            else:
                # Just update the content if imports were already there but function is missing
                with open(server_path, "w", encoding="utf-8") as f:
                    f.write(server_content)
        except Exception as e:
            log(f"Error updating server.py: {e}")
    except Exception as e:
        log(f"Error creating initializer: {e}")
    
    # Start backend
    log("Starting backend server...")
    
    # Command to run
    command = ["python", server_path]
    
    # Run server in background
    try:
        process = subprocess.Popen(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            universal_newlines=True
        )
        
        # Read output
        def read_output():
            for line in process.stdout:
                print(f"[Backend] {line.strip()}")
        
        # Start output reader in separate thread
        threading.Thread(target=read_output, daemon=True).start()
        
        log("Backend server started successfully!")
        return process
    
    except Exception as e:
        log(f"Error starting backend: {e}")
        return None

def test_backend_connection(backend_url):
    """Test the connection to the backend server"""
    print_status(f"Testing backend connection at {backend_url}...", "info")
    max_attempts = 5
    for attempt in range(max_attempts):
        try:
            response = requests.get(f"{backend_url}")
            if response.status_code == 200:
                print_status("Backend connection successful", "success")
                return True
            else:
                print_status(f"Unexpected response from backend: {response.status_code}", "warning")
        except requests.exceptions.RequestException as e:
            print_status(f"Attempt {attempt+1}/{max_attempts}: Backend not responding: {e}", "warning")
        
        if attempt < max_attempts - 1:
            print_status("Retrying in 2 seconds...", "info")
            time.sleep(2)
    
    print_status("Failed to connect to backend server after multiple attempts", "error")
    return False

def start_frontend_dev():
    """Start the frontend development server"""
    print_header("Starting Frontend Development Server")
    
    # Check if package.json exists
    if not os.path.exists("package.json"):
        log("Error: package.json not found")
        return None
    
    # Install dependencies if needed
    if not os.path.exists("node_modules"):
        log("Installing dependencies...")
        if not run_command(["npm", "install"]):
            log("Error installing dependencies")
            return None
    
    # Start frontend development server
    log("Starting frontend development server...")
    
    try:
        # Command to run
        command = ["npm", "run", "dev"]
        
        # Run server in background
        process = subprocess.Popen(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            universal_newlines=True
        )
        
        # Read output
        def read_output():
            for line in process.stdout:
                print(f"[Frontend] {line.strip()}")
        
        # Start output reader in separate thread
        threading.Thread(target=read_output, daemon=True).start()
        
        log("Frontend development server started successfully!")
        return process
    
    except Exception as e:
        log(f"Error starting frontend development server: {e}")
        return None

def open_browser(url):
    """Open the browser to the application URL"""
    print_status(f"Opening browser at {url}", "info")
    try:
        webbrowser.open(url)
        print_status("Browser opened successfully", "success")
    except Exception as e:
        print_status(f"Failed to open browser: {e}", "warning")

def check_frontend_backend_connection(backend_url, frontend_port):
    """Check if the frontend can connect to the backend"""
    print_header("Testing Frontend-Backend Connection")
    
    # Wait for both servers to be fully up
    time.sleep(2)
    
    # Test basic API endpoint
    test_endpoint = f"{backend_url}/user/info/test_user"
    print_status(f"Testing API endpoint: {test_endpoint}", "info")
    
    try:
        response = requests.get(test_endpoint)
        if response.status_code == 404:
            # 404 is expected since test_user probably doesn't exist
            print_status("API endpoint responding correctly (expected 404 for test user)", "success")
        elif response.status_code == 200:
            print_status("API endpoint responding correctly (200)", "success")
        else:
            print_status(f"Unexpected response from API: {response.status_code}", "warning")
            return False
            
        # Verify CORS headers if accessing from frontend origin
        headers = {
            'Origin': f'http://localhost:{frontend_port}'
        }
        options_response = requests.options(test_endpoint, headers=headers)
        if 'Access-Control-Allow-Origin' in options_response.headers:
            print_status("CORS headers configured correctly", "success")
        else:
            print_status("Warning: CORS headers may not be configured correctly", "warning")
        
        print_status("Frontend can connect to Backend successfully", "success")
        return True
    except requests.exceptions.RequestException as e:
        print_status(f"Frontend-Backend connection failed: {e}", "error")
        return False

def main():
    """Main function to run the CRN Wallet application"""
    print_header("Starting CRN Wallet Application")
    
    # Print current directory for debugging
    print(f"Current working directory: {os.getcwd()}")
    # Print if the server file exists
    server_path = os.path.join("backend", "crn_wallet", "server.py")
    print(f"Server path: {server_path}")
    print(f"Server file exists: {os.path.exists(server_path)}")
    
    # Update config and integrate protection systems
    print_header("Initializing Protection and Memory Management Systems")
    backend_port = update_config('production')
    
    # Build the frontend for production
    if not build_frontend():
        log("Frontend build failed. Starting backend only...")
        
        # Ask user if they want to continue with backend only
        response = input("Do you want to continue with backend only? (y/n): ")
        if response.lower() != 'y':
            log("Exiting application.")
            return
    else:
        log("Frontend built successfully!")
    
    # Start the backend server (which will serve the frontend)
    backend_process = start_backend()
    if not backend_process:
        log("Failed to start backend server. Exiting.")
        return
    
    # Wait a bit for server to start
    time.sleep(3)
    
    # Comment out browser opening code
    # try:
    #     app_url = "http://localhost:5000"
    #     log(f"Opening browser at {app_url}")
    #     webbrowser.open(app_url)
    # except Exception as e:
    #     log(f"Error opening browser: {e}")
    
    print_header("Application Started Successfully")
    log("Access the application at: http://localhost:5000")
    log("Press Ctrl+C to stop the application")
    
    try:
        # Wait for Ctrl+C
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        log("Stopping servers...")
        if backend_process:
            backend_process.terminate()
            log("Backend server stopped")
        log("Application stopped successfully")

if __name__ == "__main__":
    main() 