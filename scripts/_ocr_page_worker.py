"""
Processes exactly ONE page of the PDF catalogue: render -> OCR -> row
cluster -> crop image column -> append results as JSON lines.

Run as a fresh subprocess per page (not imported/looped in-process) so
the OS fully reclaims memory between pages — this machine has very
little free RAM and a single warm long-lived OCR engine process was
observed to OOM ("bad allocation") on the second inference call.

Usage: python scripts/_ocr_page_worker.py <page_index_0based> <out_jsonl_path> <staging_dir>
"""

import json
import os
import re
import sys

os.environ.setdefault("OMP_NUM_THREADS", "1")
os.environ.setdefault("OMP_WAIT_POLICY", "PASSIVE")

import fitz  # PyMuPDF
import numpy as np
from PIL import Image
from rapidocr_onnxruntime import RapidOCR

DPI = 120
ROW_Y_GAP_THRESHOLD = 110  # px at 120dpi (scaled down from the 150dpi calibration)
IMAGE_COL_X = (1400, 1920)  # scaled from 150dpi bounds (1750,2400) by 120/150
INK_COVERAGE_THRESHOLD = 0.012
OE_REF_SPLIT_RE = re.compile(r"[,;]\s*")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PDF_PATH = os.path.join(ROOT, "Jcb catalogue E.pdf")


def x_center(box):
    return sum(pt[0] for pt in box) / len(box)


def y_center(box):
    return sum(pt[1] for pt in box) / len(box)


def cluster_rows(ocr_boxes):
    items = sorted(ocr_boxes, key=lambda item: y_center(item[0]))
    rows, current, last_y = [], [], None
    for box, text, conf in items:
        yc = y_center(box)
        if last_y is not None and (yc - last_y) > ROW_Y_GAP_THRESHOLD:
            rows.append(current)
            current = []
        current.append((box, text, conf, yc, x_center(box)))
        last_y = yc
    if current:
        rows.append(current)
    return rows


COMING_SOON_RE = re.compile(r"COMING\s*SOON", re.I)


def strip_coming_soon(text):
    """Removes the 'IMAGE COMING SOON' placeholder phrase (and a lone
    leading 'IMAGE' token) from OCR text, recovering any real content
    that was concatenated alongside it (e.g. an OE reference on the
    same merged text line)."""
    cleaned = COMING_SOON_RE.sub("", text)
    cleaned = re.sub(r"\bIMAGE\b", "", cleaned, flags=re.I)
    return cleaned.strip()


def classify_row(row_items, page_width):
    s_no = None
    part_details_parts = []
    oe_ref_parts = []
    header_zone = page_width * 0.58
    s_no_zone = page_width * 0.20
    coming_soon = False

    for box, text, conf, yc, xc in row_items:
        clean = text.strip()
        if not clean:
            continue
        if COMING_SOON_RE.search(clean) or clean.upper().strip() == "IMAGE":
            coming_soon = True
            clean = strip_coming_soon(clean)
            if not clean:
                continue
        if xc < s_no_zone and re.fullmatch(r"\d{1,4}", clean):
            s_no = clean
        elif xc >= header_zone:
            oe_ref_parts.append(clean)
        else:
            part_details_parts.append(clean)

    return s_no, " ".join(part_details_parts).strip(), " ".join(oe_ref_parts).strip(), coming_soon


def crop_ink_fraction(pil_img):
    arr = np.array(pil_img.convert("L"))
    if arr.size == 0:
        return 0.0
    return float((arr < 235).sum()) / float(arr.size)


def main():
    page_index = int(sys.argv[1])
    out_jsonl_path = sys.argv[2]
    staging_dir = sys.argv[3]
    page_num = page_index + 1

    doc = fitz.open(PDF_PATH)
    page = doc[page_index]
    pix = page.get_pixmap(dpi=DPI)
    img = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
    arr = np.array(img)

    engine = RapidOCR()
    ocr_result, _ = engine(arr)
    ocr_result = ocr_result or []

    rows = cluster_rows(ocr_result)
    out_rows = []

    for row_items in rows:
        s_no, part_details, oe_ref_raw, coming_soon = classify_row(row_items, pix.width)
        # Drop artifacts with no real content: page-number footers, stray
        # header fragments, etc. A genuine catalogue row always has a
        # part description.
        if not part_details.strip():
            continue
        joined_upper = (part_details + " " + oe_ref_raw).upper().replace(" ", "")
        if "PARTDETAILS" in joined_upper or "OEREFERENCE" in joined_upper:
            continue

        ys = [yc for _, _, _, yc, _ in row_items]
        y_top = max(0, int(min(ys) - 70))
        y_bottom = min(pix.height, int(max(ys) + 70))

        crop = img.crop((IMAGE_COL_X[0], y_top, IMAGE_COL_X[1], y_bottom))
        ink_fraction = crop_ink_fraction(crop)
        has_real_image = (not coming_soon) and ink_fraction >= INK_COVERAGE_THRESHOLD

        crop_filename = None
        if has_real_image:
            gray = np.array(crop.convert("L"))
            mask = gray < 235
            if mask.any():
                ys_idx, xs_idx = np.where(mask)
                pad = 12
                top = max(0, ys_idx.min() - pad)
                bottom = min(crop.height, ys_idx.max() + pad)
                left = max(0, xs_idx.min() - pad)
                right = min(crop.width, xs_idx.max() + pad)
                trimmed = crop.crop((left, top, right, bottom))
            else:
                trimmed = crop
            crop_filename = f"p{page_num:03d}_r{s_no or 'x'}_{len(out_rows)}.webp"
            trimmed.save(os.path.join(staging_dir, crop_filename), "WEBP", quality=90)

        oe_references = [r.strip() for r in OE_REF_SPLIT_RE.split(oe_ref_raw) if r.strip()]

        out_rows.append({
            "page": page_num,
            "s_no": s_no,
            "part_details": part_details,
            "oe_references": oe_references,
            "has_real_image": has_real_image,
            "image_coming_soon_flag": coming_soon,
            "ink_fraction": round(ink_fraction, 4),
            "crop_filename": crop_filename
        })

    with open(out_jsonl_path, "a", encoding="utf-8") as f:
        for row in out_rows:
            f.write(json.dumps(row) + "\n")

    print(f"page {page_num}: {len(out_rows)} rows, {sum(1 for r in out_rows if r['has_real_image'])} with real image")


if __name__ == "__main__":
    main()
