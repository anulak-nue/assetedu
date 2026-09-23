/**
 * ====================================================================
 * ระบบตรวจสอบพัสดุประจำปี - Google Apps Script (Code.gs)
 * Web App & Real-time Google Sheets API
 * ====================================================================
 * 
 * วิธีการติดตั้ง:
 * 1. เปิด Google Sheet ที่เก็บรายการพัสดุ
 * 2. ไปที่เมนู "ส่วนขยาย" (Extensions) > "Apps Script"
 * 3. ลบโค้ดเดิมใน Code.gs แล้ววางโค้ดนี้แทน
 * 4. เพิ่มไฟล์ HTML ชื่อ "Index" (Index.html) แล้วนำโค้ด Index.html ไปวาง
 * 5. กด "บันทึก" (รูปแผ่นดิสก์)
 * 6. กดปุ่ม "ทำให้ใช้งานได้" (Deploy) > "การทำให้ใช้งานได้รายการใหม่" (New deployment)
 *    - เลือกประเภท: "เว็บแอป" (Web app)
 *    - ดำเนินการในฐานะ: "ตัวฉัน" (Me)
 *    - ผู้ที่มีสิทธิ์เข้าถึง: "ทุกคน" (Anyone)
 * 7. กด "ทำให้ใช้งานได้" (Deploy) จะได้ลิงก์ Web App ที่เปิดใช้งานได้ทันทีเหมือนจอด้านพรีวิว!
 */

var SHEET_NAME = 'รายการพัสดุครุภัณฑ์';

// หัวตารางมาตรฐาน (รวมคอลัมน์สถานะผลตรวจ และคอลัมน์ติ๊ก ✓ ใช้งานได้, ชำรุด, เสื่อมสภาพ, ตรวจไม่พบ)
var DEFAULT_HEADERS = [
  'Costcentername',
  'Costcenterno.',
  'ลำดับที่',
  'หมายเลขครุภัณฑ์',
  'รายละเอียด',
  'Serialno.',
  'สถานที่ตั้ง',
  'ห้อง',
  'ปีงบ',
  'มูลค่า',
  'ชื่อผู้ขาย',
  'สถานะผลตรวจ',
  'ใช้งานได้',
  'ชำรุด',
  'เสื่อมสภาพ',
  'ตรวจไม่พบ',
  'หน่วยงานผู้ถือครองไม่ถูกต้อง',
  'สถานที่ตั้งไม่ถูกต้อง',
  'ไม่มียี่ห้อ/รุ่นหรือมีแต่ไม่ถูกต้อง',
  'ระบุสาเหตุของสถานะครุภัณฑ์หรือรายละเอียดที่ต้องแก้ไขหากพบว่าข้อมูลครุภัณฑ์ไม่ถูกต้อง',
  'ขอรับป้ายสติ๊กเกอร์',
  'หมายเหตุ',
  'แบ่งทีม',
  'ส่งคืน',
  'ผู้ตรวจ',
  'เวลาที่ตรวจ'
];

/**
 * แสดงผลหน้าเว็บ Web App (เหมือนจอด้านพรีวิว)
 */
function doGet(e) {
  // หากเรียกเป็น JSON API (เช่น ?api=json, ?format=json หรือ ?action=getData)
  if (e && e.parameter && (e.parameter.api === 'json' || e.parameter.format === 'json' || e.parameter.action === 'getData' || e.parameter.type === 'json')) {
    return ContentService.createTextOutput(JSON.stringify(getAssetsData()))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // หากมีการเรียกแบบ JSONP (callback)
  if (e && e.parameter && e.parameter.callback) {
    return ContentService.createTextOutput(e.parameter.callback + '(' + JSON.stringify(getAssetsData()) + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  // แสดงผลหน้าเว็บแอป Index.html (หากมีไฟล์ Index.html อยู่ในโปรเจกต์)
  try {
    var template = HtmlService.createTemplateFromFile('Index');
    return template.evaluate()
      .setTitle('ระบบตรวจสอบพัสดุประจำปี')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (err) {
    // กรณีที่ยังไม่ได้เพิ่มไฟล์ Index.html ใน Apps Script ให้ส่งค่ากลับเป็น JSON ข้อมูลพัสดุทันที
    return ContentService.createTextOutput(JSON.stringify(getAssetsData()))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * ดึงรายการพัสดุทั้งหมดจาก Google Sheets ส่งให้ Web App
 */
function getAssetsData() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.getSheets()[0];
    }

    var data = sheet.getDataRange().getValues();
    if (data.length < 2) {
      return [];
    }

    var headers = data[0];
    var colMap = {};
    for (var c = 0; c < headers.length; c++) {
      colMap[String(headers[c]).trim()] = c;
    }

    var result = [];
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (!row || row.every(function(cell) { return cell === ''; })) continue;

      var getVal = function(key, fallbackIdx) {
        if (colMap[key] !== undefined) return row[colMap[key]];
        if (fallbackIdx !== undefined && fallbackIdx < row.length) return row[fallbackIdx];
        return '';
      };

      var sapNo = String(getVal('หมายเลขครุภัณฑ์', 3) || getVal('รหัสSAP') || ('ITEM-' + i)).trim();
      var rawStatus = String(getVal('สถานะผลตรวจ', 11) || '').trim();
      var parsedStatus = parseStatus(rawStatus);

      // ตรวจสอบจากช่องติ๊กสถานะ (ใช้งานได้, ชำรุด, เสื่อมสภาพ, ตรวจไม่พบ)
      if (isChecked(getVal('ใช้งานได้', 12)) || isChecked(getVal('ใช้งานได้ (พบ)')) || isChecked(getVal('สภาพใช้งานได้')) || isChecked(getVal('ใช้ได้')) || isChecked(getVal('พบ'))) {
        parsedStatus = 'found';
      } else if (isChecked(getVal('ชำรุด', 13))) {
        parsedStatus = 'broken';
      } else if (isChecked(getVal('เสื่อมสภาพ', 14))) {
        parsedStatus = 'deteriorated';
      } else if (isChecked(getVal('ตรวจไม่พบ', 15)) || isChecked(getVal('สูญหาย')) || isChecked(getVal('ไม่พบ'))) {
        parsedStatus = 'missing';
      }

      var updatedAtVal = getVal('เวลาที่ตรวจ', 25) || getVal('เวลาที่ตรวจ', 21);
      if (updatedAtVal instanceof Date) {
        updatedAtVal = Utilities.formatDate(updatedAtVal, 'GMT+7', 'dd/MM/yyyy HH:mm:ss');
      }

      var item = {
        id: sapNo,
        sapNo: sapNo,
        seq: String(getVal('ลำดับที่', 2) || i),
        costCenterName: String(getVal('Costcentername', 0) || ''),
        costCenterNo: String(getVal('Costcenterno.', 1) || ''),
        name: String(getVal('รายละเอียด', 4) || 'ไม่ระบุชื่อพัสดุ'),
        serialNo: String(getVal('Serialno.', 5) || '-'),
        location: String(getVal('สถานที่ตั้ง', 6) || '-'),
        room: String(getVal('ห้อง', 7) || '-'),
        budgetYear: String(getVal('ปีงบ', 8) || ''),
        value: String(getVal('มูลค่า', 9) || ''),
        vendor: String(getVal('ชื่อผู้ขาย', 10) || ''),
        status: parsedStatus,
        invalidDepartment: isChecked(getVal('หน่วยงานผู้ถือครองไม่ถูกต้อง', 16)),
        invalidLocation: isChecked(getVal('สถานที่ตั้งไม่ถูกต้อง', 17)),
        invalidModel: isChecked(getVal('ไม่มียี่ห้อ/รุ่นหรือมีแต่ไม่ถูกต้อง', 18)),
        note: String(getVal('ระบุสาเหตุของสถานะครุภัณฑ์หรือรายละเอียดที่ต้องแก้ไขหากพบว่าข้อมูลครุภัณฑ์ไม่ถูกต้อง', 19) || ''),
        requestSticker: isChecked(getVal('ขอรับป้ายสติ๊กเกอร์', 20)),
        remark: String(getVal('หมายเหตุ', 21) || ''),
        team: String(getVal('แบ่งทีม', 22) || ''),
        returnedTo: String(getVal('ส่งคืน', 23) || ''),
        updatedBy: String(getVal('ผู้ตรวจ', 24) || ''),
        updatedAt: String(updatedAtVal || '')
      };

      result.push(item);
    }

    return result;
  } catch (err) {
    throw new Error('เกิดข้อผิดพลาดในการดึงข้อมูล: ' + err.toString());
  }
}

/**
 * บันทึกผลการตรวจพัสดุ (อัปเดตลง Sheet พร้อมติ๊ก ✓ ลงในช่องของ "ใช้งานได้")
 */
function saveAssetData(asset) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) sheet = ss.getSheets()[0];

    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var colMap = {};
    for (var c = 0; c < headers.length; c++) {
      colMap[String(headers[c]).trim()] = c;
    }

    var sapColIdx = colMap['หมายเลขครุภัณฑ์'] !== undefined ? colMap['หมายเลขครุภัณฑ์'] : 3;
    var targetSap = String(asset.sapNo || asset.id || '').trim();

    var targetRow = -1;
    for (var r = 1; r < data.length; r++) {
      if (String(data[r][sapColIdx] || '').trim() === targetSap) {
        targetRow = r + 1;
        break;
      }
    }

    if (targetRow === -1) {
      // หากยังไม่มีแถว ให้เพิ่มต่อท้าย
      targetRow = sheet.getLastRow() + 1;
      sheet.getRange(targetRow, sapColIdx + 1).setValue(targetSap);
    }

    var nowStr = Utilities.formatDate(new Date(), 'GMT+7', 'dd/MM/yyyy HH:mm:ss');
    var statusThai = formatStatusThai(asset.status);

    var setCell = function(colName, fallbackIdx, value) {
      var idx = colMap[colName] !== undefined ? colMap[colName] : fallbackIdx;
      if (idx !== undefined && idx >= 0) {
        sheet.getRange(targetRow, idx + 1).setValue(value);
      }
    };

    // ค้นหาคอลัมน์สำหรับติ๊กสถานะ (ใช้งานได้, ชำรุด, เสื่อมสภาพ, ตรวจไม่พบ)
    var foundColIdx = findColIndex(colMap, ['ใช้งานได้', 'ใช้งานได้ (พบ)', 'สภาพใช้งานได้', 'ใช้ได้', 'พบ']);
    var brokenColIdx = findColIndex(colMap, ['ชำรุด']);
    var detColIdx = findColIndex(colMap, ['เสื่อมสภาพ']);
    var missColIdx = findColIndex(colMap, ['ตรวจไม่พบ', 'สูญหาย', 'ไม่พบ']);

    // หากยังไม่มีคอลัมน์ "ใช้งานได้" ใน Google Sheets ให้สร้างหัวตารางคอลัมน์ "ใช้งานได้" ให้อัตโนมัติ
    if (foundColIdx === -1) {
      var lastCol = sheet.getLastColumn();
      sheet.getRange(1, lastCol + 1).setValue('ใช้งานได้');
      sheet.getRange(1, lastCol + 1).setBackground('#0f172a').setFontColor('#ffffff').setFontWeight('bold');
      foundColIdx = lastCol;
      colMap['ใช้งานได้'] = foundColIdx;
    }

    // ติ๊ก ✓ ลงในช่องของ "ใช้งานได้" เมื่อสถานะเป็น ใช้งานได้ (พบ)
    if (foundColIdx !== -1) {
      setCheckValue(sheet.getRange(targetRow, foundColIdx + 1), asset.status === 'found');
    }
    if (brokenColIdx !== -1) {
      setCheckValue(sheet.getRange(targetRow, brokenColIdx + 1), asset.status === 'broken');
    }
    if (detColIdx !== -1) {
      setCheckValue(sheet.getRange(targetRow, detColIdx + 1), asset.status === 'deteriorated');
    }
    if (missColIdx !== -1) {
      setCheckValue(sheet.getRange(targetRow, missColIdx + 1), asset.status === 'missing');
    }

    // บันทึกสถานะผลตรวจสรุป
    setCell('สถานะผลตรวจ', 11, statusThai);
    setCell('หน่วยงานผู้ถือครองไม่ถูกต้อง', 16, asset.invalidDepartment ? 'ใช่' : '');
    setCell('สถานที่ตั้งไม่ถูกต้อง', 17, asset.invalidLocation ? 'ใช่' : '');
    setCell('ไม่มียี่ห้อ/รุ่นหรือมีแต่ไม่ถูกต้อง', 18, asset.invalidModel ? 'ใช่' : '');
    setCell('ระบุสาเหตุของสถานะครุภัณฑ์หรือรายละเอียดที่ต้องแก้ไขหากพบว่าข้อมูลครุภัณฑ์ไม่ถูกต้อง', 19, asset.note || '');
    setCell('ขอรับป้ายสติ๊กเกอร์', 20, asset.requestSticker ? 'ใช่' : '');
    setCell('หมายเหตุ', 21, asset.remark || '');
    setCell('ส่งคืน', 23, asset.returnedTo || '');
    setCell('ผู้ตรวจ', 24, asset.updatedBy || 'ผู้ตรวจ');
    setCell('เวลาที่ตรวจ', 25, nowStr);

    if (asset.name) setCell('รายละเอียด', 4, asset.name);
    if (asset.serialNo) setCell('Serialno.', 5, asset.serialNo);
    if (asset.location) setCell('สถานที่ตั้ง', 6, asset.location);
    if (asset.room) setCell('ห้อง', 7, asset.room);
    if (asset.team !== undefined) {
      setCell('แบ่งทีม', 22, asset.team || '');
    }

    return { success: true, sapNo: targetSap, updatedAt: nowStr };
  } catch (err) {
    throw new Error('บันทึกข้อมูลไม่สำเร็จ: ' + err.toString());
  }
}

/**
 * อัปเดตสถานะหรือทีมแบบกลุ่ม (Bulk Update) พร้อมติ๊ก ✓ ลงในช่องของ "ใช้งานได้"
 */
function bulkUpdateAssetsData(assetUpdates) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) sheet = ss.getSheets()[0];

    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var colMap = {};
    for (var c = 0; c < headers.length; c++) {
      colMap[String(headers[c]).trim()] = c;
    }

    var sapColIdx = colMap['หมายเลขครุภัณฑ์'] !== undefined ? colMap['หมายเลขครุภัณฑ์'] : 3;
    var rowMap = {};
    for (var r = 1; r < data.length; r++) {
      var sap = String(data[r][sapColIdx] || '').trim();
      if (sap) rowMap[sap] = r + 1;
    }

    // ค้นหาคอลัมน์ติ๊กสถานะ
    var foundColIdx = findColIndex(colMap, ['ใช้งานได้', 'ใช้งานได้ (พบ)', 'สภาพใช้งานได้', 'ใช้ได้', 'พบ']);
    var brokenColIdx = findColIndex(colMap, ['ชำรุด']);
    var detColIdx = findColIndex(colMap, ['เสื่อมสภาพ']);
    var missColIdx = findColIndex(colMap, ['ตรวจไม่พบ', 'สูญหาย', 'ไม่พบ']);

    // ถ้ายังไม่มีคอลัมน์ "ใช้งานได้" ให้เพิ่มอัตโนมัติ
    if (foundColIdx === -1) {
      var lastCol = sheet.getLastColumn();
      sheet.getRange(1, lastCol + 1).setValue('ใช้งานได้');
      sheet.getRange(1, lastCol + 1).setBackground('#0f172a').setFontColor('#ffffff').setFontWeight('bold');
      foundColIdx = lastCol;
      colMap['ใช้งานได้'] = foundColIdx;
    }

    var nowStr = Utilities.formatDate(new Date(), 'GMT+7', 'dd/MM/yyyy HH:mm:ss');
    var updated = 0;

    for (var i = 0; i < assetUpdates.length; i++) {
      var item = assetUpdates[i];
      var targetSap = String(item.sapNo || item.id || '').trim();
      var rowNum = rowMap[targetSap];
      if (!rowNum) continue;

      if (item.status) {
        var statusIdx = colMap['สถานะผลตรวจ'] !== undefined ? colMap['สถานะผลตรวจ'] : 11;
        sheet.getRange(rowNum, statusIdx + 1).setValue(formatStatusThai(item.status));

        // ติ๊ก ✓ ในช่องของ "ใช้งานได้"
        if (foundColIdx !== -1) {
          setCheckValue(sheet.getRange(rowNum, foundColIdx + 1), item.status === 'found');
        }
        if (brokenColIdx !== -1) {
          setCheckValue(sheet.getRange(rowNum, brokenColIdx + 1), item.status === 'broken');
        }
        if (detColIdx !== -1) {
          setCheckValue(sheet.getRange(rowNum, detColIdx + 1), item.status === 'deteriorated');
        }
        if (missColIdx !== -1) {
          setCheckValue(sheet.getRange(rowNum, missColIdx + 1), item.status === 'missing');
        }
      }
      if (item.team !== undefined) {
        var teamIdx = colMap['แบ่งทีม'] !== undefined ? colMap['แบ่งทีม'] : 22;
        sheet.getRange(rowNum, teamIdx + 1).setValue(item.team);
      }
      if (item.updatedBy) {
        var userIdx = colMap['ผู้ตรวจ'] !== undefined ? colMap['ผู้ตรวจ'] : 24;
        sheet.getRange(rowNum, userIdx + 1).setValue(item.updatedBy);
      }
      var timeIdx = colMap['เวลาที่ตรวจ'] !== undefined ? colMap['เวลาที่ตรวจ'] : 25;
      sheet.getRange(rowNum, timeIdx + 1).setValue(nowStr);

      updated++;
    }

    return { success: true, updatedCount: updated };
  } catch (err) {
    throw new Error('อัปเดตแบบกลุ่มไม่สำเร็จ: ' + err.toString());
  }
}

/**
 * เติมข้อมูลทดสอบอัตโนมัติ 8 รายการ หากใน Google Sheet ยังไม่มีข้อมูล
 */
function seedInitialTestData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }

  // ใส่หัวตาราง
  sheet.getRange(1, 1, 1, DEFAULT_HEADERS.length).setValues([DEFAULT_HEADERS]);
  sheet.getRange(1, 1, 1, DEFAULT_HEADERS.length)
    .setBackground('#0f172a')
    .setFontColor('#ffffff')
    .setFontWeight('bold');

  var testRows = [
    ['ฝ่ายพัฒนาระบบกายภาพ', '10042', '1', '4120-001-0001/67', 'เครื่องคอมพิวเตอร์ตั้งโต๊ะ All-in-One Dell OptiPlex 7410', 'SN-DELL-88491', 'อาคารบริหารส่วนกลาง', 'ห้อง 301', '2567', '34,500', 'บจก. เดลล์ ประเทศไทย', 'ใช้งานได้ (พบ)', '✓', '', '', '', '', '', '', '', '', '', 'ทีม AV/IT', '', 'นายอนุรักษ์ (ทีม AV)', '12/09/2026 10:15:00'],
    ['ฝ่ายพัฒนาระบบกายภาพ', '10042', '2', '4120-001-0002/67', 'เครื่องมัลติมีเดียโปรเจคเตอร์ Epson EB-2250U 5000 Lumens', 'EP-9921820', 'อาคารเรียนรวม', 'ห้องบรรยาย 1', '2567', '48,000', 'บจก. เอปสัน คอมพิวเตอร์', 'ยังไม่ตรวจ', '', '', '', '', '', '', '', '', '', '', 'ทีม AV/IT', '', '', ''],
    ['งานเทคโนโลยีสารสนเทศ', '10055', '3', '4120-002-0015/66', 'เก้าอี้สำนักงานพนักพิงสูง หุ้มตาข่ายสีดำ มีล้อเลื่อน', 'FUR-CH-0941', 'อาคารวิจัยและบริการ', 'ห้อง 402', '2566', '4,200', 'บจก. เฟอร์นิเจอร์ ดีไซน์', 'ชำรุด', '', '✓', '', '', '', 'ใช่', '', 'โช้กแก๊สปรับระดับรั่วซึม ล้อเลื่อนแตกหัก 1 ข้าง', '', 'ส่งซ่อมงานช่าง', 'ทีมสำรวจ 1', 'คืนงานพัสดุ', 'นางสาวจินตนา (พัสดุ)', '12/09/2026 11:20:00'],
    ['งานบริการการศึกษา', '10060', '4', '4120-003-0089/65', 'ตู้เอกสารเหล็ก 4 ลิ้นชัก รางลูกปืน สีเทามาตรฐาน', 'FUR-CAB-5510', 'อาคารบริหารส่วนกลาง', 'ห้อง 105', '2565', '6,800', 'หจก. สยามสตีล ออฟฟิศ', 'ยังไม่ตรวจ', '', '', '', '', '', '', '', '', '', '', 'ทีมสำรวจ 1', '', '', ''],
    ['ฝ่ายห้องสมุดและสารสนเทศ', '10070', '5', '4120-004-0042/66', 'เครื่องปรับอากาศแยกส่วน Wall Type Inverter 24,000 BTU Daikin', 'DK-AC-24018', 'อาคารหอสมุดกลาง', 'ห้องอ่านหนังสือ 2', '2566', '38,900', 'บจก. ไดกิ้น สยาม', 'เสื่อมสภาพ', '', '', '✓', '', '', '', '', 'คอยล์เย็นรั่ว ความเย็นไม่ทั่วถึง มีน้ำหยดตลอดเวลา', '', 'รอประเมินจำหน่าย', 'ทีมช่างซ่อมบำรุง', '', 'นายสมชาย (วิศวกรรม)', '11/09/2026 14:45:00'],
    ['ศูนย์เครื่องมือวิทยาศาสตร์', '10080', '6', '4120-005-0104/64', 'กล้องจุลทรรศน์สเตอริโอ Olympus SZ51 เลนส์ซูมต่อเนื่อง', 'OLY-MIC-3392', 'อาคารวิทยาศาสตร์การแพทย์', 'ห้อง LAB 3', '2564', '75,000', 'บจก. โอลิมปัส ไบโอเมดิคอล', 'ยังไม่ตรวจ', '', '', '', '', '', '', '', '', '', '', 'ทีมเครื่องมือแพทย์', '', '', ''],
    ['งานอาคารและสถานที่', '10090', '7', '4120-006-0008/67', 'เครื่องพิมพ์เลเซอร์สี Network HP Color LaserJet Pro MFP 4303fdw', 'HP-PRN-88102', 'อาคารบริหารส่วนกลาง', 'ห้อง 204', '2567', '21,500', 'บจก. เอชพี อิงค์ (ประเทศไทย)', 'ใช้งานได้ (พบ)', '✓', '', '', '', '', '', '', '', 'ใช่', '', 'ทีม AV/IT', '', 'นายอนุรักษ์ (ทีม AV)', '12/09/2026 09:30:00'],
    ['สำนักงานคณบดี', '10010', '8', '4120-007-0055/65', 'โต๊ะประชุมรูปไข่ ขนาด 10 ที่นั่ง ผิวลามิเนตลายไม้', 'FUR-TB-0182', 'อาคารบริหารส่วนกลาง', 'ห้อง 105', '2565', '19,500', 'บจก. โมเดิร์นฟอร์ม กรุ๊ป', 'ตรวจไม่พบ', '', '', '', '✓', '', '', '', 'ไม่พบโต๊ะประชุมในห้อง 105 และไม่มีบันทึกการเคลื่อนย้าย', '', 'อยู่ระหว่างตรวจสอบกล้องวงจรปิด', 'ทีมสำรวจ 2', '', 'นายปิยะ (หัวหน้าทีม 2)', '10/09/2026 16:10:00']
  ];

  sheet.getRange(2, 1, testRows.length, DEFAULT_HEADERS.length).setValues(testRows);
  sheet.setFrozenRows(1);
  return { success: true, count: testRows.length };
}

function parseStatus(raw) {
  if (!raw) return 'pending';
  var str = String(raw).toLowerCase();
  if (str.indexOf('ใช้ได้') !== -1 || str.indexOf('ปกติ') !== -1 || str.indexOf('พบ') !== -1 || str === 'found') return 'found';
  if (str.indexOf('ชำรุด') !== -1 || str === 'broken') return 'broken';
  if (str.indexOf('เสื่อม') !== -1 || str === 'deteriorated') return 'deteriorated';
  if (str.indexOf('ไม่พบ') !== -1 || str === 'missing') return 'missing';
  return 'pending';
}

function formatStatusThai(status) {
  switch (status) {
    case 'found': return 'ใช้งานได้ (พบ)';
    case 'broken': return 'ชำรุด';
    case 'deteriorated': return 'เสื่อมสภาพ';
    case 'missing': return 'ตรวจไม่พบ';
    default: return 'ยังไม่ตรวจ';
  }
}

function findColIndex(colMap, names) {
  for (var i = 0; i < names.length; i++) {
    var n = names[i];
    if (colMap[n] !== undefined) return colMap[n];
    var lower = String(n).toLowerCase().trim();
    for (var key in colMap) {
      if (String(key).toLowerCase().trim() === lower) return colMap[key];
    }
  }
  return -1;
}

function setCheckValue(range, isCheckedVal) {
  try {
    var rule = range.getDataValidation();
    if (rule && rule.getCriteriaType() === SpreadsheetApp.DataValidationCriteria.CHECKBOX) {
      if (isCheckedVal) {
        range.check();
      } else {
        range.uncheck();
      }
      return;
    }
  } catch (e) {}
  range.setValue(isCheckedVal ? '✓' : '');
}

function isChecked(val) {
  if (val === null || val === undefined || val === '') return false;
  if (val === true || val === 1) return true;
  var s = String(val).toLowerCase().trim();
  return s === '✓' || s === '✔' || s === '√' || s === 'v' || s === 'x' || s === 'ใช่' || s === 'true' || s === '1' || s === 'yes' || s === 'y' || s === 'พบ';
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({ error: 'No payload' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    var payload = JSON.parse(e.postData.contents);
    
    // หากส่งมาเป็นอ็อบเจกต์รายการเดียว หรืออาร์เรย์ที่มี 1 รายการ
    if (!Array.isArray(payload)) {
      var singleRes = saveAssetData(payload);
      return ContentService.createTextOutput(JSON.stringify(singleRes))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (payload.length === 1 && (payload[0].note !== undefined || payload[0].room !== undefined || payload[0].location !== undefined)) {
      var singleResItem = saveAssetData(payload[0]);
      return ContentService.createTextOutput(JSON.stringify(singleResItem))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // กรณีอัปเดตแบบกลุ่มหลายรายการ
    var res = bulkUpdateAssetsData(payload);
    return ContentService.createTextOutput(JSON.stringify(res))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
