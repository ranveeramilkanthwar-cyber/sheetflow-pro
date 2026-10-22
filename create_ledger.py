import zipfile
import os

def create_excel_workbook(filename):
    # Minimal valid OpenXML XLSX structure with 4 tabs
    content_types = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet3.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet4.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>"""

    rels = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>"""

    workbook_rels = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet3.xml"/>
  <Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet4.xml"/>
  <Relationship Id="rId5" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>"""

    workbook = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="1_Transactions" sheetId="1" r:id="rId1"/>
    <sheet name="2_Budgets" sheetId="2" r:id="rId2"/>
    <sheet name="3_Recurring" sheetId="3" r:id="rId3"/>
    <sheet name="4_Analytics" sheetId="4" r:id="rId4"/>
  </sheets>
</workbook>"""

    styles = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts>
  <fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>
  <borders count="1"><border><left/><right/><top/><bottom/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs>
</styleSheet>"""

    # Tab 1: 1_Transactions
    sheet1 = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>
    <row r="1">
      <c r="A1" t="inlineStr"><is><t>ID</t></is></c>
      <c r="B1" t="inlineStr"><is><t>Timestamp</t></is></c>
      <c r="C1" t="inlineStr"><is><t>Type</t></is></c>
      <c r="D1" t="inlineStr"><is><t>Category</t></is></c>
      <c r="E1" t="inlineStr"><is><t>Bucket</t></is></c>
      <c r="F1" t="inlineStr"><is><t>Amount</t></is></c>
      <c r="G1" t="inlineStr"><is><t>Mode</t></is></c>
      <c r="H1" t="inlineStr"><is><t>Source</t></is></c>
      <c r="I1" t="inlineStr"><is><t>Notes</t></is></c>
      <c r="J1" t="inlineStr"><is><t>Is_Recurring</t></is></c>
    </row>
  </sheetData>
</worksheet>"""

    # Tab 2: 2_Budgets
    sheet2 = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>
    <row r="1">
      <c r="A1" t="inlineStr"><is><t>Category</t></is></c>
      <c r="B1" t="inlineStr"><is><t>Bucket</t></is></c>
      <c r="C1" t="inlineStr"><is><t>Monthly_Limit</t></is></c>
      <c r="D1" t="inlineStr"><is><t>Current_Spend</t></is></c>
      <c r="E1" t="inlineStr"><is><t>Burn_Pct</t></is></c>
    </row>
    <row r="2">
      <c r="A2" t="inlineStr"><is><t>Food &amp; Drinks</t></is></c>
      <c r="B2" t="inlineStr"><is><t>Needs</t></is></c>
      <c r="C2"><v>4000</v></c>
      <c r="D2"><f>SUMIFS('1_Transactions'!F:F, '1_Transactions'!D:D, A2)</f></c>
      <c r="E2"><f>D2/C2</f></c>
    </row>
    <row r="3">
      <c r="A3" t="inlineStr"><is><t>Groceries</t></is></c>
      <c r="B3" t="inlineStr"><is><t>Needs</t></is></c>
      <c r="C3"><v>3500</v></c>
      <c r="D3"><f>SUMIFS('1_Transactions'!F:F, '1_Transactions'!D:D, A3)</f></c>
      <c r="E3"><f>D3/C3</f></c>
    </row>
    <row r="4">
      <c r="A4" t="inlineStr"><is><t>Transport &amp; Fuel</t></is></c>
      <c r="B4" t="inlineStr"><is><t>Needs</t></is></c>
      <c r="C4"><v>2000</v></c>
      <c r="D4"><f>SUMIFS('1_Transactions'!F:F, '1_Transactions'!D:D, A4)</f></c>
      <c r="E4"><f>D4/C4</f></c>
    </row>
    <row r="5">
      <c r="A5" t="inlineStr"><is><t>Shopping</t></is></c>
      <c r="B5" t="inlineStr"><is><t>Wants</t></is></c>
      <c r="C5"><v>2500</v></c>
      <c r="D5"><f>SUMIFS('1_Transactions'!F:F, '1_Transactions'!D:D, A5)</f></c>
      <c r="E5"><f>D5/C5</f></c>
    </row>
    <row r="6">
      <c r="A6" t="inlineStr"><is><t>Entertainment</t></is></c>
      <c r="B6" t="inlineStr"><is><t>Wants</t></is></c>
      <c r="C6"><v>1500</v></c>
      <c r="D6"><f>SUMIFS('1_Transactions'!F:F, '1_Transactions'!D:D, A6)</f></c>
      <c r="E6"><f>D6/C6</f></c>
    </row>
    <row r="7">
      <c r="A7" t="inlineStr"><is><t>Investments</t></is></c>
      <c r="B7" t="inlineStr"><is><t>Savings</t></is></c>
      <c r="C7"><v>3000</v></c>
      <c r="D7"><f>SUMIFS('1_Transactions'!F:F, '1_Transactions'!D:D, A7)</f></c>
      <c r="E7"><f>D7/C7</f></c>
    </row>
  </sheetData>
</worksheet>"""

    # Tab 3: 3_Recurring
    sheet3 = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>
    <row r="1">
      <c r="A1" t="inlineStr"><is><t>Sub_ID</t></is></c>
      <c r="B1" t="inlineStr"><is><t>Name</t></is></c>
      <c r="C1" t="inlineStr"><is><t>Amount</t></is></c>
      <c r="D1" t="inlineStr"><is><t>Billing_Day</t></is></c>
      <c r="E1" t="inlineStr"><is><t>Category</t></is></c>
      <c r="F1" t="inlineStr"><is><t>Status</t></is></c>
    </row>
    <row r="2">
      <c r="A2" t="inlineStr"><is><t>SUB-001</t></is></c>
      <c r="B2" t="inlineStr"><is><t>Netflix</t></is></c>
      <c r="C2"><v>199</v></c>
      <c r="D2"><v>5</v></c>
      <c r="E2" t="inlineStr"><is><t>Subscriptions</t></is></c>
      <c r="F2" t="inlineStr"><is><t>Active</t></is></c>
    </row>
    <row r="3">
      <c r="A3" t="inlineStr"><is><t>SUB-002</t></is></c>
      <c r="B3" t="inlineStr"><is><t>Spotify</t></is></c>
      <c r="C3"><v>119</v></c>
      <c r="D3"><v>12</v></c>
      <c r="E3" t="inlineStr"><is><t>Subscriptions</t></is></c>
      <c r="F3" t="inlineStr"><is><t>Active</t></is></c>
    </row>
    <row r="4">
      <c r="A4" t="inlineStr"><is><t>SUB-003</t></is></c>
      <c r="B4" t="inlineStr"><is><t>Jio Fiber</t></is></c>
      <c r="C4"><v>470</v></c>
      <c r="D4"><v>20</v></c>
      <c r="E4" t="inlineStr"><is><t>Bills &amp; Utilities</t></is></c>
      <c r="F4" t="inlineStr"><is><t>Active</t></is></c>
    </row>
  </sheetData>
</worksheet>"""

    # Tab 4: 4_Analytics
    sheet4 = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>
    <row r="1">
      <c r="A1" t="inlineStr"><is><t>Month_Year</t></is></c>
      <c r="B1" t="inlineStr"><is><t>Total_Income</t></is></c>
      <c r="C1" t="inlineStr"><is><t>Needs_Spent</t></is></c>
      <c r="D1" t="inlineStr"><is><t>Wants_Spent</t></is></c>
      <c r="E1" t="inlineStr"><is><t>Net_Savings</t></is></c>
      <c r="F1" t="inlineStr"><is><t>Savings_Rate</t></is></c>
    </row>
    <row r="2">
      <c r="A2" t="inlineStr"><is><t>Current Month</t></is></c>
      <c r="B2"><f>SUMIF('1_Transactions'!C:C, "Income", '1_Transactions'!F:F)</f></c>
      <c r="C2"><f>SUMIFS('1_Transactions'!F:F, '1_Transactions'!C:C, "Expense", '1_Transactions'!E:E, "Needs")</f></c>
      <c r="D2"><f>SUMIFS('1_Transactions'!F:F, '1_Transactions'!C:C, "Expense", '1_Transactions'!E:E, "Wants")</f></c>
      <c r="E2"><f>B2 - (C2 + D2)</f></c>
      <c r="F2"><f>IF(B2>0, E2/B2, 0)</f></c>
    </row>
  </sheetData>
</worksheet>"""

    with zipfile.ZipFile(filename, 'w', zipfile.ZIP_DEFLATED) as zf:
        zf.writestr('[Content_Types].xml', content_types)
        zf.writestr('_rels/.rels', rels)
        zf.writestr('xl/_rels/workbook.xml.rels', workbook_rels)
        zf.writestr('xl/workbook.xml', workbook)
        zf.writestr('xl/styles.xml', styles)
        zf.writestr('xl/worksheets/sheet1.xml', sheet1)
        zf.writestr('xl/worksheets/sheet2.xml', sheet2)
        zf.writestr('xl/worksheets/sheet3.xml', sheet3)
        zf.writestr('xl/worksheets/sheet4.xml', sheet4)

    print(f"Enterprise Excel Workbook created successfully at: {filename}")

if __name__ == '__main__':
    target = os.path.join(os.path.dirname(__file__), 'SheetFlow_Enterprise_Ledger.xlsx')
    create_excel_workbook(target)
