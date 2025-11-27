// scripts/monitorStorage.js
// Monitor storage usage and send alerts

const { getStorageStats, getStoragePath } = require('../config/localStorage');
const fs = require('fs');
const path = require('path');

/**
 * Get detailed storage information
 */
function getDetailedStorageInfo() {
  const stats = getStorageStats();

  // Get file counts by type
  const productsDir = getStoragePath('products');
  const productFiles = fs.readdirSync(productsDir);

  const filesByType = {
    jpg: productFiles.filter(f => /\.jpe?g$/i.test(f)).length,
    png: productFiles.filter(f => /\.png$/i.test(f)).length,
    webp: productFiles.filter(f => /\.webp$/i.test(f)).length,
    gif: productFiles.filter(f => /\.gif$/i.test(f)).length,
    other: productFiles.filter(f => !/\.(jpe?g|png|webp|gif)$/i.test(f)).length
  };

  return {
    ...stats,
    filesByType,
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Check if storage is approaching limits
 */
function checkStorageLimits(warningThresholdMB = 1000, criticalThresholdMB = 2000) {
  const stats = getDetailedStorageInfo();
  const totalSizeMB = parseFloat(stats.total.size);

  const alerts = [];

  if (totalSizeMB >= criticalThresholdMB) {
    alerts.push({
      level: 'CRITICAL',
      message: `Storage usage (${totalSizeMB} MB) has exceeded critical threshold (${criticalThresholdMB} MB)`,
      action: 'Consider migrating to cloud storage immediately or clean up old images'
    });
  } else if (totalSizeMB >= warningThresholdMB) {
    alerts.push({
      level: 'WARNING',
      message: `Storage usage (${totalSizeMB} MB) has exceeded warning threshold (${warningThresholdMB} MB)`,
      action: 'Plan to migrate to cloud storage or implement cleanup policy'
    });
  }

  return {
    stats,
    alerts,
    isHealthy: alerts.length === 0
  };
}

/**
 * Display storage report
 */
function displayStorageReport() {
  console.log('\n📊 WYZAR STORAGE REPORT\n');
  console.log('='.repeat(60));

  const info = getDetailedStorageInfo();

  console.log('\n📁 Storage Usage:');
  console.log(`   Products:      ${info.products.files} files (${info.products.size})`);
  console.log(`   Verification:  ${info.verification.files} files (${info.verification.size})`);
  console.log(`   Total:         ${info.total.size}`);

  console.log('\n🖼️  File Types (Products):');
  console.log(`   JPEG/JPG:  ${info.filesByType.jpg} files`);
  console.log(`   PNG:       ${info.filesByType.png} files`);
  console.log(`   WebP:      ${info.filesByType.webp} files`);
  console.log(`   GIF:       ${info.filesByType.gif} files`);
  if (info.filesByType.other > 0) {
    console.log(`   Other:     ${info.filesByType.other} files`);
  }

  console.log('\n📂 Directories:');
  console.log(`   Products:      ${info.products.path}`);
  console.log(`   Verification:  ${info.verification.path}`);

  console.log('\n⏰ Last Updated:', info.lastUpdated);

  // Check limits
  const healthCheck = checkStorageLimits();

  if (healthCheck.alerts.length > 0) {
    console.log('\n⚠️  ALERTS:');
    healthCheck.alerts.forEach((alert, index) => {
      console.log(`\n   ${index + 1}. [${alert.level}] ${alert.message}`);
      console.log(`      Action: ${alert.action}`);
    });
  } else {
    console.log('\n✅ Storage is healthy');
  }

  console.log('\n' + '='.repeat(60) + '\n');
}

/**
 * Save report to JSON file
 */
function saveReportToFile() {
  const info = getDetailedStorageInfo();
  const healthCheck = checkStorageLimits();

  const report = {
    ...info,
    health: healthCheck
  };

  const reportDir = path.join(__dirname, '..', 'reports');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().split('T')[0];
  const reportPath = path.join(reportDir, `storage-report-${timestamp}.json`);

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`💾 Report saved to: ${reportPath}`);

  return reportPath;
}

// Run monitoring if called directly
if (require.main === module) {
  displayStorageReport();

  const args = process.argv.slice(2);
  if (args.includes('--save')) {
    saveReportToFile();
  }

  console.log('💡 Tip: Run with --save flag to save report to JSON file\n');
  console.log('   Example: node scripts/monitorStorage.js --save\n');
}

module.exports = {
  getDetailedStorageInfo,
  checkStorageLimits,
  displayStorageReport,
  saveReportToFile
};
