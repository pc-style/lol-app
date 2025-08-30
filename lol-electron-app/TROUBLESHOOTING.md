# LoL Companion - Troubleshooting Guide

## Common Issues and Solutions

### 🔌 Connection Issues

#### Problem: App shows "Waiting for League of Legends" but League is running
**Solutions:**
1. **Restart League Client**: Close League completely and reopen it
2. **Check League Client Update**: Make sure League is fully updated
3. **Run as Administrator**: Try running both League and the app as administrator
4. **Firewall/Antivirus**: Check if your firewall is blocking the connection
5. **Port Issues**: League LCU typically uses port 17500-17599

#### Problem: App connects but shows 0 champions owned
**Solutions:**
1. **Wait for Full Login**: Make sure you're fully logged into League (not just client open)
2. **Check Console**: Open DevTools (F12) and check for API errors
3. **LCU API Timing**: Sometimes the API needs a moment after login

### 🎮 UI Issues

#### Problem: Champion images not loading
**Current Status:** Using Riot Data Dragon CDN - images should load automatically
**Solutions:**
1. **Internet Connection**: Ensure stable internet for loading champion images
2. **CDN Issues**: Riot's CDN might be temporarily down
3. **Clear Cache**: Restart the app to clear any cached failed requests

#### Problem: Empty champion sections
**Current Status:** App now includes fallback mock data when no real data is available
**Note:** This is expected behavior when League is not running

### 🛠️ Development Issues

#### Problem: `npm run dev` doesn't start the app
**Solutions:**
1. **Check Dependencies**: Run `npm install` to ensure all dependencies are installed
2. **Port Conflicts**: Check if port 8080 is already in use
3. **Build Issues**: Run `npm run clean && npm run build` first

#### Problem: TypeScript compilation errors
**Solutions:**
1. **Update Dependencies**: Run `npm update` to get latest compatible versions
2. **Clear Cache**: Delete `node_modules` and `package-lock.json`, then `npm install`
3. **Check Node Version**: Ensure you're using Node.js 16 or higher

### 🔍 Debug Mode

To enable detailed logging:

1. **Open DevTools**: Press F12 in the app
2. **Check Console**: Look for hexgate connection logs
3. **Main Process Logs**: Check the terminal running the app for main process logs

### 📊 Expected Behavior

#### When League is NOT running:
- Connection status: "Disconnected" 
- Dashboard shows mock data (Annie, Ahri, etc.)
- Champion Select tab is disabled
- Stats show placeholder values

#### When League IS running:
- Connection status: "Connected"
- Real summoner data loads
- Champion collection shows your actual champions
- Champion Select tab activates during champ select

### 🏥 Health Check

To verify everything is working:

1. **Start the app** - should show "Waiting for League of Legends"
2. **Check mock data** - should see sample champions even without League
3. **Start League** - connection status should change to "Connected"
4. **Enter champion select** - app should automatically switch to Champion Select tab

### 🔧 Advanced Debugging

#### Enable hexgate debug logs:
```javascript
// In main.ts, add to Connection config:
logger: console // This enables detailed hexgate logging
```

#### Check LCU endpoints manually:
```bash
# Get current summoner (requires League running)
curl -k https://127.0.0.1:17500/lol-summoner/v1/current-summoner
```

### 📞 Getting Help

If issues persist:

1. **Check Console Logs**: Include any error messages from DevTools
2. **System Info**: Include OS version, Node.js version, League version  
3. **Steps to Reproduce**: Describe exactly what you did before the issue occurred
4. **Expected vs Actual**: What you expected to happen vs what actually happened

### 🚀 Performance Notes

The app is designed to be lightweight:
- ~200MB RAM usage
- Minimal CPU usage when idle  
- Real-time updates only when needed
- Automatic reconnection if League restarts

### 🔐 Security Notes

The app:
- Only connects to local League client (localhost)
- Uses secure IPC communication between processes
- Doesn't store or transmit personal data
- Uses official Riot APIs through hexgate library