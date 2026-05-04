import sys
from pdf2docx import Converter

def convertir(pdf_path, docx_path):
    cv = Converter(pdf_path)
    cv.convert(docx_path)
    cv.close()
    print(f"Convertido correctamente: {docx_path}")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Uso: python convertir.py <pdf_path> <docx_path>")
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    docx_path = sys.argv[2]
    
    convertir(pdf_path, docx_path)