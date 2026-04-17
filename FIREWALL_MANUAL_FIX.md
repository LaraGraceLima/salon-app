# Windows Firewall - Manual Configuration Guide

## Current Status
- ✅ Firewall is ENABLED (Domain, Private, Public)
- ❌ Node.js may not be allowed through firewall
- ❌ Port 3001 may be blocked

This is likely causing the "Connection failed" error!

---

## Solution 1: Using PowerShell Script (Recommended)

### Step 1: Open PowerShell as Administrator
1. Press `Windows Key + X`
2. Select "Windows PowerShell (Admin)" or "Terminal (Admin)"
3. Click "Yes" when prompted

### Step 2: Run the Firewall Script
```powershell
cd C:\xampp\htdocs\kiro-solon
.\FIREWALL_FIX.ps1
```

### Step 3: Restart Backend
```powershell
cd salon-admin-panel/server
npm start
```

### Step 4: Test Connection
- Reload mobile apps
- Try logging in

---

## Solution 2: Manual Firewall Configuration

### Step 1: Open Windows Defender Firewall
1. Press `Windows Key`
2. Type: `Windows Defender Firewall`
3. Click "Windows Defender Firewall with Advanced Security"

### Step 2: Add Node.js Inbound Rule
1. Click "Inbound Rules" (left panel)
2. Click "New Rule..." (right panel)
3. Select "Program"
4. Click "Next"
5. Select "This program path"
6. Click "Browse"
7. Navigate to: `C:\Program Files\nodejs\node.exe`
8. Click "Open"
9. Click "Next"
10. Select "Allow the connection"
11. Click "Next"
12. Check: Domain, Private
13. Uncheck: Public
14. Click "Next"
15. Name: "Node.js (Inbound)"
16. Click "Finish"

### Step 3: Add Node.js Outbound Rule
1. Click "Outbound Rules" (left panel)
2. Click "New Rule..." (right panel)
3. Repeat steps 3-16 above
4. Name: "Node.js (Outbound)"

### Step 4: Add Port 3001 Inbound Rule
1. Click "Inbound Rules" (left panel)
2. Click "New Rule..." (right panel)
3. Select "Port"
4. Click "Next"
5. Select "TCP"
6. Select "Specific local ports"
7. Enter: `3001`
8. Click "Next"
9. Select "Allow the connection"
10. Click "Next"
11. Check: Domain, Private
12. Uncheck: Public
13. Click "Next"
14. Name: "Port 3001 (Salon Backend)"
15. Click "Finish"

### Step 5: Add Port 3001 Outbound Rule
1. Click "Outbound Rules" (left panel)
2. Click "New Rule..." (right panel)
3. Repeat steps 3-15 above
4. Name: "Port 3001 (Salon Backend) Outbound"

---

## Solution 3: Temporarily Disable Firewall (Testing Only)

⚠️ **WARNING: Only for testing! Re-enable after testing!**

### Step 1: Open Windows Defender Firewall
1. Press `Windows Key`
2. Type: `Windows Defender Firewall`
3. Click "Windows Defender Firewall"

### Step 2: Turn Off Firewall
1. Click "Turn Windows Defender Firewall on or off" (left panel)
2. Under "Private network settings":
   - Select "Turn off Windows Defender Firewall"
3. Under "Public network settings":
   - Select "Turn off Windows Defender Firewall"
4. Click "OK"

### Step 3: Test Connection
- Reload mobile apps
- Try logging in
- If it works, firewall was the issue

### Step 4: Re-enable Firewall
1. Repeat steps 1-2 above
2. Select "Turn on Windows Defender Firewall"
3. Click "OK"

---

## Verification

### Check if Rules Were Added
1. Open Windows Defender Firewall with Advanced Security
2. Click "Inbound Rules"
3. Look for:
   - "Node.js (Inbound)"
   - "Port 3001 (Salon Backend)"
4. Click "Outbound Rules"
5. Look for:
   - "Node.js (Outbound)"
   - "Port 3001 (Salon Backend) Outbound"

All should show "Allow" in the Action column ✅

### Check Port Status
```powershell
netstat -ano | Select-String "3001"
```

Should show:
```
TCP    0.0.0.0:3001           0.0.0.0:0              LISTENING
```

---

## After Firewall Configuration

### Step 1: Restart Backend Server
```powershell
cd salon-admin-panel/server
npm start
```

Expected output:
```
Server running on port 3001
WebSocket server running on ws://0.0.0.0:3001
```

### Step 2: Reload Mobile Apps
- Close apps completely
- Reopen or scan QR code
- Press `r` to reload

### Step 3: Try Login
- **User App**: `user@example.com` / `password123`
- **Stylist App**: `sarah@salon.com` / `stylist123`

Should work now! ✅

---

## Troubleshooting

### Still Getting "Connection Failed"?

1. **Verify firewall rules were added:**
   - Open Windows Defender Firewall with Advanced Security
   - Check Inbound and Outbound Rules
   - Look for Node.js and Port 3001 rules

2. **Verify backend is running:**
   - Check terminal shows "Server running on port 3001"
   - If not, restart backend

3. **Verify device network:**
   - Device must be on same WiFi as computer
   - Or using emulator with 10.0.2.2 IP

4. **Try disabling firewall temporarily:**
   - If connection works with firewall off, rules weren't added correctly
   - Re-run the PowerShell script or manually add rules again

5. **Restart computer:**
   - Sometimes helps with firewall changes
   - Clears any cached firewall rules

---

## Firewall Rules Summary

| Rule Name | Type | Direction | Protocol | Port | Action |
|-----------|------|-----------|----------|------|--------|
| Node.js (Inbound) | Program | Inbound | All | All | Allow |
| Node.js (Outbound) | Program | Outbound | All | All | Allow |
| Port 3001 (Salon Backend) | Port | Inbound | TCP | 3001 | Allow |
| Port 3001 (Salon Backend) Outbound | Port | Outbound | TCP | 3001 | Allow |

---

## Quick Reference

**PowerShell Script:**
```powershell
.\FIREWALL_FIX.ps1
```

**Manual Steps:**
1. Open Windows Defender Firewall with Advanced Security
2. Add Node.js to Inbound Rules
3. Add Node.js to Outbound Rules
4. Add Port 3001 to Inbound Rules
5. Add Port 3001 to Outbound Rules

**Restart Backend:**
```powershell
cd salon-admin-panel/server
npm start
```

**Test Connection:**
- Reload mobile apps
- Try logging in

---

**After firewall configuration, the "Connection failed" error should be resolved!**
