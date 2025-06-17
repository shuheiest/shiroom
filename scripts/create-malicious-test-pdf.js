const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const testDir = path.join(__dirname, '..', 'test-pdfs');
if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir);
}

// 疑わしいコンテンツを含むテスト用PDF（検出テスト用）
function createSuspiciousPdf() {
    const doc = new PDFDocument();
    const filePath = path.join(testDir, 'suspicious-test.pdf');
    doc.pipe(fs.createWriteStream(filePath));
    
    doc.fontSize(20)
       .text('疑わしいコンテンツテスト文書', 100, 100);
    
    doc.fontSize(12)
       .text('この文書には検出テスト用の疑わしいパターンが含まれています:', 100, 150);
    
    // JavaScript関連のキーワードを含める（検出テスト用）
    doc.text('テストパターン1: /JavaScript 機能', 100, 180);
    doc.text('テストパターン2: /OpenAction 動作', 100, 200);
    doc.text('テストパターン3: document.write 関数', 100, 220);
    doc.text('テストパターン4: eval( 実行', 100, 240);
    
    // 疑わしいURLを含める
    doc.text('疑わしいURL: https://suspicious-site.example/malware', 100, 270);
    doc.text('短縮URL: https://bit.ly/suspicious', 100, 290);
    
    doc.end();
    console.log('✅ 疑わしいコンテンツ検出テスト用PDF作成: suspicious-test.pdf');
}

// ファイル名に危険パターンを含むPDF
function createSuspiciousNamePdf() {
    const doc = new PDFDocument();
    const filePath = path.join(testDir, 'malware-test.pdf');
    doc.pipe(fs.createWriteStream(filePath));
    
    doc.fontSize(20)
       .text('ファイル名検出テスト', 100, 100);
    
    doc.fontSize(12)
       .text('このファイル名には "malware" が含まれており、', 100, 150)
       .text('ファイル名パターン検出のテストに使用されます。', 100, 170);
    
    doc.end();
    console.log('✅ 疑わしいファイル名検出テスト用PDF作成: malware-test.pdf');
}

// 複数の脅威を含むPDF
function createMultiThreatPdf() {
    const doc = new PDFDocument();
    const filePath = path.join(testDir, 'virus-multi-threat.pdf');
    doc.pipe(fs.createWriteStream(filePath));
    
    doc.fontSize(20)
       .text('複合脅威テスト文書', 100, 100);
    
    doc.fontSize(12)
       .text('このファイルには複数の脅威パターンが含まれています:', 100, 150);
    
    // 複数の危険パターン
    doc.text('JavaScript実行: /JavaScript(alert("test"))', 100, 180);
    doc.text('ファイル起動: /Launch action', 100, 200);
    doc.text('フォーム送信: /SubmitForm function', 100, 220);
    doc.text('外部リンク: https://tinyurl.com/malicious', 100, 240);
    doc.text('スクリプト実行: eval(dangerousCode)', 100, 260);
    doc.text('XHR通信: XMLHttpRequest usage', 100, 280);
    
    doc.end();
    console.log('✅ 複合脅威検出テスト用PDF作成: virus-multi-threat.pdf');
}

console.log('🔄 疑わしいコンテンツ検出テスト用PDFを作成中...');
console.log('⚠️  これらは検出システムのテスト用です');
console.log('');

createSuspiciousPdf();
createSuspiciousNamePdf();
createMultiThreatPdf();

console.log('');
console.log('✅ 検出テスト用PDFファイルが作成されました！');
console.log('');
console.log('作成されたテストファイル:');
console.log('1. suspicious-test.pdf - JavaScript関連パターン検出テスト');
console.log('2. malware-test.pdf - ファイル名パターン検出テスト');
console.log('3. virus-multi-threat.pdf - 複合脅威検出テスト');
console.log('');
console.log('これらのファイルをアップロードすると隔離機能がテストできます。');