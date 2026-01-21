#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');
const os = require('os');
const JSON5 = require('json5');

const CONFIG_PATH = process.env.ENV_BACKUP_CONFIG || path.join(__dirname, 'config.json');

function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

function hashFile(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    log(`Created directory: ${dirPath}`);
  }
}

function getTimestamp() {
  return new Date().toISOString().replace(/:/g, '-').replace(/\.\d{3}Z$/, '');
}

function makeArchiveName(filename, timestamp) {
  if (filename.endsWith('.tar.gz')) {
    return `${filename.slice(0, -7)}.${timestamp}.tar.gz`;
  }
  const ext = path.extname(filename);
  if (ext) {
    return `${filename.slice(0, -ext.length)}.${timestamp}${ext}`;
  }
  return `${filename}.${timestamp}`;
}

function isDirectory(filePath) {
  try {
    return fs.statSync(filePath).isDirectory();
  } catch {
    return false;
  }
}

function findTarCommand() {
  // Prefer GNU tar for deterministic options
  try {
    const result = spawnSync('gtar', ['--version'], { encoding: 'utf8' });
    if (result.status === 0 && result.stdout.includes('GNU tar')) {
      return 'gtar';
    }
  } catch {}

  // Check if system tar is GNU tar
  try {
    const result = spawnSync('tar', ['--version'], { encoding: 'utf8' });
    if (result.status === 0 && result.stdout.includes('GNU tar')) {
      return 'tar';
    }
  } catch {}

  // Fall back to BSD tar (macOS default)
  return 'tar';
}

function isGnuTar(tarCmd) {
  try {
    const result = spawnSync(tarCmd, ['--version'], { encoding: 'utf8' });
    return result.status === 0 && result.stdout.includes('GNU tar');
  } catch {
    return false;
  }
}

function createDeterministicTarball(sourceDir, outputPath) {
  const tarCmd = findTarCommand();
  const useGnu = isGnuTar(tarCmd);

  // Environment for deterministic output
  const env = {
    ...process.env,
    COPYFILE_DISABLE: '1',      // macOS: disable extended attributes
    GZIP: '-n',                  // gzip: no timestamp in header
    LC_ALL: 'C',                 // Consistent sorting locale
  };

  const sourceBase = path.basename(sourceDir);
  const sourceParent = path.dirname(sourceDir);

  if (useGnu) {
    // GNU tar: use built-in deterministic options
    const args = [
      '--create',
      '--gzip',
      '--file', outputPath,
      '--directory', sourceParent,
      '--sort=name',
      '--mtime=@0',              // Unix epoch for all files
      '--owner=0',
      '--group=0',
      '--numeric-owner',
      '--no-acls',
      '--no-selinux',
      '--no-xattrs',
      sourceBase
    ];

    const result = spawnSync(tarCmd, args, { env, encoding: 'utf8' });
    if (result.status !== 0) {
      throw new Error(`tar failed: ${result.stderr || result.error}`);
    }
  } else {
    // BSD tar (macOS): need workaround for determinism
    // Get sorted file list (files only, not directories - tar will create dir entries)
    const findResult = spawnSync('find', ['.', '-type', 'f', '-print0'], {
      cwd: sourceDir,
      encoding: 'buffer',
      env
    });

    if (findResult.status !== 0) {
      throw new Error(`find failed: ${findResult.stderr}`);
    }

    // Sort the null-delimited file list
    const files = findResult.stdout
      .toString('utf8')
      .split('\0')
      .filter(f => f.length > 0)
      .sort();

    // BSD tar doesn't support reading from stdin reliably for this,
    // so we'll use a file list approach via -T
    const listFile = path.join(os.tmpdir(), `env-backup-list-${process.pid}`);
    fs.writeFileSync(listFile, files.join('\n'));

    try {
      // Pipe through gzip -n for deterministic compression
      const tarProc = spawnSync('sh', [
        '-c',
        `${tarCmd} -cf - -C '${sourceDir}' --no-mac-metadata -T '${listFile}' | gzip -n > '${outputPath}'`
      ], { env, encoding: 'utf8' });

      if (tarProc.status !== 0) {
        throw new Error(`tar/gzip failed: ${tarProc.stderr || tarProc.error}`);
      }
    } finally {
      try { fs.unlinkSync(listFile); } catch {}
    }

    // Note: BSD tar doesn't support --mtime, so mtimes will vary.
    // For full determinism on macOS, install GNU tar: brew install gnu-tar
    log(`  Note: Using BSD tar. For fully deterministic archives, install gtar (brew install gnu-tar)`);
  }
}

function hashDirectory(dirPath) {
  // Create deterministic tarball in temp location and hash it
  const tempTar = path.join(os.tmpdir(), `env-backup-${process.pid}-${Date.now()}.tar.gz`);

  try {
    createDeterministicTarball(dirPath, tempTar);
    const hash = hashFile(tempTar);
    return { hash, tempTar };
  } catch (err) {
    try { fs.unlinkSync(tempTar); } catch {}
    throw err;
  }
}

function backupEntry(entry) {
  const { name, source, latest, archiveDir } = entry;

  log(`Processing: ${name}`);

  // Check if source exists
  if (!fs.existsSync(source)) {
    log(`  SKIP: Source does not exist: ${source}`);
    return { name, status: 'skipped', reason: 'source not found' };
  }

  const isDir = isDirectory(source);
  log(`  Type: ${isDir ? 'directory' : 'file'}`);

  // For directories, latest should be a .tar.gz file
  const effectiveLatest = isDir && !latest.endsWith('.tar.gz')
    ? `${latest}.tar.gz`
    : latest;

  let sourceHash;
  let tempTarPath = null;

  if (isDir) {
    // Create deterministic tarball and get hash
    const result = hashDirectory(source);
    sourceHash = result.hash;
    tempTarPath = result.tempTar;
  } else {
    sourceHash = hashFile(source);
  }

  log(`  Source hash: ${sourceHash.substring(0, 12)}...`);

  // Check if latest backup exists and compare hashes
  if (fs.existsSync(effectiveLatest)) {
    const latestHash = hashFile(effectiveLatest);
    log(`  Latest hash: ${latestHash.substring(0, 12)}...`);

    if (sourceHash === latestHash) {
      log(`  SKIP: No changes detected`);
      // Clean up temp tarball if we created one
      if (tempTarPath) {
        try { fs.unlinkSync(tempTarPath); } catch {}
      }
      return { name, status: 'unchanged' };
    }

    // Rotate latest to archive
    ensureDir(archiveDir);
    const timestamp = getTimestamp();
    const archiveName = makeArchiveName(path.basename(effectiveLatest), timestamp);
    const archivePath = path.join(archiveDir, archiveName);

    fs.copyFileSync(effectiveLatest, archivePath);
    log(`  Archived previous: ${archivePath}`);
  }

  // Update latest
  ensureDir(path.dirname(effectiveLatest));

  if (isDir) {
    // Move temp tarball to latest location
    fs.renameSync(tempTarPath, effectiveLatest);
  } else {
    fs.copyFileSync(source, effectiveLatest);
  }

  log(`  Updated latest: ${effectiveLatest}`);

  return { name, status: 'backed_up' };
}

function main() {
  log(`Starting env backup`);
  log(`Config: ${CONFIG_PATH}`);

  if (!fs.existsSync(CONFIG_PATH)) {
    console.error(`Config file not found: ${CONFIG_PATH}`);
    process.exit(1);
  }

  const config = JSON5.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  const results = [];

  for (const entry of config.backups) {
    try {
      const result = backupEntry(entry);
      results.push(result);
    } catch (err) {
      log(`  ERROR: ${err.message}`);
      results.push({ name: entry.name, status: 'error', error: err.message });
    }
  }

  log(`Backup complete`);
  log(`Summary:`);
  for (const r of results) {
    log(`  ${r.name}: ${r.status}${r.reason ? ` (${r.reason})` : ''}${r.error ? ` - ${r.error}` : ''}`);
  }
}

// Run if executed directly, export if required as module
if (require.main === module) {
  main();
}

module.exports = {
  hashFile,
  ensureDir,
  getTimestamp,
  makeArchiveName,
  isDirectory,
  findTarCommand,
  isGnuTar,
  createDeterministicTarball,
  hashDirectory,
  backupEntry,
  main,
};
