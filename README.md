# 🔐 SaralLicence — Software Licence Management System

<div align="center">

> **This License Management System allows any software to be securely controlled through a License Key,**
> **enabling centralized activation, validation, feature control, subscription management,**
> **and remote enable/disable capabilities from a single Admin Dashboard.**

![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.x-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white)

</div>

---

## ✨ Key Capabilities

| Feature | Description |
|---------|-------------|
| 🔑 **License Key Control** | Securely control any software through unique, cryptographically signed licence keys |
| 🚀 **Centralized Activation** | Activate software on specific machines with hardware fingerprinting |
| ✅ **Online Validation** | Periodically validate licences against the central server |
| 🎛️ **Feature Flag Control** | Enable/disable specific software features per licence type |
| 📅 **Subscription Management** | Support for `TRIAL`, `ANNUAL`, `ENTERPRISE`, and `LIFETIME` plans |
| 🔴 **Remote Enable/Disable** | Instantly suspend or revoke any licence from the Admin Dashboard |
| 🖥️ **Multi-Platform Integration** | Works with React, Node.js, Python, PHP — any software stack |
| 🌐 **Offline Grace Period** | 7-day offline grace period with tamper-proof clock rollback detection |
| 📊 **Audit Logs** | Full server-side logging of all activation and validation attempts |
| 🔒 **Ed25519 Cryptography** | Licence certificates signed with industry-standard asymmetric keys |

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18 + TypeScript + Vite + TailwindCSS |
| **Backend** | Node.js + Express + TypeScript |
| **Database** | MySQL 8 via Sequelize ORM |
| **Auth** | JWT (Access + Refresh Tokens) + HTTP-only Cookies |
| **Security** | Helmet, CORS, Ed25519 Key Signing, Rate Limiting |
| **Dev Tools** | ts-node, nodemon, bcryptjs, zod validation |

---

## 📋 Table of Contents

- [Overview](#overview)
- [📘 Client API Integration Guide (INTEGRATION_GUIDE.md)](INTEGRATION_GUIDE.md)
- [How the System Works](#how-the-system-works)
- [Quick Start](#quick-start)
- [Step 1 — Generate a Licence Key (Admin Panel)](#step-1--generate-a-licence-key-admin-panel)
- [Step 2 — API Endpoints Reference](#step-2--api-endpoints-reference)
- [Step 3 — Integration (React / Vite / Next.js Projects)](#step-3--integration-react--vite--nextjs-projects)
- [Step 4 — Integration (Node.js / Express Backend)](#step-4--integration-nodejs--express-backend)
- [Step 5 — Integration (Python Projects)](#step-5--integration-python-projects)
- [Step 6 — Integration (PHP Projects)](#step-6--integration-php-projects)
- [Licence Status Codes Reference](#licence-status-codes-reference)
- [Offline Grace Period](#offline-grace-period)
- [Deactivation (Server Migration)](#deactivation-server-migration)
- [Environment Variables](#environment-variables)
- [Troubleshooting](#troubleshooting)

---

## Overview

**SaralLicence** is a centralized, enterprise-grade software licence management server built on the MERN stack. It allows you to protect any software — web apps, desktop apps, or server applications — behind a secure licence key system managed from a single Admin Dashboard.

Once you generate a licence key from the admin panel, embed the small licensing module into any client project (React, Node.js, Python, PHP) to:

- **Activate** the software on a specific machine using the licence key
- **Validate** the licence periodically (online + offline grace)
- **Enforce** expiry dates, max activations, and feature flags
- **Remotely disable** any installation instantly from the Admin Panel
- **Migrate** licences between machines via deactivation workflow

---

## Quick Start

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd Mern_Licence

# 2. Copy and configure environment
cp .env.example .env
# Edit .env with your MySQL credentials

# 3. Install dependencies
cd backend && npm install
cd ../frontend && npm install

# 4. Run database migrations & seed
cd backend && npm run migrate && npm run seed

# 5. Start the servers
# Terminal 1 — Backend API (port 8000)
cd backend && npm run dev

# Terminal 2 — Frontend Dashboard (port 3000)
cd frontend && npm run dev
```

> **Admin Panel:** http://localhost:3000 | **API Server:** http://localhost:8000

> **Default Login:** `admin@saraltech.com` / `AdminPassword123!`

---

## How the System Works

```
┌────────────────────┐         ┌──────────────────────────┐
│  Admin Panel       │         │  Licence Server (API)    │
│  (SaralLicence)    │────────▶│  http://localhost:8000   │
│                    │ Generate│  /api/licences/activate  │
│  Customer + Product│ Key     │  /api/licences/validate  │
│  → Licence Key 🔑  │         │  /api/licences/deactivate│
└────────────────────┘         └────────────┬─────────────┘
                                             │ REST API calls
                               ┌─────────────▼─────────────┐
                               │  Your Client Software      │
                               │  (React / Node / Python)   │
                               │                            │
                               │  1. Call activate on       │
                               │     first run              │
                               │  2. Validate periodically  │
                               │  3. Block if invalid       │
                               └────────────────────────────┘
```

---

## Step 1 — Generate a Licence Key (Admin Panel)

1. Login to the **SaralLicence Admin Panel** at `http://localhost:5173`
   - **Username**: `admin` or `admin@saraltech.com`
   - **Password**: `AdminPassword123!`

2. Go to **Customer Directory** → Add a Customer (if not added)

3. Go to **Software Products** → Confirm your product is listed (e.g. `EMS`, `POS`, `ERP`)

4. Go to **Software Licence Administration** → Click **"Generate New Licence"**
   - Select **Customer**
   - Select **Product Code** (must match your software's product code)
   - Select **Licence Type**: `TRIAL` (30 days) / `ANNUAL` / `ENTERPRISE` / `LIFETIME`
   - Set **Max Activations** (how many machines can use this key)
   - Click **Generate**

5. **⚠️ CRITICAL**: Copy the generated licence key immediately — it is shown **ONLY ONCE** and cannot be recovered!

   Example key format:
   ```
   EMS-PRO-2DA3-1150-457F-025A-3F9B
   ```

---

## Step 2 — API Endpoints Reference

Base URL: `http://your-licence-server.com/api`

### POST `/licences/activate`
Activate a machine with a licence key.

**Request Body:**
```json
{
  "licenceKey": "EMS-PRO-2DA3-1150-457F-025A",
  "installationId": "unique-machine-id-here",
  "fingerprintHash": "sha256-hash-of-machine-fingerprint",
  "productCode": "EMS",
  "appVersion": "1.0.0",
  "hostname": "DESKTOP-XYZ",
  "operatingSystem": "Windows 11"
}
```

**Success Response `200`:**
```json
{
  "success": true,
  "message": "Licence activated successfully.",
  "activationId": 5,
  "licenceReference": "LIC-2026-XXXXXX",
  "expiresAt": "2027-07-31T00:00:00.000Z",
  "maxUsers": 10,
  "maxMachines": 5,
  "licenceType": "ANNUAL",
  "features": ["CORE_MODULE"]
}
```

**Error Response `400`:**
```json
{
  "success": false,
  "message": "Max activations limit reached for this licence."
}
```

---

### POST `/licences/validate`
Validate an existing activation (call this periodically).

**Request Body:**
```json
{
  "licenceReference": "LIC-2026-XXXXXX",
  "installationId": "unique-machine-id-here",
  "fingerprintHash": "sha256-hash-of-machine-fingerprint"
}
```

**Success Response `200`:**
```json
{
  "success": true,
  "valid": true,
  "code": "LICENCE_VALID",
  "message": "Licence is valid and active.",
  "expiresAt": "2027-07-31T00:00:00.000Z",
  "features": ["CORE_MODULE"]
}
```

---

### POST `/licences/deactivate`
Deactivate this machine's installation (for server migration).

**Request Body:**
```json
{
  "activationId": 5
}
```

**Success Response `200`:**
```json
{
  "success": true,
  "message": "Licence deactivated successfully."
}
```

---

## Step 3 — Integration (React / Vite / Next.js Projects)

### 3.1 — Copy the Licensing Module

Copy the entire folder from this project:
```
frontend/src/modules/licensing/
```
Into your project:
```
src/modules/licensing/
```

### 3.2 — Set Environment Variable

In your project's `.env` file:
```env
VITE_LICENCE_SERVER_URL=http://localhost:8000/api
VITE_PRODUCT_CODE=EMS
```

### 3.3 — Update `licenceApi.ts`

```typescript
// src/modules/licensing/services/licenceApi.ts

const LICENCE_SERVER = import.meta.env.VITE_LICENCE_SERVER_URL || 'http://localhost:8000/api';
const PRODUCT_CODE = import.meta.env.VITE_PRODUCT_CODE || 'EMS';
```

### 3.4 — Wrap your App with `LicenceProvider`

```tsx
// src/main.tsx
import { LicenceProvider } from './modules/licensing/context/LicenceContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <LicenceProvider>
    <App />
  </LicenceProvider>
);
```

### 3.5 — Use the `useLicence` Hook

```tsx
// src/App.tsx
import { useLicence } from './modules/licensing/hooks/useLicence';

function App() {
  const { valid, loading, status, features, activate, licence } = useLicence();

  if (loading) return <div>Checking licence...</div>;

  if (!valid) {
    return <LicenceActivationPage onActivate={activate} />;
  }

  return (
    <div>
      <p>✅ Licence Valid: {licence?.licenceReference}</p>
      <p>Expires: {licence?.expiresAt || 'Lifetime'}</p>
      <p>Max Users: {features.maxUsers}</p>
      <YourMainApp />
    </div>
  );
}
```

### 3.6 — Create Activation Page

```tsx
// src/pages/LicenceActivationPage.tsx
import React, { useState } from 'react';
import { useLicence } from '../modules/licensing/hooks/useLicence';

export const LicenceActivationPage = () => {
  const { activate, activating, error } = useLicence();
  const [key, setKey] = useState('');
  const [result, setResult] = useState('');

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await activate(key.trim());
    setResult(res.message);
  };

  return (
    <div>
      <h1>🔐 Software Activation Required</h1>
      <form onSubmit={handleActivate}>
        <input
          type="text"
          placeholder="Enter your licence key (e.g. EMS-PRO-XXXX-XXXX)"
          value={key}
          onChange={(e) => setKey(e.target.value)}
        />
        <button type="submit" disabled={activating}>
          {activating ? 'Activating...' : 'Activate Software'}
        </button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {result && <p>{result}</p>}
    </div>
  );
};
```

### 3.7 — Generate Machine Fingerprint & Installation ID

The client must send a stable machine identifier. Example utility:

```typescript
// src/utils/machineId.ts
import { createHash } from 'crypto';

export function getMachineInstallationId(): string {
  // Use a stored UUID (create once, save to localStorage or config file)
  let id = localStorage.getItem('_installation_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('_installation_id', id);
  }
  return id;
}

export function getMachineFingerprintHash(): string {
  const raw = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  ].join('|');

  // For browser: use SubtleCrypto or a simple hash
  // For Electron/Node: use os.hostname() + cpus + MAC address
  return btoa(raw).slice(0, 64); // Simplified — use sha256 in production
}
```

> **For Electron / Desktop apps**: Use `os.hostname()`, network interface MAC address, and CPU ID for a stable fingerprint.

---

## Step 4 — Integration (Node.js / Express Backend)

```javascript
// licenceClient.js
const axios = require('axios');
const crypto = require('crypto');
const os = require('os');
const fs = require('fs');

const LICENCE_SERVER = process.env.LICENCE_SERVER_URL || 'http://localhost:8000/api';
const PRODUCT_CODE = process.env.PRODUCT_CODE || 'EMS';
const INSTALLATION_FILE = './licence-installation.json';

function getMachineFingerprint() {
  const interfaces = os.networkInterfaces();
  const mac = Object.values(interfaces)
    .flat()
    .find((i) => !i.internal && i.mac !== '00:00:00:00:00:00')?.mac || 'unknown';

  const raw = `${os.hostname()}|${os.platform()}|${mac}|${PRODUCT_CODE}`;
  return crypto.createHash('sha256').update(raw).digest('hex');
}

function getOrCreateInstallationId() {
  if (fs.existsSync(INSTALLATION_FILE)) {
    return JSON.parse(fs.readFileSync(INSTALLATION_FILE)).installationId;
  }
  const id = crypto.randomUUID();
  fs.writeFileSync(INSTALLATION_FILE, JSON.stringify({ installationId: id }));
  return id;
}

async function activateLicence(licenceKey) {
  const installationId = getOrCreateInstallationId();
  const fingerprintHash = getMachineFingerprint();

  const { data } = await axios.post(`${LICENCE_SERVER}/licences/activate`, {
    licenceKey,
    installationId,
    fingerprintHash,
    productCode: PRODUCT_CODE,
    appVersion: process.env.APP_VERSION || '1.0.0',
    hostname: os.hostname(),
    operatingSystem: `${os.platform()} ${os.release()}`,
  });

  if (data.success) {
    // Save licence reference for future validations
    const existing = fs.existsSync(INSTALLATION_FILE)
      ? JSON.parse(fs.readFileSync(INSTALLATION_FILE))
      : {};
    fs.writeFileSync(INSTALLATION_FILE, JSON.stringify({
      ...existing,
      licenceReference: data.licenceReference,
      activationId: data.activationId,
    }));
    console.log('✅ Licence activated:', data.licenceReference);
    return true;
  }

  throw new Error(data.message);
}

async function validateLicence() {
  if (!fs.existsSync(INSTALLATION_FILE)) return false;

  const { installationId, licenceReference } = JSON.parse(fs.readFileSync(INSTALLATION_FILE));
  if (!licenceReference) return false;

  const fingerprintHash = getMachineFingerprint();

  try {
    const { data } = await axios.post(`${LICENCE_SERVER}/licences/validate`, {
      licenceReference,
      installationId,
      fingerprintHash,
    });
    return data.success && data.valid;
  } catch {
    return false; // Falls back to offline grace period
  }
}

// Usage in your app startup:
async function checkLicenceOnStartup() {
  const isValid = await validateLicence();
  if (!isValid) {
    console.error('❌ Licence validation failed. Please activate your software.');
    process.exit(1); // Or show activation prompt
  }
  console.log('✅ Licence is valid. Starting application...');
}

module.exports = { activateLicence, validateLicence, checkLicenceOnStartup };
```

**Usage in `server.js`:**
```javascript
const { checkLicenceOnStartup } = require('./licenceClient');

async function startServer() {
  await checkLicenceOnStartup(); // Blocks startup if licence invalid
  
  const app = express();
  // ... rest of your server setup
  app.listen(3000, () => console.log('Server running on port 3000'));
}

startServer();
```

---

## Step 5 — Integration (Python Projects)

```python
# licence_client.py
import requests
import hashlib
import uuid
import platform
import socket
import json
import os

LICENCE_SERVER = os.getenv("LICENCE_SERVER_URL", "http://localhost:8000/api")
PRODUCT_CODE = os.getenv("PRODUCT_CODE", "EMS")
INSTALLATION_FILE = "licence_installation.json"


def get_machine_fingerprint():
    raw = f"{socket.gethostname()}|{platform.system()}|{platform.machine()}|{PRODUCT_CODE}"
    return hashlib.sha256(raw.encode()).hexdigest()


def get_or_create_installation_id():
    if os.path.exists(INSTALLATION_FILE):
        with open(INSTALLATION_FILE) as f:
            data = json.load(f)
            return data.get("installationId")
    
    installation_id = str(uuid.uuid4())
    with open(INSTALLATION_FILE, "w") as f:
        json.dump({"installationId": installation_id}, f)
    return installation_id


def activate_licence(licence_key: str) -> bool:
    installation_id = get_or_create_installation_id()
    fingerprint_hash = get_machine_fingerprint()

    resp = requests.post(f"{LICENCE_SERVER}/licences/activate", json={
        "licenceKey": licence_key,
        "installationId": installation_id,
        "fingerprintHash": fingerprint_hash,
        "productCode": PRODUCT_CODE,
        "appVersion": "1.0.0",
        "hostname": socket.gethostname(),
        "operatingSystem": platform.system() + " " + platform.release(),
    })

    data = resp.json()
    if data.get("success"):
        # Save licence reference
        with open(INSTALLATION_FILE) as f:
            existing = json.load(f)
        existing["licenceReference"] = data["licenceReference"]
        existing["activationId"] = data["activationId"]
        with open(INSTALLATION_FILE, "w") as f:
            json.dump(existing, f)
        print(f"✅ Licence activated: {data['licenceReference']}")
        return True

    print(f"❌ Activation failed: {data.get('message')}")
    return False


def validate_licence() -> bool:
    if not os.path.exists(INSTALLATION_FILE):
        return False

    with open(INSTALLATION_FILE) as f:
        data = json.load(f)

    licence_reference = data.get("licenceReference")
    installation_id = data.get("installationId")
    if not licence_reference:
        return False

    try:
        resp = requests.post(f"{LICENCE_SERVER}/licences/validate", json={
            "licenceReference": licence_reference,
            "installationId": installation_id,
            "fingerprintHash": get_machine_fingerprint(),
        }, timeout=10)
        result = resp.json()
        return result.get("success") and result.get("valid")
    except Exception:
        return False  # Offline grace period applies


# Usage at startup
if __name__ == "__main__":
    if not validate_licence():
        key = input("Enter your licence key: ")
        if not activate_licence(key):
            print("Cannot start application without a valid licence.")
            exit(1)
    print("✅ Application started successfully.")
```

---

## Step 6 — Integration (PHP Projects)

```php
<?php
// LicenceClient.php

class LicenceClient {
    private string $serverUrl;
    private string $productCode;
    private string $installationFile;

    public function __construct(
        string $serverUrl = 'http://localhost:8000/api',
        string $productCode = 'EMS',
        string $installationFile = __DIR__ . '/licence_installation.json'
    ) {
        $this->serverUrl = $serverUrl;
        $this->productCode = $productCode;
        $this->installationFile = $installationFile;
    }

    private function getMachineFingerprint(): string {
        $raw = gethostname() . '|' . PHP_OS . '|' . $this->productCode;
        return hash('sha256', $raw);
    }

    private function getOrCreateInstallationId(): string {
        if (file_exists($this->installationFile)) {
            $data = json_decode(file_get_contents($this->installationFile), true);
            return $data['installationId'] ?? $this->createInstallationId();
        }
        return $this->createInstallationId();
    }

    private function createInstallationId(): string {
        $id = sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000, mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );
        file_put_contents($this->installationFile, json_encode(['installationId' => $id]));
        return $id;
    }

    private function httpPost(string $endpoint, array $payload): array {
        $ch = curl_init($this->serverUrl . $endpoint);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_POSTFIELDS => json_encode($payload),
            CURLOPT_TIMEOUT => 10,
        ]);
        $response = curl_exec($ch);
        curl_close($ch);
        return json_decode($response, true) ?? [];
    }

    public function activateLicence(string $licenceKey): bool {
        $installationId = $this->getOrCreateInstallationId();
        $result = $this->httpPost('/licences/activate', [
            'licenceKey' => $licenceKey,
            'installationId' => $installationId,
            'fingerprintHash' => $this->getMachineFingerprint(),
            'productCode' => $this->productCode,
            'appVersion' => '1.0.0',
            'hostname' => gethostname(),
            'operatingSystem' => PHP_OS,
        ]);

        if ($result['success'] ?? false) {
            $data = json_decode(file_get_contents($this->installationFile), true);
            $data['licenceReference'] = $result['licenceReference'];
            $data['activationId'] = $result['activationId'];
            file_put_contents($this->installationFile, json_encode($data));
            return true;
        }

        return false;
    }

    public function validateLicence(): bool {
        if (!file_exists($this->installationFile)) return false;

        $data = json_decode(file_get_contents($this->installationFile), true);
        if (empty($data['licenceReference'])) return false;

        try {
            $result = $this->httpPost('/licences/validate', [
                'licenceReference' => $data['licenceReference'],
                'installationId' => $data['installationId'],
                'fingerprintHash' => $this->getMachineFingerprint(),
            ]);
            return ($result['success'] ?? false) && ($result['valid'] ?? false);
        } catch (Exception $e) {
            return false; // Offline grace period applies
        }
    }
}

// Usage:
$licence = new LicenceClient('http://localhost:8000/api', 'EMS');

if (!$licence->validateLicence()) {
    $key = readline("Enter licence key: ");
    if (!$licence->activateLicence($key)) {
        die("❌ Invalid licence. Application cannot start.\n");
    }
}

echo "✅ Application started.\n";
```

---

## Licence Status Codes Reference

| Code | Meaning | Action Required |
|------|---------|-----------------|
| `LICENCE_VALID` | ✅ Licence is active and verified | None — continue normally |
| `LICENCE_REQUIRED` | ❌ No licence found | Show activation form |
| `LICENCE_EXPIRED` | ⏰ Licence has expired | Contact admin to renew |
| `LICENCE_SUSPENDED` | ⛔ Licence suspended by admin | Contact admin |
| `LICENCE_REVOKED` | 🚫 Licence permanently revoked | Contact admin |
| `INSTALLATION_MISMATCH` | 🖥️ Machine fingerprint changed | Re-activate or contact admin |
| `FINGERPRINT_MISMATCH` | 🔒 Hardware changed significantly | Re-activate on this machine |
| `ONLINE_VALIDATION_REQUIRED` | 🌐 Grace period expired | Connect to internet to validate |
| `CLOCK_ROLLBACK_DETECTED` | ⚠️ System clock tampered | Fix system time |

---

## Offline Grace Period

When the licence server is **unreachable** (no internet), the software uses a local offline grace period.

- Default: **7 days** (configurable in Admin Panel per licence)
- During grace period: Software continues to work normally
- After grace period expires: Software shows validation required warning

**How it works:**
```
Day 1 — Server unreachable → Start grace period counter
Day 7 — Still unreachable  → Show warning
Day 8 — Still unreachable  → Block usage (ONLINE_VALIDATION_REQUIRED)
Day 8 — Server reachable   → Validate, reset counter ✅
```

---

## Deactivation (Server Migration)

To move the software to a new machine:

1. Call deactivate on the old machine:
```bash
curl -X POST http://localhost:8000/api/licences/deactivate \
  -H "Content-Type: application/json" \
  -d '{"activationId": 5}'
```

2. Delete the `licence_installation.json` file on the old machine

3. Activate on the new machine using the same licence key

Or from Admin Panel: **Active Installations** → Click **"Deactivate"** on the old machine row.

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `LICENCE_SERVER_URL` | URL of the SaralLicence API server | `http://localhost:8000/api` |
| `PRODUCT_CODE` | Your product code (must match admin panel) | `EMS` |
| `APP_VERSION` | Your application version | `1.0.0` |
| `LICENCE_OFFLINE_GRACE_DAYS` | Days allowed offline (set per licence in admin) | `7` |

---

## Troubleshooting

### ❌ "licenceKey, installationId, fingerprintHash, and productCode are required"
- Make sure all 4 required fields are sent in the request body.
- `productCode` must **exactly** match the product code registered in the Admin Panel.

### ❌ "Invalid licence key"
- Check that you copied the full licence key (format: `EMS-PRO-XXXX-XXXX-XXXX-XXXX`)
- Licence keys are **case-sensitive**
- Ensure the key wasn't already revoked or expired

### ❌ "Max activations limit reached"
- Go to Admin Panel → Software Licence Administration → Edit the licence → Increase Max Activations
- Or deactivate old installations from the **Active Installations** page

### ❌ "Licence validation failed" on startup
- Confirm `LICENCE_SERVER_URL` points to the running SaralLicence server
- Ensure port `8000` is accessible from the client machine (firewall rules)
- Check server status: `curl http://localhost:8000/api/auth/setup-status`

### ❌ 401 Unauthorized on Admin Panel
- Username: `admin` or `admin@saraltech.com`
- Password: `AdminPassword123!`

---

## Quick Reference — cURL Test Commands

```bash
# Test server connectivity
curl http://localhost:8000/api/auth/setup-status

# Activate a licence key
curl -X POST http://localhost:8000/api/licences/activate \
  -H "Content-Type: application/json" \
  -d '{
    "licenceKey": "EMS-PRO-XXXX-XXXX-XXXX-XXXX",
    "installationId": "my-unique-machine-001",
    "fingerprintHash": "abcdef1234567890abcdef1234567890",
    "productCode": "EMS",
    "appVersion": "1.0.0",
    "hostname": "WORKSTATION-01",
    "operatingSystem": "Windows 11"
  }'

# Validate an existing licence
curl -X POST http://localhost:8000/api/licences/validate \
  -H "Content-Type: application/json" \
  -d '{
    "licenceReference": "LIC-2026-XXXXXXX",
    "installationId": "my-unique-machine-001",
    "fingerprintHash": "abcdef1234567890abcdef1234567890"
  }'

# Deactivate a machine
curl -X POST http://localhost:8000/api/licences/deactivate \
  -H "Content-Type: application/json" \
  -d '{"activationId": 5}'
```

---

## Security Best Practices

- 🔐 **Never expose** the raw licence key in client-side JavaScript bundles
- 🔒 Store `licenceReference` and `activationId` in **server-side config files**, not browser localStorage for production
- 🌐 In production, always use **HTTPS** for the licence server (`https://your-domain.com/api`)
- 🖥️ For **Electron desktop apps**, use OS-level keychain to store the activation data
- 🔄 Set up **periodic validation** (every 24 hours) to detect licence expiry promptly
- 📋 Log all activation attempts server-side (already built into SaralLicence audit logs)

---

*SaralLicence — Enterprise Software Licence Management System by SaralTech*
