#!/usr/bin/env python3
"""
Translate text inside Word document shapes/textboxes while preserving diagram structure.
Handles: Shapes, TextBoxes, SmartArt, GroupShapes, Tables inside shapes.

Two approaches:
1. XML-level manipulation (most reliable, works with all shape types)
2. python-docx shape API (simpler but limited)

This script uses Approach 1 (XML-level) for maximum compatibility.
"""

import sys
import os
import re
import json
import shutil
import zipfile
from pathlib import Path
from lxml import etree
from copy import deepcopy

# Word XML namespaces
NAMESPACES = {
    'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
    'wp': 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing',
    'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
    'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
    'mc': 'http://schemas.openxmlformats.org/markup-compatibility/2006',
    'wps': 'http://schemas.microsoft.com/office/word/2010/wordprocessingShape',
    'wpg': 'http://schemas.microsoft.com/office/word/2010/wordprocessingGroup',
    'v': 'urn:schemas-microsoft-com:vml',
    'o': 'urn:schemas-microsoft-com:office:office',
    'dgm': 'http://schemas.openxmlformats.org/drawingml/2006/diagram',
}

# Register all namespaces to preserve them during write
for prefix, uri in NAMESPACES.items():
    etree.register_namespace(prefix, uri)


def extract_texts_from_docx(docx_path):
    """
    Extract ALL text from shapes, textboxes, SmartArt in a Word document.
    Returns a list of (xpath_location, original_text) tuples.
    """
    texts = []
    
    with zipfile.ZipFile(docx_path, 'r') as zf:
        # Process document.xml and any other XML parts that might contain shapes
        xml_files = [f for f in zf.namelist() if f.endswith('.xml')]
        
        for xml_file in xml_files:
            content = zf.read(xml_file)
            try:
                tree = etree.fromstring(content)
            except etree.XMLSyntaxError:
                continue
            
            # 1. Find text in DrawingML shapes (wps:txbx)
            for txbx in tree.iter('{http://schemas.microsoft.com/office/word/2010/wordprocessingShape}txbx'):
                for para in txbx.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t'):
                    if para.text and para.text.strip():
                        texts.append({
                            'file': xml_file,
                            'text': para.text.strip(),
                            'type': 'shape_textbox'
                        })
            
            # 2. Find text in VML shapes (v:textbox)
            for textbox in tree.iter('{urn:schemas-microsoft-com:vml}textbox'):
                for para in textbox.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t'):
                    if para.text and para.text.strip():
                        texts.append({
                            'file': xml_file,
                            'text': para.text.strip(),
                            'type': 'vml_textbox'
                        })
            
            # 3. Find text in DrawingML text bodies (a:t) - covers SmartArt, charts
            for at in tree.iter('{http://schemas.openxmlformats.org/drawingml/2006/main}t'):
                if at.text and at.text.strip():
                    texts.append({
                        'file': xml_file,
                        'text': at.text.strip(),
                        'type': 'drawingml_text'
                    })
            
            # 4. Regular paragraph text (w:t) - not inside shapes
            for wt in tree.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t'):
                if wt.text and wt.text.strip():
                    # Check if this is inside a shape (already captured above)
                    parent = wt.getparent()
                    in_shape = False
                    while parent is not None:
                        tag = parent.tag
                        if any(ns in tag for ns in ['wordprocessingShape', 'vml', 'drawingml']):
                            in_shape = True
                            break
                        parent = parent.getparent()
                    
                    if not in_shape:
                        texts.append({
                            'file': xml_file,
                            'text': wt.text.strip(),
                            'type': 'paragraph_text'
                        })
    
    return texts


def translate_texts_in_docx(input_path, output_path, translation_dict):
    """
    Replace text in a Word document using a translation dictionary.
    Preserves ALL formatting, shapes, arrows, and layout.
    
    translation_dict: {original_chinese: translated_vietnamese}
    """
    # Copy the file
    shutil.copy2(input_path, output_path)
    
    replacements_made = 0
    
    # Work with the ZIP
    temp_dir = Path(output_path).with_suffix('.tmp')
    
    # Extract
    with zipfile.ZipFile(output_path, 'r') as zf:
        zf.extractall(temp_dir)
    
    # Process each XML file
    xml_files = list(temp_dir.rglob('*.xml'))
    
    for xml_file in xml_files:
        content = xml_file.read_bytes()
        try:
            tree = etree.fromstring(content)
        except etree.XMLSyntaxError:
            continue
        
        modified = False
        
        # Find ALL text elements
        text_tags = [
            '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t',      # w:t
            '{http://schemas.openxmlformats.org/drawingml/2006/main}t',              # a:t
        ]
        
        for tag in text_tags:
            for elem in tree.iter(tag):
                if elem.text:
                    original = elem.text
                    translated = original
                    
                    for cn_text, vi_text in translation_dict.items():
                        if cn_text in translated:
                            translated = translated.replace(cn_text, vi_text)
                    
                    if translated != original:
                        elem.text = translated
                        modified = True
                        replacements_made += 1
        
        if modified:
            # Write back with XML declaration
            xml_bytes = etree.tostring(tree, xml_declaration=True, encoding='UTF-8', standalone=True)
            xml_file.write_bytes(xml_bytes)
    
    # Repack into DOCX
    os.remove(output_path)
    with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zf:
        for file_path in temp_dir.rglob('*'):
            if file_path.is_file():
                arcname = file_path.relative_to(temp_dir)
                zf.write(file_path, arcname)
    
    # Cleanup
    shutil.rmtree(temp_dir)
    
    return replacements_made


# ============================================================
# DEMO: Translation dictionary for the construction supervision flowchart
# ============================================================

# Chinese → Vietnamese translation for the specific flowchart in the image
CONSTRUCTION_SUPERVISION_DICT = {
    # Title & Headers
    '监理工作总程序框图': 'Sơ đồ quy trình tổng thể công tác giám sát',
    '工程监理总程序框图': 'Sơ đồ tổng thể quy trình giám sát công trình',
    '监理阶段': 'Giai đoạn giám sát',
    '施工单位': 'Đơn vị thi công',
    '监理工作内容': 'Nội dung công tác giám sát',
    '监理单位': 'Đơn vị giám sát',
    
    # Phase 1: Construction Preparation (施工准备阶段)
    '施工准备阶段': 'Giai đoạn chuẩn bị thi công',
    '提供与解释': 'Cung cấp và giải thích',
    '承发包合同': 'Hợp đồng thầu phụ',
    '熟悉与提问': 'Nghiên cứu và đặt câu hỏi',
    '填报': 'Khai báo',
    '分包单位资质': 'Năng lực đơn vị thầu phụ',
    '检查确认': 'Kiểm tra xác nhận',
    '编报': 'Biên soạn báo cáo',
    '施工组织设计': 'Thiết kế tổ chức thi công',
    '参与审查': 'Tham gia thẩm tra',
    '建立': 'Thiết lập',
    '质量保证体系': 'Hệ thống đảm bảo chất lượng',
    '督促检查': 'Đôn đốc kiểm tra',
    '参加': 'Tham gia',
    '施工图设计交底': 'Giao nhận bản vẽ thiết kế thi công',
    '参加和复查': 'Tham gia và kiểm tra lại',
    '复测': 'Đo đạc lại',
    '测量资料': 'Tài liệu đo đạc',
    '抽查、检测': 'Kiểm tra xác suất, đo kiểm',
    '申请': 'Đề nghị',
    '单位工程开工报告': 'Báo cáo khởi công hạng mục công trình',
    '审批或参与审批': 'Phê duyệt hoặc tham gia phê duyệt',
    
    # Phase 2: Construction Phase (施工阶段) - Quality Control
    '施工阶段': 'Giai đoạn thi công',
    '质量控制内容': 'Nội dung kiểm soát chất lượng',
    '测量': 'Đo đạc',
    '施工放样': 'Cắm mốc thi công',
    '复测确认': 'Xác nhận đo lại',
    '填报合格证': 'Khai báo chứng nhận đạt chuẩn',
    '工地材料设备': 'Vật liệu thiết bị công trường',
    '抽检确认': 'Xác nhận kiểm tra xác suất',
    '自检': 'Tự kiểm tra',
    '隐蔽工程': 'Công trình ẩn giấu',
    '检查签证': 'Kiểm tra ký xác nhận',
    '施工质量': 'Chất lượng thi công',
    '检查与验收': 'Kiểm tra và nghiệm thu',
    '上报': 'Báo cáo lên',
    '工程质量事故': 'Sự cố chất lượng công trình',
    '参加处理': 'Tham gia xử lý',
    '组织申请': 'Tổ chức đề nghị',
    '创优活动': 'Hoạt động nâng cao chất lượng',
    '参加评检': 'Tham gia đánh giá kiểm tra',
}


def demo():
    """Demo the translation capability"""
    print("=" * 60)
    print("WORD DIAGRAM TRANSLATOR - Demo")
    print("=" * 60)
    print()
    print(f"Translation dictionary loaded: {len(CONSTRUCTION_SUPERVISION_DICT)} entries")
    print()
    print("Sample translations:")
    print("-" * 50)
    for i, (cn, vi) in enumerate(list(CONSTRUCTION_SUPERVISION_DICT.items())[:10]):
        print(f"  {cn} → {vi}")
    print(f"  ... and {len(CONSTRUCTION_SUPERVISION_DICT) - 10} more")
    print()
    print("=" * 60)
    print("USAGE:")
    print("=" * 60)
    print("""
    # 1. Extract texts from a Word file to see what's translatable:
    texts = extract_texts_from_docx('input.docx')
    for t in texts:
        print(f"[{t['type']}] {t['text']}")
    
    # 2. Translate with dictionary:
    count = translate_texts_in_docx(
        'input.docx', 
        'output_translated.docx',
        CONSTRUCTION_SUPERVISION_DICT
    )
    print(f"Made {count} replacements")
    
    # 3. Or use Claude API for dynamic translation:
    # (see translate_with_api function below)
    """)


def translate_with_api_example():
    """
    Example: How to integrate with Claude API for dynamic translation.
    This would be a Pho.Chat feature.
    """
    code = '''
import anthropic

client = anthropic.Anthropic()

def translate_batch(texts, source_lang="Chinese", target_lang="Vietnamese"):
    """Translate a batch of short texts using Claude API"""
    prompt = f"""Translate the following {source_lang} texts to {target_lang}.
These are labels from a construction supervision flowchart.
Return ONLY a JSON object mapping original → translated.

Texts to translate:
{json.dumps(texts, ensure_ascii=False, indent=2)}
"""
    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=4096,
        messages=[{"role": "user", "content": prompt}]
    )
    
    return json.loads(response.content[0].text)

# Pipeline:
# 1. Extract texts
texts = extract_texts_from_docx('input.docx')
unique_texts = list(set(t['text'] for t in texts))

# 2. Translate via API  
translation_dict = translate_batch(unique_texts)

# 3. Apply translations
translate_texts_in_docx('input.docx', 'output.docx', translation_dict)
'''
    print("API Integration Example:")
    print(code)


if __name__ == '__main__':
    if len(sys.argv) > 1:
        input_file = sys.argv[1]
        output_file = sys.argv[2] if len(sys.argv) > 2 else 'translated_output.docx'
        
        print(f"Extracting texts from: {input_file}")
        texts = extract_texts_from_docx(input_file)
        
        print(f"\nFound {len(texts)} text elements:")
        for t in texts:
            print(f"  [{t['type']:20s}] {t['text']}")
        
        print(f"\nTranslating to Vietnamese...")
        count = translate_texts_in_docx(input_file, output_file, CONSTRUCTION_SUPERVISION_DICT)
        print(f"Made {count} replacements → {output_file}")
    else:
        demo()
