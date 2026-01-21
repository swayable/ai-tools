const fs = require('fs');
const path = require('path');
const os = require('os');
const {
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
} = require('./backup');

// Helper to create temp test directories
function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'env-backup-test-'));
}

function cleanup(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

describe('hashFile', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    cleanup(tempDir);
  });

  test('returns consistent hash for same content', () => {
    const file = path.join(tempDir, 'test.txt');
    fs.writeFileSync(file, 'hello world');

    const hash1 = hashFile(file);
    const hash2 = hashFile(file);

    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hex
  });

  test('returns different hash for different content', () => {
    const file1 = path.join(tempDir, 'test1.txt');
    const file2 = path.join(tempDir, 'test2.txt');
    fs.writeFileSync(file1, 'hello');
    fs.writeFileSync(file2, 'world');

    expect(hashFile(file1)).not.toBe(hashFile(file2));
  });
});

describe('makeArchiveName', () => {
  const timestamp = '2024-01-15T10-30-00';

  test('handles .tar.gz files', () => {
    expect(makeArchiveName('backup.tar.gz', timestamp))
      .toBe('backup.2024-01-15T10-30-00.tar.gz');
  });

  test('handles single extension files', () => {
    expect(makeArchiveName('config.json', timestamp))
      .toBe('config.2024-01-15T10-30-00.json');
  });

  test('handles files without extension', () => {
    expect(makeArchiveName('Makefile', timestamp))
      .toBe('Makefile.2024-01-15T10-30-00');
  });

  test('handles dotfiles (no extension)', () => {
    // .bashrc has no extension per path.extname(), so timestamp is appended
    expect(makeArchiveName('.bashrc', timestamp))
      .toBe('.bashrc.2024-01-15T10-30-00');
  });

  test('handles dotfiles with extension', () => {
    expect(makeArchiveName('.bashrc.bak', timestamp))
      .toBe('.bashrc.2024-01-15T10-30-00.bak');
  });
});

describe('getTimestamp', () => {
  test('returns ISO-like format without colons', () => {
    const ts = getTimestamp();
    expect(ts).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}$/);
  });

  test('does not contain colons or milliseconds', () => {
    const ts = getTimestamp();
    expect(ts).not.toContain(':');
    expect(ts).not.toContain('.');
    expect(ts).not.toContain('Z');
  });
});

describe('isDirectory', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    cleanup(tempDir);
  });

  test('returns true for directory', () => {
    expect(isDirectory(tempDir)).toBe(true);
  });

  test('returns false for file', () => {
    const file = path.join(tempDir, 'test.txt');
    fs.writeFileSync(file, 'content');
    expect(isDirectory(file)).toBe(false);
  });

  test('returns false for non-existent path', () => {
    expect(isDirectory('/nonexistent/path')).toBe(false);
  });
});

describe('ensureDir', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    cleanup(tempDir);
  });

  test('creates nested directories', () => {
    const nested = path.join(tempDir, 'a', 'b', 'c');
    ensureDir(nested);
    expect(fs.existsSync(nested)).toBe(true);
  });

  test('does nothing if directory exists', () => {
    ensureDir(tempDir);
    expect(fs.existsSync(tempDir)).toBe(true);
  });
});

describe('findTarCommand and isGnuTar', () => {
  test('findTarCommand returns a string', () => {
    const cmd = findTarCommand();
    expect(typeof cmd).toBe('string');
    expect(['tar', 'gtar']).toContain(cmd);
  });

  test('isGnuTar returns boolean', () => {
    const cmd = findTarCommand();
    expect(typeof isGnuTar(cmd)).toBe('boolean');
  });
});

describe('createDeterministicTarball', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    cleanup(tempDir);
  });

  test('creates a valid gzipped tarball', () => {
    const sourceDir = path.join(tempDir, 'source');
    fs.mkdirSync(sourceDir);
    fs.writeFileSync(path.join(sourceDir, 'file.txt'), 'content');

    const outputPath = path.join(tempDir, 'output.tar.gz');
    createDeterministicTarball(sourceDir, outputPath);

    expect(fs.existsSync(outputPath)).toBe(true);
    // Check it's a gzip file (magic bytes: 1f 8b)
    const header = Buffer.alloc(2);
    const fd = fs.openSync(outputPath, 'r');
    fs.readSync(fd, header, 0, 2, 0);
    fs.closeSync(fd);
    expect(header[0]).toBe(0x1f);
    expect(header[1]).toBe(0x8b);
  });

  test('produces deterministic output for same content', () => {
    const sourceDir = path.join(tempDir, 'source');
    fs.mkdirSync(sourceDir);
    fs.writeFileSync(path.join(sourceDir, 'file.txt'), 'content');

    const output1 = path.join(tempDir, 'output1.tar.gz');
    const output2 = path.join(tempDir, 'output2.tar.gz');

    createDeterministicTarball(sourceDir, output1);
    createDeterministicTarball(sourceDir, output2);

    expect(hashFile(output1)).toBe(hashFile(output2));
  });
});

describe('hashDirectory', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    cleanup(tempDir);
  });

  test('returns hash and temp tarball path', () => {
    const sourceDir = path.join(tempDir, 'source');
    fs.mkdirSync(sourceDir);
    fs.writeFileSync(path.join(sourceDir, 'file.txt'), 'content');

    const result = hashDirectory(sourceDir);

    expect(result.hash).toMatch(/^[a-f0-9]{64}$/);
    expect(fs.existsSync(result.tempTar)).toBe(true);

    // Cleanup temp tar
    fs.unlinkSync(result.tempTar);
  });

  test('returns consistent hash for same directory content', () => {
    const sourceDir = path.join(tempDir, 'source');
    fs.mkdirSync(sourceDir);
    fs.writeFileSync(path.join(sourceDir, 'file.txt'), 'content');

    const result1 = hashDirectory(sourceDir);
    fs.unlinkSync(result1.tempTar);

    const result2 = hashDirectory(sourceDir);
    fs.unlinkSync(result2.tempTar);

    expect(result1.hash).toBe(result2.hash);
  });
});

describe('backupEntry', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    cleanup(tempDir);
  });

  describe('file backup', () => {
    test('backs up a new file', () => {
      const source = path.join(tempDir, 'source.txt');
      const latest = path.join(tempDir, 'backup', 'latest.txt');
      const archiveDir = path.join(tempDir, 'backup', 'archive');

      fs.writeFileSync(source, 'content');

      const result = backupEntry({
        name: 'test-file',
        source,
        latest,
        archiveDir,
      });

      expect(result.status).toBe('backed_up');
      expect(fs.existsSync(latest)).toBe(true);
      expect(fs.readFileSync(latest, 'utf8')).toBe('content');
    });

    test('skips unchanged file', () => {
      const source = path.join(tempDir, 'source.txt');
      const latest = path.join(tempDir, 'backup', 'latest.txt');
      const archiveDir = path.join(tempDir, 'backup', 'archive');

      fs.writeFileSync(source, 'content');
      fs.mkdirSync(path.dirname(latest), { recursive: true });
      fs.writeFileSync(latest, 'content');

      const result = backupEntry({
        name: 'test-file',
        source,
        latest,
        archiveDir,
      });

      expect(result.status).toBe('unchanged');
    });

    test('rotates and updates when file changes', () => {
      const source = path.join(tempDir, 'source.txt');
      const latest = path.join(tempDir, 'backup', 'latest.txt');
      const archiveDir = path.join(tempDir, 'backup', 'archive');

      fs.writeFileSync(source, 'new content');
      fs.mkdirSync(path.dirname(latest), { recursive: true });
      fs.writeFileSync(latest, 'old content');

      const result = backupEntry({
        name: 'test-file',
        source,
        latest,
        archiveDir,
      });

      expect(result.status).toBe('backed_up');
      expect(fs.readFileSync(latest, 'utf8')).toBe('new content');
      expect(fs.existsSync(archiveDir)).toBe(true);

      const archives = fs.readdirSync(archiveDir);
      expect(archives.length).toBe(1);
      expect(archives[0]).toMatch(/^latest\..*\.txt$/);
    });

    test('returns skipped for non-existent source', () => {
      const result = backupEntry({
        name: 'missing',
        source: '/nonexistent/file',
        latest: path.join(tempDir, 'latest'),
        archiveDir: path.join(tempDir, 'archive'),
      });

      expect(result.status).toBe('skipped');
      expect(result.reason).toBe('source not found');
    });
  });

  describe('directory backup', () => {
    test('backs up a new directory as tarball', () => {
      const sourceDir = path.join(tempDir, 'source');
      const latest = path.join(tempDir, 'backup', 'latest');
      const archiveDir = path.join(tempDir, 'backup', 'archive');

      fs.mkdirSync(sourceDir);
      fs.writeFileSync(path.join(sourceDir, 'file.txt'), 'content');

      const result = backupEntry({
        name: 'test-dir',
        source: sourceDir,
        latest,
        archiveDir,
      });

      expect(result.status).toBe('backed_up');
      // Should auto-append .tar.gz
      expect(fs.existsSync(`${latest}.tar.gz`)).toBe(true);
    });

    test('skips unchanged directory', () => {
      const sourceDir = path.join(tempDir, 'source');
      const latest = path.join(tempDir, 'backup', 'latest');
      const archiveDir = path.join(tempDir, 'backup', 'archive');

      fs.mkdirSync(sourceDir);
      fs.writeFileSync(path.join(sourceDir, 'file.txt'), 'content');

      // First backup
      backupEntry({ name: 'test-dir', source: sourceDir, latest, archiveDir });

      // Second backup - should skip
      const result = backupEntry({
        name: 'test-dir',
        source: sourceDir,
        latest,
        archiveDir,
      });

      expect(result.status).toBe('unchanged');
    });

    test('rotates and updates when directory changes', () => {
      const sourceDir = path.join(tempDir, 'source');
      const latest = path.join(tempDir, 'backup', 'latest');
      const archiveDir = path.join(tempDir, 'backup', 'archive');

      fs.mkdirSync(sourceDir);
      fs.writeFileSync(path.join(sourceDir, 'file.txt'), 'original');

      // First backup
      backupEntry({ name: 'test-dir', source: sourceDir, latest, archiveDir });

      // Modify and backup again
      fs.writeFileSync(path.join(sourceDir, 'file.txt'), 'modified');
      const result = backupEntry({
        name: 'test-dir',
        source: sourceDir,
        latest,
        archiveDir,
      });

      expect(result.status).toBe('backed_up');
      expect(fs.existsSync(archiveDir)).toBe(true);

      const archives = fs.readdirSync(archiveDir);
      expect(archives.length).toBe(1);
      expect(archives[0]).toMatch(/^latest\..*\.tar\.gz$/);
    });
  });
});
