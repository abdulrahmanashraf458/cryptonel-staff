
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
