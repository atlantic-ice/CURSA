from werkzeug.utils import secure_filename
print(f"1.2.1.1.docx -> {secure_filename('1.2.1.1.docx')}")
print(f"1_2_1_1.docx -> {secure_filename('1_2_1_1.docx')}")
