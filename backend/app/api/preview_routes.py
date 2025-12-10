from flask import Blueprint, request, jsonify, current_app
import os
import sys
import traceback
from app.services.preview_service import PreviewService

bp = Blueprint('preview', __name__, url_prefix='/api/preview')

# Directory for storing corrected files (same as in document_routes)
CORRECTIONS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'static', 'corrections')

@bp.route('/generate', methods=['POST'])
def generate_preview():
    """
    Generates an HTML preview for a given DOCX file path.
    Expects JSON body: { "path": "..." }
    """
    data = request.json
    if not data or 'path' not in data:
        return jsonify({'error': 'Path is required'}), 400
    
    file_path = data['path']
    current_app.logger.info(f"Generating preview for: {file_path}")
    
    try:
        # Security/Path resolution logic similar to download_file
        full_path = None
        
        # 1. Check if it's a simple filename in CORRECTIONS_DIR
        if '/' not in file_path and '\\' not in file_path:
            candidate = os.path.join(CORRECTIONS_DIR, file_path)
            if os.path.exists(candidate):
                full_path = candidate
            elif not file_path.lower().endswith('.docx'):
                candidate = os.path.join(CORRECTIONS_DIR, file_path + '.docx')
                if os.path.exists(candidate):
                    full_path = candidate
        
        # 2. Check if it's an absolute path or relative path that exists
        if not full_path:
            if os.path.exists(file_path):
                full_path = file_path
            
        # 3. Check relative to project root
        if not full_path and not os.path.isabs(file_path):
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            candidate = os.path.join(base_dir, file_path)
            if os.path.exists(candidate):
                full_path = candidate

        if not full_path or not os.path.exists(full_path):
            current_app.logger.error(f"File not found for preview: {file_path}")
            return jsonify({'error': 'File not found'}), 404

        # Generate Preview
        service = PreviewService()
        html_content = service.generate_preview(full_path)
        
        return jsonify({
            'success': True,
            'html': html_content,
            'path': full_path
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error generating preview: {str(e)}")
        traceback.print_exc(file=sys.stdout)
        return jsonify({'error': f'Error generating preview: {str(e)}'}), 500
