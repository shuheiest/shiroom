const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// テスト用PDFファイルを作成するディレクトリ
const testDir = path.join(__dirname, '..', 'test-pdfs');
if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir);
}

// 1. 通常の安全なPDF
function createSafePdf() {
    const doc = new PDFDocument();
    const filePath = path.join(testDir, 'safe-document.pdf');
    doc.pipe(fs.createWriteStream(filePath));
    
    doc.fontSize(20)
       .text('安全なテスト文書', 100, 100);
    
    doc.fontSize(14)
       .text('この文書は通常のPDFファイルです。', 100, 150)
       .text('JavaScriptやその他の危険な要素は含まれていません。', 100, 170)
       .text('無害化システムのテストに使用できます。', 100, 190);
    
    doc.end();
    console.log('✅ 安全なPDF作成: safe-document.pdf');
}

// 2. フォームフィールドを含むPDF
function createFormPdf() {
    const doc = new PDFDocument();
    const filePath = path.join(testDir, 'form-document.pdf');
    doc.pipe(fs.createWriteStream(filePath));
    
    doc.fontSize(20)
       .text('フォーム付き文書', 100, 100);
    
    doc.fontSize(14)
       .text('名前: ________________', 100, 150)
       .text('メール: ________________', 100, 180)
       .text('コメント:', 100, 210)
       .rect(100, 230, 400, 100)
       .stroke();
    
    doc.end();
    console.log('✅ フォーム付きPDF作成: form-document.pdf');
}

// 3. 外部リンクを含むPDF
function createLinkPdf() {
    const doc = new PDFDocument();
    const filePath = path.join(testDir, 'link-document.pdf');
    doc.pipe(fs.createWriteStream(filePath));
    
    doc.fontSize(20)
       .text('リンク付き文書', 100, 100);
    
    doc.fontSize(14)
       .text('この文書には外部リンクが含まれています:', 100, 150);
    
    // 外部リンクを追加
    doc.fillColor('blue')
       .text('Google検索', 100, 180, {
           link: 'https://www.google.com',
           underline: true
       });
    
    doc.fillColor('black')
       .text('悪意のある可能性のあるリンク:', 100, 210);
    
    doc.fillColor('red')
       .text('suspicious-site.example', 100, 230, {
           link: 'https://suspicious-site.example/malware',
           underline: true
       });
    
    doc.end();
    console.log('✅ リンク付きPDF作成: link-document.pdf');
}

// 4. メタデータを含むPDF
function createMetadataPdf() {
    const doc = new PDFDocument({
        info: {
            Title: 'メタデータテスト文書',
            Author: 'テストユーザー',
            Subject: 'セキュリティテスト',
            Keywords: 'test, security, metadata, 機密情報',
            Creator: 'Test PDF Creator',
            Producer: 'PDF Security Test Suite'
        }
    });
    
    const filePath = path.join(testDir, 'metadata-document.pdf');
    doc.pipe(fs.createWriteStream(filePath));
    
    doc.fontSize(20)
       .text('メタデータ付き文書', 100, 100);
    
    doc.fontSize(14)
       .text('この文書にはメタデータが含まれています:', 100, 150)
       .text('• タイトル、作成者、キーワードなど', 100, 170)
       .text('• 機密情報が含まれている可能性', 100, 190)
       .text('• 無害化時に除去される必要があります', 100, 210);
    
    doc.end();
    console.log('✅ メタデータ付きPDF作成: metadata-document.pdf');
}

// 5. 注釈を含むPDF
function createAnnotationPdf() {
    const doc = new PDFDocument();
    const filePath = path.join(testDir, 'annotation-document.pdf');
    doc.pipe(fs.createWriteStream(filePath));
    
    doc.fontSize(20)
       .text('注釈付き文書', 100, 100);
    
    doc.fontSize(14)
       .text('この文書には注釈が含まれています。', 100, 150)
       .text('通常の注釈は安全ですが、', 100, 170)
       .text('悪意のあるコンテンツが埋め込まれる', 100, 190)
       .text('可能性があります。', 100, 210);
    
    // 簡単な図形を追加
    doc.rect(100, 250, 200, 100)
       .stroke();
    
    doc.text('この四角形には注釈が', 110, 270)
       .text('付いている想定です', 110, 290);
    
    doc.end();
    console.log('✅ 注釈付きPDF作成: annotation-document.pdf');
}

// 6. 大きなファイルサイズのPDF
function createLargePdf() {
    const doc = new PDFDocument();
    const filePath = path.join(testDir, 'large-document.pdf');
    doc.pipe(fs.createWriteStream(filePath));
    
    doc.fontSize(20)
       .text('大容量テスト文書', 100, 100);
    
    // 多くのページを作成してファイルサイズを大きくする
    for (let page = 1; page <= 50; page++) {
        if (page > 1) doc.addPage();
        
        doc.fontSize(16)
           .text(`ページ ${page}`, 100, 100);
        
        doc.fontSize(12);
        for (let line = 0; line < 30; line++) {
            doc.text(`これは ${page} ページ目の ${line + 1} 行目のテキストです。ファイルサイズを大きくするためのダミーコンテンツです。`, 100, 130 + (line * 20));
        }
    }
    
    doc.end();
    console.log('✅ 大容量PDF作成: large-document.pdf');
}

// すべてのテストPDFを作成
console.log('🔄 テスト用PDFファイルを作成中...');
console.log(`📁 保存先: ${testDir}`);
console.log('');

createSafePdf();
createFormPdf();
createLinkPdf();
createMetadataPdf();
createAnnotationPdf();
createLargePdf();

console.log('');
console.log('✅ すべてのテスト用PDFファイルが作成されました！');
console.log('');
console.log('作成されたファイル:');
console.log('1. safe-document.pdf - 通常の安全なPDF');
console.log('2. form-document.pdf - フォームフィールド付き');
console.log('3. link-document.pdf - 外部リンク付き');
console.log('4. metadata-document.pdf - メタデータ付き');
console.log('5. annotation-document.pdf - 注釈付き');
console.log('6. large-document.pdf - 大容量ファイル');
console.log('');
console.log('これらのファイルを使って無害化システムをテストできます。');