try:
    print("Importing DocumentCorrector...")
    from services.document_corrector import DocumentCorrector
    print("Import successful.")
    corrector = DocumentCorrector()
    print("Instantiation successful.")
    
    from docx import Document
    print("Creating Document...")
    doc = Document()
    print("Saving Document...")
    doc.save("test_import.docx")
    print("Save successful.")
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
