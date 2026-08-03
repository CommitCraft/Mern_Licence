# 📖 Client Integration Guide — SaralLicence API

Complete Developer Guide & User Manual for integrating the **SaralLicence Key Control & Validation API** into any client application (React, Node.js, Next.js, Python, PHP, C#, cURL).

---

## 📋 Table of Contents

1. [Overview & Architecture](#1-overview--architecture)
2. [Step-by-Step: How to Generate a Licence Key](#2-step-by-step-how-to-generate-a-licence-key)
3. [API Endpoints Specification](#3-api-endpoints-specification)
4. [Machine Fingerprinting Guide](#4-machine-fingerprinting-guide)
5. [Code Integration Examples](#5-code-integration-examples)
   - [cURL Command Line](#curl-command-line)
   - [React / TypeScript](#react--typescript)
   - [Node.js / Express Backend](#nodejs--express-backend)
   - [Python Application](#python-application)
   - [PHP Script](#php-script)
   - [C# / .NET Application](#c--net-application)
6. [Offline Grace Period & Security Rules](#6-offline-grace-period--security-rules)
7. [Licence Status & Error Reference](#7-licence-status--error-reference)

---

## 1. Overview & Architecture

SaralLicence operates on a **Client-Server Licensing Model**:

```
 ┌──────────────────────────────┐
 │   SaralLicence Admin Panel   │
 │   http://localhost:3000      │
 └──────────────┬───────────────┘
                │ 1. Admin generates Licence Key
                ▼
 ┌──────────────────────────────┐          REST API Call           ┌──────────────────────────────┐
 │   SaralLicence API Server    │ ◄─────────────────────────────── │    Your Client Software      │
 │   http://localhost:8000/api  │   /api/v1/licences/activate    │   (React / Node / Python)    │
 └──────────────────────────────┘   /api/v1/licences/validate     └──────────────────────────────┘
                                    /api/v1/licences/deactivate
```

1. **Admin Key Generation**: Admin creates a Customer, registers a Product Code (e.g. `EMS`), and issues a unique Licence Key.
2. **First Run (Activation)**: Client app collects machine fingerprint, prompts user for Licence Key, and calls `POST /api/v1/licences/activate`.
3. **Periodic Checks (Validation)**: Client app stores activation data locally and calls `POST /api/v1/licences/validate` every 24 hours.
4. **Remote Lock**: Admin can suspend or revoke the licence from the dashboard, instantly locking the client software upon next validation check.

---

## 2. Step-by-Step: How to Generate a Licence Key

### Step 2.1 — Access Admin Panel
1. Open Admin Dashboard: `http://localhost:3000/login`
2. Login with Admin credentials:
   - **Email/Username**: `admin@saraltech.com` or `admin`
   - **Password**: `AdminPassword123!`

### Step 2.2 — Add Customer
1. Navigate to **Customer Directory** (`/customers`)
2. Click **Add Customer**
3. Fill in Company Name (e.g., `Acme Corp`), Email, and Contact details. Click **Create Customer**.

### Step 2.3 — Register Software Product
1. Navigate to **Software Products** (`/products`)
2. Verify or Add your product:
   - **Product Code**: Must match your software's internal code (e.g., `EMS`, `POS`, `ERP`)
   - **Product Name**: Enterprise Management System

### Step 2.4 — Issue Licence Key
1. Navigate to **All Licences** (`/licences`)
2. Click **Generate New Licence**
3. Select:
   - **Customer**: `Acme Corp`
   - **Product Code**: `EMS`
   - **Licence Type**: `TRIAL` (30 days) | `ANNUAL` (1 year) | `ENTERPRISE` (3 years) | `LIFETIME`
   - **Max Activations**: Number of devices allowed (e.g., `5`)
   - **Offline Grace Days**: Days allowed offline before re-validation (default: `7`)
4. Click **Generate Licence**

> ⚠️ **IMPORTANT**: Copy the generated Raw Licence Key immediately! It is displayed **ONLY ONCE** for security reasons.
> 
> Example Key: `EMS-ANNUAL-9F8A-12C4-88E2-A51B`

---

## 3. API Endpoints Specification

Base URL: `http://localhost:8000/api/v1`

---

### 3.1 Activate Licence Key

- **Endpoint**: `POST /api/v1/licences/activate`
- **Headers**: `Content-Type: application/json`

#### Request Payload:
```json
{
  "licenceKey": "EMS-ANNUAL-9F8A-12C4-88E2-A51B",
  "installationId": "INST-MACHINE-001",
  "fingerprintHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "productCode": "EMS",
  "appVersion": "1.0.0",
  "hostname": "WORKSTATION-MAIN",
  "operatingSystem": "Windows 11 Enterprise"
}
```

#### Success Response (`200 OK`):
```json
{
  "success": true,
  "message": "Licence activated successfully.",
  "activationId": 12,
  "licenceReference": "LIC-2026-9A4B12",
  "expiresAt": "2027-08-03T00:00:00.000Z",
  "maxUsers": 10,
  "maxMachines": 5,
  "licenceType": "ANNUAL",
  "features": ["CORE_MODULE", "ADVANCED_REPORTS"]
}
```

#### Error Response (`400 Bad Request`):
```json
{
  "success": false,
  "message": "Max activations limit reached for this licence."
}
```

---

### 3.2 Validate Licence

- **Endpoint**: `POST /api/v1/licences/validate`
- **Headers**: `Content-Type: application/json`

#### Request Payload:
```json
{
  "licenceReference": "LIC-2026-9A4B12",
  "installationId": "INST-MACHINE-001",
  "fingerprintHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
}
```

#### Success Response (`200 OK`):
```json
{
  "success": true,
  "valid": true,
  "code": "LICENCE_VALID",
  "message": "Licence is valid and active.",
  "expiresAt": "2027-08-03T00:00:00.000Z",
  "features": ["CORE_MODULE", "ADVANCED_REPORTS"]
}
```

#### Revoked/Suspended Response (`400 Bad Request`):
```json
{
  "success": false,
  "valid": false,
  "code": "LICENCE_SUSPENDED",
  "message": "This licence has been suspended by the administrator."
}
```

---

### 3.3 Deactivate Installation

- **Endpoint**: `POST /api/v1/licences/deactivate`
- **Headers**: `Content-Type: application/json`

#### Request Payload:
```json
{
  "activationId": 12
}
```

#### Success Response (`200 OK`):
```json
{
  "success": true,
  "message": "Licence deactivated successfully."
}
```

---

## 4. Machine Fingerprinting Guide

To bind a licence key to a specific hardware device, compute a SHA-256 hash of unique hardware identifiers:

### Recommended Identifiers for Hash:
- **CPU ID / Processor Serial**
- **Motherboard Serial Number**
- **Primary Disk Volume Serial**
- **MAC Address**

```javascript
// Example Node.js fingerprinting hash generator
const crypto = require('crypto');
const os = require('os');

function generateFingerprint() {
  const rawString = `${os.hostname()}-${os.arch()}-${os.platform()}-${os.cpus()[0].model}`;
  return crypto.createHash('sha256').update(rawString).digest('hex');
}
```

---

## 5. Code Integration Examples

### cURL Command Line

```bash
# 1. Activate Software
curl -X POST http://localhost:8000/api/v1/licences/activate \
  -H "Content-Type: application/json" \
  -d '{
    "licenceKey": "EMS-ANNUAL-9F8A-12C4-88E2-A51B",
    "installationId": "CLIENT-DEV-001",
    "fingerprintHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "productCode": "EMS",
    "appVersion": "1.0.0",
    "hostname": "MY-LAPTOP",
    "operatingSystem": "Windows"
  }'

# 2. Validate Licence
curl -X POST http://localhost:8000/api/v1/licences/validate \
  -H "Content-Type: application/json" \
  -d '{
    "licenceReference": "LIC-2026-9A4B12",
    "installationId": "CLIENT-DEV-001",
    "fingerprintHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  }'
```

---

### React / TypeScript

```tsx
// src/services/licenceService.ts
import axios from 'axios';

const LICENCE_SERVER = 'http://localhost:8000/api/v1';
const PRODUCT_CODE = 'EMS';

export interface ActivationResult {
  success: boolean;
  message: string;
  licenceReference?: string;
  expiresAt?: string;
}

export async function activateLicence(licenceKey: string): Promise<ActivationResult> {
  const installationId = localStorage.getItem('installation_id') || `INST-${Date.now()}`;
  localStorage.setItem('installation_id', installationId);

  const fingerprintHash = 'fingerprint_hash_here'; // Replace with fingerprint logic

  try {
    const { data } = await axios.post(`${LICENCE_SERVER}/licences/activate`, {
      licenceKey: licenceKey.trim(),
      installationId,
      fingerprintHash,
      productCode: PRODUCT_CODE,
      appVersion: '1.0.0',
      hostname: window.location.hostname,
      operatingSystem: navigator.platform,
    });

    if (data.success) {
      localStorage.setItem('licence_ref', data.licenceReference);
      localStorage.setItem('licence_active', 'true');
    }
    return data;
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || 'Activation failed',
    };
  }
}

export async function validateLicence(): Promise<boolean> {
  const licenceReference = localStorage.getItem('licence_ref');
  const installationId = localStorage.getItem('installation_id');
  if (!licenceReference || !installationId) return false;

  try {
    const { data } = await axios.post(`${LICENCE_SERVER}/licences/validate`, {
      licenceReference,
      installationId,
      fingerprintHash: 'fingerprint_hash_here',
    });
    return data.success && data.valid;
  } catch (err) {
    return false;
  }
}
```

---

### Node.js / Express Backend

```javascript
// licenceChecker.js
const axios = require('axios');
const fs = require('fs');

const LICENCE_SERVER = 'http://localhost:8000/api/v1';
const CONFIG_FILE = './licence_config.json';

async function checkSoftwareLicence() {
  if (!fs.existsSync(CONFIG_FILE)) {
    console.error('❌ Software unactivated. Please activate with licence key.');
    process.exit(1);
  }

  const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));

  try {
    const response = await axios.post(`${LICENCE_SERVER}/licences/validate`, {
      licenceReference: config.licenceReference,
      installationId: config.installationId,
      fingerprintHash: config.fingerprintHash,
    });

    if (response.data.success && response.data.valid) {
      console.log('✅ Licence active & verified.');
      return true;
    } else {
      console.error(`❌ Licence check failed: ${response.data.message}`);
      process.exit(1);
    }
  } catch (err) {
    console.warn('⚠️ Server unreachable. Applying offline grace period rules.');
    return true; // Apply local grace check
  }
}

module.exports = { checkSoftwareLicence };
```

---

### Python Application

```python
# licence_client.py
import requests
import json
import os
import platform

LICENCE_SERVER = "http://localhost:8000/api/v1"
PRODUCT_CODE = "EMS"
STORAGE_FILE = "licence.json"

def activate(licence_key):
    installation_id = f"PY-{platform.node()}"
    fingerprint = "py_fingerprint_sha256"

    payload = {
        "licenceKey": licence_key,
        "installationId": installation_id,
        "fingerprintHash": fingerprint,
        "productCode": PRODUCT_CODE,
        "appVersion": "1.0.0",
        "hostname": platform.node(),
        "operatingSystem": platform.system()
    }

    res = requests.post(f"{LICENCE_SERVER}/licences/activate", json=payload)
    data = res.json()

    if data.get("success"):
        with open(STORAGE_FILE, "w") as f:
            json.dump({
                "licenceReference": data["licenceReference"],
                "installationId": installation_id,
                "fingerprintHash": fingerprint
            }, f)
        print("✅ Activated successfully!")
        return True
    else:
        print(f"❌ Activation failed: {data.get('message')}")
        return False

def validate():
    if not os.path.exists(STORAGE_FILE):
        return False

    with open(STORAGE_FILE, "r") as f:
        config = json.load(f)

    res = requests.post(f"{LICENCE_SERVER}/licences/validate", json=config)
    data = res.json()
    return data.get("success") and data.get("valid")

# Run check
if not validate():
    key = input("Enter Licence Key: ")
    activate(key)
```

---

### PHP Script

```php
<?php
// licence_client.php

$licenceServer = "http://localhost:8000/api/v1";
$configFile = __DIR__ . "/licence.json";

function validateLicence() {
    global $licenceServer, $configFile;
    if (!file_exists($configFile)) return false;

    $config = json_decode(file_get_contents($configFile), true);

    $ch = curl_init("$licenceServer/licences/validate");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_POSTFIELDS => json_encode($config),
        CURLOPT_TIMEOUT => 5
    ]);

    $response = json_decode(curl_exec($ch), true);
    curl_close($ch);

    return ($response['success'] ?? false) && ($response['valid'] ?? false);
}

if (!validateLicence()) {
    die("❌ Error: Valid Licence Required to run this PHP Application.\n");
}

echo "✅ Licence verified. Application running.\n";
```

---

### C# / .NET Application

```csharp
// LicenceClient.cs
using System;
using System.IO;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

public class LicenceClient
{
    private static readonly HttpClient client = new HttpClient();
    private const string SERVER_URL = "http://localhost:8000/api/v1";

    public async Task<bool> ValidateLicenceAsync(string licenceRef, string installationId, string fingerprint)
    {
        var payload = new
        {
            licenceReference = licenceRef,
            installationId = installationId,
            fingerprintHash = fingerprint
        };

        var json = JsonSerializer.Serialize(payload);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        var response = await client.PostAsync($"{SERVER_URL}/licences/validate", content);
        if (!response.IsSuccessStatusCode) return false;

        var resultStr = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(resultStr);
        return doc.RootElement.GetProperty("valid").GetBoolean();
    }
}
```

---

## 6. Offline Grace Period & Security Rules

- **Offline Grace Days**: Default `7 days` (configurable per licence in Admin Panel).
- **Grace Logic**: If client application is offline (server unreachable), client compares `last_successful_online_check` with current local clock.
- **Clock Rollback Protection**: Client records timestamp on every boot. If system clock is set backwards, grace period is invalidated immediately (`CLOCK_ROLLBACK_DETECTED`).

---

## 7. Licence Status & Error Reference

| Code | Status Meaning | Client Action Required |
|---|---|---|
| `LICENCE_VALID` | ✅ Active & verified | Run app normally |
| `LICENCE_EXPIRED` | ⏰ Expiry date passed | Prompt user to renew licence |
| `LICENCE_SUSPENDED` | ⚠️ Temporarily locked by admin | Contact support / Admin |
| `LICENCE_REVOKED` | 🚫 Permanently revoked | Block app completely |
| `MAX_ACTIVATIONS_REACHED` | 🖥️ Limit of devices exceeded | Deactivate old machine first |
| `INSTALLATION_MISMATCH` | 🔒 Hardware fingerprint changed | Re-activate or request hardware update |

---

*SaralLicence — Enterprise Software Licence Management API*
