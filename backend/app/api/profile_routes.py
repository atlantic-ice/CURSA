from flask import Blueprint, jsonify, current_app
import os
import json

bp = Blueprint('profiles', __name__, url_prefix='/api/profiles')

@bp.route('/', methods=['GET'])
def list_profiles():
    """List all available norm control profiles"""
    profiles_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'profiles')
    profiles = []
    
    if not os.path.exists(profiles_dir):
        return jsonify([]), 200
        
    for filename in os.listdir(profiles_dir):
        if filename.endswith('.json'):
            try:
                with open(os.path.join(profiles_dir, filename), 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    profiles.append({
                        'id': filename.replace('.json', ''),
                        'name': data.get('name', filename),
                        'description': data.get('description', '')
                    })
            except Exception as e:
                current_app.logger.error(f"Error loading profile {filename}: {e}")
                
    return jsonify(profiles)

@bp.route('/<profile_id>', methods=['GET'])
def get_profile(profile_id):
    """Get details of a specific profile"""
    profiles_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'profiles')
    profile_path = os.path.join(profiles_dir, f"{profile_id}.json")
    
    if not os.path.exists(profile_path):
        return jsonify({'error': 'Profile not found'}), 404
        
    try:
        with open(profile_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return jsonify(data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
