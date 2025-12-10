import os
import mammoth

class PreviewService:
    def generate_preview(self, file_path):
        """
        Converts a DOCX file to HTML using mammoth.
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")

        try:
            with open(file_path, "rb") as docx_file:
                # Convert to HTML using mammoth
                # We can add style maps if needed, but default is usually good for preview
                result = mammoth.convert_to_html(docx_file)
                html_content = result.value
                
                # Wrap in the container class expected by frontend
                return f'<div class="docx-preview-content">{html_content}</div>'
                
        except Exception as e:
            raise ValueError(f"Could not convert DOCX file: {str(e)}")
