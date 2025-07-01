from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
import os
from bson.objectid import ObjectId
from datetime import datetime
from security import security_middleware, setup_security_endpoints
import configparser

app = Flask(__name__)
CORS(app)

# تطبيق ميدلوير الأمان
security_middleware()(app)
setup_security_endpoints(app)

# MongoDB connection - Read from env file first
try:
    # Try to read from .env file
    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../clyne.env')
    print(f"Looking for env file at: {env_path}")
    
    if os.path.exists(env_path):
        # Read DATABASE_URL from .env file
        with open(env_path, 'r') as env_file:
            for line in env_file:
                if line.startswith('DATABASE_URL='):
                    mongo_uri = line.strip().split('=', 1)[1]
                    print(f"Using DATABASE_URL from env file: {mongo_uri}")
                    break
    else:
        # Fallback to hardcoded connection string
        print("Env file not found, using hardcoded connection string")
        mongo_uri = "mongodb+srv://abdulrahman:GmsPvw6tspNufsYE@cluster0.pujvbqx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
except Exception as e:
    print(f"Error reading env file: {e}")
    # Fallback to hardcoded connection string
    mongo_uri = "mongodb+srv://abdulrahman:GmsPvw6tspNufsYE@cluster0.pujvbqx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

print(f"Connecting to MongoDB with URI: {mongo_uri}")
try:
    client = MongoClient(mongo_uri)
    # Test connection
    client.server_info()
    print("MongoDB connection successful!")
    
    wallet_db = client["cryptonel_wallet"]
    mining_db = client["cryptonel_mining"]
    users_collection = wallet_db["users"]
    
    # Print database info
    print(f"Connected to database: {wallet_db.name}")
    print(f"Available collections: {wallet_db.list_collection_names()}")
    print(f"Users in collection: {users_collection.count_documents({})}")
except Exception as e:
    print(f"MongoDB connection error: {e}")
    # Continue but log error - app will give proper errors when DB operations fail

# Helper function to find user by Discord ID
def find_user_by_discord_id(user_id):
    if not user_id:
        return None
    
    try:
        # تحويل النص إلى سلسلة نصية للتأكد من تطابق الأنواع
        user_id_str = str(user_id).strip()
        print(f"Searching for user with ID: {user_id_str}")
        
        # البحث بالمعرف بشكل دقيق
        user = users_collection.find_one({"user_id": user_id_str})
        if user:
            print(f"User found by exact match: {user.get('username', 'Unknown')}")
            return user
            
        # البحث بشكل مرن إذا لم يتم العثور على المستخدم
        if not user:
            print(f"Trying case-insensitive search for: {user_id_str}")
            user = users_collection.find_one({"user_id": {"$regex": f"^{user_id_str}$", "$options": "i"}})
            if user:
                print(f"User found by case-insensitive match: {user.get('username', 'Unknown')}")
                
        return user
    except Exception as e:
        print(f"Error searching for user by discord ID: {e}")
        return None

# Helper function to find user by Wallet ID
def find_user_by_wallet_id(wallet_id):
    if not wallet_id:
        return None
        
    try:
        # تحويل النص إلى سلسلة نصية للتأكد من تطابق الأنواع
        wallet_id_str = str(wallet_id).strip()
        print(f"Searching for user with wallet ID: {wallet_id_str}")
        
        # البحث بمعرف المحفظة بشكل دقيق
        user = users_collection.find_one({"wallet_id": wallet_id_str})
        if user:
            print(f"User found by exact wallet match: {user.get('username', 'Unknown')}")
            return user
            
        # البحث بشكل مرن إذا لم يتم العثور على المستخدم
        if not user:
            print(f"Trying case-insensitive search for wallet: {wallet_id_str}")
            user = users_collection.find_one({"wallet_id": {"$regex": f"^{wallet_id_str}$", "$options": "i"}})
            if user:
                print(f"User found by case-insensitive wallet match: {user.get('username', 'Unknown')}")
                
        return user
    except Exception as e:
        print(f"Error searching for user by wallet ID: {e}")
        return None

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
        "vip": user.get("vip"),
        "staff": user.get("staff"),
        "account_type": user.get("account_type"),
        "membership": user.get("membership"),
        "premium": user.get("premium"),
        "wallet_lock": user.get("wallet_lock"),
        "wallet_limit": user.get("wallet_limit"),
        "frozen": user.get("frozen"),
        "profile_hidden": user.get("profile_hidden")
    }

# Wallet transfer endpoint
@app.route('/api/wallet/transfer', methods=['POST'])
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

# Ban/Unban user endpoint
@app.route('/api/user/ban', methods=['POST'])
def ban_user():
    data = request.json
    user_id = data.get('user_id')
    ban_status = data.get('ban_status', True)
    
    if not user_id:
        return jsonify({"success": False, "message": "User ID is required"}), 400
    
    user = find_user_by_discord_id(user_id)
    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404
    
    users_collection.update_one(
        {"user_id": user_id},
        {"$set": {"ban": ban_status}}
    )
    
    status = "banned" if ban_status else "unbanned"
    return jsonify({
        "success": True,
        "message": f"User {status} successfully"
    })

# Get user information endpoint
@app.route('/api/user/info/<user_id>', methods=['GET'])
def get_user_info(user_id):
    user = find_user_by_discord_id(user_id)
    
    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404
    
    safe_data = safe_user_data(user)
    return jsonify({
        "success": True,
        "user": safe_data
    })

# Delete user endpoint
@app.route('/api/user/delete', methods=['DELETE'])
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
@app.route('/api/user/update/main', methods=['PUT'])
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
@app.route('/api/user/update/status', methods=['PUT'])
def update_account_status():
    data = request.json
    user_id = data.get('user_id')
    
    if not user_id:
        return jsonify({"success": False, "message": "User ID is required"}), 400
    
    user = find_user_by_discord_id(user_id)
    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404
    
    update_data = {}
    
    # Check which fields to update
    if 'verified' in data:
        update_data["verified"] = data['verified']
    if 'vip' in data:
        update_data["vip"] = data['vip']
    if 'premium' in data:
        update_data["premium"] = data['premium']
    if 'account_type' in data:
        update_data["account_type"] = data['account_type']
    if 'membership' in data:
        update_data["membership"] = data['membership']
    
    if not update_data:
        return jsonify({"success": False, "message": "No status data to update"}), 400
    
    users_collection.update_one(
        {"user_id": user_id},
        {"$set": update_data}
    )
    
    return jsonify({
        "success": True,
        "message": "Account status updated successfully"
    })

# Lock/Unlock wallet endpoint
@app.route('/api/wallet/lock', methods=['PUT'])
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

# Get user information by wallet ID endpoint
@app.route('/api/user/wallet/<wallet_id>', methods=['GET'])
def get_user_by_wallet_id(wallet_id):
    user = find_user_by_wallet_id(wallet_id)
    
    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404
    
    safe_data = safe_user_data(user)
    return jsonify({
        "success": True,
        "user": safe_data
    })

# Disable 2FA endpoint
@app.route('/api/user/disable2fa', methods=['PUT'])
def disable_2fa():
    data = request.json
    user_id = data.get('user_id')
    
    if not user_id:
        return jsonify({"success": False, "message": "User ID is required"}), 400
    
    user = find_user_by_discord_id(user_id)
    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404
    
    # Check if 2FA is already disabled
    if not user.get('2fa_activated', False):
        return jsonify({"success": False, "message": "2FA is already disabled for this user"}), 400
    
    # Disable 2FA
    users_collection.update_one(
        {"user_id": user_id},
        {
            "$set": {
                "2fa_activated": False,
                "2fa_secret": None
            }
        }
    )
    
    return jsonify({
        "success": True,
        "message": "2FA disabled successfully"
    })

# Block/Unblock transfers endpoint
@app.route('/api/user/transfers/block', methods=['PUT'])
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
@app.route('/api/user/mining/block', methods=['PUT'])
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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True) 